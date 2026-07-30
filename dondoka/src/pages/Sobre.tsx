import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import logo from "../assets/logo_sem_fundo.png";
import "../styles/InfoPages.css";

const FAQ = [
    {
        q: "Como faço um pedido?",
        a: "Escolha as peças, o tamanho, adicione à sacola e finalize. Registramos o pedido e abrimos o WhatsApp para confirmar.",
    },
    {
        q: "Posso trocar ou devolver?",
        a: "Sim. Trocas em até 7 dias após o recebimento, com a peça sem uso e com etiquetas. Fale conosco pelo WhatsApp para agendar.",
    },
    {
        q: "Como escolho o tamanho certo?",
        a: "Use o guia de tamanhos na página do produto. Em dúvida, mande suas medidas no WhatsApp que te ajudamos.",
    },
    {
        q: "Qual o prazo de entrega?",
        a: "Retirada na loja fica pronta conforme confirmação. Entregas dependem da região — o prazo é informado no atendimento.",
    },
];

export default function Sobre() {
    return (
        <>
            <Header />

            <main className="info-page">
                <section className="info-hero">
                    <span>A marca</span>
                    <h1>Sobre a Dondoka</h1>
                    <p>
                        Uma boutique feita para mulheres que querem se vestir
                        com elegância, leveza e personalidade.
                    </p>
                </section>

                <section className="info-content">
                    <div className="info-brand-block">
                        <img src={logo} alt="Dondoka Boutique" />
                        <div>
                            <h2>Estilo com presença</h2>
                            <p>
                                A Dondoka Boutique nasceu para oferecer moda
                                feminina moderna, com peças que acompanham o
                                dia a dia sem abrir mão do charme. Cada
                                coleção é pensada para realçar a mulher em
                                diferentes momentos — do casual ao especial.
                            </p>
                            <p>
                                Nosso foco é qualidade, caimento e uma
                                experiência de compra simples, próxima e
                                acolhedora.
                            </p>
                        </div>
                    </div>

                    <div className="info-grid">
                        <article>
                            <h3>Feminina</h3>
                            <p>Peças com identidade visual marcante e delicada.</p>
                        </article>
                        <article>
                            <h3>Moderna</h3>
                            <p>Tendências traduzidas para o seu estilo real.</p>
                        </article>
                        <article>
                            <h3>Próxima</h3>
                            <p>Atendimento humanizado, inclusive via WhatsApp.</p>
                        </article>
                    </div>

                    <section className="info-faq">
                        <h2>FAQ · Trocas e devoluções</h2>
                        <div className="faq-list">
                            {FAQ.map((item) => (
                                <details key={item.q}>
                                    <summary>{item.q}</summary>
                                    <p>{item.a}</p>
                                </details>
                            ))}
                        </div>
                    </section>

                    <div className="info-cta">
                        <h2>Conheça a coleção</h2>
                        <Link to="/colecao" className="info-btn">
                            Ver loja
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
