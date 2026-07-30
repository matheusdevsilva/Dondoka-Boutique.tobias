import type { Request, Response } from "express"
import pool from "../database/db.js"

export async function validateCoupon(req: Request, res: Response) {
    try {
        const code = String(req.body.code || req.query.code || "")
            .trim()
            .toUpperCase()
        const subtotal = Number(req.body.subtotal ?? req.query.subtotal ?? 0)

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Informe o cupom",
            })
        }

        const result = await pool.query(
            "SELECT * FROM coupons WHERE UPPER(code) = $1",
            [code]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cupom inválido",
            })
        }

        const coupon = result.rows[0]
        const check = validateCouponRow(coupon, subtotal)
        if (!check.ok) {
            return res.status(400).json({
                success: false,
                message: check.message,
            })
        }

        const discount = calcDiscount(coupon, subtotal)

        return res.status(200).json({
            success: true,
            data: {
                code: coupon.code,
                type: coupon.type,
                value: Number(coupon.value),
                discount,
            },
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao validar cupom" })
    }
}

export function validateCouponRow(
    coupon: {
        is_active: boolean
        expires_at?: string | Date | null
        max_uses?: number | null
        used_count?: number | null
        min_order?: number | null
    },
    subtotal: number
): { ok: true } | { ok: false; message: string } {
    if (!coupon.is_active) {
        return { ok: false, message: "Cupom inativo" }
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { ok: false, message: "Cupom expirado" }
    }
    if (
        coupon.max_uses != null &&
        Number(coupon.used_count || 0) >= Number(coupon.max_uses)
    ) {
        return { ok: false, message: "Cupom esgotado" }
    }
    if (Number(coupon.min_order || 0) > subtotal) {
        return {
            ok: false,
            message: `Pedido mínimo de R$ ${Number(coupon.min_order).toFixed(2)}`,
        }
    }
    return { ok: true }
}

export function calcDiscount(
    coupon: { type: string; value: number | string },
    subtotal: number
): number {
    const value = Number(coupon.value) || 0
    if (coupon.type === "fixed") {
        return Math.min(subtotal, value)
    }
    return Math.round(subtotal * (value / 100) * 100) / 100
}

export async function getCoupons(_req: Request, res: Response) {
    try {
        const result = await pool.query(
            "SELECT * FROM coupons ORDER BY id DESC"
        )
        return res.status(200).json({ success: true, data: result.rows })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao listar cupons" })
    }
}

export async function createCoupon(req: Request, res: Response) {
    try {
        const {
            code,
            type = "percent",
            value,
            min_order = 0,
            max_uses,
            expires_at,
            is_active = true,
        } = req.body

        if (!code || value == null) {
            return res.status(400).json({
                success: false,
                message: "Código e valor são obrigatórios",
            })
        }

        if (!["percent", "fixed"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Tipo inválido",
            })
        }

        const result = await pool.query(
            `INSERT INTO coupons
             (code, type, value, min_order, max_uses, expires_at, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                String(code).trim().toUpperCase(),
                type,
                Number(value),
                Number(min_order) || 0,
                max_uses === "" || max_uses == null ? null : Number(max_uses),
                expires_at || null,
                is_active === true || is_active === "true",
            ]
        )

        return res.status(201).json({ success: true, data: result.rows[0] })
    } catch (error: unknown) {
        const err = error as { code?: string }
        if (err.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Código já existe",
            })
        }
        console.error(error)
        return res.status(500).json({ message: "Erro ao criar cupom" })
    }
}

export async function updateCoupon(req: Request, res: Response) {
    try {
        const { id } = req.params
        const {
            code,
            type,
            value,
            min_order,
            max_uses,
            expires_at,
            is_active,
        } = req.body

        const current = await pool.query(
            "SELECT * FROM coupons WHERE id = $1",
            [id]
        )
        if (current.rows.length === 0) {
            return res.status(404).json({ message: "Cupom não encontrado" })
        }
        const c = current.rows[0]

        const result = await pool.query(
            `UPDATE coupons SET
                code = $1,
                type = $2,
                value = $3,
                min_order = $4,
                max_uses = $5,
                expires_at = $6,
                is_active = $7
             WHERE id = $8
             RETURNING *`,
            [
                code ? String(code).trim().toUpperCase() : c.code,
                type || c.type,
                value != null ? Number(value) : c.value,
                min_order != null ? Number(min_order) : c.min_order,
                max_uses === "" || max_uses === undefined
                    ? c.max_uses
                    : max_uses == null
                      ? null
                      : Number(max_uses),
                expires_at === undefined ? c.expires_at : expires_at || null,
                is_active === undefined
                    ? c.is_active
                    : is_active === true || is_active === "true",
                id,
            ]
        )

        return res.status(200).json({ success: true, data: result.rows[0] })
    } catch (error: unknown) {
        const err = error as { code?: string }
        if (err.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Código já existe",
            })
        }
        console.error(error)
        return res.status(500).json({ message: "Erro ao atualizar cupom" })
    }
}

export async function deleteCoupon(req: Request, res: Response) {
    try {
        const { id } = req.params
        const result = await pool.query(
            "DELETE FROM coupons WHERE id = $1 RETURNING id",
            [id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Cupom não encontrado" })
        }
        return res.status(200).json({ success: true })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Erro ao deletar cupom" })
    }
}
