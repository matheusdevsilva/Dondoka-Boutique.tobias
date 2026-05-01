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

    } catch (error) {

    }
}

export async function DeleteProducts(req: Request, res: Response) {
    try {

    } catch (error) {

    }

}


export async function EditProducts(req: Request, res: Response) {
    try {

    } catch (error) {

    }

}