import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api, { resolveImageUrl } from "../services/api";
import logo from "../assets/logo_sem_fundo.png";
import { formatBRL, productCover, productPrice, type ProductType } from "../types/product";
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
        async function load() {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    api.get("/products", { params: { page: 1, limit: 8 } }),
                    api.get("/categories"),
                ]);
                setProducts(productsRes.data.data || []);
                setCategories(categoriesRes.data.data || []);
            } catch (error) {
                console.error("Erro ao carregar home:", error);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    return (
        <div className="home">
            <Header />

            <section className="home-hero">
                <div className="home-hero-content">
                    <img
                        src={logo}
                        alt="Dondoka Boutique"
                        className="home-hero-logo"
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
                <span className="home-hero-scroll">scroll</span>
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
                    <div className="home-products-grid">
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
                                        alt={product.name}
                                    />
                                </div>
                                <h3>{product.name}</h3>
                                <div className="price-row">
                                    {product.discount_price ? (
                                        <span className="old-price">
                                            {formatBRL(Number(product.price))}
                                        </span>
                                    ) : null}
                                    <strong>{formatBRL(productPrice(product))}</strong>
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

            <Footer />
        </div>
    );
}
