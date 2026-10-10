import type { Request, Response } from "express"
import bcrypt from "bcrypt"
import pool from "../database/db.js"
import { endSession, startSession } from "../utils/auth.js"
import {
    BCRYPT_ROUNDS,
    cleanText,
    isEmail,
    MIN_CUSTOMER_PASSWORD,
    toPositiveInt,
} from "../utils/validation.js"
import { groupOrderItems } from "./ordersController.js"

const DUMMY_HASH = bcrypt.hashSync("dondoka-dummy-password", BCRYPT_ROUNDS)

function openCustomerSession(res: Response, customer: { id: number; email: string }) {
    startSession(res, {
        id: String(customer.id),
        email: customer.email,
        role: "customer",
    })
}

export async function registerCustomer(req: Request, res: Response) {
    try {
        const { name, email, phone, password } = req.body ?? {}

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Nome, e-mail, telefone e senha são obrigatórios",
            })
        }

        if (!isEmail(email)) {
            return res.status(400).json({ success: false, message: "E-mail inválido" })
        }

        if (String(password).length < MIN_CUSTOMER_PASSWORD) {
            return res.status(400).json({
                success: false,
                message: `Senha deve ter pelo menos ${MIN_CUSTOMER_PASSWORD} caracteres`,
            })
        }

        const hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS)
        const result = await pool.query(
            `INSERT INTO customers (name, email, phone, password)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, phone, created_at`,
            [
                cleanText(name, 160),
                String(email).toLowerCase().trim(),
                cleanText(phone, 40),
                hash,
            ]
        )

        const customer = result.rows[0]
        openCustomerSession(res, customer)

        return res.status(201).json({ success: true, data: customer })
    } catch (error: unknown) {
        if ((error as { code?: string }).code === "23505") {
            return res.status(409).json({
                success: false,
                message: "E-mail já cadastrado",
            })
        }
        console.error("Erro ao cadastrar cliente:", error)
        return res.status(500).json({
            success: false,
            message: "Erro ao cadastrar",
        })
    }
}

export async function loginCustomer(req: Request, res: Response) {
    try {
        const { email, password } = req.body ?? {}

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "E-mail e senha são obrigatórios",
            })
        }

        const result = await pool.query(
            "SELECT id, name, email, phone, password FROM customers WHERE email = $1",
            [String(email).toLowerCase().trim()]
        )
        const customer = result.rows[0]

        const ok = await bcrypt.compare(String(password), customer?.password ?? DUMMY_HASH)

        if (!customer || !ok) {
            return res.status(401).json({
                success: false,
                message: "E-mail ou senha inválidos",
            })
        }

        openCustomerSession(res, customer)

        return res.status(200).json({
            success: true,
            data: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
            },
        })
    } catch (error) {
        console.error("Erro no login do cliente:", error)
        return res.status(500).json({
            success: false,
            message: "Erro interno",
        })
    }
}

export function logoutCustomer(_req: Request, res: Response) {
    endSession(res, "customer")
    return res.status(200).json({ success: true })
}

