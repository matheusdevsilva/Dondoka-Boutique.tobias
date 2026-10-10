import type { Request, Response } from "express"
import type { PoolClient } from "pg"
import pool from "../database/db.js"
import { DELIVERY_FEE } from "../config.js"
import { cleanText, toPositiveInt } from "../utils/validation.js"
import {
    calcDiscount,
    validateCouponRow,
} from "./couponsController.js"

const MAX_ITEMS_PER_ORDER = 50
const MAX_QTY_PER_ITEM = 20
const ORDER_STATUSES = ["pending", "confirmed", "shipped", "cancelled"] as const

class OrderError extends Error {
    constructor(message: string, readonly status = 400) {
        super(message)
    }
}

interface RequestedItem {
    productId: number
    size: string | null
    quantity: number
}

interface PricedItem extends RequestedItem {
    name: string
    unitPrice: number
}

function parseRequestedItems(raw: unknown): RequestedItem[] {
    if (!Array.isArray(raw) || raw.length === 0) {
        throw new OrderError("Pedido precisa ter itens")
    }
    if (raw.length > MAX_ITEMS_PER_ORDER) {
        throw new OrderError("Pedido com itens demais")
    }

    return raw.map((item) => {
        const productId = toPositiveInt(item?.id ?? item?.product_id)
        const quantity = toPositiveInt(item?.quantity)
        if (!productId || !quantity || quantity > MAX_QTY_PER_ITEM) {
            throw new OrderError("Item inválido no pedido")
        }
        const size = item?.size ? cleanText(item.size, 20) : null
        return { productId, quantity, size }
    })
}

function effectivePrice(row: { price: string | number; discount_price: string | number | null }) {
    const price = Number(row.price)
    const discount = row.discount_price == null ? NaN : Number(row.discount_price)
    return discount > 0 && discount < price ? discount : price
}

async function priceAndReserveItems(
    client: PoolClient,
    requested: RequestedItem[]
): Promise<PricedItem[]> {
    const ids = [...new Set(requested.map((item) => item.productId))]
    const products = await client.query(
        `SELECT id, name, price, discount_price, stock, sizes, is_active
         FROM products
         WHERE id = ANY($1::int[])
         ORDER BY id
         FOR UPDATE`,
        [ids]
    )
    const byId = new Map(products.rows.map((row) => [Number(row.id), row]))

    const totals = new Map<number, number>()
    for (const item of requested) {
        totals.set(item.productId, (totals.get(item.productId) || 0) + item.quantity)
    }

    for (const [productId, quantity] of totals) {
        const product = byId.get(productId)
        if (!product || product.is_active === false) {
            throw new OrderError("Um dos produtos não está mais disponível")
        }
        if (Number(product.stock ?? 0) < quantity) {
            throw new OrderError(`Estoque insuficiente para ${product.name}`)
        }
    }

    const priced = requested.map((item) => {
        const product = byId.get(item.productId)!
        const sizes = String(product.sizes || "")
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        if (sizes.length > 0 && (!item.size || !sizes.includes(item.size))) {
            throw new OrderError(`Escolha um tamanho válido para ${product.name}`)
        }
        return { ...item, name: product.name, unitPrice: effectivePrice(product) }
    })

    for (const [productId, quantity] of totals) {
        await client.query(
            `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2`,
            [quantity, productId]
        )
    }

    return priced
}

export async function groupOrderItems<T extends { id: number }>(orders: T[]) {
    if (orders.length === 0) return []
    const items = await pool.query(
        `SELECT * FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY id`,
        [orders.map((order) => order.id)]
    )
    const byOrder = new Map<number, typeof items.rows>()
    for (const item of items.rows) {
        const list = byOrder.get(item.order_id) || []
        list.push(item)
        byOrder.set(item.order_id, list)
    }
    return orders.map((order) => ({ ...order, items: byOrder.get(order.id) || [] }))
}

