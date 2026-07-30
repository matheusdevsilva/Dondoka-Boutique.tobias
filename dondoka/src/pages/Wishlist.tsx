import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api, { resolveImageUrl } from "../services/api";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import {
    formatBRL,
    productCover,
    productPrice,
    type ProductType,
} from "../types/product";
import "../styles/Wishlist.css";

export default function Wishlist() {
    const { ids, toggle, count } = useWishlist();
    const { addItem } = useCart();
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (ids.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const res = await api.get("/products/");
                const all = (res.data.data || []) as ProductType[];
                const idSet = new Set(ids);
                setProducts(all.filter((p) => idSet.has(String(p.id))));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [ids]);

    return (
        <>
            <Header />
            <main className="wishlist-page">
                <h1>Favoritos</h1>
                <p className="wishlist-subtitle">
                    {count === 0
                        ? "Nenhuma peça salva ainda."
                        : `${count} peça${count > 1 ? "s" : ""} salva${count > 1 ? "s" : ""}`}
                </p>

                {loading && <p className="wishlist-state">Carregando...</p>}

                {!loading && products.length > 0 && (
                    <div className="wishlist-grid">
                        {products.map((product) => (
                            <article key={product.id} className="wishlist-card">
                                <Link to={`/produto/${product.id}`}>
                                    <img
                                        src={resolveImageUrl(
                                            productCover(product)
                                        )}
                                        alt={product.name}
                                    />
                                    <h2>{product.name}</h2>
                                </Link>
                                <strong>
                                    {formatBRL(productPrice(product))}
                                </strong>
                                <div className="wishlist-actions">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            addItem({
                                                id: String(product.id),
                                                name: product.name,
                                                price: productPrice(product),
                                                image_url:
                                                    productCover(product) ||
                                                    undefined,
                                            })
                                        }
                                    >
                                        Sacola
                                    </button>
                                    <button
                                        type="button"
                                        className="ghost"
                                        onClick={() => toggle(product.id)}
                                    >
                                        Remover
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {!loading && products.length === 0 && (
                    <Link to="/colecao" className="wishlist-cta">
                        Explorar coleção
                    </Link>
                )}
            </main>
            <Footer />
        </>
    );
}
