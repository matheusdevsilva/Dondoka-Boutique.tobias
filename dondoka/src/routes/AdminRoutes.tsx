import { useState } from "react";
import HeaderAdmin from "../admin/components/HeaderAdmin";
import SidebarAdmin from "../admin/components/SidebarAdmin";
import "../admin/components/LayoutAdmin.css"
export default function AdminRoute({ children }: any) {
    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className="admin-layout">

            <SidebarAdmin collapsed={collapsed} />

            <div className={`admin-main ${collapsed ? "collapsed" : ""}`}>

                <HeaderAdmin toggleSidebar={toggleSidebar} />

                <main className="admin-content">
                    {children}
                </main>

            </div>
        </div>
    );
}