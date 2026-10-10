import { useEffect, useState } from "react";
import "./ListProducts.css";
import { Link, useNavigate } from "react-router-dom";
import api, { apiErrorMessage, resolveImageUrl, type ApiResponse } from "../../services/api";
import Modal from "../../components/Modal";
import { formatBRL, hasDiscount, productCover, productPrice } from "../../types/product";

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    discount_price?: number | null;
    category_id?: number;
    brand?: string;
    image_url?: string;
    images?: string[] | string | null;
    is_active: boolean;
    stock?: number;
    created_at?: string;
}

interface Category {
    id: string | number;
    name: string;
}

type FilterType = "all" | "active" | "inactive" | "promo";

export default function ListProducts() {
    const navigate = useNavigate();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<Product | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        Promise.all([
            api.get<ApiResponse<Product[]>>("/admin/products", { signal }),
            api.get<ApiResponse<Category[]>>("/admin/categories", { signal }),
        ])
            .then(([productsRes, categoriesRes]) => {
                setProducts(productsRes.data.data || []);
                setCategories(categoriesRes.data.data || []);
            })
            .catch((err) => {
                if (!signal.aborted) setError(apiErrorMessage(err, "Erro ao buscar produtos."));
            })
            .finally(() => {
                if (!signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, []);

    async function confirmDelete() {
        if (!deleting) return;
        const id = deleting.id;
        try {
            await api.delete(`/admin/products/delete/${id}`);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            setError(apiErrorMessage(err, "Erro ao deletar produto."));
        } finally {
            setDeleting(null);
        }
    }

    async function toggleActive(product: Product) {
        const next = product.is_active === false;
        try {
            const formData = new FormData();
            formData.append("is_active", String(next));
            await api.put(`/admin/product/edit/${product.id}`, formData);
            setProducts((prev) =>
                prev.map((p) =>
                    p.id === product.id ? { ...p, is_active: next } : p
                )
            );
        } catch (err) {
            setError(apiErrorMessage(err, "Erro ao atualizar status."));
        }
    }

    const categoryName = (id?: number) =>
        categories.find((c) => String(c.id) === String(id))?.name || "—";

    const filteredProducts = products
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        .filter((p) => {
            if (filter === "active") return p.is_active !== false;
            if (filter === "inactive") return p.is_active === false;
            if (filter === "promo") return hasDiscount(p);
            return true;
        })
        .filter((p) =>
            categoryFilter === "all"
                ? true
                : String(p.category_id) === categoryFilter
        );

    return (
        <div className="products-page">
            <div className="products-page-header">
                <div>
                    <h1>Produtos</h1>
                    <p>{filteredProducts.length} itens</p>
                </div>
                <Link to="/admin/produtos/novo" className="products-add-btn">
                    Novo produto
                </Link>
            </div>

            <div className="products-controls">
                <input
                    type="search"
                    aria-label="Buscar produto"
                    placeholder="Buscar produto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    aria-label="Filtrar por status"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterType)}
                >
                    <option value="all">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                    <option value="promo">Promoções</option>
                </select>

                <select
                    aria-label="Filtrar por categoria"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="all">Todas categorias</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <p className="products-status products-error" role="alert">
                    {error}
                </p>
            )}

            {loading && <p className="products-status" role="status">Carregando produtos...</p>}

            {!loading && (
                <ul className="products-grid">
                    {filteredProducts.length === 0 && (
                        <li className="products-status">Nenhum produto encontrado.</li>
                    )}

                    {filteredProducts.map((product) => (
                        <li key={product.id} className="product-card">
                            <img
                                src={resolveImageUrl(productCover(product))}
                                alt=""
                                loading="lazy"
                                decoding="async"
                            />

                            <div className="product-card-body">
                                <span
                                    className={
                                        product.is_active !== false
                                            ? "active"
                                            : "inactive"
                                    }
                                >
                                    {product.is_active !== false ? "Ativo" : "Inativo"}
                                </span>

                                <h2>{product.name}</h2>
                                <p className="meta-line">
                                    {categoryName(product.category_id)}
                                    {product.stock != null && ` · ${product.stock} em estoque`}
                                </p>

                                <div className="prices">
                                    <span className="price">
                                        {formatBRL(productPrice(product))}
                                    </span>
                                    {hasDiscount(product) && (
                                        <span className="discount">
                                            {formatBRL(Number(product.price))}
                                        </span>
                                    )}
                                </div>

                                <div className="actions">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(`/admin/produtos/editar/${product.id}`)
                                        }
                                        aria-label={`Editar ${product.name}`}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleActive(product)}
                                        aria-label={`${product.is_active !== false ? "Desativar" : "Ativar"} ${product.name}`}
                                    >
                                        {product.is_active !== false
                                            ? "Desativar"
                                            : "Ativar"}
                                    </button>
                                    <button
                                        type="button"
                                        className="danger"
                                        onClick={() => setDeleting(product)}
                                        aria-label={`Deletar ${product.name}`}
                                    >
                                        Deletar
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Modal
                open={deleting != null}
                onClose={() => setDeleting(null)}
                title="Excluir produto?"
                overlayClassName="modal-overlay"
                panelClassName="modal-content delete"
                headClassName="modal-head"
            >
                <p>“{deleting?.name}” será removido. Essa ação não pode ser desfeita.</p>
                <div className="modal-actions">
                    <button type="button" onClick={() => setDeleting(null)}>
                        Cancelar
                    </button>
                    <button type="button" className="danger" onClick={confirmDelete}>
                        Sim, deletar
                    </button>
                </div>
            </Modal>
        </div>
    );
}
