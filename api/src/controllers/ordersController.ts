import type { Request, Response } from "express"
import pool from "../database/db.js"
import {
    calcDiscount,
    validateCouponRow,
} from "./couponsController.js"

const DELIVERY_FEE = Number(process.env.SHIPPING_FEE || 15)

export async function createOrder(req: Request, res: Response) {
    const client = await pool.connect()
    try {
        const {
            customer_name,
            customer_phone,
            customer_notes,
            items,
            shipping_method = "pickup",
            shipping_address,
            coupon_code,
        } = req.body

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Pedido precisa ter itens",
            })
        }

        if (!customer_name || !customer_phone) {
            return res.status(400).json({
                success: false,
                message: "Nome e WhatsApp são obrigatórios",
            })
        }

        const method =
            shipping_method === "delivery" ? "delivery" : "pickup"

        if (method === "delivery" && !String(shipping_address || "").trim()) {
            return res.status(400).json({
                success: false,
                message: "Informe o endereço de entrega",
            })
        }

        await client.query("BEGIN")

        let subtotal = 0
        const normalized = []

        for (const item of items) {
            const quantity = Number(item.quantity) || 0
            const unitPrice = Number(item.price) || 0
            if (!item.name || quantity <= 0 || unitPrice < 0) {
                await client.query("ROLLBACK")
                return res.status(400).json({
                    success: false,
                    message: "Item inválido no pedido",
                })
            }

            if (item.id) {
                const product = await client.query(
                    "SELECT id, stock, name FROM products WHERE id = $1",
                    [item.id]
                )
                if (product.rows.length > 0) {
                    const stock = Number(product.rows[0].stock ?? 0)
                    if (stock > 0 && stock < quantity) {
                        await client.query("ROLLBACK")
                        return res.status(400).json({
                            success: false,
                            message: `Estoque insuficiente para ${product.rows[0].name}`,
                        })
                    }
                }
            }

            subtotal += unitPrice * quantity
            normalized.push({
                product_id: item.id || null,
                product_name: item.name,
                size: item.size || null,
                quantity,
                unit_price: unitPrice,
            })
        }

        let discount = 0
        let appliedCoupon: string | null = null

        if (coupon_code) {
            const couponRes = await client.query(
                "SELECT * FROM coupons WHERE UPPER(code) = $1 FOR UPDATE",
                [String(coupon_code).trim().toUpperCase()]
            )

            if (couponRes.rows.length === 0) {
                await client.query("ROLLBACK")
                return res.status(400).json({
                    success: false,
                    message: "Cupom inválido",
                })
            }

            const coupon = couponRes.rows[0]
            const check = validateCouponRow(coupon, subtotal)
            if (!check.ok) {
                await client.query("ROLLBACK")
                return res.status(400).json({
                    success: false,
                    message: check.message,
                })
            }

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
                customer_name,
                customer_phone,
                customer_notes || null,
                subtotal,
                discount,
                appliedCoupon,
                method,
                shippingFee,
                method === "delivery"
                    ? String(shipping_address).trim()
                    : null,
                total,
            ]
        )

        const order = orderResult.rows[0]

        for (const item of normalized) {
            await client.query(
                `INSERT INTO order_items
                 (order_id, product_id, product_name, size, quantity, unit_price)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    order.id,
                    item.product_id,
                    item.product_name,
                    item.size,
                    item.quantity,
                    item.unit_price,
                ]
            )

            if (item.product_id) {
                await client.query(
                    `UPDATE products
                     SET stock = GREATEST(COALESCE(stock, 0) - $1, 0),
                         updated_at = NOW()
                     WHERE id = $2`,
                    [item.quantity, item.product_id]
                )
            }
        }

        await client.query("COMMIT")

        const itemsResult = await pool.query(
            "SELECT * FROM order_items WHERE order_id = $1 ORDER BY id",
            [order.id]
        )

        return res.status(201).json({
            success: true,
            data: { ...order, items: itemsResult.rows },
        })
    } catch (error) {
        await client.query("ROLLBACK")
        console.error("Erro ao criar pedido:", error)
        return res.status(500).json({
            success: false,
            message: "Erro ao criar pedido",
        })
    } finally {
        client.release()
    }
}

export async function getOrders(_req: Request, res: Response) {
    try {
        const orders = await pool.query(
            `SELECT * FROM orders ORDER BY id DESC`
        )

        const items = await pool.query(
            `SELECT * FROM order_items ORDER BY id`
        )

        const byOrder = new Map<number, typeof items.rows>()
        for (const item of items.rows) {
            const list = byOrder.get(item.order_id) || []
            list.push(item)
            byOrder.set(item.order_id, list)
        }

        const data = orders.rows.map((order) => ({
            ...order,
            items: byOrder.get(order.id) || [],
        }))

        return res.status(200).json({ success: true, data })
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
        const { id } = req.params
        const order = await pool.query("SELECT * FROM orders WHERE id = $1", [id])

        if (order.rows.length === 0) {
            return res.status(404).json({ message: "Pedido não encontrado" })
        }

        const items = await pool.query(
            "SELECT * FROM order_items WHERE order_id = $1 ORDER BY id",
            [id]
        )

        return res.status(200).json({
            success: true,
            data: { ...order.rows[0], items: items.rows },
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao buscar pedido" })
    }
}

export async function updateOrderStatus(req: Request, res: Response) {
    try {
        const { id } = req.params
        const { status } = req.body

        const allowed = ["pending", "confirmed", "shipped", "cancelled"]
        if (!allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status inválido",
            })
        }

        const result = await pool.query(
            `UPDATE orders
             SET status = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [status, id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Pedido não encontrado" })
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao atualizar pedido" })
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

        return res.status(200).json({
            success: true,
            data: {
                month_revenue: Number(month.rows[0].revenue),
                month_orders: month.rows[0].orders_count,
                top_products: top.rows,
                shipping_breakdown: shipping.rows,
                delivery_fee: DELIVERY_FEE,
            },
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao gerar relatório" })
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
