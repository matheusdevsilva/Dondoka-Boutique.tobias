import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

interface WishlistContextValue {
    ids: string[];
    count: number;
    isFavorite: (productId: string | number) => boolean;
    toggle: (productId: string | number) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "dondoka_wishlist";

function loadLocal(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [ids, setIds] = useState<string[]>(() => loadLocal());

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }, [ids]);

    useEffect(() => {
        async function sync() {
            if (!user) return;
            try {
                const res = await api.post("/auth/wishlist/sync", {
                    product_ids: ids.map(Number).filter((n) => !Number.isNaN(n)),
                });
                if (Array.isArray(res.data.data)) {
                    setIds(res.data.data.map(String));
                }
            } catch (error) {
                console.error(error);
            }
        }
        sync();
        // Only when user logs in — merge local into server
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    function isFavorite(productId: string | number) {
        return ids.includes(String(productId));
    }

    function toggle(productId: string | number) {
        const id = String(productId);
        const adding = !ids.includes(id);

        setIds((prev) =>
            adding ? [...prev, id] : prev.filter((item) => item !== id)
        );

        if (user) {
            if (adding) {
                api.post("/auth/wishlist", { product_id: Number(id) }).catch(
                    console.error
                );
            } else {
                api.delete(`/auth/wishlist/${id}`).catch(console.error);
            }
        }
    }

    return (
        <WishlistContext.Provider
            value={{
                ids,
                count: ids.length,
                isFavorite,
                toggle,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const ctx = useContext(WishlistContext);
    if (!ctx) {
        throw new Error("useWishlist deve ser usado dentro de WishlistProvider");
    }
    return ctx;
}
