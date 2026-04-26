import type { RequestHandler } from "express"
import jwt from "jsonwebtoken"

const authMiddleware: RequestHandler = (req, res, next) => {

    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({
            message: "Token não enviado"
        })
    }

    const token:any = authHeader.split(" ")[1]

    try {

        jwt.verify(token, process.env.JWT_SECRET as string)

        next()

    } catch {

        return res.status(401).json({
            message: "Token inválido"
        })
    }
}

export default authMiddleware