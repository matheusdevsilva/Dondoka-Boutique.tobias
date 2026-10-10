import { Menu, User } from "lucide-react";
import { useAdminSession } from "../AdminSession";

export default function HeaderAdmin({
    collapsed,
    toggleSidebar,
}: {
    collapsed: boolean;
    toggleSidebar: () => void;
}) {
    const { user, logout } = useAdminSession();

    return (
        <header className="header-admin">
            <button
                type="button"
                className="menu-btn"
                onClick={toggleSidebar}
                aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
                aria-expanded={!collapsed}
                aria-controls="admin-sidebar"
            >
                <Menu size={20} aria-hidden="true" />
            </button>

            <p className="header-admin-title">Painel Admin</p>

            <div className="header-right">
                <div className="user-box">
                    <div className="avatar" aria-hidden="true">
                        <User size={18} />
                    </div>
                    <div className="user-info">
                        <strong>{user.username}</strong>
                        <span>{user.role}</span>
                    </div>
                </div>

                <button type="button" className="logout-btn" onClick={logout}>
                    Sair
                </button>
            </div>
        </header>
    );
}
