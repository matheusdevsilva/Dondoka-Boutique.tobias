import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import api from "../services/api";

export interface CustomerUser {
    id: number | string;
    name: string;
    email: string;
    phone: string;
}

interface AuthContextValue {
    user: CustomerUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        name: string;
        email: string;
        phone: string;
        password: string;
    }) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
export const CUSTOMER_TOKEN_KEY = "dondoka_customer_token";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CustomerUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await api.get("/auth/me");
                setUser(res.data.data);
            } catch {
                localStorage.removeItem(CUSTOMER_TOKEN_KEY);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function login(email: string, password: string) {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem(CUSTOMER_TOKEN_KEY, res.data.token);
        setUser(res.data.user);
    }

    async function register(data: {
        name: string;
        email: string;
        phone: string;
        password: string;
    }) {
        const res = await api.post("/auth/register", data);
        localStorage.setItem(CUSTOMER_TOKEN_KEY, res.data.token);
        setUser(res.data.user);
    }

    function logout() {
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{ user, loading, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
    return ctx;
}
