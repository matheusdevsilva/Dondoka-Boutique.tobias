import { useState } from "react";
import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    Box,
    ClipboardList,
    Users,
    Zap,
    ChevronDown,
    Shield,
    UserCog
} from "lucide-react";

type Props = {
    collapsed: boolean;
};

export default function SidebarAdmin({ collapsed }: Props) {

    const [openProducts, setOpenProducts] = useState(false);
    const [openOrders, setOpenOrders] = useState(false);
    const [openClients, setOpenClients] = useState(false);
    const [openUsers, setOpenUsers] = useState(false);
    return (
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

            {/* HEADER */}
            <div className="sidebar-header">
                <h2>
                    {collapsed ? <Zap size={22} /> : "Painel Admin"}
                </h2>
            </div>

            <nav className="sidebar-nav">

                {/* DASHBOARD */}
                <Link to="/admin/dashboard" className="item">
                    <LayoutDashboard size={20} />
                    {!collapsed && "Dashboard"}
                </Link>

                {/* ===================== PRODUTOS ===================== */}
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
                                <ChevronDown size={18} className={`arrow ${openProducts ? "open" : ""}`} />
                            </>
                        )}
                    </div>

                    {openProducts && !collapsed && (
                        <div className="submenu">
                            <Link to="/admin/produtos" className="subitem">
                                Listar Produtos
                            </Link>
                            <Link to="/admin/produtos/novo" className="subitem">
                                Novo Produto
                            </Link>
                            <Link to="/admin/categorias" className="subitem">
                                Categorias
                            </Link>
                        </div>
                    )}
                </div>

                {/* ===================== PEDIDOS ===================== */}
                <div className="menu-group">

                    <div
                        className="item"
                        onClick={() => setOpenOrders(!openOrders)}
                        style={{ cursor: "pointer" }}
                    >
                        <ClipboardList size={20} />
                        {!collapsed && (
                            <>
                                <span>Pedidos</span>
                                <ChevronDown size={18} className={`arrow ${openOrders ? "open" : ""}`} />
                            </>
                        )}
                    </div>

                    {openOrders && !collapsed && (
                        <div className="submenu">
                            <Link to="/admin/pedidos" className="subitem">
                                Todos Pedidos
                            </Link>
                            <Link to="/admin/pedidos/pendentes" className="subitem">
                                Pendentes
                            </Link>
                            <Link to="/admin/pedidos/enviados" className="subitem">
                                Enviados
                            </Link>
                        </div>
                    )}
                </div>

                {/* ===================== CLIENTES ===================== */}
                <div className="menu-group">

                    <div
                        className="item"
                        onClick={() => setOpenClients(!openClients)}
                        style={{ cursor: "pointer" }}
                    >
                        <Users size={20} />
                        {!collapsed && (
                            <>
                                <span>Clientes</span>
                                <ChevronDown size={18} className={`arrow ${openClients ? "open" : ""}`} />
                            </>
                        )}
                    </div>

                    {openClients && !collapsed && (
                        <div className="submenu">
                            <Link to="/admin/clientes" className="subitem">
                                Lista de Clientes
                            </Link>
                            <Link to="/admin/clientes/novos" className="subitem">
                                Novos
                            </Link>
                            <Link to="/admin/clientes/ativos" className="subitem">
                                Ativos
                            </Link>
                        </div>
                    )}
                </div>

                <div className="menu-group">
                    <div className="item" onClick={() => setOpenUsers(!openUsers)}>
                        <UserCog size={20} />
                        {!collapsed && (
                            <>
                                <span>Usuários</span>
                                <ChevronDown size={18} className={`arrow ${openUsers ? "open" : ""}`} />
                            </>
                        )}
                    </div>

                    {openUsers && !collapsed && (
                        <div className="submenu">
                            <Link to="/admin/usuarios" className="subitem">Todos usuários</Link>
                            <Link to="/admin/usuarios/administradores" className="subitem">Administradores</Link>
                            <Link to="/admin/usuarios/permissoes" className="subitem">Permissões</Link>
                        </div>
                    )}
                </div>

                <Link to="/admin/perfil" className="item">
                    <Shield size={20} />
                    {!collapsed && "Configurações"}
                </Link>


            </nav>

        </aside>
    );
}