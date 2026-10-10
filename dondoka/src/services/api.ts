import axios, { isAxiosError } from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 20_000,
    headers: { "X-Requested-With": "XMLHttpRequest" },
});

type UnauthorizedListener = (scope: "admin" | "customer") => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

/** Avisa contextos de sessão quando a API responde 401 (sessão expirada ou inválida). */
export function onUnauthorized(listener: UnauthorizedListener) {
    unauthorizedListeners.add(listener);
    return () => {
        unauthorizedListeners.delete(listener);
    };
}

api.interceptors.response.use(undefined, (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
        const url = error.config?.url || "";
        const isLoginAttempt = url.includes("/auth/login") || url.includes("/admin/auth");
        if (!isLoginAttempt) {
            const scope = url.startsWith("/admin") ? "admin" : "customer";
            unauthorizedListeners.forEach((listener) => listener(scope));
        }
    }
    return Promise.reject(error);
});

export function apiErrorMessage(error: unknown, fallback: string): string {
    if (isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message || fallback;
    }
    return fallback;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: { total: number; page: number; limit: number };
}

export function resolveImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) return "/placeholder.svg";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }

    const origin = API_URL.startsWith("http") ? API_URL.replace(/\/api$/, "") : "";
    return `${origin}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

export default api;
