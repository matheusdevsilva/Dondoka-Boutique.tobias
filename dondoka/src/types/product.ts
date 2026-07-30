export interface ProductType {
    id: string;
    name: string;
    description?: string;
    price: number;
    discount_price?: number | null;
    image_url?: string | null;
    images?: string[] | string | null;
    category_id?: number | string | null;
    brand?: string | null;
    is_active?: boolean;
    stock?: number | null;
    sizes?: string | null;
}

export function productImages(
    product: Pick<ProductType, "image_url" | "images">
): string[] {
    const raw = product.images;
    let list: string[] = [];

    if (Array.isArray(raw)) {
        list = raw.filter(Boolean);
    } else if (typeof raw === "string" && raw.trim()) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) list = parsed.filter(Boolean);
        } catch {
            /* ignore */
        }
    }

    if (!list.length && product.image_url) list = [product.image_url];
    return list;
}

export function productCover(
    product: Pick<ProductType, "image_url" | "images">
): string | null {
    return productImages(product)[0] || null;
}

export function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

export function productPrice(product: Pick<ProductType, "price" | "discount_price">) {
    return Number(product.discount_price || product.price) || 0;
}

export function parseSizes(sizes?: string | null): string[] {
    if (!sizes) return ["P", "M", "G", "GG"];
    return sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}
