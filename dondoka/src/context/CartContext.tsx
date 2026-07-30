import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

export interface CartItem {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    quantity: number;
    size?: string;
}

interface CartContextValue {
    items: CartItem[];
    cartOpen: boolean;
    setCartOpen: (open: boolean) => void;
    addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
    increaseQty: (id: string, size?: string) => void;
    decreaseQty: (id: string, size?: string) => void;
    removeItem: (id: string, size?: string) => void;
    clearCart: () => void;
    total: number;
    count: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "dondoka_cart";

function itemKey(id: string, size?: string) {
    return `${id}::${size || "-"}`;
}

function loadCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => loadCart());
    const [cartOpen, setCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    function addItem(item: Omit<CartItem, "quantity">, quantity = 1) {
        setItems((prev) => {
            const key = itemKey(item.id, item.size);
            const existing = prev.find(
                (p) => itemKey(p.id, p.size) === key
            );
            if (existing) {
                return prev.map((p) =>
                    itemKey(p.id, p.size) === key
                        ? { ...p, quantity: p.quantity + quantity }
                        : p
                );
            }
            return [...prev, { ...item, quantity }];
        });
        setCartOpen(true);
    }

    function increaseQty(id: string, size?: string) {
        const key = itemKey(id, size);
        setItems((prev) =>
            prev.map((item) =>
                itemKey(item.id, item.size) === key
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    }

    function decreaseQty(id: string, size?: string) {
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
    }

    function removeItem(id: string, size?: string) {
        const key = itemKey(id, size);
        setItems((prev) =>
            prev.filter((item) => itemKey(item.id, item.size) !== key)
        );
    }

    function clearCart() {
        setItems([]);
    }

    const total = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );

    const count = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                cartOpen,
                setCartOpen,
                addItem,
                increaseQty,
                decreaseQty,
                removeItem,
                clearCart,
                total,
                count,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error("useCart deve ser usado dentro de CartProvider");
    }
    return ctx;
}
