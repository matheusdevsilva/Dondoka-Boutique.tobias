import pool from "../database/db.js"
import type { Request, Response } from "express"

export default async function Login(req: Request, res: Response) {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({
                message: "Username e password são obrigatórios"
            })
        }
        const sql = "SELECT * FROM tbl_admin WHERE username = $1"
        const result = await pool.query(sql, [username])


        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Usuário não encontrado"
            })
        }

        

    } catch (error) {

    }
}
