/** Número da loja no WhatsApp (só dígitos, com DDI). Ex: 5511999999999 */
export function getStoreWhatsApp(): string {
    const raw = String(import.meta.env.VITE_WHATSAPP || "").replace(/\D/g, "")
    return raw || ""
}

export function isWhatsAppConfigured(): boolean {
    const n = getStoreWhatsApp()
    return n.length >= 12 && n !== "5500000000000"
}

export function whatsappLink(text?: string): string {
    const n = getStoreWhatsApp() || "5500000000000"
    if (!text) return `https://wa.me/${n}`
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`
}
