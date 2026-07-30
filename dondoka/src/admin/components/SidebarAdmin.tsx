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
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
            <div className="sidebar-header">
                <h2>
                    {collapsed ? <Store size={22} /> : "Dondoka Admin"}
                </h2>
            </div>

            <nav className="sidebar-nav">
                <Link
                    to="/admin/dashboard"
                    className={`item ${isActive("/admin/dashboard") ? "active" : ""}`}
                >
                    <LayoutDashboard size={20} />
                    {!collapsed && "Dashboard"}
                </Link>

                <div className="menu-group">
                    <div
                        className="item"
                        onClick={() => setOpenProducts(!openProducts)}
                        style={{ cursor: "pointer" }}
                    >
                        <Box size={20} />
                        {!collapsed && (
                            <>
                                <span>Produtos</span>
                                <ChevronDown
                                    size={18}
                                    className={`arrow ${openProducts ? "open" : ""}`}
                                />
                            </>
                        )}
                    </div>

                    {openProducts && !collapsed && (
                        <div className="submenu">
                            <Link
                                to="/admin/produtos"
                                className={`subitem ${isActive("/admin/produtos") && !location.pathname.includes("novo") && !location.pathname.includes("editar") ? "active" : ""}`}
                            >
                                Listar
                            </Link>
                            <Link
                                to="/admin/produtos/novo"
                                className={`subitem ${location.pathname.includes("novo") ? "active" : ""}`}
                            >
                                Novo produto
                            </Link>
                        </div>
                    )}
                </div>

                <Link
                    to="/admin/pedidos"
                    className={`item ${isActive("/admin/pedidos") ? "active" : ""}`}
                >
                    <ClipboardList size={20} />
                    {!collapsed && "Pedidos"}
                </Link>

                <Link
                    to="/admin/clientes"
                    className={`item ${isActive("/admin/clientes") ? "active" : ""}`}
                >
                    <Users size={20} />
                    {!collapsed && "Clientes"}
                </Link>

                <Link
                    to="/admin/cupons"
                    className={`item ${isActive("/admin/cupons") ? "active" : ""}`}
                >
                    <TicketPercent size={20} />
                    {!collapsed && "Cupons"}
                </Link>

                <Link
                    to="/admin/categorias"
                    className={`item ${isActive("/admin/categorias") ? "active" : ""}`}
                >
                    <Tags size={20} />
                    {!collapsed && "Categorias"}
                </Link>

                <Link to="/" className="item store-link" target="_blank">
                    <Store size={20} />
                    {!collapsed && "Ver loja"}
                </Link>
            </nav>
        </aside>
    );
}
