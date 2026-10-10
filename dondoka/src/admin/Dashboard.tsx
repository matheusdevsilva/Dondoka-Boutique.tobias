import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorMessage, resolveImageUrl, type ApiResponse } from "../services/api";
import { formatBRL, productCover, productPrice, type ProductType } from "../types/product";
import "./Dashboard.css";

interface Category {
    id: number | string;
    name: string;
}

interface Stats {
    month_revenue: number;
    month_orders: number;
    total_orders: number;
    pending_orders: number;
    total_customers: number;
    total_products: number;
    out_of_stock: number;
    top_products: { product_name: string; qty: number; revenue: number }[];
}

export default function Dashboard() {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        Promise.all([
            api.get<ApiResponse<ProductType[]>>("/admin/products", { signal }),
            api.get<ApiResponse<Category[]>>("/admin/categories", { signal }),
            api.get<ApiResponse<Stats>>("/admin/stats", { signal }),
        ])
            .then(([productsRes, categoriesRes, statsRes]) => {
                setProducts(productsRes.data.data || []);
                setCategories(categoriesRes.data.data || []);
                setStats(statsRes.data.data || null);
            })
            .catch((err) => {
                if (!signal.aborted) setError(apiErrorMessage(err, "Erro ao carregar o dashboard."));
            })
            .finally(() => {
                if (!signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, []);

    const latest = [...products]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 6);
    const show = (value: number | undefined) => (loading ? "—" : value ?? 0);

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

            {error && (
                <p className="dash-empty" role="alert">
                    {error}
                </p>
            )}

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
                    <strong>{show(stats?.month_orders)}</strong>
                </div>
                <div className="card">
                    <span>Pendentes</span>
                    <strong>{show(stats?.pending_orders)}</strong>
                </div>
                <div className="card">
                    <span>Clientes</span>
                    <strong>{show(stats?.total_customers)}</strong>
                </div>
            </div>

            <div className="container-grid-dashboard secondary">
                <div className="card">
                    <span>Produtos</span>
                    <strong>{show(stats?.total_products)}</strong>
                </div>
                <div className="card">
                    <span>Pedidos totais</span>
                    <strong>{show(stats?.total_orders)}</strong>
                </div>
                <div className="card">
                    <span>Esgotados (ativos)</span>
                    <strong>{show(stats?.out_of_stock)}</strong>
                </div>
            </div>

            <div className="dashboard-tables">
                <div className="table-card">
                    <div className="table-card-head">
                        <h2>Mais vendidos</h2>
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
                        <h2>Últimos produtos</h2>
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
                                    <th scope="col">Produto</th>
                                    <th scope="col">Categoria</th>
                                    <th scope="col">Preço</th>
                                    <th scope="col">Status</th>
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
                                                    alt=""
                                                    loading="lazy"
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
