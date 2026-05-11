import { useEffect, useState } from "react";
import "./ListProducts.css";

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    discount_price?: number;
    category_id?: number;
    brand?: string;
    gender?: string;
    image_url: string;
    is_active: boolean;
    created_at?: string;
}

export default function ListProducts() {

    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

    useEffect(() => {
        const data: Product[] = [
            {
                id: "1",
                name: "Produto A",
                description: "Descrição do produto A",
                price: 100,
                discount_price: 80,
                brand: "Nike",
                gender: "unisex",
                category_id: 1,
                image_url: "https://via.placeholder.com/300",
                is_active: true,
                created_at: "2024-01-01"
            },
            {
                id: "2",
                name: "Produto B",
                price: 200,
                image_url: "https://via.placeholder.com/300",
                is_active: false,
                created_at: "2024-02-01"
            }
        ];

        setProducts(data);
    }, []);

    const filteredProducts = products
        .filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase())
        )
        .filter(p =>
            filter === "all"
                ? true
                : filter === "active"
                    ? p.is_active
                    : !p.is_active
        );

    return (
        <div className="products-page">

            {/* 🔎 filtros */}
            <div className="products-controls">

                <input
                    placeholder="Buscar produto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                >
                    <option value="all">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                </select>

            </div>

            {/* 📦 grid */}
            <div className="products-grid">

                {filteredProducts.map(product => (
                    <div key={product.id} className="product-card">

                        <img src={product.image_url} alt={product.name} />

                        <h3>{product.name}</h3>

                        {product.description && (
                            <p className="description">
                                {product.description}
                            </p>
                        )}

                        <div className="prices">
                            <span className="price">
                                R$ {product.price}
                            </span>

                            {product.discount_price && (
                                <span className="discount">
                                    R$ {product.discount_price}
                                </span>
                            )}
                        </div>

                        <div className="meta">
                            {product.brand && <span>Marca: {product.brand}</span>}
                            {product.gender && <span>Gênero: {product.gender}</span>}
                            {product.category_id && <span>Categoria: {product.category_id}</span>}
                        </div>

                        <span className={product.is_active ? "active" : "inactive"}>
                            {product.is_active ? "Ativo" : "Inativo"}
                        </span>

                        {product.created_at && (
                            <small>
                                Criado: {new Date(product.created_at).toLocaleDateString()}
                            </small>
                        )}

                        <div className="actions">
                            <button>Editar</button>
                            <button>Deletar</button>
                        </div>

                    </div>
                ))}

            </div>
        </div>
    );
}