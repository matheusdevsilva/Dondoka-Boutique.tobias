import { createContext, useContext } from "react";

export interface AdminUser {
    id: number;
    username: string;
    name?: string;
    email?: string;
    role: string;
}

export interface AdminSessionValue {
    user: AdminUser;
    logout: () => Promise<void>;
}

export const AdminSessionContext = createContext<AdminSessionValue | null>(null);

export function useAdminSession() {
    const ctx = useContext(AdminSessionContext);
    if (!ctx) throw new Error("useAdminSession deve ser usado dentro de AdminRoute");
    return ctx;
}
