import logo from "../assets/logo.jpeg"
import "../styles/Footer.css"

export default function Footer() {
    return (
        <footer className="footer">

            <div className="footer-glow" />

            <div className="footer-container">

                {/* BRAND */}
                <div className="footer-brand">
                    <img src={logo} className="footer-logo" />
                    <p>
                        Moda elegante, feminina e moderna.<br />
                        Encontre seu estilo com personalidade.
                    </p>
                </div>

                {/* LINKS */}
                <div className="footer-column">
                    <h4>Institucional</h4>
                    <ul>
                        <li>Sobre nós</li>
                        <li>Coleções</li>
                        <li>Novidades</li>
                        <li>Contato</li>
                    </ul>
                </div>

                {/* AJUDA */}
                <div className="footer-column">
                    <h4>Ajuda</h4>
                    <ul>
                        <li>Trocas</li>
                        <li>Entrega</li>
                        <li>Suporte</li>
                        <li>FAQ</li>
                    </ul>
                </div>

                {/* NEWSLETTER */}
                <div className="footer-news">
                    <h4>Receba novidades</h4>
                    <p>Fique por dentro das promoções</p>

                    <div className="footer-input">
                        <input type="email" placeholder="Seu e-mail" />
                        <button>OK</button>
                    </div>
                </div>

            </div>

            <div className="footer-bottom">
                <p>© 2026 Dondoka Boutique — Todos os direitos reservados</p>
            </div>

        </footer>
    )
}