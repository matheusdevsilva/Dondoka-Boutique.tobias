import { Link, useLocation, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { formatBRL } from "../types/product";
import { isWhatsAppConfigured, whatsappLink } from "../utils/whatsapp";
import "./OrderConfirmed.css";

interface OrderState {
    id: number;
    total: number;
    customer_name: string;
    shipping_method?: string;
    items?: { name: string; size?: string; quantity: number; price: number }[];
    whatsappMessage?: string;
}

export default function OrderConfirmed() {
    const { id } = useParams();
    const location = useLocation();
    const order = (location.state as OrderState | null) || null;
    const orderId = order?.id || id;

    return (
        <>
            <Header />
            <main className="order-confirmed-page">
                <p className="order-confirmed-kicker">Pedido registrado</p>
                <h1>Pedido #{orderId} enviado</h1>
                <p className="order-confirmed-text">
                    Recebemos seu pedido. Confirme os detalhes no WhatsApp para
                    finalizarmos o atendimento.
                </p>

                {order && (
                    <div className="order-confirmed-card">
                        <p>
                            <span>Cliente</span>
                            <strong>{order.customer_name}</strong>
                        </p>
                        <p>
                            <span>Entrega</span>
                            <strong>
                                {order.shipping_method === "delivery"
                                    ? "Entrega"
                                    : "Retirada na loja"}
                            </strong>
                        </p>
                        {order.items && order.items.length > 0 && (
                            <ul>
                                {order.items.map((item, i) => (
                                    <li key={`${item.name}-${i}`}>
                                        {item.name}
                                        {item.size ? ` (${item.size})` : ""} ×
                                        {item.quantity}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="order-confirmed-total">
                            <span>Total</span>
                            <strong>{formatBRL(Number(order.total))}</strong>
                        </p>
                    </div>
                )}

                {!isWhatsAppConfigured() && (
                    <p className="order-confirmed-warn">
                        Configure o WhatsApp da loja em <code>VITE_WHATSAPP</code>{" "}
                        no arquivo <code>.env</code> do frontend (ex.:
                        5511999999999).
                    </p>
                )}

                <div className="order-confirmed-actions">
                    {order?.whatsappMessage && (
                        <a
                            className="order-confirmed-primary"
                            href={whatsappLink(order.whatsappMessage)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Abrir WhatsApp de novo
                        </a>
                    )}
                    <Link to="/colecao" className="order-confirmed-secondary">
                        Continuar comprando
                    </Link>
                    <Link to="/conta">Ver minha conta</Link>
                </div>
            </main>
            <Footer />
        </>
    );
}
