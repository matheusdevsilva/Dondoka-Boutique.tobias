import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { productCover, productPrice, type ProductType } from "../types/product";

export interface CartItem {
    id: string;
    name: string;
    /** Preço exibido; o servidor recalcula no pedido. */
    price: number;
    image_url?: string;
    quantity: number;
    size?: string;
}

interface CartContextValue {
    items: CartItem[];
    cartOpen: boolean;
    setCartOpen: (open: boolean) => void;
    checkoutOpen: boolean;
    setCheckoutOpen: (open: boolean) => void;
    addItem: (
        item: Omit<CartItem, "quantity">,
        quantity?: number,
        options?: { openCart?: boolean }
    ) => void;
    increaseQty: (id: string, size?: string) => void;
    decreaseQty: (id: string, size?: string) => void;
    removeItem: (id: string, size?: string) => void;
    clearCart: () => void;
    refreshFromCatalog: (products: ProductType[]) => number;
    total: number;
    count: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "dondoka_cart";
const MAX_QTY = 20;

function itemKey(id: string, size?: string) {
    return `${id}::${size || "-"}`;
}

function isCartItem(value: unknown): value is CartItem {
    if (!value || typeof value !== "object") return false;
    const item = value as Record<string, unknown>;
    return (
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        Number.isInteger(item.quantity) &&
        (item.quantity as number) > 0 &&
        (item.size === undefined || typeof item.size === "string")
    );
}

function loadCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
    } catch {
        return [];
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(loadCart);
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    useEffect(() => {
        function onStorage(event: StorageEvent) {
            if (event.key === STORAGE_KEY) setItems(loadCart());
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const addItem = useCallback((
        item: Omit<CartItem, "quantity">,
        quantity = 1,
        options: { openCart?: boolean } = {}
    ) => {
        setItems((prev) => {
            const key = itemKey(item.id, item.size);
            const existing = prev.find((p) => itemKey(p.id, p.size) === key);
            if (existing) {
                return prev.map((p) =>
                    itemKey(p.id, p.size) === key
                        ? { ...p, quantity: Math.min(MAX_QTY, p.quantity + quantity) }
                        : p
                );
            }
            return [...prev, { ...item, quantity: Math.min(MAX_QTY, quantity) }];
        });
        if (options.openCart !== false) setCartOpen(true);
    }, []);

    const increaseQty = useCallback((id: string, size?: string) => {
        const key = itemKey(id, size);
        setItems((prev) =>
            prev.map((item) =>
                itemKey(item.id, item.size) === key
                    ? { ...item, quantity: Math.min(MAX_QTY, item.quantity + 1) }
                    : item
            )
        );
    }, []);

    const decreaseQty = useCallback((id: string, size?: string) => {
        const key = itemKey(id, size);
        setItems((prev) =>
            prev
                .map((item) =>
                    itemKey(item.id, item.size) === key
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    }, []);

    const removeItem = useCallback((id: string, size?: string) => {
        const key = itemKey(id, size);
        setItems((prev) => prev.filter((item) => itemKey(item.id, item.size) !== key));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    /** Atualiza nome/preço/imagem com o catálogo atual e remove itens indisponíveis. Retorna quantos foram removidos. */
    const refreshFromCatalog = useCallback(
        (products: ProductType[]) => {
            const byId = new Map(products.map((p) => [String(p.id), p]));
            const removed = items.filter((item) => !byId.has(item.id)).length;
            setItems((prev) =>
                prev.flatMap((item) => {
                    const product = byId.get(item.id);
                    if (!product) return [];
                    return [
                        {
                            ...item,
                            name: product.name,
                            price: productPrice(product),
                            image_url: productCover(product) || item.image_url,
                        },
                    ];
                })
            );
            return removed;
        },
        [items]
    );

    const value = useMemo(() => {
        const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const count = items.reduce((acc, item) => acc + item.quantity, 0);
        return {
            items,
            cartOpen,
            setCartOpen,
            checkoutOpen,
            setCheckoutOpen,
            addItem,
            increaseQty,
            decreaseQty,
            removeItem,
            clearCart,
            refreshFromCatalog,
            total,
            count,
        };
    }, [items, cartOpen, checkoutOpen, addItem, increaseQty, decreaseQty, removeItem, clearCart, refreshFromCatalog]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error("useCart deve ser usado dentro de CartProvider");
    }
    return ctx;
}