export async function getCustomerMe(req: Request, res: Response) {
    try {
        const result = await pool.query(
            `SELECT id, name, email, phone, created_at
             FROM customers WHERE id = $1`,
            [req.user?.id]
        )

        if (result.rows.length === 0) {
            endSession(res, "customer")
            return res.status(401).json({ success: false, message: "Sessão inválida" })
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro interno" })
    }
}

export async function getMyOrders(req: Request, res: Response) {
    try {
        const orders = await pool.query(
            `SELECT * FROM orders
             WHERE customer_id = $1
             ORDER BY id DESC`,
            [req.user?.id]
        )

        return res.status(200).json({
            success: true,
            data: await groupOrderItems(orders.rows),
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao listar pedidos" })
    }
}

export async function getWishlist(req: Request, res: Response) {
    try {
        const id = req.user?.id
        if (!id) {
            return res.status(401).json({ message: "Não autenticado" })
        }

        const result = await pool.query(
            `SELECT p.*
             FROM wishlist_items w
             JOIN products p ON p.id = w.product_id
             WHERE w.customer_id = $1
             ORDER BY w.created_at DESC`,
            [id]
        )

        return res.status(200).json({
            success: true,
            data: result.rows,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao buscar favoritos" })
    }
}

export async function addWishlistItem(req: Request, res: Response) {
    try {
        const productId = toPositiveInt(req.body?.product_id)

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "product_id é obrigatório",
            })
        }

        await pool.query(
            `INSERT INTO wishlist_items (customer_id, product_id)
             SELECT $1, id FROM products WHERE id = $2
             ON CONFLICT (customer_id, product_id) DO NOTHING`,
            [req.user?.id, productId]
        )

        return res.status(201).json({ success: true })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao favoritar" })
    }
}

export async function removeWishlistItem(req: Request, res: Response) {
    try {
        const id = req.user?.id
        const { productId } = req.params

        if (!id || !productId) {
            return res.status(400).json({ message: "Dados inválidos" })
        }

        await pool.query(
            `DELETE FROM wishlist_items
             WHERE customer_id = $1 AND product_id = $2`,
            [id, productId]
        )

        return res.status(200).json({ success: true })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao remover favorito" })
    }
}

export async function syncWishlist(req: Request, res: Response) {
    try {
        const id = req.user?.id
        const { product_ids } = req.body ?? {}

        if (!Array.isArray(product_ids)) {
            return res.status(400).json({ success: false, message: "product_ids inválido" })
        }

        const ids = [
            ...new Set(
                product_ids
                    .slice(0, 500)
                    .map(toPositiveInt)
                    .filter((value): value is number => value !== null)
            ),
        ]

        if (ids.length > 0) {
            await pool.query(
                `INSERT INTO wishlist_items (customer_id, product_id)
                 SELECT $1, p.id FROM products p WHERE p.id = ANY($2::int[])
                 ON CONFLICT (customer_id, product_id) DO NOTHING`,
                [id, ids]
            )
        }

        const result = await pool.query(
            `SELECT product_id FROM wishlist_items WHERE customer_id = $1`,
            [id]
        )

        return res.status(200).json({
            success: true,
            data: result.rows.map((row) => String(row.product_id)),
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao sincronizar favoritos" })
    }
}

/** Admin: listar clientes da loja */
export async function adminGetCustomers(_req: Request, res: Response) {
    try {
        const result = await pool.query(
            `SELECT
                c.id,
                c.name,
                c.email,
                c.phone,
                c.created_at,
                COALESCE(o.orders_count, 0)::int AS orders_count,
                COALESCE(o.orders_total, 0)::numeric AS orders_total,
                COALESCE(w.wishlist_count, 0)::int AS wishlist_count
             FROM customers c
             LEFT JOIN (
                SELECT customer_id, COUNT(*) AS orders_count, SUM(total) AS orders_total
                FROM orders GROUP BY customer_id
             ) o ON o.customer_id = c.id
             LEFT JOIN (
                SELECT customer_id, COUNT(*) AS wishlist_count
                FROM wishlist_items GROUP BY customer_id
             ) w ON w.customer_id = c.id
             ORDER BY c.id DESC`
        )

        return res.status(200).json({
            success: true,
            data: result.rows,
        })
    } catch (error) {
        console.error("Erro ao listar clientes:", error)
        return res.status(500).json({
            success: false,
            message: "Erro ao listar clientes",
        })
    }
}

export async function adminGetCustomerById(req: Request, res: Response) {
    try {
        const { id } = req.params

        const customer = await pool.query(
            `SELECT id, name, email, phone, created_at
             FROM customers WHERE id = $1`,
            [id]
        )

        if (customer.rows.length === 0) {
            return res.status(404).json({ message: "Cliente não encontrado" })
        }

        const orders = await pool.query(
            `SELECT * FROM orders
             WHERE customer_id = $1
             ORDER BY id DESC`,
            [id]
        )

        const wishlist = await pool.query(
            `SELECT p.id, p.name, p.price, p.discount_price, p.image_url
             FROM wishlist_items w
             JOIN products p ON p.id = w.product_id
             WHERE w.customer_id = $1
             ORDER BY w.created_at DESC`,
            [id]
        )

        return res.status(200).json({
            success: true,
            data: {
                ...customer.rows[0],
                orders: await groupOrderItems(orders.rows),
                wishlist: wishlist.rows,
            },
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao buscar cliente" })
    }
}

export async function adminUpdateCustomer(req: Request, res: Response) {
    try {
        const { id } = req.params
        const { name, email, phone } = req.body

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: "Nome, e-mail e telefone são obrigatórios",
            })
        }

        const result = await pool.query(
            `UPDATE customers
             SET name = $1, email = $2, phone = $3
             WHERE id = $4
             RETURNING id, name, email, phone, created_at`,
            [
                String(name).trim(),
                String(email).toLowerCase().trim(),
                String(phone).trim(),
                id,
            ]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Cliente não encontrado" })
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        })
    } catch (error: unknown) {
        const err = error as { code?: string }
        if (err.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "E-mail já em uso",
            })
        }
        console.error(error)
        return res.status(500).json({ message: "Erro ao atualizar cliente" })
    }
}

export async function adminDeleteCustomer(req: Request, res: Response) {
    try {
        const { id } = req.params

        const result = await pool.query(
            "DELETE FROM customers WHERE id = $1 RETURNING id",
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Cliente não encontrado" })
        }

        return res.status(200).json({
            success: true,
            message: "Cliente removido",
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao remover cliente" })
    }
}
