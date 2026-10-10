export interface OrderItemSummary {
    product_name: string;
    size?: string | null;
    quantity: number;
    unit_price: number | string;
}

export interface OrderSummary {
    id: number;
    customer_name: string;
    shipping_method: "pickup" | "delivery";
    subtotal: number | string;
    discount: number | string;
    shipping_fee: number | string;
    total: number | string;
    status: string;
    coupon_code?: string | null;
    created_at?: string;
    items: OrderItemSummary[];
}

interface RememberedOrder {
    id: number;
    phone: string;
    whatsappMessage?: string;
}

const KEY = "dondoka_last_order";

/** Guarda na aba atual o necessário para reabrir a confirmação depois de um refresh. */
export function rememberOrder(order: RememberedOrder) {
    try {
        sessionStorage.setItem(KEY, JSON.stringify(order));
    } catch {
        /* storage indisponível */
    }
}

export function recallOrder(id: number | string): RememberedOrder | null {
    try {
        const raw = sessionStorage.getItem(KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as RememberedOrder;
        return String(parsed.id) === String(id) ? parsed : null;
    } catch {
        return null;
    }
}
