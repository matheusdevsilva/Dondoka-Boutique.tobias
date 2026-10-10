import type { Request, Response } from "express"
import pool from "../database/db.js"
import { cleanText, toPositiveInt } from "../utils/validation.js"

export async function getProductReviews(req: Request, res: Response) {
    try {
        const { id } = req.params
        const result = await pool.query(
            `SELECT id, product_id, author_name, rating, comment, created_at
             FROM product_reviews
             WHERE product_id = $1
             ORDER BY id DESC`,
            [id]
        )

        const avg =
            result.rows.length === 0
                ? 0
                : result.rows.reduce(
                      (acc, row) => acc + Number(row.rating),
                      0
                  ) / result.rows.length

        return res.status(200).json({
            success: true,
            data: {
                average: Math.round(avg * 10) / 10,
                count: result.rows.length,
                reviews: result.rows,
            },
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao buscar avaliações" })
    }
}

export async function createProductReview(req: Request, res: Response) {
    try {
        const id = toPositiveInt(req.params.id)
        const { rating } = req.body ?? {}
        const author_name = cleanText(req.body?.author_name, 80)
        const comment = cleanText(req.body?.comment, 1000)

        if (!id) {
            return res.status(404).json({ success: false, message: "Produto não encontrado" })
        }

        if (!author_name || !comment || rating == null) {
            return res.status(400).json({
                success: false,
                message: "Nome, nota e comentário são obrigatórios",
            })
        }

        const stars = Number(rating)
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
            return res.status(400).json({
                success: false,
                message: "Nota deve ser de 1 a 5",
            })
        }

        const product = await pool.query(
            "SELECT id FROM products WHERE id = $1 AND is_active = TRUE",
            [id]
        )
        if (product.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Produto não encontrado" })
        }

        const result = await pool.query(
            `INSERT INTO product_reviews (product_id, author_name, rating, comment)
             VALUES ($1, $2, $3, $4)
             RETURNING id, product_id, author_name, rating, comment, created_at`,
            [id, author_name, stars, comment]
        )

        return res.status(201).json({
            success: true,
            data: result.rows[0],
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao enviar avaliação" })
    }
}
