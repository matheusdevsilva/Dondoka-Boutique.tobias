import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/Products.css";

interface ProductType {
    id: string;
    name: string;
    description?: string;
    price: number;
    discount_price?: number;
    image_url?: string;
    category_id?: number;
}

export default function Products() {

    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const pageRef = useRef(1);
    const lockRef = useRef(false);

    const [search, setSearch] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [category, setCategory] = useState("all");
    const [onlyPromo, setOnlyPromo] = useState(false);
    const [sort, setSort] = useState<"none" | "asc" | "desc">("none");

    async function getProducts(pageNumber: number) {
        if (lockRef.current || !hasMore) return;

        try {
            lockRef.current = true;
            setLoading(true);

            const response = await api.get("/products", {
                params: {
                    page: pageNumber,
                    limit: 12
                }
            });

            const newProducts = response.data.data || [];

            if (pageNumber === 1) {
                setProducts(newProducts);
            } else {
                setProducts((prev) => {
                    const ids = new Set(prev.map(p => p.id));
                    const filtered = newProducts.filter((p: ProductType) => !ids.has(p.id));
                    return [...prev, ...filtered];
                });
            }

            if (newProducts.length < 12) {
                setHasMore(false);
            }

        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        } finally {
            setLoading(false);
            lockRef.current = false;
        }
    }

    useEffect(() => {
        getProducts(1);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 300
            ) {
                if (!loading && hasMore) {
                    pageRef.current += 1;
                    getProducts(pageRef.current);
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [loading, hasMore]);

    const filteredProducts = products
        .filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase())
        )
        .filter(p =>
            category === "all" ? true : String(p.category_id) === category
        )
        .filter(p =>
            onlyPromo ? !!p.discount_price : true
        )
        .filter(p => {
            const price = p.discount_price || p.price;

            if (minPrice && price < Number(minPrice)) return false;
            if (maxPrice && price > Number(maxPrice)) return false;

            return true;
        })
        .sort((a, b) => {
            if (sort === "asc") return a.price - b.price;
            if (sort === "desc") return b.price - a.price;
            return 0;
        });

    return (
        <>
            <Header />

            <div className="shop-products-container">

                <h1 className="shop-products-title">
                    Produtos
                </h1>

                {/* FILTERS */}
                <div className="filters">

                    <input
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                    />

                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="all">Categorias</option>
                        <option value="1">Categoria 1</option>
                        <option value="2">Categoria 2</option>
                    </select>

                    <label>
                        <input
                            type="checkbox"
                            checked={onlyPromo}
                            onChange={(e) => setOnlyPromo(e.target.checked)}
                        />
                        Promoção
                    </label>

                    <select
                        value={sort}
                        onChange={(e) =>
                            setSort(e.target.value as any)
                        }
                    >
                        <option value="none">Ordenar</option>
                        <option value="asc">Menor preço</option>
                        <option value="desc">Maior preço</option>
                    </select>

                </div>

                {/* GRID */}
                <div className="shop-products-grid">

                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="shop-product-card"
                        >

                            <img
                                className="shop-product-image"
                                src={product.image_url || "/placeholder.png"}
                                alt={product.name}
                            />

                            <h2 className="shop-product-name">
                                {product.name}
                            </h2>

                            <strong className="shop-product-price">
                                {(product.discount_price || product.price).toLocaleString(
                                    "pt-BR",
                                    { style: "currency", currency: "BRL" }
                                )}
                            </strong>

                        </div>
                    ))}

                </div>

                {/* LOADING */}
                {loading && (
                    <p className="shop-products-loading">
                        Carregando...
                    </p>
                )}

                {/* EMPTY */}
                {!loading && filteredProducts.length === 0 && (
                    <p>Nenhum produto encontrado</p>
                )}

            </div>

            <Footer />
        </>
    );
}