const WEAK_SECRETS = new Set(["troque-esta-chave", "sua_chave", "secret", "changeme"])

function requireJwtSecret(): string {
    const secret = process.env.JWT_SECRET?.trim() || ""
    if (secret.length < 32 || WEAK_SECRETS.has(secret)) {
        throw new Error(
            "JWT_SECRET ausente ou fraco. Defina um valor aleatório com pelo menos 32 caracteres (ex.: openssl rand -hex 32)."
        )
    }
    return secret
}

export const JWT_SECRET = requireJwtSecret()
export const DELIVERY_FEE = Number(process.env.SHIPPING_FEE || 15)
export const IS_PRODUCTION = process.env.NODE_ENV === "production"
