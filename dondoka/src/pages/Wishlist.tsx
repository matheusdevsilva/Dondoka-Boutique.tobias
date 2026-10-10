import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { resolveImageUrl, type ApiResponse } from "../services/api";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import Seo from "../components/Seo";
import {
    formatBRL,
    parseSizes,
    productCover,
    productPrice,
    productStock,
    type ProductType,
} from "../types/product";
import "../styles/Wishlist.css";

export default function Wishlist() {
    const { ids, toggle } = useWishlist();
    const { addItem } = useCart();
    const [products, setProducts] = useState<ProductType[]>([]);
    const [requested, setRequested] = useState<Set<string>>(() => new Set());
    const [sizes, setSizes] = useState<Record<string, string>>({});
    const missing = ids.filter((id) => !requested.has(id));
    const missingKey = missing.join(",");
    const loading = products.length === 0 && ids.length > 0 && missing.length > 0;

    useEffect(() => {
        if (!missingKey) return;
        const controller = new AbortController();
        api.get<ApiResponse<ProductType[]>>("/products", {
            params: { ids: missingKey },
            signal: controller.signal,
        })
            .then((res) => {
                const fetched = res.data.data || [];
                setProducts((prev) => {
                    const known = new Set(prev.map((p) => String(p.id)));
                    return [...prev, ...fetched.filter((p) => !known.has(String(p.id)))];
                });
            })
            .catch((error) => {
                if (!controller.signal.aborted) console.error(error);
            })
            .finally(() => {
                if (controller.signal.aborted) return;
                setRequested((prev) => new Set([...prev, ...missingKey.split(",")]));
            });
        return () => controller.abort();
    }, [missingKey]);

    const visible = products.filter((p) => ids.includes(String(p.id)));
    const count = visible.length;

    return (
        <div className="wishlist-page">
            <Seo title="Favoritos" noIndex />
            <h1>Favoritos</h1>
            <p className="wishlist-subtitle" aria-live="polite">
                {loading
                    ? "Carregando..."
                    : count === 0
                      ? "Nenhuma peça salva ainda."
                      : `${count} peça${count > 1 ? "s" : ""} salva${count > 1 ? "s" : ""}`}
            </p>

            {!loading && visible.length > 0 && (
                <ul className="wishlist-grid">
                    {visible.map((product) => {
                        const id = String(product.id);
                        const options = parseSizes(product.sizes);
                        const chosen = sizes[id] || options[0];
                        const soldOut = productStock(product) === 0;

                        return (
                            <li key={product.id} className="wishlist-card">
                                <Link to={`/produto/${product.id}`}>
                                    <img
                                        src={resolveImageUrl(productCover(product))}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <h2>{product.name}</h2>
                                </Link>
                                <strong>{formatBRL(productPrice(product))}</strong>

                                {options.length > 1 && (
                                    <label className="wishlist-size">
                                        Tamanho
                                        <select
                                            value={chosen}
                                            onChange={(e) =>
                                                setSizes((prev) => ({ ...prev, [id]: e.target.value }))
                                            }
                                        >
                                            {options.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                <div className="wishlist-actions">
                                    <button
                                        type="button"
                                        disabled={soldOut}
                                        onClick={() =>
                                            addItem({
                                                id,
                                                name: product.name,
                                                price: productPrice(product),
                                                image_url: productCover(product) || undefined,
                                                size: chosen,
                                            })
                                        }
                                        aria-label={`Adicionar ${product.name} à sacola`}
                                    >
                                        {soldOut ? "Esgotado" : "Sacola"}
                                    </button>
                                    <button
                                        type="button"
                                        className="ghost"
                                        onClick={() => toggle(product.id)}
                                        aria-label={`Remover ${product.name} dos favoritos`}
                                    >
                                        Remover
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {!loading && visible.length === 0 && (
                <Link to="/colecao" className="wishlist-cta">
                    Explorar coleção
                </Link>
            )}
        </div>
    );
}
