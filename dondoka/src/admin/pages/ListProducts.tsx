import { useEffect, useState } from "react";
import "./ListProducts.css";
import { Link, useNavigate } from "react-router-dom";
import api, { resolveImageUrl } from "../../services/api";
import { formatBRL, productCover, productPrice } from "../../types/product";

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    discount_price?: number;
    category_id?: number;
    brand?: string;
    image_url?: string;
    images?: string[] | string | null;
    is_active: boolean;
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
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    async function getProducts() {
        try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                api.get("/admin/products"),
                api.get("/admin/categories"),
            ]);
            setProducts(productsRes.data.data || []);
            setCategories(categoriesRes.data.data || []);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        } finally {
            setLoading(false);
        }
    }

    async function confirmDelete() {
        if (!selectedId) return;
        try {
            await api.delete(`/admin/products/delete/${selectedId}`);
            setProducts((prev) =>
                prev.filter((p) => Number(p.id) !== selectedId)
            );
            setOpenDeleteModal(false);
            setSelectedId(null);
        } catch (error) {
            console.error("Erro ao deletar produto:", error);
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
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
        }
    }

    useEffect(() => {
        getProducts();
    }, []);

    const categoryName = (id?: number) =>
        categories.find((c) => String(c.id) === String(id))?.name || "—";

    const filteredProducts = products
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        .filter((p) => {
            if (filter === "active") return p.is_active !== false;
            if (filter === "inactive") return p.is_active === false;
            if (filter === "promo") return !!p.discount_price;
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
                    type="text"
                    placeholder="Buscar produto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterType)}
                >
                    <option value="all">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                    <option value="promo">Promoções</option>
                </select>

                <select
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

            {loading && <p className="products-status">Carregando produtos...</p>}

            {!loading && (
                <div className="products-grid">
                    {filteredProducts.length === 0 && (
                        <p className="products-status">Nenhum produto encontrado.</p>
                    )}

                    {filteredProducts.map((product) => (
                        <div key={product.id} className="product-card">
                            <img
                                src={resolveImageUrl(productCover(product))}
                                alt={product.name}
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

                                <h3>{product.name}</h3>
                                <p className="meta-line">{categoryName(product.category_id)}</p>

                                <div className="prices">
                                    <span className="price">
                                        {formatBRL(productPrice(product))}
                                    </span>
                                    {product.discount_price && (
                                        <span className="discount">
                                            {formatBRL(Number(product.price))}
                                        </span>
                                    )}
                                </div>

                                <div className="actions">
                                    <button
                                        onClick={() =>
                                            navigate(`/admin/produtos/editar/${product.id}`)
                                        }
                                    >
                                        Editar
                                    </button>
                                    <button onClick={() => toggleActive(product)}>
                                        {product.is_active !== false
                                            ? "Desativar"
                                            : "Ativar"}
                                    </button>
                                    <button
                                        className="danger"
                                        onClick={() => {
                                            setSelectedId(Number(product.id));
                                            setOpenDeleteModal(true);
                                        }}
                                    >
                                        Deletar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {openDeleteModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setOpenDeleteModal(false)}
                >
                    <div
                        className="modal-content delete"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Excluir produto?</h3>
                        <p>Essa ação não pode ser desfeita.</p>
                        <div className="modal-actions">
                            <button onClick={() => setOpenDeleteModal(false)}>
                                Cancelar
                            </button>
                            <button className="danger" onClick={confirmDelete}>
                                Sim, deletar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
