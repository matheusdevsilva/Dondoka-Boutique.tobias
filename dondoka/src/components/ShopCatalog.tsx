import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Heart } from "lucide-react";
import api, { resolveImageUrl, type ApiResponse } from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
    formatBRL,
    hasDiscount,
    parseSizes,
    productCover,
    productPrice,
    productStock,
    type ProductType,
} from "../types/product";
import "../styles/Products.css";

export type ShopMode = "all" | "new" | "promo";
type Sort = "new" | "asc" | "desc";

const PAGE_SIZE = 12;
const DEFAULT_SIZES = ["PP", "P", "M", "G", "GG"];

interface ShopCatalogProps {
    title: string;
    subtitle: string;
    mode?: ShopMode;
}

export default function ShopCatalog({ title, subtitle, mode = "all" }: ShopCatalogProps) {
    const { addItem } = useCart();
    const { isFavorite, toggle } = useWishlist();
    const [searchParams] = useSearchParams();

    const [products, setProducts] = useState<ProductType[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [attempt, setAttempt] = useState(0);
    const [settledKey, setSettledKey] = useState<string | null>(null);
    const [errorKey, setErrorKey] = useState<string | null>(null);
    const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
    const [cardError, setCardError] = useState<Record<string, string>>({});
    const [categories, setCategories] = useState<{ id: string | number; name: string }[]>([]);

    const [search, setSearch] = useState(searchParams.get("q") || "");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [category, setCategory] = useState(searchParams.get("categoria") || "all");
    const [size, setSize] = useState(searchParams.get("tamanho") || "all");
    const [onlyPromo, setOnlyPromo] = useState(mode === "promo");
    const [sort, setSort] = useState<Sort>("new");

    const debouncedSearch = useDebouncedValue(search.trim(), 300);
    const debouncedMin = useDebouncedValue(minPrice, 400);
    const debouncedMax = useDebouncedValue(maxPrice, 400);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const [prevParams, setPrevParams] = useState(searchParams);
    if (prevParams !== searchParams) {
        setPrevParams(searchParams);
        setSearch(searchParams.get("q") || "");
        setCategory(searchParams.get("categoria") || "all");
        setSize(searchParams.get("tamanho") || "all");
    }

    const filters = useMemo(
        () => ({
            q: debouncedSearch || undefined,
            category: category !== "all" ? category : undefined,
            size: size !== "all" ? size : undefined,
            promo: mode === "promo" || onlyPromo ? "true" : undefined,
            min_price: debouncedMin || undefined,
            max_price: debouncedMax || undefined,
            sort,
        }),
        [debouncedSearch, category, size, mode, onlyPromo, debouncedMin, debouncedMax, sort]
    );

    const [prevFilters, setPrevFilters] = useState(filters);
    if (prevFilters !== filters) {
        setPrevFilters(filters);
        setPage(1);
    }

    useEffect(() => {
        const controller = new AbortController();
        api.get<ApiResponse<{ id: string | number; name: string }[]>>("/categories", {
            signal: controller.signal,
        })
            .then((res) => setCategories(res.data.data || []))
            .catch(() => undefined);
        return () => controller.abort();
    }, []);

    const requestKey = useMemo(() => JSON.stringify([filters, page, attempt]), [filters, page, attempt]);
    const loading = settledKey !== requestKey;
    const loadError = errorKey === requestKey;

    useEffect(() => {
        const controller = new AbortController();

        api.get<ApiResponse<ProductType[]>>("/products", {
            params: { ...filters, page, limit: PAGE_SIZE },
            signal: controller.signal,
        })
            .then((res) => {
                const next = res.data.data || [];
                setTotal(res.data.meta?.total ?? next.length);
                setProducts((prev) => {
                    if (page === 1) return next;
                    const ids = new Set(prev.map((p) => p.id));
                    return [...prev, ...next.filter((p) => !ids.has(p.id))];
                });
                setSettledKey(requestKey);
            })
            .catch(() => {
                if (controller.signal.aborted) return;
                setErrorKey(requestKey);
                setSettledKey(requestKey);
            });

        return () => controller.abort();
    }, [filters, page, requestKey]);

    const hasMore = products.length < total;

    const loadMore = useCallback(() => {
        if (!loading && hasMore) setPage((p) => p + 1);
    }, [loading, hasMore]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMore) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) loadMore();
            },
            { rootMargin: "400px" }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    const availableSizes = useMemo(() => {
        const set = new Set<string>(DEFAULT_SIZES);
        for (const product of products) {
            for (const s of parseSizes(product.sizes)) set.add(s);
        }
        if (size !== "all") set.add(size);
        return Array.from(set);
    }, [products, size]);

    const hasActiveFilters =
        search !== "" ||
        category !== "all" ||
        size !== "all" ||
        minPrice !== "" ||
        maxPrice !== "" ||
        (mode !== "promo" && onlyPromo) ||
        sort !== "new";

    function clearFilters() {
        setSearch("");
        setCategory("all");
        setSize("all");
        setMinPrice("");
        setMaxPrice("");
        setOnlyPromo(mode === "promo");
        setSort("new");
    }

    function handleAdd(product: ProductType) {
        const id = String(product.id);
        const sizes = parseSizes(product.sizes);
        const chosen = selectedSizes[id] || sizes[0];
        if (sizes.length > 0 && !chosen) {
            setCardError((prev) => ({ ...prev, [id]: "Escolha um tamanho" }));
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

    return (
        <div className="shop-products-container">
            <h1 className="shop-products-title">{title}</h1>
            <p className="shop-products-subtitle">{subtitle}</p>

            <section aria-labelledby="filters-title">
                <h2 id="filters-title" className="sr-only">
                    Filtros
                </h2>
                <div className="filters">
                    <label className="filter-field">
                        <span className="sr-only">Buscar por nome</span>
                        <input
                            type="search"
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </label>
                    <label className="filter-field">
                        <span className="sr-only">Preço mínimo</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            placeholder="Preço mín."
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                    </label>
                    <label className="filter-field">
                        <span className="sr-only">Preço máximo</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            placeholder="Preço máx."
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </label>
                    <label className="filter-field">
                        <span className="sr-only">Ordenar por</span>
                        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                            <option value="new">Mais recentes</option>
                            <option value="asc">Menor preço</option>
                            <option value="desc">Maior preço</option>
                        </select>
                    </label>
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
                    <div className="filter-chips-row" role="group" aria-labelledby="filter-category-label">
                        <span id="filter-category-label">Categoria</span>
                        <button
                            type="button"
                            className={category === "all" ? "active" : ""}
                            aria-pressed={category === "all"}
                            onClick={() => setCategory("all")}
                        >
                            Todas
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                className={category === String(cat.id) ? "active" : ""}
                                aria-pressed={category === String(cat.id)}
                                onClick={() => setCategory(String(cat.id))}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="filter-chips-row" role="group" aria-labelledby="filter-size-label">
                        <span id="filter-size-label">Tamanho</span>
                        <button
                            type="button"
                            className={size === "all" ? "active" : ""}
                            aria-pressed={size === "all"}
                            onClick={() => setSize("all")}
                        >
                            Todos
                        </button>
                        {availableSizes.map((option) => (
                            <button
                                key={option}
                                type="button"
                                className={size === option ? "active" : ""}
                                aria-pressed={size === option}
                                onClick={() => setSize(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {hasActiveFilters && (
                        <button type="button" className="clear-filters" onClick={clearFilters}>
                            Limpar filtros
                        </button>
                    )}
                </div>
            </section>

            <section aria-labelledby="products-title">
                <h2 id="products-title" className="sr-only">
                    Produtos
                </h2>
                <p className="sr-only" role="status" aria-live="polite">
                    {loading && page === 1
                        ? "Carregando produtos"
                        : `${total} ${total === 1 ? "produto encontrado" : "produtos encontrados"}`}
                </p>

                <ul className="shop-products-grid" aria-busy={loading}>
                    {loading &&
                        page === 1 &&
                        products.length === 0 &&
                        Array.from({ length: 8 }).map((_, i) => (
                            <li key={`sk-${i}`} className="shop-skeleton-card" aria-hidden="true">
                                <div className="shop-skeleton-media" />
                                <div className="shop-skeleton-line" />
                                <div className="shop-skeleton-line short" />
                            </li>
                        ))}

                    {products.map((product) => {
                        const id = String(product.id);
                        const sizes = parseSizes(product.sizes);
                        const chosen = selectedSizes[id] || sizes[0] || "";
                        const stock = productStock(product);
                        const favorite = isFavorite(product.id);
                        const soldOut = stock === 0;

                        return (
                            <li key={product.id} className="shop-product-card">
                                <div className="shop-product-media">
                                    <Link to={`/produto/${product.id}`} tabIndex={-1} aria-hidden="true">
                                        <img
                                            className="shop-product-image"
                                            src={resolveImageUrl(productCover(product))}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </Link>
                                    <button
                                        type="button"
                                        className={`wishlist-btn ${favorite ? "active" : ""}`}
                                        aria-label={`Favoritar ${product.name}`}
                                        aria-pressed={favorite}
                                        onClick={() => toggle(product.id)}
                                    >
                                        <Heart
                                            size={18}
                                            strokeWidth={1.5}
                                            fill={favorite ? "currentColor" : "none"}
                                            aria-hidden="true"
                                        />
                                    </button>
                                    {soldOut ? (
                                        <span className="stock-badge">Esgotado</span>
                                    ) : (
                                        stock <= 5 && <span className="stock-badge">Restam {stock}</span>
                                    )}
                                </div>

                                <h3 className="shop-product-name">
                                    <Link to={`/produto/${product.id}`}>{product.name}</Link>
                                </h3>

                                <p className="shop-product-price">
                                    {hasDiscount(product) && <span className="sr-only">Preço promocional: </span>}
                                    {formatBRL(productPrice(product))}
                                </p>

                                {sizes.length > 0 && (
                                    <div
                                        className="card-size-options"
                                        role="group"
                                        aria-label={`Tamanho de ${product.name}`}
                                    >
                                        {sizes.map((option) => (
                                            <button
                                                key={option}
                                                type="button"
                                                className={chosen === option ? "active" : ""}
                                                aria-pressed={chosen === option}
                                                onClick={() =>
                                                    setSelectedSizes((prev) => ({ ...prev, [id]: option }))
                                                }
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {cardError[id] && (
                                    <p className="card-size-error" role="alert">
                                        {cardError[id]}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    className="shop-add-cart"
                                    onClick={() => handleAdd(product)}
                                    disabled={soldOut}
                                >
                                    {soldOut ? "Esgotado" : "Adicionar à sacola"}
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <div ref={sentinelRef} aria-hidden="true" />

                {loading && page > 1 && <p className="shop-products-loading">Carregando...</p>}

                {hasMore && !loading && (
                    <button type="button" className="clear-filters shop-load-more" onClick={loadMore}>
                        Carregar mais
                    </button>
                )}

                {loadError && (
                    <p role="alert">
                        Não foi possível carregar os produtos.{" "}
                        <button type="button" className="link-button" onClick={() => setAttempt((n) => n + 1)}>
                            Tentar de novo
                        </button>
                    </p>
                )}

                {!loading && !loadError && products.length === 0 && <p>Nenhum produto encontrado</p>}
            </section>
        </div>
    );
}
