import type { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import pool from "../database/db.js"

function signCustomerToken(customer: { id: number; email: string }) {
    return jwt.sign(
        {
            id: String(customer.id),
            email: customer.email,
            role: "customer",
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
    )
}

export async function registerCustomer(req: Request, res: Response) {
    try {
        const { name, email, phone, password } = req.body

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Nome, e-mail, telefone e senha são obrigatórios",
            })
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Senha deve ter pelo menos 6 caracteres",
            })
        }

        const existing = await pool.query(
            "SELECT id FROM customers WHERE email = $1",
            [String(email).toLowerCase().trim()]
        )

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "E-mail já cadastrado",
            })
        }

        const hash = await bcrypt.hash(String(password), 10)
        const result = await pool.query(
            `INSERT INTO customers (name, email, phone, password)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, phone, created_at`,
            [
                String(name).trim(),
                String(email).toLowerCase().trim(),
                String(phone).trim(),
                hash,
            ]
        )

        const customer = result.rows[0]
        const token = signCustomerToken(customer)

        return res.status(201).json({
            success: true,
            token,
            user: customer,
        })
    } catch (error) {
        console.error("Erro ao cadastrar cliente:", error)
        return res.status(500).json({
            success: false,
            message: "Erro ao cadastrar",
        })
    }
}

export async function loginCustomer(req: Request, res: Response) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "E-mail e senha são obrigatórios",
            })
        }

        const result = await pool.query(
            "SELECT * FROM customers WHERE email = $1",
            [String(email).toLowerCase().trim()]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "E-mail ou senha inválidos",
            })
        }

        const customer = result.rows[0]
        const ok = await bcrypt.compare(String(password), customer.password)

        if (!ok) {
            return res.status(401).json({
                success: false,
                message: "E-mail ou senha inválidos",
            })
        }

        const token = signCustomerToken(customer)

        return res.status(200).json({
            success: true,
            token,
            user: {
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

export async function getCustomerMe(req: Request, res: Response) {
    try {
        const id = req.user?.id
        if (!id) {
            return res.status(401).json({ message: "Não autenticado" })
        }

        const result = await pool.query(
            `SELECT id, name, email, phone, created_at
             FROM customers WHERE id = $1`,
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Cliente não encontrado" })
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro interno" })
    }
}

export async function getMyOrders(req: Request, res: Response) {
    try {
        const id = req.user?.id
        if (!id) {
            return res.status(401).json({ message: "Não autenticado" })
        }

        const orders = await pool.query(
            `SELECT * FROM orders
             WHERE customer_id = $1
             ORDER BY id DESC`,
            [id]
        )

        const items = await pool.query(
            `SELECT oi.*
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE o.customer_id = $1
             ORDER BY oi.id`,
            [id]
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
        console.error(error)
        return res.status(500).json({ message: "Erro ao listar pedidos" })
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
        const id = req.user?.id
        const { product_id } = req.body

        if (!id || !product_id) {
            return res.status(400).json({
                success: false,
                message: "product_id é obrigatório",
            })
        }

        await pool.query(
            `INSERT INTO wishlist_items (customer_id, product_id)
             VALUES ($1, $2)
             ON CONFLICT (customer_id, product_id) DO NOTHING`,
            [id, product_id]
        )

        return res.status(201).json({ success: true })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao favoritar" })
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
        const { product_ids } = req.body

        if (!id || !Array.isArray(product_ids)) {
            return res.status(400).json({ message: "product_ids inválido" })
        }

        const client = await pool.connect()
        try {
            await client.query("BEGIN")
            for (const productId of product_ids) {
                await client.query(
                    `INSERT INTO wishlist_items (customer_id, product_id)
                     VALUES ($1, $2)
                     ON CONFLICT (customer_id, product_id) DO NOTHING`,
                    [id, productId]
                )
            }
            await client.query("COMMIT")
        } catch (error) {
            await client.query("ROLLBACK")
            throw error
        } finally {
            client.release()
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
        return res.status(500).json({ message: "Erro ao sincronizar favoritos" })
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
                COUNT(DISTINCT o.id)::int AS orders_count,
                COALESCE(SUM(o.total), 0)::numeric AS orders_total,
                COUNT(DISTINCT w.id)::int AS wishlist_count
             FROM customers c
             LEFT JOIN orders o ON o.customer_id = c.id
             LEFT JOIN wishlist_items w ON w.customer_id = c.id
             GROUP BY c.id
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

        const items = await pool.query(
            `SELECT oi.*
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE o.customer_id = $1
             ORDER BY oi.id`,
            [id]
        )

        const byOrder = new Map<number, typeof items.rows>()
        for (const item of items.rows) {
            const list = byOrder.get(item.order_id) || []
            list.push(item)
            byOrder.set(item.order_id, list)
        }

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
                orders: orders.rows.map((order) => ({
                    ...order,
                    items: byOrder.get(order.id) || [],
                })),
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
