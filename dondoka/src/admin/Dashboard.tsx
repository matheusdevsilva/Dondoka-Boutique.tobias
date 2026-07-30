import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { resolveImageUrl } from "../services/api";
import { formatBRL, productCover, productPrice, type ProductType } from "../types/product";
import "./Dashboard.css";

interface Category {
    id: number | string;
    name: string;
}

interface Stats {
    month_revenue: number;
    month_orders: number;
    top_products: { product_name: string; qty: number; revenue: number }[];
}

export default function Dashboard() {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [ordersCount, setOrdersCount] = useState(0);
    const [pendingOrders, setPendingOrders] = useState(0);
    const [customersCount, setCustomersCount] = useState(0);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [
                    productsRes,
                    categoriesRes,
                    ordersRes,
                    customersRes,
                    statsRes,
                ] = await Promise.all([
                    api.get("/admin/products"),
                    api.get("/admin/categories"),
                    api.get("/admin/orders"),
                    api.get("/admin/customers"),
                    api.get("/admin/stats"),
                ]);
                setProducts(productsRes.data.data || []);
                setCategories(categoriesRes.data.data || []);
                const orders = ordersRes.data.data || [];
                setOrdersCount(orders.length);
                setPendingOrders(
                    orders.filter(
                        (o: { status: string }) => o.status === "pending"
                    ).length
                );
                setCustomersCount((customersRes.data.data || []).length);
                setStats(statsRes.data.data || null);
            } catch (error) {
                console.error("Erro ao carregar dashboard:", error);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    const totalProducts = products.length;
    const latest = [...products]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 6);

    const categoryName = (id?: number | string | null) =>
        categories.find((c) => String(c.id) === String(id))?.name || "—";

    return (
        <div className="admin-dashboard">
            <div className="dash-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Visão geral da Dondoka Boutique</p>
                </div>
                <div className="dash-actions">
                    <Link to="/admin/produtos/novo" className="dash-btn primary">
                        Novo produto
                    </Link>
                    <Link to="/admin/pedidos" className="dash-btn">
                        Pedidos
                    </Link>
                    <Link to="/admin/cupons" className="dash-btn">
                        Cupons
                    </Link>
                </div>
            </div>

            <div className="container-grid-dashboard">
                <div className="card">
                    <span>Receita do mês</span>
                    <strong>
                        {loading
                            ? "—"
                            : formatBRL(Number(stats?.month_revenue || 0))}
                    </strong>
                </div>
                <div className="card">
                    <span>Pedidos do mês</span>
                    <strong>{loading ? "—" : stats?.month_orders ?? 0}</strong>
                </div>
                <div className="card">
                    <span>Pendentes</span>
                    <strong>{loading ? "—" : pendingOrders}</strong>
                </div>
                <div className="card">
                    <span>Clientes</span>
                    <strong>{loading ? "—" : customersCount}</strong>
                </div>
            </div>

            <div className="container-grid-dashboard secondary">
                <div className="card">
                    <span>Produtos</span>
                    <strong>{loading ? "—" : totalProducts}</strong>
                </div>
                <div className="card">
                    <span>Pedidos totais</span>
                    <strong>{loading ? "—" : ordersCount}</strong>
                </div>
            </div>

            <div className="dashboard-tables">
                <div className="table-card">
                    <div className="table-card-head">
                        <h4>Mais vendidos</h4>
                        <Link to="/admin/pedidos">Ver pedidos</Link>
                    </div>
                    {loading && <p className="dash-empty">Carregando...</p>}
                    {!loading && (!stats?.top_products || stats.top_products.length === 0) && (
                        <p className="dash-empty">Sem vendas ainda.</p>
                    )}
                    {!loading && stats?.top_products && stats.top_products.length > 0 && (
                        <ul className="dash-cat-list">
                            {stats.top_products.map((item) => (
                                <li key={item.product_name}>
                                    <strong>{item.product_name}</strong>
                                    <span>
                                        {item.qty} un · {formatBRL(Number(item.revenue))}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="table-card">
                    <div className="table-card-head">
                        <h4>Últimos produtos</h4>
                        <Link to="/admin/produtos">Ver todos</Link>
                    </div>

                    {loading && <p className="dash-empty">Carregando...</p>}

                    {!loading && latest.length === 0 && (
                        <p className="dash-empty">Nenhum produto cadastrado.</p>
                    )}

                    {!loading && latest.length > 0 && (
                        <table>
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Categoria</th>
                                    <th>Preço</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latest.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="dash-product-cell">
                                                <img
                                                    src={resolveImageUrl(
                                                        productCover(product)
                                                    )}
                                                    alt={product.name}
                                                />
                                                <span>{product.name}</span>
                                            </div>
                                        </td>
                                        <td>{categoryName(product.category_id)}</td>
                                        <td>{formatBRL(productPrice(product))}</td>
                                        <td>
                                            <span
                                                className={`dash-badge ${
                                                    product.is_active !== false
                                                        ? "on"
                                                        : "off"
                                                }`}
                                            >
                                                {product.is_active !== false
                                                    ? "Ativo"
                                                    : "Inativo"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