export async function createOrder(req: Request, res: Response) {
    const {
        customer_name,
        customer_phone,
        customer_notes,
        items,
        shipping_method = "pickup",
        shipping_address,
        coupon_code,
    } = req.body ?? {}

    const name = cleanText(customer_name, 160)
    const phone = cleanText(customer_phone, 40)
    const method = shipping_method === "delivery" ? "delivery" : "pickup"
    const address = cleanText(shipping_address, 500)

    let requested: RequestedItem[]
    try {
        requested = parseRequestedItems(items)
        if (!name || !phone) throw new OrderError("Nome e WhatsApp são obrigatórios")
        if (method === "delivery" && !address) {
            throw new OrderError("Informe o endereço de entrega")
        }
    } catch (error) {
        const message = error instanceof OrderError ? error.message : "Pedido inválido"
        return res.status(400).json({ success: false, message })
    }

    const client = await pool.connect()
    try {
        await client.query("BEGIN")

        const priced = await priceAndReserveItems(client, requested)
        const subtotal =
            Math.round(
                priced.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0) * 100
            ) / 100

        let discount = 0
        let appliedCoupon: string | null = null

        if (coupon_code) {
            const couponRes = await client.query(
                "SELECT * FROM coupons WHERE UPPER(code) = $1 FOR UPDATE",
                [cleanText(coupon_code, 40).toUpperCase()]
            )
            const coupon = couponRes.rows[0]
            if (!coupon) throw new OrderError("Cupom inválido")

            const check = validateCouponRow(coupon, subtotal)
            if (!check.ok) throw new OrderError(check.message)

            discount = calcDiscount(coupon, subtotal)
            appliedCoupon = coupon.code

            await client.query(
                `UPDATE coupons
                 SET used_count = COALESCE(used_count, 0) + 1
                 WHERE id = $1`,
                [coupon.id]
            )
        }

        const shippingFee = method === "delivery" ? DELIVERY_FEE : 0
        const total = Math.max(0, subtotal - discount + shippingFee)

        const orderResult = await client.query(
            `INSERT INTO orders (
                customer_id, customer_name, customer_phone, customer_notes,
                subtotal, discount, coupon_code, shipping_method, shipping_fee,
                shipping_address, total, status
             )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending')
             RETURNING *`,
            [
                req.user?.role === "customer" ? req.user.id : null,
                name,
                phone,
                cleanText(customer_notes, 1000) || null,
                subtotal,
                discount,
                appliedCoupon,
                method,
                shippingFee,
                method === "delivery" ? address : null,
                total,
            ]
        )

        const order = orderResult.rows[0]

        const inserted = await client.query(
            `INSERT INTO order_items
             (order_id, product_id, product_name, size, quantity, unit_price)
             SELECT $1::int, * FROM UNNEST($2::int[], $3::text[], $4::text[], $5::int[], $6::numeric[])
             RETURNING *`,
            [
                order.id,
                priced.map((item) => item.productId),
                priced.map((item) => item.name),
                priced.map((item) => item.size),
                priced.map((item) => item.quantity),
                priced.map((item) => item.unitPrice),
            ]
        )

        await client.query("COMMIT")

        return res.status(201).json({
            success: true,
            data: { ...order, items: inserted.rows },
        })
    } catch (error) {
        await client.query("ROLLBACK")
        if (error instanceof OrderError) {
            return res.status(error.status).json({ success: false, message: error.message })
        }
        console.error("Erro ao criar pedido:", error)
        return res.status(500).json({
            success: false,
            message: "Erro ao criar pedido",
        })
    } finally {
        client.release()
    }
}

export async function getOrders(req: Request, res: Response) {
    try {
        const page = Math.max(1, Number(req.query.page) || 1)
        const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100))
        const status = ORDER_STATUSES.find((s) => s === req.query.status)

        const orders = await pool.query(
            `SELECT * FROM orders
             WHERE ($1::text IS NULL OR status = $1)
             ORDER BY id DESC
             LIMIT $2 OFFSET $3`,
            [status ?? null, limit, (page - 1) * limit]
        )

        return res.status(200).json({
            success: true,
            data: await groupOrderItems(orders.rows),
        })
    } catch (error) {
        console.error("Erro ao listar pedidos:", error)
        return res.status(500).json({
            success: false,
            message: "Erro ao listar pedidos",
        })
    }
}

export async function getOrderById(req: Request, res: Response) {
    try {
        const id = toPositiveInt(req.params.id)
        const order = id
            ? await pool.query("SELECT * FROM orders WHERE id = $1", [id])
            : { rows: [] }

        if (order.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Pedido não encontrado" })
        }

        const [data] = await groupOrderItems(order.rows)
        return res.status(200).json({ success: true, data })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao buscar pedido" })
    }
}

/** Cliente vê o próprio pedido; guest precisa do telefone usado no checkout. */
export async function getPublicOrder(req: Request, res: Response) {
    try {
        const id = toPositiveInt(req.params.id)
        const phone = cleanText(req.query.phone, 40)
        const customerId = req.user?.role === "customer" ? req.user.id : null

        if (!id || (!customerId && !phone)) {
            return res.status(404).json({ success: false, message: "Pedido não encontrado" })
        }

        const order = await pool.query(
            `SELECT id, customer_name, shipping_method, subtotal, discount,
                    shipping_fee, total, status, coupon_code, created_at
             FROM orders
             WHERE id = $1
               AND (($2::int IS NOT NULL AND customer_id = $2) OR customer_phone = $3)`,
            [id, customerId, phone || null]
        )

        if (order.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Pedido não encontrado" })
        }

        const [data] = await groupOrderItems(order.rows)
        return res.status(200).json({ success: true, data })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao buscar pedido" })
    }
}

