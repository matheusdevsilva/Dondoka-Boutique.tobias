import type { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import pool from "../database/db.js"

export async function Login(req: Request, res: Response) {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({
                message: "Username e password são obrigatórios",
            })
        }

        const sql = "SELECT * FROM admin WHERE username = $1"
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
                role: user.role,
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


export async function CreateAdmin(req: Request, res: Response) {
    try {
        const { name, username, email, password } = req.body

        if (!name || !username || !email || !password) {
            return res.status(400).json({
                message: "name, username, email e password são obrigatórios",
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const result = await pool.query(
            `INSERT INTO admin (name, username, email, password)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, username, email, role`,
            [name, username, email, hashedPassword]
        )

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao criar admin" })
    }
}


export async function DeleteAdmin(req: Request, res: Response) {
    try {
        const { id } = req.params

        const result = await pool.query(
            "DELETE FROM admin WHERE id = $1 RETURNING id",
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Admin não encontrado" })
        }

        return res.status(200).json({
            success: true,
            message: "Admin deletado com sucesso"
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao deletar admin" })
    }
}

export async function EditAdmin(req: Request, res: Response) {
    try {
        const { id } = req.params
        const { name, username, email, password } = req.body

        if (!id) {
            return res.status(400).json({ message: "ID é obrigatório" })
        }

        const existing = await pool.query(
            "SELECT * FROM admin WHERE id = $1",
            [id]
        )

        if (existing.rows.length === 0) {
            return res.status(404).json({ message: "Admin não encontrado" })
        }

        const current = existing.rows[0]
        const hashedPassword = password
            ? await bcrypt.hash(password, 10)
            : current.password

        const result = await pool.query(
            `UPDATE admin SET
                name = $1,
                username = $2,
                email = $3,
                password = $4
             WHERE id = $5
             RETURNING id, name, username, email, role`,
            [
                name ?? current.name,
                username ?? current.username,
                email ?? current.email,
                hashedPassword,
                id,
            ]
        )

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao editar admin" })
    }
}
