import type { Request, Response } from "express"
import pool from "../database/db.js"


export async function getProducts(req: Request, res: Response) {
    try {
        const result = await pool.query("SELECT * FROM products")

        return res.status(200).json({
            success: true,
            data: result.rows
        })
    } catch (error) {
        console.error("Erro ao buscar produtos:", error)

        return res.status(500).json({
            success: false,
            message: "Erro interno"
        })
    }
}


export async function getProductsById(req: Request, res: Response) {
    try {
        const { id } = req.params

        const result = await pool.query(
            "SELECT * FROM products WHERE id = $1",
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Produto não encontrado" })
        }

        return res.status(200).json(result.rows[0])

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao buscar produto" })
    }
}



export async function createNewProducts(req: Request, res: Response) {
    try {
        const {
            name,
            description,
            price,
            discount_price,
            category_id,
            brand,
            image_url
        } = req.body

        const result = await pool.query(
            `INSERT INTO products 
            (name, description, price, discount_price, category_id, brand, image_url)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [name, description, price, discount_price, category_id, brand, image_url]
        )

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        })

    } catch (error) {
        console.error("Erro ao criar produto:", error)

        return res.status(500).json({
            success: false,
            message: "Erro ao criar produto"
        })
    }
}

export async function DeleteProducts(req: Request, res: Response) {
    try {
        const { id } = req.params

        const result = await pool.query(
            "DELETE FROM products WHERE id = $1 RETURNING *",
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Produto não encontrado"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Produto deletado com sucesso"
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            success: false,
            message: "Erro ao deletar produto"
        })
    }
}

export async function EditProducts(req: Request, res: Response) {
    try {
        const { id } = req.params

        const {
            name,
            description,
            price,
            discount_price,
            category_id,
            brand,
            image_url
        } = req.body

        const result = await pool.query(
            `UPDATE products SET
                name = $1,
                description = $2,
                price = $3,
                discount_price = $4,
                category_id = $5,
                brand = $6,
                image_url = $7,
                updated_at = NOW()
             WHERE id = $8
             RETURNING *`,
            [
                name,
                description,
                price,
                discount_price,
                category_id,
                brand,
                image_url,
                id
            ]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Produto não encontrado"
            })
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            success: false,
            message: "Erro ao atualizar produto"
        })
    }
}



export async function getProductsByCategory(req: Request, res: Response) {
    try {
        const { category } = req.query

        const result = await pool.query(
            `SELECT p.*, c.name AS category
             FROM products p
             JOIN categories c ON p.category_id = c.id
             WHERE c.name = $1`,
            [category]
        )

        res.json(result.rows)

    } catch (error) {
        res.status(500).json({ message: "Erro ao filtrar" })
    }
}