import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import api, { onUnauthorized, type ApiResponse } from "../services/api";

export interface CustomerUser {
    id: number | string;
    name: string;
    email: string;
    phone: string;
}

export interface RegisterData {
    name: string;
    email: string;
    phone: string;
    password: string;
}

interface AuthContextValue {
    user: CustomerUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CustomerUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        localStorage.removeItem("dondoka_customer_token");

        const controller = new AbortController();
        api.get<ApiResponse<CustomerUser>>("/auth/me", { signal: controller.signal })
            .then((res) => setUser(res.data.data))
            .catch(() => setUser(null))
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        const unsubscribe = onUnauthorized((scope) => {
            if (scope === "customer") setUser(null);
        });

        return () => {
            controller.abort();
            unsubscribe();
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.post<ApiResponse<CustomerUser>>("/auth/login", { email, password });
        setUser(res.data.data);
    }, []);

    const register = useCallback(async (data: RegisterData) => {
        const res = await api.post<ApiResponse<CustomerUser>>("/auth/register", data);
        setUser(res.data.data);
    }, []);

    const logout = useCallback(async () => {
        setUser(null);
        await api.post("/auth/logout").catch(() => undefined);
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout }),
        [user, loading, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
    return ctx;
}
