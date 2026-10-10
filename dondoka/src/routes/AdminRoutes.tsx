import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import HeaderAdmin from "../admin/components/HeaderAdmin";
import SidebarAdmin from "../admin/components/SidebarAdmin";
import { AdminSessionContext, type AdminUser } from "../admin/AdminSession";
import api, { onUnauthorized, type ApiResponse } from "../services/api";
import PageLoader from "../components/PageLoader";
import "../admin/components/LayoutAdmin.css";

type SessionState = { status: "loading" } | { status: "anonymous" } | { status: "ready"; user: AdminUser };

const isNarrow = () => window.matchMedia("(max-width: 800px)").matches;

export default function AdminRoute() {
    const [collapsed, setCollapsed] = useState(isNarrow);
    const [session, setSession] = useState<SessionState>({ status: "loading" });
    const navigate = useNavigate();
    const location = useLocation();

    const [path, setPath] = useState(location.pathname);
    if (path !== location.pathname) {
        setPath(location.pathname);
        if (!collapsed && isNarrow()) setCollapsed(true);
    }

    useEffect(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        const controller = new AbortController();
        api.get<ApiResponse<AdminUser>>("/admin/me", { signal: controller.signal })
            .then((res) => setSession({ status: "ready", user: res.data.data }))
            .catch(() => {
                if (!controller.signal.aborted) setSession({ status: "anonymous" });
            });

        const unsubscribe = onUnauthorized((scope) => {
            if (scope === "admin") setSession({ status: "anonymous" });
        });

        return () => {
            controller.abort();
            unsubscribe();
        };
    }, []);

    const logout = useCallback(async () => {
        await api.post("/admin/logout").catch(() => undefined);
        setSession({ status: "anonymous" });
        navigate("/admin/login", { replace: true });
    }, [navigate]);

    const value = useMemo(
        () => (session.status === "ready" ? { user: session.user, logout } : null),
        [session, logout]
    );

    if (session.status === "loading") {
        return <PageLoader label="Verificando acesso..." />;
    }

    if (session.status === "anonymous" || !value) {
        return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
    }

    return (
        <AdminSessionContext.Provider value={value}>
            <div
                className="admin-layout"
                onKeyDown={(e) => {
                    if (e.key === "Escape" && !collapsed && isNarrow()) setCollapsed(true);
                }}
            >
                <SidebarAdmin collapsed={collapsed} />
                {!collapsed && (
                    <div className="admin-backdrop" aria-hidden="true" onClick={() => setCollapsed(true)} />
                )}

                <div className={`admin-main ${collapsed ? "collapsed" : ""}`}>
                    <HeaderAdmin
                        collapsed={collapsed}
                        toggleSidebar={() => setCollapsed((prev) => !prev)}
                    />

                    <main className="admin-content" id="conteudo" tabIndex={-1}>
                        <Suspense fallback={<PageLoader />}>
                            <Outlet />
                        </Suspense>
                    </main>
                </div>
            </div>
        </AdminSessionContext.Provider>
    );
}
