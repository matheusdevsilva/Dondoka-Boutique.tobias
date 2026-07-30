import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import HeaderAdmin from "../admin/components/HeaderAdmin";
import SidebarAdmin from "../admin/components/SidebarAdmin";
import "../admin/components/LayoutAdmin.css";

function isTokenValid(token: string): boolean {
    try {
        const parts = token.split(".");
        if (parts.length !== 3 || !parts[1]) return false;

        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) return true;

        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

export default function AdminRoute() {

    const [collapsed, setCollapsed] = useState(false);
    const [auth, setAuth] = useState<boolean | null>(null);

    const toggleSidebar = () => {
        setCollapsed(prev => !prev);
    };

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token || !isTokenValid(token)) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setAuth(false);
            return;
        }

        setAuth(true);
    }, []);

    if (auth === null) {
        return <div>Carregando...</div>;
    }

    if (!auth) {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className="admin-layout">
            <SidebarAdmin collapsed={collapsed} />

            <div className={`admin-main ${collapsed ? "collapsed" : ""}`}>
                <HeaderAdmin toggleSidebar={toggleSidebar} />

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
