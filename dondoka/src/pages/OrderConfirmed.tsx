import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api, { type ApiResponse } from "../services/api";
import Seo from "../components/Seo";
import PageLoader from "../components/PageLoader";
import { useAuth } from "../context/AuthContext";
import { formatBRL } from "../types/product";
import { recallOrder, type OrderSummary } from "../utils/orders";
import { isWhatsAppConfigured, whatsappLink } from "../utils/whatsapp";
import "./OrderConfirmed.css";

interface ConfirmationState {
    order?: OrderSummary;
    whatsappMessage?: string;
}

export default function OrderConfirmed() {
    const { id = "" } = useParams();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();
    const state = (location.state as ConfirmationState | null) ?? null;
    const remembered = recallOrder(id);
    const whatsappMessage = state?.whatsappMessage ?? remembered?.whatsappMessage;

    const [order, setOrder] = useState<OrderSummary | null>(state?.order ?? null);
    const [fetchDone, setFetchDone] = useState(false);
    const phone = remembered?.phone;
    const canFetch = !!user || !!phone;
    const loading = !order && (authLoading || (canFetch && !fetchDone));

    useEffect(() => {
        if (order || authLoading || !canFetch) return;
        const controller = new AbortController();
        api.get<ApiResponse<OrderSummary>>(`/orders/${id}`, {
            params: phone ? { phone } : undefined,
            signal: controller.signal,
        })
            .then((res) => setOrder(res.data.data))
            .catch(() => undefined)
            .finally(() => {
                if (!controller.signal.aborted) setFetchDone(true);
            });
        return () => controller.abort();
    }, [id, order, authLoading, canFetch, phone]);

    if (loading) {
        return <PageLoader label="Carregando pedido..." />;
    }

    return (
        <div className="order-confirmed-page">
            <Seo title={`Pedido #${id}`} noIndex />
            <p className="order-confirmed-kicker">Pedido registrado</p>
            <h1>Pedido #{id} enviado</h1>
            <p className="order-confirmed-text">
                Recebemos seu pedido. Confirme os detalhes no WhatsApp para finalizarmos o atendimento.
            </p>

            {order && (
                <dl className="order-confirmed-card">
                    <div>
                        <dt>Cliente</dt>
                        <dd>{order.customer_name}</dd>
                    </div>
                    <div>
                        <dt>Entrega</dt>
                        <dd>{order.shipping_method === "delivery" ? "Entrega" : "Retirada na loja"}</dd>
                    </div>
                    {order.items.length > 0 && (
                        <div className="order-confirmed-items">
                            <dt>Itens</dt>
                            <dd>
                                <ul>
                                    {order.items.map((item, i) => (
                                        <li key={`${item.product_name}-${i}`}>
                                            {item.product_name}
                                            {item.size ? ` (${item.size})` : ""} × {item.quantity}
                                        </li>
                                    ))}
                                </ul>
                            </dd>
                        </div>
                    )}
                    {Number(order.discount) > 0 && (
                        <div>
                            <dt>Desconto</dt>
                            <dd>− {formatBRL(Number(order.discount))}</dd>
                        </div>
                    )}
                    {Number(order.shipping_fee) > 0 && (
                        <div>
                            <dt>Frete</dt>
                            <dd>{formatBRL(Number(order.shipping_fee))}</dd>
                        </div>
                    )}
                    <div className="order-confirmed-total">
                        <dt>Total</dt>
                        <dd>{formatBRL(Number(order.total))}</dd>
                    </div>
                </dl>
            )}

            {!isWhatsAppConfigured() && (
                <p className="order-confirmed-warn">
                    Configure o WhatsApp da loja em <code>VITE_WHATSAPP</code> no arquivo <code>.env</code> do
                    frontend (ex.: 5511999999999).
                </p>
            )}

            <div className="order-confirmed-actions">
                {whatsappMessage && isWhatsAppConfigured() && (
                    <a
                        className="order-confirmed-primary"
                        href={whatsappLink(whatsappMessage)}
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
        </div>
    );
}
