

import type { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import pool from "../database/db.js"

export default async function Login(req: Request, res: Response) {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({
                message: "Username e password são obrigatórios",
            })
        }

        const sql = "SELECT * FROM tbl_admin WHERE username = $1"
        const result = await pool.query(sql, [username])

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Usuário não encontrado",
            })
        }

        const user = result.rows[0]


        const passwordMatch = await bcrypt.compare(password, user.password)

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Senha incorreta",
            })
        }


        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role || "admin",
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn: "1h",
            }
        )

        return res.status(200).json({
            message: "Login realizado com sucesso",
            token,
            user: {
                id: user.id,
                username: user.username,
            },
        })
    } catch (error) {
        console.error("Erro no login:", error)

        return res.status(500).json({
            message: "Erro interno no servidor",
        })
    }
}