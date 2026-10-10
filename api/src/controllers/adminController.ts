import type { Request, Response } from "express"
import bcrypt from "bcrypt"
import pool from "../database/db.js"
import { endSession, startSession } from "../utils/auth.js"
import { BCRYPT_ROUNDS, isEmail, MIN_ADMIN_PASSWORD } from "../utils/validation.js"

const DUMMY_HASH = bcrypt.hashSync("dondoka-dummy-password", BCRYPT_ROUNDS)

export async function Login(req: Request, res: Response) {
    try {
        const { username, password } = req.body ?? {}

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Usuário e senha são obrigatórios",
            })
        }

        const result = await pool.query(
            "SELECT id, username, password, role FROM admin WHERE username = $1",
            [String(username).trim()]
        )
        const user = result.rows[0]

        const passwordMatch = await bcrypt.compare(
            String(password),
            user?.password ?? DUMMY_HASH
        )

        if (!user || !passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Usuário ou senha inválidos",
            })
        }

        startSession(res, {
            id: String(user.id),
            username: user.username,
            role: "admin",
        })

        return res.status(200).json({
            success: true,
            data: {
                id: user.id,
                role: user.role || "admin",
                username: user.username,
            },
        })
    } catch (error) {
        console.error("Erro no login:", error)
        return res.status(500).json({
            success: false,
            message: "Erro interno no servidor",
        })
    }
}

export async function getAdminMe(req: Request, res: Response) {
    try {
        const result = await pool.query(
            "SELECT id, name, username, email, role FROM admin WHERE id = $1",
            [req.user?.id]
        )

        if (result.rows.length === 0) {
            endSession(res, "admin")
            return res.status(401).json({ success: false, message: "Sessão inválida" })
        }

        return res.status(200).json({ success: true, data: result.rows[0] })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao carregar sessão" })
    }
}

export function LogoutAdmin(_req: Request, res: Response) {
    endSession(res, "admin")
    return res.status(200).json({ success: true })
}

export async function CreateAdmin(req: Request, res: Response) {
    try {
        const { name, username, email, password } = req.body ?? {}

        if (!name || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Nome, usuário, e-mail e senha são obrigatórios",
            })
        }

        if (!isEmail(email)) {
            return res.status(400).json({ success: false, message: "E-mail inválido" })
        }

        if (String(password).length < MIN_ADMIN_PASSWORD) {
            return res.status(400).json({
                success: false,
                message: `Senha deve ter pelo menos ${MIN_ADMIN_PASSWORD} caracteres`,
            })
        }

        const hashedPassword = await bcrypt.hash(String(password), BCRYPT_ROUNDS)

        const result = await pool.query(
            `INSERT INTO admin (name, username, email, password)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, username, email, role`,
            [
                String(name).trim(),
                String(username).trim(),
                String(email).trim().toLowerCase(),
                hashedPassword,
            ]
        )

        return res.status(201).json({ success: true, data: result.rows[0] })
    } catch (error: unknown) {
        if ((error as { code?: string }).code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Usuário ou e-mail já cadastrado",
            })
        }
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao criar admin" })
    }
}

export async function DeleteAdmin(req: Request, res: Response) {
    try {
        const { id } = req.params

        if (String(id) === String(req.user?.id)) {
            return res.status(400).json({
                success: false,
                message: "Você não pode remover o próprio acesso",
            })
        }

        const result = await pool.query(
            "DELETE FROM admin WHERE id = $1 RETURNING id",
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Admin não encontrado" })
        }

        return res.status(200).json({ success: true })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao deletar admin" })
    }
}

export async function EditAdmin(req: Request, res: Response) {
    try {
        const { id } = req.params
        const { name, username, email, password } = req.body ?? {}

        const existing = await pool.query(
            "SELECT id, name, username, email, password FROM admin WHERE id = $1",
            [id]
        )

        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Admin não encontrado" })
        }

        if (email != null && !isEmail(email)) {
            return res.status(400).json({ success: false, message: "E-mail inválido" })
        }

        if (password && String(password).length < MIN_ADMIN_PASSWORD) {
            return res.status(400).json({
                success: false,
                message: `Senha deve ter pelo menos ${MIN_ADMIN_PASSWORD} caracteres`,
            })
        }

        const current = existing.rows[0]
        const hashedPassword = password
            ? await bcrypt.hash(String(password), BCRYPT_ROUNDS)
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
                email != null ? String(email).trim().toLowerCase() : current.email,
                hashedPassword,
                id,
            ]
        )

        return res.status(200).json({ success: true, data: result.rows[0] })
    } catch (error: unknown) {
        if ((error as { code?: string }).code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Usuário ou e-mail já cadastrado",
            })
        }
        console.error(error)
        return res.status(500).json({ success: false, message: "Erro ao editar admin" })
    }
}
