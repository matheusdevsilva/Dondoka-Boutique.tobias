import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useEffect, useState } from "react";

type AdminUser = {
    id: number;
    username: string;
    role: string;
};

export default function HeaderAdmin({
    toggleSidebar,
}: {
    toggleSidebar: () => void;
}) {
    const navigate = useNavigate();
    const [user, setUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/admin/login");
    }

    return (
        <header className="header-admin">
            <button className="menu-btn" onClick={toggleSidebar}>
                ☰
            </button>

            <h3>Painel Admin</h3>

            <div className="header-right">
                <div className="user-box">
                    <div className="avatar">
                        <User size={18} />
                    </div>
                    <div className="user-info">
                        <strong>{user?.username || "Admin"}</strong>
                        <span>{user?.role || "admin"}</span>
                    </div>
                </div>

                <button className="logout-btn" onClick={handleLogout}>
                    Sair
                </button>
            </div>
        </header>
    );
}
