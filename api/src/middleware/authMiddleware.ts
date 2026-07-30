import type { RequestHandler } from "express"
import jwt from "jsonwebtoken"


interface JwtPayload {
    id: string
    username?: string
    email?: string
    role?: string
}

const authMiddleware: RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({
            message: "Token não enviado",
        })
    }

    const parts = authHeader.split(" ")

    if (parts.length !== 2) {
        return res.status(401).json({
            message: "Token mal formatado",
        })
    }

    const [scheme, token] = parts as [string, string]

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({
            message: "Token mal formatado",
        })
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as JwtPayload

        req.user = decoded

        if (decoded.role && decoded.role !== "admin") {
            return res.status(403).json({
                message: "Acesso restrito a administradores",
            })
        }

        return next()
    } catch {
        return res.status(401).json({
            message: "Token inválido ou expirado",
        })
    }
}

export default authMiddleware
