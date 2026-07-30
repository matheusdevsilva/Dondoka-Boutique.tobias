import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Heart } from "lucide-react";
import api, { resolveImageUrl } from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
    formatBRL,
    parseSizes,
    productCover,
    productPrice,
    type ProductType,
} from "../types/product";
import "../styles/Products.css";

export type ShopMode = "all" | "new" | "promo";

interface ShopCatalogProps {
    title: string;
    subtitle: string;
    mode?: ShopMode;
}

export default function ShopCatalog({
    title,
    subtitle,
    mode = "all",
}: ShopCatalogProps) {
    const { addItem } = useCart();
    const { isFavorite, toggle } = useWishlist();
    const [searchParams] = useSearchParams();

    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>(
        {}
    );
    const [cardError, setCardError] = useState<Record<string, string>>({});

    const pageRef = useRef(1);
    const lockRef = useRef(false);
    const hasMoreRef = useRef(true);

    const [search, setSearch] = useState(searchParams.get("q") || "");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [category, setCategory] = useState(
        searchParams.get("categoria") || "all"
    );
    const [size, setSize] = useState(searchParams.get("tamanho") || "all");
    const [onlyPromo, setOnlyPromo] = useState(mode === "promo");
    const [sort, setSort] = useState<"none" | "asc" | "desc" | "new">(
        mode === "new" ? "new" : "none"
    );
    const [categories, setCategories] = useState<
        { id: string; name: string }[]
    >([]);

    async function getProducts(pageNumber: number) {
        if (lockRef.current || !hasMoreRef.current) return;

        try {
            lockRef.current = true;
            setLoading(true);

            const response = await api.get("/products", {
                params: { page: pageNumber, limit: 12 },
            });

            const newProducts = response.data.data || [];

            if (pageNumber === 1) {
                setProducts(newProducts);
            } else {
                setProducts((prev) => {
                    const ids = new Set(prev.map((p) => p.id));
                    const filtered = newProducts.filter(
                        (p: ProductType) => !ids.has(p.id)
                    );
                    return [...prev, ...filtered];
                });
            }

            if (newProducts.length < 12) {
                hasMoreRef.current = false;
            }
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        } finally {
            setLoading(false);
            lockRef.current = false;
        }
    }

    useEffect(() => {
        pageRef.current = 1;
        hasMoreRef.current = true;
        getProducts(1);

        api.get("/categories")
            .then((res) => setCategories(res.data.data || []))
            .catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        const q = searchParams.get("q");
        if (q) setSearch(q);
        const cat = searchParams.get("categoria");
        if (cat) setCategory(cat);
        const tamanho = searchParams.get("tamanho");
        if (tamanho) setSize(tamanho);
    }, [searchParams]);

    useEffect(() => {
        setOnlyPromo(mode === "promo");
        if (mode === "new") setSort("new");
    }, [mode]);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 300
            ) {
                if (!lockRef.current && hasMoreRef.current) {
                    pageRef.current += 1;
                    getProducts(pageRef.current);
                }
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const availableSizes = useMemo(() => {
        const set = new Set<string>();
        for (const product of products) {
            for (const s of parseSizes(product.sizes)) set.add(s);
        }
        return Array.from(set);
    }, [products]);

    const hasActiveFilters =
        search !== "" ||
        category !== "all" ||
        size !== "all" ||
        minPrice !== "" ||
        maxPrice !== "" ||
        (mode !== "promo" && onlyPromo) ||
        sort !== (mode === "new" ? "new" : "none");

    function clearFilters() {
        setSearch("");
        setCategory("all");
        setSize("all");
        setMinPrice("");
        setMaxPrice("");
        setOnlyPromo(mode === "promo");
        setSort(mode === "new" ? "new" : "none");
    }

    function handleAdd(product: ProductType) {
        const id = String(product.id);
        const chosen =
            selectedSizes[id] || parseSizes(product.sizes)[0] || "";
        if (!chosen) {
            setCardError((prev) => ({
                ...prev,
                [id]: "Escolha um tamanho",
            }));
            return;
        }
        setCardError((prev) => ({ ...prev, [id]: "" }));
        addItem({
            id,
            name: product.name,
            price: productPrice(product),
            image_url: productCover(product) || undefined,
            size: chosen,
        });
    }

    const filteredProducts = products
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        .filter((p) =>
            category === "all" ? true : String(p.category_id) === category
        )
        .filter((p) => {
            if (size === "all") return true;
            return parseSizes(p.sizes).includes(size);
        })
        .filter((p) => {
            if (mode === "promo" || onlyPromo) return !!p.discount_price;
            return true;
        })
        .filter((p) => {
            const price = productPrice(p);
            if (minPrice && price < Number(minPrice)) return false;
            if (maxPrice && price > Number(maxPrice)) return false;
            return true;
        })
        .sort((a, b) => {
            if (sort === "asc") return productPrice(a) - productPrice(b);
            if (sort === "desc") return productPrice(b) - productPrice(a);
            if (sort === "new") return Number(b.id) - Number(a.id);
            return 0;
        });

    return (
        <div className="shop-products-container">
            <h1 className="shop-products-title">{title}</h1>
            <p className="shop-products-subtitle">{subtitle}</p>

            <div className="filters">
                <input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Preço mín."
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Preço máx."
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                />
                <select
                    value={sort}
                    onChange={(e) =>
                        setSort(
                            e.target.value as "none" | "asc" | "desc" | "new"
                        )
                    }
                >
                    <option value="none">Ordenar</option>
                    <option value="new">Mais recentes</option>
                    <option value="asc">Menor preço</option>
                    <option value="desc">Maior preço</option>
                </select>
                {mode !== "promo" && (
                    <label>
                        <input
                            type="checkbox"
                            checked={onlyPromo}
                            onChange={(e) => setOnlyPromo(e.target.checked)}
                        />
                        Só promoção
                    </label>
                )}
            </div>

            <div className="filter-chips-block">
                <div className="filter-chips-row">
                    <span>Categoria</span>
                    <button
                        type="button"
                        className={category === "all" ? "active" : ""}
                        onClick={() => setCategory("all")}
                    >
                        Todas
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            className={
                                category === String(cat.id) ? "active" : ""
                            }
                            onClick={() => setCategory(String(cat.id))}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="filter-chips-row">
                    <span>Tamanho</span>
                    <button
                        type="button"
                        className={size === "all" ? "active" : ""}
                        onClick={() => setSize("all")}
                    >
                        Todos
                    </button>
                    {availableSizes.map((option) => (
                        <button
                            key={option}
                            type="button"
                            className={size === option ? "active" : ""}
                            onClick={() => setSize(option)}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {hasActiveFilters && (
                    <button
                        type="button"
                        className="clear-filters"
                        onClick={clearFilters}
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            <div className="shop-products-grid">
                {loading &&
                    products.length === 0 &&
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={`sk-${i}`} className="shop-skeleton-card">
                            <div className="shop-skeleton-media" />
                            <div className="shop-skeleton-line" />
                            <div className="shop-skeleton-line short" />
                        </div>
                    ))}

                {filteredProducts.map((product) => {
                    const id = String(product.id);
                    const sizes = parseSizes(product.sizes);
                    const chosen = selectedSizes[id] || sizes[0] || "";
                    const stock = Number(product.stock ?? 0);

                    return (
                        <div key={product.id} className="shop-product-card">
                            <div className="shop-product-media">
                                <Link to={`/produto/${product.id}`}>
                                    <img
                                        className="shop-product-image"
                                        src={resolveImageUrl(
                                            productCover(product)
                                        )}
                                        alt={product.name}
                                    />
                                </Link>
                                <button
                                    type="button"
                                    className={`wishlist-btn ${
                                        isFavorite(product.id) ? "active" : ""
                                    }`}
                                    aria-label="Favoritar"
                                    onClick={() => toggle(product.id)}
                                >
                                    <Heart
                                        size={18}
                                        strokeWidth={1.5}
                                        fill={
                                            isFavorite(product.id)
                                                ? "currentColor"
                                                : "none"
                                        }
                                    />
                                </button>
                                {stock > 0 && stock <= 5 && (
                                    <span className="stock-badge">
                                        Restam {stock}
                                    </span>
                                )}
                            </div>

                            <Link to={`/produto/${product.id}`}>
                                <h2 className="shop-product-name">
                                    {product.name}
                                </h2>
                            </Link>

                            <strong className="shop-product-price">
                                {formatBRL(productPrice(product))}
                            </strong>

                            <div className="card-size-options">
                                {sizes.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        className={
                                            chosen === option ? "active" : ""
                                        }
                                        onClick={() =>
                                            setSelectedSizes((prev) => ({
                                                ...prev,
                                                [id]: option,
                                            }))
                                        }
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>

                            {cardError[id] && (
                                <p className="card-size-error">
                                    {cardError[id]}
                                </p>
                            )}

                            <button
                                type="button"
                                className="shop-add-cart"
                                onClick={() => handleAdd(product)}
                            >
                                Adicionar à sacola
                            </button>
                        </div>
                    );
                })}
            </div>

            {loading && products.length > 0 && (
                <p className="shop-products-loading">Carregando...</p>
            )}

            {!loading && filteredProducts.length === 0 && (
                <p>Nenhum produto encontrado</p>
            )}
        </div>
    );
}
