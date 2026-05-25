import { useEffect, useState } from "react";
import "./ListProducts.css";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    discount_price?: number;
    category_id?: number;
    brand?: string;
    gender?: string;
    image_url?: string;
    is_active: boolean;
    created_at?: string;
}

type FilterType = "all" | "active" | "inactive";

export default function ListProducts() {

    const navigate = useNavigate();

    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [loading, setLoading] = useState(true);

    async function getProducts() {
        try {
            setLoading(true);

            const response = await api.get("/admin/products");

            setProducts(response.data.data);

        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        } finally {
            setLoading(false);
        }
    }
    async function deleteProduct(id: number) {
        try {
        } catch (error) {

        }
    }
    function handleEdit(id: string) {
        navigate(`/admin/products/edit/${id}`);
    }

    function getCategoria() {
        try {
            
        } catch (error) {
            
        }
    }
    useEffect(() => {
        getProducts();
        getCategoria();
    }, []);

    const filteredProducts = products
        .filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase())
        )
        .filter((p) =>
            filter === "all"
                ? true
                : filter === "active"
                    ? p.is_active
                    : !p.is_active
        );

    return (
        <div className="products-page">

            {/* filtros */}
            <div className="products-controls">

                <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    value={filter}
                    onChange={(e) =>
                        setFilter(
                            e.target.value as FilterType
                        )
                    }
                >
                    <option value="all">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                </select>

            </div>

            {/* loading */}
            {loading && (
                <p>Carregando produtos...</p>
            )}

            {/* grid */}
            {!loading && (
                <div className="products-grid">

                    {filteredProducts.length === 0 && (
                        <p>Nenhum produto encontrado.</p>
                    )}

                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="product-card"
                        >

                            <img
                                src={
                                    product.image_url ||
                                    "/placeholder.png"
                                }
                                alt={product.name}
                            />

                            <h3>{product.name}</h3>

                            {product.description && (
                                <p className="description">
                                    {product.description}
                                </p>
                            )}

                            <div className="prices">

                                <span className="price">
                                    R$
                                    {product.price.toLocaleString(
                                        "pt-BR",
                                        {
                                            style: "currency",
                                            currency: "BRL"
                                        }
                                    )}
                                </span>

                                {product.discount_price && (
                                    <span className="discount">
                                        {product.discount_price.toLocaleString(
                                            "pt-BR",
                                            {
                                                style: "currency",
                                                currency: "BRL"
                                            }
                                        )}
                                    </span>
                                )}

                            </div>

                            <div className="meta">

                                {product.brand && (
                                    <span>
                                        Marca: {product.brand}
                                    </span>
                                )}

                                {product.gender && (
                                    <span>
                                        Gênero: {product.gender}
                                    </span>
                                )}

                                {product.category_id && (
                                    <span>
                                        Categoria: {product.category_id}
                                    </span>
                                )}

                            </div>

                            <span
                                className={
                                    product.is_active
                                        ? "active"
                                        : "inactive"
                                }
                            >
                                {product.is_active
                                    ? "Ativo"
                                    : "Inativo"}
                            </span>

                            {product.created_at && (
                                <small>
                                    Criado em:{" "}
                                    {new Date(
                                        product.created_at
                                    ).toLocaleDateString("pt-BR")}
                                </small>
                            )}

                            <div className="actions">

                                <button onClick={() => handleEdit(product.id)}>
                                    Editar
                                </button>

                                <button>
                                    Deletar
                                </button>

                            </div>

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}