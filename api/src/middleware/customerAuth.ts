import type { RequestHandler } from "express"
import jwt from "jsonwebtoken"

interface JwtPayload {
    id: string
    username?: string
    email?: string
    role?: string
}

/** Exige token de cliente (role = customer). */
export const customerAuth: RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({ message: "Token não enviado" })
    }

    const parts = authHeader.split(" ")
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0] || "")) {
        return res.status(401).json({ message: "Token mal formatado" })
    }

    try {
        const decoded = jwt.verify(
            parts[1] as string,
            process.env.JWT_SECRET as string
        ) as JwtPayload

        if (decoded.role !== "customer") {
            return res.status(403).json({ message: "Acesso negado" })
        }

        req.user = decoded
        return next()
    } catch {
        return res.status(401).json({ message: "Token inválido ou expirado" })
    }
}

/** Anexa cliente se houver token válido; não bloqueia guest. */
export const optionalCustomerAuth: RequestHandler = (req, _res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) return next()

    const parts = authHeader.split(" ")
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0] || "")) {
        return next()
    }

    try {
        const decoded = jwt.verify(
            parts[1] as string,
            process.env.JWT_SECRET as string
        ) as JwtPayload

        if (decoded.role === "customer") {
            req.user = decoded
        }
    } catch {
        /* ignore */
    }

    return next()
}

export default customerAuth
