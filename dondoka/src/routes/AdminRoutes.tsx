import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import HeaderAdmin from "../admin/components/HeaderAdmin";
import SidebarAdmin from "../admin/components/SidebarAdmin";
import "../admin/components/LayoutAdmin.css";

export default function AdminRoute() {

    const [collapsed, setCollapsed] = useState(false);
    const [auth, setAuth] = useState<boolean | null>(null);

    const toggleSidebar = () => {
        setCollapsed(prev => !prev);
    };

    useEffect(() => {
        const token = localStorage.getItem("token");

       
        if (!token) {
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