export async function updateOrderStatus(req: Request, res: Response) {
    const id = toPositiveInt(req.params.id)
    const status = ORDER_STATUSES.find((s) => s === req.body?.status)

    if (!status) {
        return res.status(400).json({ success: false, message: "Status inválido" })
    }
    if (!id) {
        return res.status(404).json({ success: false, message: "Pedido não encontrado" })
    }

    const client = await pool.connect()
    try {
        await client.query("BEGIN")

        const current = await client.query(
            "SELECT status FROM orders WHERE id = $1 FOR UPDATE",
            [id]
        )
        if (current.rows.length === 0) {
            await client.query("ROLLBACK")
            return res.status(404).json({ success: false, message: "Pedido não encontrado" })
        }

        const previous = current.rows[0].status
        const stockSign =
            previous !== "cancelled" && status === "cancelled"
                ? 1
                : previous === "cancelled" && status !== "cancelled"
                  ? -1
                  : 0

        if (stockSign !== 0) {
            const items = await client.query(
                `SELECT product_id, SUM(quantity)::int AS qty
                 FROM order_items
                 WHERE order_id = $1 AND product_id IS NOT NULL
                 GROUP BY product_id
                 ORDER BY product_id`,
                [id]
            )
            for (const item of items.rows) {
                const updated = await client.query(
                    `UPDATE products
                     SET stock = stock + $1, updated_at = NOW()
                     WHERE id = $2 AND stock + $1 >= 0
                     RETURNING id`,
                    [stockSign * item.qty, item.product_id]
                )
                if (updated.rowCount === 0 && stockSign < 0) {
                    await client.query("ROLLBACK")
                    return res.status(409).json({
                        success: false,
                        message: "Estoque insuficiente para reabrir este pedido",
                    })
                }
            }
        }

        const result = await client.query(
            `UPDATE orders
             SET status = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [status, id]
        )

        await client.query("COMMIT")

        return res.status(200).json({ success: true, data: result.rows[0] })
    } catch (error) {
        await client.query("ROLLBACK")
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao atualizar pedido" })
    } finally {
        client.release()
    }
}

export async function getSalesStats(_req: Request, res: Response) {
    try {
        const month = await pool.query(
            `SELECT
                COALESCE(SUM(total), 0)::numeric AS revenue,
                COUNT(*)::int AS orders_count
             FROM orders
             WHERE status <> 'cancelled'
               AND created_at >= date_trunc('month', NOW())`
        )

        const top = await pool.query(
            `SELECT
                oi.product_name,
                SUM(oi.quantity)::int AS qty,
                SUM(oi.quantity * oi.unit_price)::numeric AS revenue
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE o.status <> 'cancelled'
             GROUP BY oi.product_name
             ORDER BY qty DESC
             LIMIT 5`
        )

        const shipping = await pool.query(
            `SELECT
                shipping_method,
                COUNT(*)::int AS total
             FROM orders
             WHERE status <> 'cancelled'
             GROUP BY shipping_method`
        )

        const totals = await pool.query(
            `SELECT
                (SELECT COUNT(*) FROM orders)::int AS total_orders,
                (SELECT COUNT(*) FROM orders WHERE status = 'pending')::int AS pending_orders,
                (SELECT COUNT(*) FROM customers)::int AS total_customers,
                (SELECT COUNT(*) FROM products)::int AS total_products,
                (SELECT COUNT(*) FROM products WHERE is_active AND stock = 0)::int AS out_of_stock`
        )

        return res.status(200).json({
            success: true,
            data: {
                ...totals.rows[0],
                month_revenue: Number(month.rows[0].revenue),
                month_orders: month.rows[0].orders_count,
                top_products: top.rows,
                shipping_breakdown: shipping.rows,
                delivery_fee: DELIVERY_FEE,
            },
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao gerar relatório" })
    }
}

export function getShippingConfig(_req: Request, res: Response) {
    return res.status(200).json({
        success: true,
        data: {
            delivery_fee: DELIVERY_FEE,
            methods: [
                { id: "pickup", label: "Retirada na loja", fee: 0 },
                { id: "delivery", label: "Entrega", fee: DELIVERY_FEE },
            ],
        },
    })
}
