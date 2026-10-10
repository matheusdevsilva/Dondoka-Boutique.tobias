import type { CookieOptions, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { IS_PRODUCTION, JWT_SECRET } from "../config.js"

export type SessionKind = "admin" | "customer"

export interface TokenPayload {
    id: string
    username?: string
    email?: string
    role: SessionKind
}

const COOKIE_NAMES: Record<SessionKind, string> = {
    admin: "dondoka_admin",
    customer: "dondoka_customer",
}

const SESSION_TTL_SECONDS: Record<SessionKind, number> = {
    admin: 60 * 60 * 8,
    customer: 60 * 60 * 24 * 3,
}

const SAME_SITE_VALUES = ["lax", "strict", "none"] as const
type SameSite = (typeof SAME_SITE_VALUES)[number]

/** Front e API em sites diferentes (ex.: Render) exigem SameSite=None + Secure; atrás do mesmo domínio, use lax. */
const COOKIE_SAME_SITE: SameSite =
    SAME_SITE_VALUES.find((value) => value === process.env.COOKIE_SAMESITE?.toLowerCase()) ??
    (IS_PRODUCTION ? "none" : "lax")
const COOKIE_SECURE =
    COOKIE_SAME_SITE === "none" ||
    (process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : IS_PRODUCTION)

function cookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        path: "/",
    }
}

function parseCookies(header: string | undefined): Record<string, string> {
    const out: Record<string, string> = {}
    if (!header) return out
    for (const part of header.split(";")) {
        const index = part.indexOf("=")
        if (index < 0) continue
        const key = part.slice(0, index).trim()
        const value = part.slice(index + 1).trim()
        if (!key) continue
        try {
            out[key] = decodeURIComponent(value)
        } catch {
            out[key] = value
        }
    }
    return out
}

export function readBearerToken(req: Request, kind: SessionKind): string | null {
    const header = req.headers.authorization
    if (header) {
        const [scheme, token] = header.split(" ")
        if (scheme && token && /^Bearer$/i.test(scheme)) return token
    }
    return parseCookies(req.headers.cookie)[COOKIE_NAMES[kind]] || null
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] })
        if (typeof decoded !== "object" || !decoded) return null
        const payload = decoded as Partial<TokenPayload>
        if (!payload.id || (payload.role !== "admin" && payload.role !== "customer")) {
            return null
        }
        return payload as TokenPayload
    } catch {
        return null
    }
}

export function startSession(res: Response, payload: TokenPayload) {
    const ttl = SESSION_TTL_SECONDS[payload.role]
    const token = jwt.sign(payload, JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: ttl,
    })
    res.cookie(COOKIE_NAMES[payload.role], token, {
        ...cookieOptions(),
        maxAge: ttl * 1000,
    })
}

export function endSession(res: Response, kind: SessionKind) {
    res.clearCookie(COOKIE_NAMES[kind], cookieOptions())
}
