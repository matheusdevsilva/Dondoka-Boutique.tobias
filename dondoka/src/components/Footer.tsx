import { Link } from "react-router-dom"
import { FaInstagram, FaWhatsapp } from "react-icons/fa"
import logo from "../assets/logo_sem_fundo.png"
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "../utils/social"
import { isWhatsAppConfigured, whatsappLink } from "../utils/whatsapp"
import "../styles/Footer.css"

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <img src={logo} className="footer-logo" alt="Dondoka Boutique" />
                    <p>
                        Moda elegante, feminina e moderna.
                        Encontre seu estilo com personalidade.
                    </p>
                    <div className="footer-social">
                        <a
                            href={INSTAGRAM_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="footer-social-link"
                        >
                            <FaInstagram size={18} aria-hidden />
                            <span>Instagram {INSTAGRAM_HANDLE}</span>
                        </a>
                        {isWhatsAppConfigured() && (
                            <a
                                href={whatsappLink()}
                                target="_blank"
                                rel="noreferrer"
                                className="footer-social-link"
                            >
                                <FaWhatsapp size={18} aria-hidden />
                                <span>WhatsApp (11) 94931-6452</span>
                            </a>
                        )}
                    </div>
                </div>

                <div className="footer-column">
                    <h4>Loja</h4>
                    <ul>
                        <li><Link to="/colecao">Coleção</Link></li>
                        <li><Link to="/novidades">Novidades</Link></li>
                        <li><Link to="/promocoes">Promoções</Link></li>
                        <li><Link to="/contato">Pedidos</Link></li>
                    </ul>
                </div>

                <div className="footer-column">
                    <h4>Institucional</h4>
                    <ul>
                        <li><Link to="/sobre">Sobre</Link></li>
                        <li><Link to="/contato">Contato</Link></li>
                        <li><Link to="/contato">Trocas</Link></li>
                        <li><Link to="/contato">Ajuda</Link></li>
                    </ul>
                </div>

                <div className="footer-news">
                    <h4>Fale conosco</h4>
                    <p>Siga no Instagram e chame no WhatsApp</p>
                    <div className="footer-social footer-social-stack">
                        <a
                            href={INSTAGRAM_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="footer-cta"
                        >
                            <FaInstagram size={16} aria-hidden />
                            Seguir no Instagram
                        </a>
                        {isWhatsAppConfigured() && (
                            <a
                                href={whatsappLink()}
                                target="_blank"
                                rel="noreferrer"
                                className="footer-cta footer-cta-ghost"
                            >
                                <FaWhatsapp size={16} aria-hidden />
                                Chamar no WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© 2026 Dondoka Boutique — Todos os direitos reservados</p>
            </div>
        </footer>
    )
}
