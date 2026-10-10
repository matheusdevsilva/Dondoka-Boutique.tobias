import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, Minus, Plus } from "lucide-react";
import api, { apiErrorMessage, resolveImageUrl, type ApiResponse } from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import Modal from "../components/Modal";
import Seo from "../components/Seo";
import PageLoader from "../components/PageLoader";
import {
    formatBRL,
    hasDiscount,
    parseSizes,
    productCover,
    productImages,
    productPrice,
    productStock,
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

interface ReviewsPayload {
    average: number;
    count: number;
    reviews: Review[];
}

function Stars({ value }: { value: number }) {
    const rounded = Math.round(value);
    return (
        <span aria-hidden="true">
            {"★".repeat(rounded)}
            {"☆".repeat(5 - rounded)}
        </span>
    );
}

export default function ProductDetail() {
    const { id = "" } = useParams();
    return <ProductDetailView key={id} id={id} />;
}

function ProductDetailView({ id }: { id: string }) {
    const { addItem, setCartOpen, setCheckoutOpen } = useCart();
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
    const [reviews, setReviews] = useState<ReviewsPayload>({ average: 0, count: 0, reviews: [] });
    const [reviewName, setReviewName] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewMsg, setReviewMsg] = useState("");
    const [reviewSending, setReviewSending] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        Promise.all([
            api.get<ApiResponse<ProductType>>(`/product/${id}`, { signal }),
            api.get<ApiResponse<ReviewsPayload>>(`/product/${id}/reviews`, { signal }),
        ])
            .then(([productRes, reviewsRes]) => {
                const data = productRes.data.data;
                setProduct(data);
                setSize(parseSizes(data.sizes)[0] || "");
                setReviews(reviewsRes.data.data);

                if (data.category_id) {
                    api.get<ApiResponse<ProductType[]>>("/products", {
                        params: { category: data.category_id, exclude: data.id, page: 1, limit: 4 },
                        signal,
                    })
                        .then((res) => setRelated(res.data.data || []))
                        .catch(() => undefined);
                }
            })
            .catch(() => {
                if (!signal.aborted) setError(true);
            })
            .finally(() => {
                if (!signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [id]);

    function addToCart(goToCheckout: boolean) {
        if (!product) return false;
        const sizes = parseSizes(product.sizes);
        if (sizes.length > 0 && !size) {
            setSizeError("Escolha um tamanho.");
            return false;
        }

        const stock = productStock(product);
        if (qty > stock) {
            setSizeError(stock === 0 ? "Produto esgotado." : `Estoque disponível: ${stock}`);
            return false;
        }

        setSizeError("");
        addItem(
            {
                id: String(product.id),
                name: product.name,
                price: productPrice(product),
                image_url: productCover(product) || undefined,
                size: size || undefined,
            },
            qty,
            { openCart: !goToCheckout }
        );
        if (goToCheckout) {
            setCartOpen(false);
            setCheckoutOpen(true);
        }
        return true;
    }

    async function submitReview(e: FormEvent) {
        e.preventDefault();
        setReviewMsg("");
        setReviewSending(true);
        try {
            await api.post(`/product/${id}/reviews`, {
                author_name: reviewName,
                rating: reviewRating,
                comment: reviewComment,
            });
            const reviewsRes = await api.get<ApiResponse<ReviewsPayload>>(`/product/${id}/reviews`);
            setReviews(reviewsRes.data.data);
            setReviewName("");
            setReviewComment("");
            setReviewRating(5);
            setReviewMsg("Avaliação enviada. Obrigada!");
        } catch (err) {
            setReviewMsg(apiErrorMessage(err, "Não foi possível enviar."));
        } finally {
            setReviewSending(false);
        }
    }

    if (loading) {
        return <PageLoader label="Carregando produto..." />;
    }

    if (error || !product) {
        return (
            <div className="product-detail-state">
                <Seo title="Produto não encontrado" noIndex />
                <h1>Produto não encontrado.</h1>
                <Link to="/colecao">Voltar à coleção</Link>
            </div>
        );
    }

    const price = productPrice(product);
    const sizes = parseSizes(product.sizes);
    const stock = productStock(product);
    const soldOut = stock === 0;
    const gallery = productImages(product);
    const mainSrc = resolveImageUrl(gallery[activeImage] || gallery[0]);
    const discounted = hasDiscount(product);
    const favorite = isFavorite(product.id);
    const description = product.description?.slice(0, 160) || `${product.name} na Dondoka Boutique.`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        image: gallery.map((src) => resolveImageUrl(src)),
        brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
        aggregateRating:
            reviews.count > 0
                ? { "@type": "AggregateRating", ratingValue: reviews.average, reviewCount: reviews.count }
                : undefined,
        offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: price.toFixed(2),
            availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        },
    };

    return (
        <>
            <Seo title={product.name} description={description} image={mainSrc} />
            <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

            <div className="product-detail-page">
                <Link to="/colecao" className="product-detail-back">
                    <span aria-hidden="true">← </span>Voltar à coleção
                </Link>

                <div className="product-detail">
                    <div className="product-gallery">
                        <div className="product-gallery-main">
                            <button
                                type="button"
                                className="zoom-trigger"
                                onClick={() => setZoomOpen(true)}
                                aria-label={`Ampliar imagem de ${product.name}`}
                            >
                                <img
                                    className="product-detail-image"
                                    src={mainSrc}
                                    alt=""
                                    fetchPriority="high"
                                />
                                <span aria-hidden="true">Clique para ampliar</span>
                            </button>
                            <button
                                type="button"
                                className={`wishlist-btn detail ${favorite ? "active" : ""}`}
                                aria-label={`Favoritar ${product.name}`}
                                aria-pressed={favorite}
                                onClick={() => toggle(product.id)}
                            >
                                <Heart
                                    size={20}
                                    strokeWidth={1.5}
                                    fill={favorite ? "currentColor" : "none"}
                                    aria-hidden="true"
                                />
                            </button>
                        </div>

                        {gallery.length > 1 && (
                            <div className="product-gallery-thumbs" role="group" aria-label="Imagens do produto">
                                {gallery.map((src, index) => (
                                    <button
                                        key={`${src}-${index}`}
                                        type="button"
                                        className={activeImage === index ? "active" : ""}
                                        aria-label={`Ver imagem ${index + 1} de ${gallery.length}`}
                                        aria-pressed={activeImage === index}
                                        onClick={() => setActiveImage(index)}
                                    >
                                        <img src={resolveImageUrl(src)} alt="" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="product-detail-info">
                        {product.brand && <span className="product-detail-brand">{product.brand}</span>}

                        <h1>{product.name}</h1>

                        {reviews.average > 0 && (
                            <p className="product-rating-summary">
                                <Stars value={reviews.average} />
                                <span className="sr-only">Nota média {reviews.average.toFixed(1)} de 5,</span>{" "}
                                <span aria-hidden="true">{reviews.average.toFixed(1)} · </span>
                                {reviews.count} avaliaç{reviews.count !== 1 ? "ões" : "ão"}
                            </p>
                        )}

                        <p className="product-detail-prices">
                            {discounted && (
                                <span className="product-detail-old">
                                    <span className="sr-only">De </span>
                                    {formatBRL(Number(product.price))}
                                </span>
                            )}
                            <span className="product-detail-price">
                                {discounted && <span className="sr-only">por </span>}
                                {formatBRL(price)}
                            </span>
                        </p>

                        {product.description && <p className="product-detail-desc">{product.description}</p>}

                        {sizes.length > 0 && (
                            <div className="product-detail-sizes">
                                <div className="size-label-row">
                                    <span className="label" id="size-label">
                                        Tamanho
                                    </span>
                                    <button
                                        type="button"
                                        className="size-guide-link"
                                        onClick={() => setGuideOpen(true)}
                                        aria-haspopup="dialog"
                                    >
                                        Guia de tamanhos
                                    </button>
                                </div>
                                <div className="size-options" role="group" aria-labelledby="size-label">
                                    {sizes.map((option) => (
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
                            </div>
                        )}

                        <div className="product-detail-qty">
                            <span className="label" id="qty-label">
                                Quantidade
                            </span>
                            <div className="product-detail-qty-controls" role="group" aria-labelledby="qty-label">
                                <button
                                    type="button"
                                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                                    disabled={qty <= 1}
                                    aria-label="Diminuir quantidade"
                                >
                                    <Minus size={14} aria-hidden="true" />
                                </button>
                                <span aria-live="polite">{qty}</span>
                                <button
                                    type="button"
                                    onClick={() => setQty((q) => Math.min(Math.max(1, stock), 20, q + 1))}
                                    disabled={soldOut || qty >= Math.min(stock, 20)}
                                    aria-label="Aumentar quantidade"
                                >
                                    <Plus size={14} aria-hidden="true" />
                                </button>
                            </div>
                            {soldOut && <span className="stock-hint low">Esgotado</span>}
                            {stock > 0 && stock <= 5 && <span className="stock-hint low">Restam só {stock}</span>}
                            {stock > 5 && <span className="stock-hint">{stock} em estoque</span>}
                        </div>

                        {sizeError && (
                            <p className="product-size-error" role="alert">
                                {sizeError}
                            </p>
                        )}

                        <div className="product-detail-actions">
                            <button
                                type="button"
                                className="btn-add-cart"
                                onClick={() => addToCart(false)}
                                disabled={soldOut}
                            >
                                {soldOut ? "Esgotado" : "Adicionar à sacola"}
                            </button>
                            <button
                                type="button"
                                className="btn-buy-now"
                                onClick={() => addToCart(true)}
                                disabled={soldOut}
                            >
                                Comprar agora
                            </button>
                        </div>
                    </div>
                </div>

                <section className="product-reviews" aria-labelledby="reviews-title">
                    <h2 id="reviews-title">Avaliações</h2>

                    {reviews.reviews.length === 0 && (
                        <p className="reviews-empty">Seja a primeira a avaliar esta peça.</p>
                    )}

                    <ul className="reviews-list">
                        {reviews.reviews.map((review) => (
                            <li key={review.id}>
                                <article>
                                    <header>
                                        <strong>{review.author_name}</strong>
                                        <span>
                                            <Stars value={review.rating} />
                                            <span className="sr-only">Nota {review.rating} de 5</span>
                                        </span>
                                    </header>
                                    <p>{review.comment}</p>
                                </article>
                            </li>
                        ))}
                    </ul>

                    <form className="review-form" onSubmit={submitReview}>
                        <h3>Deixe sua avaliação</h3>
                        <label>
                            Nome
                            <input
                                value={reviewName}
                                onChange={(e) => setReviewName(e.target.value)}
                                autoComplete="given-name"
                                maxLength={80}
                                required
                            />
                        </label>
                        <label>
                            Nota
                            <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
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
                                onChange={(e) => setReviewComment(e.target.value)}
                                rows={3}
                                maxLength={1000}
                                required
                            />
                        </label>
                        <p className="review-msg" role="status" aria-live="polite">
                            {reviewMsg}
                        </p>
                        <button type="submit" disabled={reviewSending}>
                            {reviewSending ? "Enviando..." : "Enviar avaliação"}
                        </button>
                    </form>
                </section>

                {related.length > 0 && (
                    <section className="product-related" aria-labelledby="related-title">
                        <h2 id="related-title">Você também pode gostar</h2>
                        <ul className="product-related-grid">
                            {related.map((item) => (
                                <li key={item.id}>
                                    <Link to={`/produto/${item.id}`} className="product-related-card">
                                        <img
                                            src={resolveImageUrl(productCover(item))}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <h3>{item.name}</h3>
                                        <span>{formatBRL(productPrice(item))}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            <Modal
                open={zoomOpen}
                onClose={() => setZoomOpen(false)}
                title={`Imagem ampliada de ${product.name}`}
                hideTitle
                overlayClassName="zoom-overlay"
                panelClassName="zoom-panel"
            >
                <img src={mainSrc} alt={product.name} />
            </Modal>

            <Modal
                open={guideOpen}
                onClose={() => setGuideOpen(false)}
                title="Guia de tamanhos"
                overlayClassName="guide-overlay"
                panelClassName="guide-modal"
                headClassName="guide-head"
            >
                <table>
                    <caption className="sr-only">Medidas em centímetros por tamanho</caption>
                    <thead>
                        <tr>
                            <th scope="col">Tam.</th>
                            <th scope="col">Busto</th>
                            <th scope="col">Cintura</th>
                            <th scope="col">Quadril</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ["P", "84–88", "66–70", "90–94"],
                            ["M", "88–92", "70–74", "94–98"],
                            ["G", "92–98", "74–80", "98–104"],
                            ["GG", "98–104", "80–86", "104–110"],
                        ].map(([label, ...measures]) => (
                            <tr key={label}>
                                <th scope="row">{label}</th>
                                {measures.map((m) => (
                                    <td key={m}>{m}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p>Medidas aproximadas em centímetros.</p>
            </Modal>
        </>
    );
}
