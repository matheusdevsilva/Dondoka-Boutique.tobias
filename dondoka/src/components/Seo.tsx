import { useEffect } from "react"

const SITE = "Dondoka Boutique"

interface SeoProps {
    title?: string
    description?: string
    image?: string | null
    noIndex?: boolean
}

type MetaKey = "description" | "og:title" | "og:description" | "og:image" | "robots"

const defaults = new Map<MetaKey, string | null>()

function metaElement(key: MetaKey) {
    const attr = key.startsWith("og:") ? "property" : "name"
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
    if (!defaults.has(key)) defaults.set(key, el?.content ?? null)
    if (!el) {
        el = document.createElement("meta")
        el.setAttribute(attr, key)
        document.head.appendChild(el)
    }
    return el
}

function setMeta(key: MetaKey, value: string | null | undefined) {
    const el = metaElement(key)
    const next = value ?? defaults.get(key) ?? null
    if (next == null) el.remove()
    else el.content = next
}

function absoluteUrl(src: string) {
    return new URL(src, window.location.origin).href
}

/** Atualiza as tags do index.html no lugar para não duplicar title/meta quando a página muda. */
export default function Seo({ title, description, image, noIndex }: SeoProps) {
    const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — moda feminina`

    useEffect(() => {
        document.title = fullTitle
        setMeta("description", description)
        setMeta("og:title", fullTitle)
        setMeta("og:description", description)
        setMeta("og:image", image ? absoluteUrl(image) : null)
        setMeta("robots", noIndex ? "noindex" : null)
    }, [fullTitle, description, image, noIndex])

    return null
}
