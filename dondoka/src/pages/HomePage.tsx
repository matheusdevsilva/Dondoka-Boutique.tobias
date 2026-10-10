import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { resolveImageUrl, type ApiResponse } from "../services/api";
import Seo from "../components/Seo";
import logo from "../assets/logo_sem_fundo.png";
import { formatBRL, hasDiscount, productCover, productPrice, type ProductType } from "../types/product";
import "../styles/Home.css";

interface Category {
    id: string | number;
    name: string;
}

export default function HomePage() {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        Promise.all([
            api.get<ApiResponse<ProductType[]>>("/products", {
                params: { page: 1, limit: 8 },
                signal: controller.signal,
            }),
            api.get<ApiResponse<Category[]>>("/categories", { signal: controller.signal }),
        ])
            .then(([productsRes, categoriesRes]) => {
                setProducts(productsRes.data.data || []);
                setCategories(categoriesRes.data.data || []);
            })
            .catch((error) => {
                if (!controller.signal.aborted) console.error("Erro ao carregar home:", error);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, []);

    return (
        <div className="home">
            <Seo description="Dondoka Boutique — moda feminina com leveza, presença e personalidade." />
            <section className="home-hero">
                <div className="home-hero-content">
                    <img
                        src={logo}
                        alt=""
                        width={499}
                        height={500}
                        className="home-hero-logo"
                        fetchPriority="high"
                    />
                    <span className="home-hero-mark">boutique</span>
                    <h1>Dondoka</h1>
                    <p>Moda feminina com leveza, presença e personalidade.</p>
                    <div className="home-hero-actions">
                        <Link to="/colecao" className="home-btn home-btn-primary">
                            Ver coleção
                        </Link>
                        <Link to="/novidades" className="home-btn home-btn-secondary">
                            Novidades
                        </Link>
                    </div>
                </div>
                <span className="home-hero-scroll" aria-hidden="true">scroll</span>
            </section>

            <section className="home-departments">
                <Link to="/colecao" className="home-dept">
                    <span>01</span>
                    <h2>Coleção</h2>
                    <p>Todas as peças</p>
                </Link>
                <Link to="/novidades" className="home-dept">
                    <span>02</span>
                    <h2>Novidades</h2>
                    <p>Recém-chegados</p>
                </Link>
                <Link to="/promocoes" className="home-dept">
                    <span>03</span>
                    <h2>Promoções</h2>
                    <p>Ofertas especiais</p>
                </Link>
                <Link to="/sobre" className="home-dept">
                    <span>04</span>
                    <h2>A marca</h2>
                    <p>Conheça a Dondoka</p>
                </Link>
            </section>

            {categories.length > 0 && (
                <section className="home-section">
                    <div className="home-section-header">
                        <div>
                            <h2>Categorias</h2>
                            <p>Navegue pela loja</p>
                        </div>
                        <Link to="/colecao">Ver tudo</Link>
                    </div>

                    <div className="home-categories">
                        {categories.map((cat, index) => (
                            <Link
                                key={cat.id}
                                to={`/colecao?categoria=${cat.id}`}
                                className="home-category"
                            >
                                <span>{String(index + 1).padStart(2, "0")}</span>
                                <strong>{cat.name}</strong>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <section className="home-section" id="destaques">
                <div className="home-section-header">
                    <div>
                        <h2>Em destaque</h2>
                        <p>Seleção para começar sua sacola</p>
                    </div>
                    <Link to="/colecao">Ver loja</Link>
                </div>

                {loading && (
                    <div className="home-products-grid" aria-busy="true" aria-label="Carregando produtos">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={`home-sk-${i}`} className="home-skeleton-card">
                                <div className="home-skeleton-media" />
                                <div className="home-skeleton-line" />
                                <div className="home-skeleton-line short" />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && products.length === 0 && (
                    <p className="home-empty">Em breve novas peças.</p>
                )}

                {!loading && products.length > 0 && (
                    <div className="home-products-grid">
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                to={`/produto/${product.id}`}
                                className="home-product-card"
                            >
                                <div className="media">
                                    <img
                                        src={resolveImageUrl(productCover(product))}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <h3>{product.name}</h3>
                                <div className="price-row">
                                    {hasDiscount(product) && (
                                        <span className="old-price">
                                            <span className="sr-only">De </span>
                                            {formatBRL(Number(product.price))}
                                        </span>
                                    )}
                                    <strong>
                                        {hasDiscount(product) && <span className="sr-only">por </span>}
                                        {formatBRL(productPrice(product))}
                                    </strong>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section className="home-statement">
                <span>Dondoka Boutique</span>
                <h2>Vista-se com elegância. Sinta-se você.</h2>
                <div className="home-hero-actions">
                    <Link to="/colecao" className="home-btn home-btn-primary">
                        Explorar loja
                    </Link>
                    <Link to="/contato" className="home-btn home-btn-secondary home-btn-on-dark">
                        Fale conosco
                    </Link>
                </div>
            </section>
        </div>
    );
}
