import type { RequestHandler } from "express"
import { readBearerToken, verifyToken } from "../utils/auth.js"

/** Exige sessão de cliente (role = customer). */
export const customerAuth: RequestHandler = (req, res, next) => {
    const token = readBearerToken(req, "customer")

    if (!token) {
        return res.status(401).json({ success: false, message: "Token não enviado" })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
        return res.status(401).json({ success: false, message: "Token inválido ou expirado" })
    }

    if (decoded.role !== "customer") {
        return res.status(403).json({ success: false, message: "Acesso negado" })
    }

    req.user = decoded
    return next()
}

/** Anexa cliente se houver sessão válida; não bloqueia guest. */
export const optionalCustomerAuth: RequestHandler = (req, _res, next) => {
    const token = readBearerToken(req, "customer")
    const decoded = token ? verifyToken(token) : null

    if (decoded?.role === "customer") {
        req.user = decoded
    }

    return next()
}

export default customerAuth
