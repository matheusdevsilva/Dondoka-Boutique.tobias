import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import api, { type ApiResponse } from "../services/api";
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
        return Array.isArray(parsed) ? parsed.map(String).filter((id) => /^\d+$/.test(id)) : [];
    } catch {
        return [];
    }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [ids, setIds] = useState<string[]>(loadLocal);
    const idsRef = useRef(ids);
    const userId = user?.id;

    useEffect(() => {
        idsRef.current = ids;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }, [ids]);

    useEffect(() => {
        function onStorage(event: StorageEvent) {
            if (event.key === STORAGE_KEY) setIds(loadLocal());
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    useEffect(() => {
        if (userId == null) return;
        const controller = new AbortController();
        api.post<ApiResponse<(string | number)[]>>(
            "/auth/wishlist/sync",
            { product_ids: idsRef.current.map(Number).filter((n) => Number.isInteger(n)) },
            { signal: controller.signal }
        )
            .then((res) => {
                if (Array.isArray(res.data.data)) setIds(res.data.data.map(String));
            })
            .catch((error) => {
                if (!controller.signal.aborted) console.error(error);
            });
        return () => controller.abort();
    }, [userId]);

    const isFavorite = useCallback((productId: string | number) => ids.includes(String(productId)), [ids]);

    const toggle = useCallback(
        (productId: string | number) => {
            const id = String(productId);
            const adding = !idsRef.current.includes(id);
            setIds((prev) => (adding ? [...prev, id] : prev.filter((item) => item !== id)));

            if (userId == null) return;
            const request = adding
                ? api.post("/auth/wishlist", { product_id: Number(id) })
                : api.delete(`/auth/wishlist/${id}`);
            request.catch(console.error);
        },
        [userId]
    );

    const value = useMemo(
        () => ({ ids, count: ids.length, isFavorite, toggle }),
        [ids, isFavorite, toggle]
    );

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
    const ctx = useContext(WishlistContext);
    if (!ctx) {
        throw new Error("useWishlist deve ser usado dentro de WishlistProvider");
    }
    return ctx;
}
