import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Box,
    Tags,
    ChevronDown,
    Store,
    ClipboardList,
    Users,
    TicketPercent,
} from "lucide-react";

type Props = {
    collapsed: boolean;
};

export default function SidebarAdmin({ collapsed }: Props) {
    const location = useLocation();
    const [openProducts, setOpenProducts] = useState(true);

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + "/");

    return (
        <aside id="admin-sidebar" className={`sidebar ${collapsed ? "collapsed" : ""}`}>
            <div className="sidebar-header">
                <p className="sidebar-brand">
                    {collapsed ? (
                        <>
                            <Store size={22} aria-hidden="true" />
                            <span className="sr-only">Dondoka Admin</span>
                        </>
                    ) : (
                        "Dondoka Admin"
                    )}
                </p>
            </div>

            <nav className="sidebar-nav" aria-label="Menu do painel">
                <Link
                    to="/admin/dashboard"
                    className={`item ${isActive("/admin/dashboard") ? "active" : ""}`}
                    aria-current={isActive("/admin/dashboard") ? "page" : undefined}
                >
                    <LayoutDashboard size={20} aria-hidden="true" />
                    {collapsed ? <span className="sr-only">Dashboard</span> : "Dashboard"}
                </Link>

                <div className="menu-group">
                    <button
                        type="button"
                        className="item item-toggle"
                        onClick={() => setOpenProducts(!openProducts)}
                        aria-expanded={openProducts && !collapsed}
                        aria-controls="admin-products-menu"
                        aria-label={collapsed ? "Produtos" : undefined}
                        title={collapsed ? "Produtos" : undefined}
                    >
                        <Box size={20} aria-hidden="true" />
                        {!collapsed && (
                            <>
                                <span>Produtos</span>
                                <ChevronDown
                                    size={18}
                                    className={`arrow ${openProducts ? "open" : ""}`}
                                    aria-hidden="true"
                                />
                            </>
                        )}
                    </button>

                    {openProducts && !collapsed && (
                        <div className="submenu" id="admin-products-menu">
                            <Link
                                to="/admin/produtos"
                                className={`subitem ${isActive("/admin/produtos") && !location.pathname.includes("novo") && !location.pathname.includes("editar") ? "active" : ""}`}
                    aria-current={isActive("/admin/produtos") && !location.pathname.includes("novo") && !location.pathname.includes("editar") ? "page" : undefined}
                            >
                                Listar
                            </Link>
                            <Link
                                to="/admin/produtos/novo"
                                className={`subitem ${location.pathname.includes("novo") ? "active" : ""}`}
                    aria-current={location.pathname.includes("novo") ? "page" : undefined}
                            >
                                Novo produto
                            </Link>
                        </div>
                    )}
                </div>

                <Link
                    to="/admin/pedidos"
                    className={`item ${isActive("/admin/pedidos") ? "active" : ""}`}
                    aria-current={isActive("/admin/pedidos") ? "page" : undefined}
                >
                    <ClipboardList size={20} aria-hidden="true" />
                    {collapsed ? <span className="sr-only">Pedidos</span> : "Pedidos"}
                </Link>

                <Link
                    to="/admin/clientes"
                    className={`item ${isActive("/admin/clientes") ? "active" : ""}`}
                    aria-current={isActive("/admin/clientes") ? "page" : undefined}
                >
                    <Users size={20} aria-hidden="true" />
                    {collapsed ? <span className="sr-only">Clientes</span> : "Clientes"}
                </Link>

                <Link
                    to="/admin/cupons"
                    className={`item ${isActive("/admin/cupons") ? "active" : ""}`}
                    aria-current={isActive("/admin/cupons") ? "page" : undefined}
                >
                    <TicketPercent size={20} aria-hidden="true" />
                    {collapsed ? <span className="sr-only">Cupons</span> : "Cupons"}
                </Link>

                <Link
                    to="/admin/categorias"
                    className={`item ${isActive("/admin/categorias") ? "active" : ""}`}
                    aria-current={isActive("/admin/categorias") ? "page" : undefined}
                >
                    <Tags size={20} aria-hidden="true" />
                    {collapsed ? <span className="sr-only">Categorias</span> : "Categorias"}
                </Link>

                <Link to="/" className="item store-link" target="_blank" rel="noopener">
                    <Store size={20} aria-hidden="true" />
                    {collapsed ? <span className="sr-only">Ver loja</span> : "Ver loja"}
                </Link>
            </nav>
        </aside>
    );
}
