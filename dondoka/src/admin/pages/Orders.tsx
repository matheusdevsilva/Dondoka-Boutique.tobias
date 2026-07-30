import { useEffect, useState } from "react";
import api from "../../services/api";
import { formatBRL } from "../../types/product";
import "./Orders.css";

interface OrderItem {
    id: number;
    product_name: string;
    size?: string;
    quantity: number;
    unit_price: number;
}

interface Order {
    id: number;
    customer_id?: number | null;
    customer_name: string;
    customer_phone: string;
    customer_notes?: string;
    shipping_method?: string;
    shipping_fee?: number;
    shipping_address?: string;
    coupon_code?: string;
    discount?: number;
    subtotal?: number;
    total: number;
    status: "pending" | "confirmed" | "shipped" | "cancelled";
    created_at: string;
    items: OrderItem[];
}

const STATUS_LABEL: Record<Order["status"], string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    cancelled: "Cancelado",
};

function toCsv(orders: Order[]) {
    const header = [
        "id",
        "data",
        "cliente",
        "telefone",
        "status",
        "entrega",
        "cupom",
        "desconto",
        "frete",
        "total",
        "itens",
    ];

    const rows = orders.map((order) => {
        const items = order.items
            .map(
                (i) =>
                    `${i.product_name}${i.size ? ` (${i.size})` : ""} x${i.quantity}`
            )
            .join(" | ");
        return [
            order.id,
            new Date(order.created_at).toLocaleString("pt-BR"),
            `"${order.customer_name.replace(/"/g, '""')}"`,
            order.customer_phone,
            order.status,
            order.shipping_method === "delivery" ? "entrega" : "retirada",
            order.coupon_code || "",
            Number(order.discount || 0),
            Number(order.shipping_fee || 0),
            Number(order.total),
            `"${items.replace(/"/g, '""')}"`,
        ].join(",");
    });

    return [header.join(","), ...rows].join("\n");
}

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | Order["status"]>("all");

    async function loadOrders() {
        try {
            setLoading(true);
            const response = await api.get("/admin/orders");
            setOrders(response.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(id: number, status: Order["status"]) {
        try {
            await api.put(`/admin/orders/${id}/status`, { status });
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === id ? { ...order, status } : order
                )
            );
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar status");
        }
    }

    function exportCsv() {
        const csv = toCsv(filtered);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pedidos-dondoka-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    useEffect(() => {
        loadOrders();
    }, []);

    const filtered =
        filter === "all"
            ? orders
            : orders.filter((order) => order.status === filter);

    return (
        <div className="orders-page">
            <div className="orders-header">
                <div>
                    <h1>Pedidos</h1>
                    <p>{filtered.length} pedidos</p>
                </div>
                <div className="orders-header-actions">
                    <select
                        value={filter}
                        onChange={(e) =>
                            setFilter(e.target.value as "all" | Order["status"])
                        }
                    >
                        <option value="all">Todos</option>
                        <option value="pending">Pendentes</option>
                        <option value="confirmed">Confirmados</option>
                        <option value="shipped">Enviados</option>
                        <option value="cancelled">Cancelados</option>
                    </select>
                    <button type="button" onClick={exportCsv}>
                        Exportar CSV
                    </button>
                </div>
            </div>

            {loading && <p className="orders-empty">Carregando...</p>}

            {!loading && filtered.length === 0 && (
                <p className="orders-empty">Nenhum pedido encontrado.</p>
            )}

            <div className="orders-list">
                {filtered.map((order) => (
                    <article key={order.id} className="order-card">
                        <div className="order-card-top">
                            <div>
                                <h3>Pedido #{order.id}</h3>
                                <p>
                                    {order.customer_name} • {order.customer_phone}
                                    {order.customer_id
                                        ? " • Conta cadastrada"
                                        : " • Convidado"}
                                </p>
                                <small>
                                    {new Date(order.created_at).toLocaleString(
                                        "pt-BR"
                                    )}
                                    {" · "}
                                    {order.shipping_method === "delivery"
                                        ? "Entrega"
                                        : "Retirada"}
                                    {order.coupon_code
                                        ? ` · Cupom ${order.coupon_code}`
                                        : ""}
                                </small>
                            </div>
                            <span className={`order-status ${order.status}`}>
                                {STATUS_LABEL[order.status]}
                            </span>
                        </div>

                        <ul className="order-items">
                            {order.items.map((item) => (
                                <li key={item.id}>
                                    <span>
                                        {item.product_name}
                                        {item.size ? ` (${item.size})` : ""} ×{" "}
                                        {item.quantity}
                                    </span>
                                    <strong>
                                        {formatBRL(
                                            Number(item.unit_price) *
                                                item.quantity
                                        )}
                                    </strong>
                                </li>
                            ))}
                        </ul>

                        {order.shipping_address && (
                            <p className="order-notes">
                                Endereço: {order.shipping_address}
                            </p>
                        )}

                        {order.customer_notes && (
                            <p className="order-notes">
                                Obs: {order.customer_notes}
                            </p>
                        )}

                        <div className="order-card-bottom">
                            <div>
                                {Number(order.discount) > 0 && (
                                    <small className="order-discount">
                                        Desconto -{formatBRL(Number(order.discount))}
                                    </small>
                                )}
                                <strong>{formatBRL(Number(order.total))}</strong>
                            </div>
                            <select
                                value={order.status}
                                onChange={(e) =>
                                    updateStatus(
                                        order.id,
                                        e.target.value as Order["status"]
                                    )
                                }
                            >
                                <option value="pending">Pendente</option>
                                <option value="confirmed">Confirmado</option>
                                <option value="shipped">Enviado</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
