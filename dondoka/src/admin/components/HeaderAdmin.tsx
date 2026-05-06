import { useNavigate } from "react-router-dom";
import { User, Bell } from "lucide-react";
import { useEffect, useState } from "react";


type User = {
    id: number;
    username: string;
    role: string
};


export default function HeaderAdmin({ toggleSidebar }: any) {
    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null)

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

            {/* MENU */}
            <button className="menu-btn" onClick={toggleSidebar}>
                ☰
            </button>

            {/* TITLE */}
            <h3>Painel Admin</h3>

            {/* RIGHT SIDE */}
            <div className="header-right">

                {/* NOTIFICAÇÃO */}
                <button className="icon-btn">
                    <Bell size={18} />
                </button>

                {/* USER */}
                <div className="user-box">

                    <div className="avatar">
                        <User size={18} />
                    </div>

                    <div className="user-info">
                        <strong>{user?.username}</strong>
                        <span>{user?.role}</span>
                    </div>

                </div>

                {/* LOGOUT */}
                <button className="logout-btn" onClick={handleLogout}>
                    Sair
                </button>

            </div>

        </header>
    );
}