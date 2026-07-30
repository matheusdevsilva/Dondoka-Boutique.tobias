import axios from "axios";

const CUSTOMER_TOKEN_KEY = "dondoka_customer_token";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
    const url = `${config.baseURL || ""}${config.url || ""}`;
    const isAdmin = url.includes("/admin");

    if (isAdmin) {
        const token = localStorage.getItem("token");
        if (token) config.headers.set("Authorization", `Bearer ${token}`);
    } else {
        const customerToken = localStorage.getItem(CUSTOMER_TOKEN_KEY);
        if (customerToken) {
            config.headers.set("Authorization", `Bearer ${customerToken}`);
        }
    }

    return config;
});

export function resolveImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) return "/placeholder.png";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
    }

    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const origin = apiBase.replace(/\/api\/?$/, "");
    return `${origin}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

export default api;
