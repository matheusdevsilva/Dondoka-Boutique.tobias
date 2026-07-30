import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import { MapPin, Clock } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
    isWhatsAppConfigured,
    whatsappLink,
} from "../utils/whatsapp";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "../utils/social";
import "../styles/InfoPages.css";

const STORE_ADDRESS =
    "Av. Giovani Rinaldi, 131 - Parque Vitoria, Franco da Rocha - SP, 07854-120";

const mapsQuery = encodeURIComponent(STORE_ADDRESS);
const mapsEmbedSrc = `https://maps.google.com/maps?q=${mapsQuery}&z=16&output=embed`;
const mapsOpenUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

export default function Contato() {
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        const text = [
            "Olá! Vim pelo site da Dondoka Boutique.",
            name ? `Nome: ${name}` : "",
            "",
            message || "Gostaria de mais informações.",
        ]
            .filter(Boolean)
            .join("\n");

        window.open(whatsappLink(text), "_blank");
    }

    return (
        <>
            <Header />

            <main className="info-page contact-page">
                <section className="info-hero">
                    <span>Fale conosco</span>
                    <h1>Contato</h1>
                    <p>
                        Tire dúvidas, peça indicação de tamanho ou acompanhe
                        seu pedido com a gente.
                    </p>
                </section>

                <section className="info-content contact-layout">
                    <div className="contact-aside">
                        <div className="contact-cards">
                            <article className="contact-card contact-card-accent">
                                <span className="contact-card-label">Atendimento</span>
                                <div className="contact-card-title">
                                    <span className="contact-icon contact-icon-wa" aria-hidden>
                                        <FaWhatsapp size={18} />
                                    </span>
                                    <h3>WhatsApp</h3>
                                </div>
                                <p>
                                    Resposta rápida para pedidos, tamanhos e dúvidas.
                                    <br />
                                    <strong className="contact-phone">(11) 94931-6452</strong>
                                </p>
                                {isWhatsAppConfigured() ? (
                                    <a
                                        href={whatsappLink()}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="info-btn contact-card-btn"
                                    >
                                        <FaWhatsapp size={16} className="btn-icon" />
                                        Abrir conversa
                                    </a>
                                ) : (
                                    <p className="info-warn">
                                        Configure VITE_WHATSAPP no .env (ex.:
                                        5511999999999).
                                    </p>
                                )}
                            </article>

                            <article className="contact-card">
                                <span className="contact-card-label">Rede social</span>
                                <div className="contact-card-title">
                                    <span className="contact-icon contact-icon-ig" aria-hidden>
                                        <FaInstagram size={18} />
                                    </span>
                                    <h3>Instagram</h3>
                                </div>
                                <p>
                                    Novidades, looks e bastidores da boutique.
                                    <br />
                                    <strong className="contact-phone">{INSTAGRAM_HANDLE}</strong>
                                </p>
                                <a
                                    href={INSTAGRAM_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="info-btn contact-card-btn contact-card-btn-ghost"
                                >
                                    <FaInstagram size={16} className="btn-icon" />
                                    Seguir no Instagram
                                </a>
                            </article>

                            <article className="contact-card">
                                <span className="contact-card-label">Horário</span>
                                <div className="contact-card-title">
                                    <span className="contact-icon" aria-hidden>
                                        <Clock size={18} />
                                    </span>
                                    <h3>Segunda a sábado</h3>
                                </div>
                                <p>Das 9h às 18h. Fora do horário, deixe mensagem no WhatsApp.</p>
                            </article>

                            <article className="contact-card">
                                <span className="contact-card-label">Loja</span>
                                <h3>Pedidos &amp; trocas</h3>
                                <p>
                                    Finalize pela sacola + WhatsApp. Trocas em até 7 dias,
                                    peça sem uso.
                                </p>
                                <div className="contact-card-links">
                                    <Link to="/colecao" className="info-link">
                                        Ir para a loja
                                    </Link>
                                    <Link to="/sobre" className="info-link">
                                        Ver política
                                    </Link>
                                </div>
                            </article>
                        </div>

                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="contact-form-head">
                                <h2>Enviar mensagem</h2>
                                <p>Abrimos o WhatsApp com seu texto pronto.</p>
                            </div>

                            <label>
                                Nome
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                />
                            </label>

                            <label>
                                Mensagem
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Como podemos ajudar?"
                                    rows={5}
                                />
                            </label>

                            <button type="submit" className="info-btn">
                                <FaWhatsapp size={16} className="btn-icon" />
                                Enviar no WhatsApp
                            </button>
                        </form>
                    </div>

                    <section className="contact-map" aria-label="Localização da loja">
                        <div className="contact-map-head">
                            <span className="contact-card-label">Visite a boutique</span>
                            <div className="contact-card-title">
                                <span className="contact-icon" aria-hidden>
                                    <MapPin size={18} />
                                </span>
                                <h2>Onde estamos</h2>
                            </div>
                            <p>{STORE_ADDRESS}</p>
                            <a
                                href={mapsOpenUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="info-link"
                            >
                                <MapPin size={14} className="contact-icon-inline" />
                                Abrir no Google Maps
                            </a>
                        </div>
                        <div className="contact-map-frame">
                            <iframe
                                title="Mapa da Dondoka Boutique"
                                src={mapsEmbedSrc}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                            />
                        </div>
                    </section>
                </section>
            </main>

            <Footer />
        </>
    );
}
