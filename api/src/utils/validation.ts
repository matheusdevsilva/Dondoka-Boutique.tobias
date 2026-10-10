export const BCRYPT_ROUNDS = 12
export const MIN_CUSTOMER_PASSWORD = 8
export const MIN_ADMIN_PASSWORD = 10

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isEmail(value: unknown): boolean {
    return typeof value === "string" && value.length <= 160 && EMAIL_RE.test(value.trim())
}

/** Inteiro positivo vindo de params/body, ou null. */
export function toPositiveInt(value: unknown): number | null {
    const n = Number(value)
    return Number.isInteger(n) && n > 0 ? n : null
}

export function cleanText(value: unknown, maxLength: number): string {
    return String(value ?? "").trim().slice(0, maxLength)
}
