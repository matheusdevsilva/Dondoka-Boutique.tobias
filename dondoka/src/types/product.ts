export interface ProductType {
    id: string | number;
    name: string;
    description?: string | null;
    price: number | string;
    discount_price?: number | string | null;
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
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                list = parsed.filter((item): item is string => typeof item === "string" && !!item);
            }
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

/** Mesma regra da API: o preço promocional só vale quando é menor que o preço cheio. */
export function hasDiscount(product: Pick<ProductType, "price" | "discount_price">) {
    const price = Number(product.price);
    const discount = Number(product.discount_price);
    return discount > 0 && discount < price;
}

export function productPrice(product: Pick<ProductType, "price" | "discount_price">) {
    return hasDiscount(product) ? Number(product.discount_price) : Number(product.price) || 0;
}

export function productStock(product: Pick<ProductType, "stock">) {
    return Math.max(0, Number(product.stock ?? 0));
}

export function parseSizes(sizes?: string | null): string[] {
    if (!sizes) return [];
    return sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}
