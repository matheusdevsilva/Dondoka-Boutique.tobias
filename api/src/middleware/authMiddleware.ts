import type { RequestHandler } from "express"
import { readBearerToken, verifyToken } from "../utils/auth.js"

const authMiddleware: RequestHandler = (req, res, next) => {
    const token = readBearerToken(req, "admin")

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token não enviado",
        })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: "Token inválido ou expirado",
        })
    }

    if (decoded.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Acesso restrito a administradores",
        })
    }

    req.user = decoded
    return next()
}

export default authMiddleware
