import { Link } from "react-router-dom"
import { InstagramIcon, WhatsAppIcon } from "./BrandIcons"
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
                            rel="noopener noreferrer"
                            className="footer-social-link"
                        >
                            <InstagramIcon size={18} />
                            <span>Instagram {INSTAGRAM_HANDLE}</span>
                        </a>
                        {isWhatsAppConfigured() && (
                            <a
                                href={whatsappLink()}
                                target="_blank"
                                rel="noreferrer"
                                className="footer-social-link"
                            >
                                <WhatsAppIcon size={18} />
                                <span>WhatsApp (11) 94931-6452</span>
                            </a>
                        )}
                    </div>
                </div>

                <div className="footer-column">
                    <h2>Loja</h2>
                    <ul>
                        <li><Link to="/colecao">Coleção</Link></li>
                        <li><Link to="/novidades">Novidades</Link></li>
                        <li><Link to="/promocoes">Promoções</Link></li>
                        <li><Link to="/contato">Pedidos</Link></li>
                    </ul>
                </div>

                <div className="footer-column">
                    <h2>Institucional</h2>
                    <ul>
                        <li><Link to="/sobre">Sobre</Link></li>
                        <li><Link to="/contato">Contato</Link></li>
                        <li><Link to="/contato">Trocas</Link></li>
                        <li><Link to="/contato">Ajuda</Link></li>
                    </ul>
                </div>

                <div className="footer-news">
                    <h2>Fale conosco</h2>
                    <p>Siga no Instagram e chame no WhatsApp</p>
                    <div className="footer-social footer-social-stack">
                        <a
                            href={INSTAGRAM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-cta"
                        >
                            <InstagramIcon size={16} />
                            Seguir no Instagram
                        </a>
                        {isWhatsAppConfigured() && (
                            <a
                                href={whatsappLink()}
                                target="_blank"
                                rel="noreferrer"
                                className="footer-cta footer-cta-ghost"
                            >
                                <WhatsAppIcon size={16} />
                                Chamar no WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} Dondoka Boutique — Todos os direitos reservados</p>
            </div>
        </footer>
    )
}
