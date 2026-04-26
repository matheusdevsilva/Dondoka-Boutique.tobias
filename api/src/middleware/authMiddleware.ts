import type { RequestHandler } from "express"
import jwt from "jsonwebtoken"

const authMiddleware: RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({
            message: "Token não enviado",
        })
    }

    const parts = authHeader.split(" ")

    // 🔥 valida formato "Bearer token"
    if (parts.length !== 2) {
        return res.status(401).json({
            message: "Token mal formatado",
        })
    }

    const [scheme, token] = parts

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({
            message: "Token mal formatado",
        })
    }

    try {
        // 🔐 valida e captura payload
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        )

        // 💡 opcional: salvar usuário no request
        req.user = decoded

        return next()
    } catch (err) {
        return res.status(401).json({
            message: "Token inválido ou expirado",
        })
    }
}

export default authMiddleware