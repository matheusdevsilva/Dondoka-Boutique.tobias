import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, X } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api, { resolveImageUrl } from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
    formatBRL,
    parseSizes,
    productCover,
    productImages,
    productPrice,
    type ProductType,
} from "../types/product";
import "../styles/ProductDetail.css";

interface Review {
    id: number;
    author_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export default function ProductDetail() {
    const { id } = useParams();
    const { addItem } = useCart();
    const { isFavorite, toggle } = useWishlist();

    const [product, setProduct] = useState<ProductType | null>(null);
    const [related, setRelated] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [size, setSize] = useState("");
    const [activeImage, setActiveImage] = useState(0);
    const [error, setError] = useState(false);
    const [sizeError, setSizeError] = useState("");
    const [zoomOpen, setZoomOpen] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [reviewName, setReviewName] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewMsg, setReviewMsg] = useState("");

    useEffect(() => {
        async function load() {
            if (!id) return;

            try {
                setLoading(true);
                setError(false);
                setActiveImage(0);
                const [productRes, listRes, reviewsRes] = await Promise.all([
                    api.get(`/product/${id}`),
                    api.get("/products/"),
                    api.get(`/product/${id}/reviews`),
                ]);
                const data = productRes.data as ProductType;
                setProduct(data);
                const sizes = parseSizes(data.sizes);
                setSize(sizes[0] || "M");

                const all = (listRes.data.data || []) as ProductType[];
                setRelated(
                    all
                        .filter(
                            (p) =>
                                String(p.id) !== String(data.id) &&
                                p.is_active !== false &&
                                String(p.category_id) === String(data.category_id)
                        )
                        .slice(0, 4)
                );

                setReviews(reviewsRes.data.data?.reviews || []);
                setAvgRating(Number(reviewsRes.data.data?.average || 0));
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [id]);

    function handleAdd() {
        if (!product) return;
        if (!size) {
            setSizeError("Escolha um tamanho.");
            return;
        }

        const stock = Number(product.stock ?? 0);
        if (stock > 0 && qty > stock) {
            setSizeError(`Estoque disponível: ${stock}`);
            return;
        }

        setSizeError("");
        addItem(
            {
                id: String(product.id),
                name: product.name,
                price: productPrice(product),
                image_url: productCover(product) || undefined,
                size,
            },
            qty
        );
    }

    async function submitReview(e: FormEvent) {
        e.preventDefault();
        if (!id) return;
        setReviewMsg("");
        try {
            await api.post(`/product/${id}/reviews`, {
                author_name: reviewName,
                rating: reviewRating,
                comment: reviewComment,
            });
            const reviewsRes = await api.get(`/product/${id}/reviews`);
            setReviews(reviewsRes.data.data?.reviews || []);
            setAvgRating(Number(reviewsRes.data.data?.average || 0));
            setReviewName("");
            setReviewComment("");
            setReviewRating(5);
            setReviewMsg("Avaliação enviada. Obrigada!");
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setReviewMsg(
                error.response?.data?.message || "Não foi possível enviar."
            );
        }
    }

    if (loading) {
        return (
            <>
                <Header />
                <div className="product-detail-state">Carregando produto...</div>
                <Footer />
            </>
        );
    }

    if (error || !product) {
        return (
            <>
                <Header />
                <div className="product-detail-state">
                    <p>Produto não encontrado.</p>
                    <Link to="/colecao">Voltar à coleção</Link>
                </div>
                <Footer />
            </>
        );
    }

    const price = productPrice(product);
    const sizes = parseSizes(product.sizes);
    const stock = Number(product.stock ?? 0);
    const gallery = productImages(product);
    const mainSrc = resolveImageUrl(gallery[activeImage] || gallery[0]);
    const hasDiscount =
        product.discount_price != null &&
        Number(product.discount_price) > 0 &&
        Number(product.discount_price) < Number(product.price);

    return (
        <>
            <Header />

            <div className="product-detail-page">
                <Link to="/colecao" className="product-detail-back">
                    ← Voltar à coleção
                </Link>

                <div className="product-detail">
                    <div className="product-gallery">
                        <div className="product-gallery-main">
                            <button
                                type="button"
                                className="zoom-trigger"
                                onClick={() => setZoomOpen(true)}
                                aria-label="Ampliar imagem"
                            >
                                <img
                                    className="product-detail-image"
                                    src={mainSrc}
                                    alt={product.name}
                                />
                                <span>Clique para ampliar</span>
                            </button>
                            <button
                                type="button"
                                className={`wishlist-btn detail ${
                                    isFavorite(product.id) ? "active" : ""
                                }`}
                                aria-label="Favoritar"
                                onClick={() => toggle(product.id)}
                            >
                                <Heart
                                    size={20}
                                    strokeWidth={1.5}
                                    fill={
                                        isFavorite(product.id)
                                            ? "currentColor"
                                            : "none"
                                    }
                                />
                            </button>
                        </div>

                        {gallery.length > 1 && (
                            <div className="product-gallery-thumbs">
                                {gallery.map((src, index) => (
                                    <button
                                        key={`${src}-${index}`}
                                        type="button"
                                        className={
                                            activeImage === index ? "active" : ""
                                        }
                                        onClick={() => setActiveImage(index)}
                                    >
                                        <img
                                            src={resolveImageUrl(src)}
                                            alt=""
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="product-detail-info">
                        {product.brand && (
                            <span className="product-detail-brand">
                                {product.brand}
                            </span>
                        )}

                        <h1>{product.name}</h1>

                        {avgRating > 0 && (
                            <p className="product-rating-summary">
                                {"★".repeat(Math.round(avgRating))}
                                {"☆".repeat(5 - Math.round(avgRating))}{" "}
                                {avgRating.toFixed(1)} · {reviews.length}{" "}
                                avaliação{reviews.length !== 1 ? "ões" : ""}
                            </p>
                        )}

                        <div className="product-detail-prices">
                            {hasDiscount && (
                                <span className="product-detail-old">
                                    {formatBRL(Number(product.price))}
                                </span>
                            )}
                            <span className="product-detail-price">
                                {formatBRL(price)}
                            </span>
                        </div>

                        {product.description && (
                            <p className="product-detail-desc">
                                {product.description}
                            </p>
                        )}

                        <div className="product-detail-sizes">
                            <div className="size-label-row">
                                <span className="label">Tamanho</span>
                                <button
                                    type="button"
                                    className="size-guide-link"
                                    onClick={() => setGuideOpen(true)}
                                >
                                    Guia de tamanhos
                                </button>
                            </div>
                            <div className="size-options">
                                {sizes.map((option) => (
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
                        </div>

                        <div className="product-detail-qty">
                            <span className="label">Quantidade</span>
                            <div className="product-detail-qty-controls">
                                <button
                                    type="button"
                                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                                >
                                    -
                                </button>
                                <span>{qty}</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setQty((q) =>
                                            stock > 0 ? Math.min(stock, q + 1) : q + 1
                                        )
                                    }
                                >
                                    +
                                </button>
                            </div>
                            {stock > 0 && stock <= 5 && (
                                <span className="stock-hint low">
                                    Restam só {stock}
                                </span>
                            )}
                            {stock > 5 && (
                                <span className="stock-hint">
                                    {stock} em estoque
                                </span>
                            )}
                        </div>

                        {sizeError && (
                            <p className="product-size-error">{sizeError}</p>
                        )}

                        <div className="product-detail-actions">
                            <button
                                type="button"
                                className="btn-add-cart"
                                onClick={handleAdd}
                            >
                                Adicionar à sacola
                            </button>
                            <button
                                type="button"
                                className="btn-buy-now"
                                onClick={handleAdd}
                            >
                                Comprar agora
                            </button>
                        </div>
                    </div>
                </div>

                <section className="product-reviews">
                    <h2>Avaliações</h2>

                    {reviews.length === 0 && (
                        <p className="reviews-empty">
                            Seja a primeira a avaliar esta peça.
                        </p>
                    )}

                    <div className="reviews-list">
                        {reviews.map((review) => (
                            <article key={review.id}>
                                <header>
                                    <strong>{review.author_name}</strong>
                                    <span>
                                        {"★".repeat(review.rating)}
                                        {"☆".repeat(5 - review.rating)}
                                    </span>
                                </header>
                                <p>{review.comment}</p>
                            </article>
                        ))}
                    </div>

                    <form className="review-form" onSubmit={submitReview}>
                        <h3>Deixe sua avaliação</h3>
                        <label>
                            Nome
                            <input
                                value={reviewName}
                                onChange={(e) => setReviewName(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Nota
                            <select
                                value={reviewRating}
                                onChange={(e) =>
                                    setReviewRating(Number(e.target.value))
                                }
                            >
                                {[5, 4, 3, 2, 1].map((n) => (
                                    <option key={n} value={n}>
                                        {n} estrela{n > 1 ? "s" : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Comentário
                            <textarea
                                value={reviewComment}
                                onChange={(e) =>
                                    setReviewComment(e.target.value)
                                }
                                rows={3}
                                required
                            />
                        </label>
                        {reviewMsg && <p className="review-msg">{reviewMsg}</p>}
                        <button type="submit">Enviar avaliação</button>
                    </form>
                </section>

                {related.length > 0 && (
                    <section className="product-related">
                        <h2>Você também pode gostar</h2>
                        <div className="product-related-grid">
                            {related.map((item) => (
                                <Link
                                    key={item.id}
                                    to={`/produto/${item.id}`}
                                    className="product-related-card"
                                >
                                    <img
                                        src={resolveImageUrl(productCover(item))}
                                        alt={item.name}
                                    />
                                    <h3>{item.name}</h3>
                                    <span>{formatBRL(productPrice(item))}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {zoomOpen && (
                <div
                    className="zoom-overlay"
                    onClick={() => setZoomOpen(false)}
                >
                    <button
                        type="button"
                        className="zoom-close"
                        onClick={() => setZoomOpen(false)}
                        aria-label="Fechar"
                    >
                        <X size={22} />
                    </button>
                    <img src={mainSrc} alt={product.name} />
                </div>
            )}

            {guideOpen && (
                <div
                    className="guide-overlay"
                    onClick={() => setGuideOpen(false)}
                >
                    <div
                        className="guide-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="guide-head">
                            <h3>Guia de tamanhos</h3>
                            <button
                                type="button"
                                onClick={() => setGuideOpen(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Tam.</th>
                                    <th>Busto</th>
                                    <th>Cintura</th>
                                    <th>Quadril</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>P</td>
                                    <td>84–88</td>
                                    <td>66–70</td>
                                    <td>90–94</td>
                                </tr>
                                <tr>
                                    <td>M</td>
                                    <td>88–92</td>
                                    <td>70–74</td>
                                    <td>94–98</td>
                                </tr>
                                <tr>
                                    <td>G</td>
                                    <td>92–98</td>
                                    <td>74–80</td>
                                    <td>98–104</td>
                                </tr>
                                <tr>
                                    <td>GG</td>
                                    <td>98–104</td>
                                    <td>80–86</td>
                                    <td>104–110</td>
                                </tr>
                            </tbody>
                        </table>
                        <p>Medidas aproximadas em centímetros.</p>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}
