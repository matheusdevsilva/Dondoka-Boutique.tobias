import { useEffect, useState, type FormEvent } from "react";
import api, { apiErrorMessage, resolveImageUrl, type ApiResponse } from "../../services/api";
import Modal from "../../components/Modal";
import { formatBRL, productPrice } from "../../types/product";
import "./ListClient.css";

interface CustomerRow {
    id: number;
    name: string;
    email: string;
    phone: string;
    created_at: string;
    orders_count: number;
    orders_total: number;
    wishlist_count: number;
}

interface OrderItem {
    product_name: string;
    size?: string;
    quantity: number;
    unit_price: number;
}

interface CustomerDetail extends CustomerRow {
    orders: {
        id: number;
        total: number;
        status: string;
        created_at: string;
        items: OrderItem[];
    }[];
    wishlist: {
        id: number;
        name: string;
        price: number;
        discount_price?: number | null;
        image_url?: string;
    }[];
}

const STATUS_LABEL: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    cancelled: "Cancelado",
};

export default function ListClient() {
    const [customers, setCustomers] = useState<CustomerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<CustomerDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [message, setMessage] = useState("");

    const [listError, setListError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        api.get<ApiResponse<CustomerRow[]>>("/admin/customers", { signal: controller.signal })
            .then((res) => setCustomers(res.data.data || []))
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setListError(apiErrorMessage(error, "Erro ao carregar clientes."));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, []);

    async function openDetail(id: number) {
        try {
            setDetailLoading(true);
            setMessage("");
            setEditing(false);
            const res = await api.get<ApiResponse<CustomerDetail>>(`/admin/customers/${id}`);
            const data = res.data.data;
            setSelected(data);
            setEditName(data.name);
            setEditEmail(data.email);
            setEditPhone(data.phone);
        } catch (error) {
            setMessage(apiErrorMessage(error, "Não foi possível carregar o cliente."));
        } finally {
            setDetailLoading(false);
        }
    }

    async function saveEdit(e: FormEvent) {
        e.preventDefault();
        if (!selected) return;
        try {
            setSaving(true);
            setMessage("");
            const res = await api.put(`/admin/customers/${selected.id}`, {
                name: editName,
                email: editEmail,
                phone: editPhone,
            });
            const updated = res.data.data;
            setSelected((prev) => (prev ? { ...prev, ...updated } : prev));
            setCustomers((prev) =>
                prev.map((c) =>
                    c.id === selected.id ? { ...c, ...updated } : c
                )
            );
            setEditing(false);
            setMessage("Cliente atualizado.");
        } catch (error) {
            setMessage(apiErrorMessage(error, "Erro ao salvar."));
        } finally {
            setSaving(false);
        }
    }

    async function confirmDelete() {
        if (!deleteId) return;
        try {
            await api.delete(`/admin/customers/${deleteId}`);
            setCustomers((prev) => prev.filter((c) => c.id !== deleteId));
            if (selected?.id === deleteId) setSelected(null);
        } catch (error) {
            setListError(apiErrorMessage(error, "Erro ao remover cliente."));
        } finally {
            setDeleteId(null);
        }
    }

    const filtered = customers.filter((c) => {
        const q = search.toLowerCase();
        return (
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q)
        );
    });

    return (
        <div className="clients-page">
            <div className="clients-header">
                <div>
                    <h1>Clientes</h1>
                    <p>
                        {filtered.length} conta
                        {filtered.length !== 1 ? "s" : ""} cadastrada
                        {filtered.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <input
                    type="search"
                    aria-label="Buscar cliente"
                    placeholder="Buscar nome, e-mail ou WhatsApp..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {listError && (
                <p className="client-message error" role="alert">
                    {listError}
                </p>
            )}

            {loading && <p className="clients-empty" role="status">Carregando clientes...</p>}

            {!loading && filtered.length === 0 && (
                <p className="clients-empty">Nenhum cliente cadastrado ainda.</p>
            )}

            {!loading && filtered.length > 0 && (
                <div className="clients-layout">
                    <div className="clients-list">
                        {filtered.map((customer) => (
                            <button
                                key={customer.id}
                                type="button"
                                className={`client-card ${
                                    selected?.id === customer.id ? "active" : ""
                                }`}
                                onClick={() => openDetail(customer.id)}
                                aria-pressed={selected?.id === customer.id}
                                aria-controls="client-detail"
                            >
                                <div>
                                    <span className="client-card-name">{customer.name}</span>
                                    <p>{customer.email}</p>
                                    <p>{customer.phone}</p>
                                </div>
                                <div className="client-meta">
                                    <span>
                                        {customer.orders_count} pedido
                                        {customer.orders_count !== 1 ? "s" : ""}
                                    </span>
                                    <strong>
                                        {formatBRL(Number(customer.orders_total))}
                                    </strong>
                                </div>
                            </button>
                        ))}
                    </div>

                    <section className="client-detail" id="client-detail" aria-live="polite" aria-label="Detalhes do cliente">
                        {!selected && !detailLoading && (
                            <p className="clients-empty">
                                Selecione um cliente para ver detalhes.
                            </p>
                        )}

                        {detailLoading && (
                            <p className="clients-empty">Carregando...</p>
                        )}

                        {selected && !detailLoading && (
                            <>
                                <div className="client-detail-head">
                                    <div>
                                        <h2>{selected.name}</h2>
                                        <p>
                                            Desde{" "}
                                            {new Date(
                                                selected.created_at
                                            ).toLocaleDateString("pt-BR")}
                                        </p>
                                    </div>
                                    <div className="client-detail-actions">
                                        <button
                                            type="button"
                                            onClick={() => setEditing((v) => !v)}
                                        >
                                            {editing ? "Cancelar" : "Editar"}
                                        </button>
                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() =>
                                                setDeleteId(selected.id)
                                            }
                                        >
                                            Remover
                                        </button>
                                    </div>
                                </div>

                                {message && (
                                    <p className="client-message" role="status">
                                        {message}
                                    </p>
                                )}

                                {editing ? (
                                    <form className="client-edit-form" onSubmit={saveEdit}>
                                        <label>
                                            Nome
                                            <input
                                                autoComplete="off"
                                                maxLength={120}
                                                required
                                                value={editName}
                                                onChange={(e) =>
                                                    setEditName(e.target.value)
                                                }
                                            />
                                        </label>
                                        <label>
                                            E-mail
                                            <input
                                                type="email"
                                                value={editEmail}
                                                onChange={(e) =>
                                                    setEditEmail(e.target.value)
                                                }
                                            />
                                        </label>
                                        <label>
                                            WhatsApp
                                            <input
                                                value={editPhone}
                                                onChange={(e) =>
                                                    setEditPhone(e.target.value)
                                                }
                                            />
                                        </label>
                                        <button type="submit" disabled={saving}>
                                            {saving ? "Salvando..." : "Salvar"}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="client-info">
                                        <p>
                                            <span>E-mail</span>
                                            <strong>{selected.email}</strong>
                                        </p>
                                        <p>
                                            <span>WhatsApp</span>
                                            <strong>{selected.phone}</strong>
                                        </p>
                                        <p>
                                            <span>Favoritos</span>
                                            <strong>
                                                {selected.wishlist?.length || 0}
                                            </strong>
                                        </p>
                                    </div>
                                )}

                                <section className="client-section">
                                    <h3>Pedidos</h3>
                                    {(selected.orders || []).length === 0 && (
                                        <p className="clients-empty">
                                            Sem pedidos vinculados.
                                        </p>
                                    )}
                                    {(selected.orders || []).map((order) => (
                                        <article
                                            key={order.id}
                                            className="client-order"
                                        >
                                            <header>
                                                <strong>#{order.id}</strong>
                                                <span>
                                                    {STATUS_LABEL[order.status] ||
                                                        order.status}
                                                </span>
                                            </header>
                                            <ul>
                                                {order.items.map((item, i) => (
                                                    <li key={`${order.id}-${i}`}>
                                                        {item.product_name}
                                                        {item.size
                                                            ? ` (${item.size})`
                                                            : ""}{" "}
                                                        ×{item.quantity}
                                                    </li>
                                                ))}
                                            </ul>
                                            <footer>
                                                {formatBRL(Number(order.total))}
                                            </footer>
                                        </article>
                                    ))}
                                </section>

                                <section className="client-section">
                                    <h3>Favoritos</h3>
                                    {(selected.wishlist || []).length === 0 && (
                                        <p className="clients-empty">
                                            Nenhum favorito.
                                        </p>
                                    )}
                                    <div className="client-wishlist">
                                        {(selected.wishlist || []).map((item) => (
                                            <div
                                                key={item.id}
                                                className="client-wish-item"
                                            >
                                                <img
                                                    src={resolveImageUrl(
                                                        item.image_url
                                                    )}
                                                    alt=""
                                                    loading="lazy"
                                                />
                                                <div>
                                                    <strong>{item.name}</strong>
                                                    <span>
                                                        {formatBRL(productPrice(item))}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}
                    </section>
                </div>
            )}

            <Modal
                open={deleteId != null}
                onClose={() => setDeleteId(null)}
                title="Remover cliente?"
                overlayClassName="modal-overlay"
                panelClassName="modal-content delete"
                headClassName="modal-head"
            >
                <p>Os pedidos continuam no histórico, mas sem vínculo com a conta.</p>
                <div className="modal-actions">
                    <button type="button" onClick={() => setDeleteId(null)}>
                        Cancelar
                    </button>
                    <button type="button" className="danger" onClick={confirmDelete}>
                        Sim, remover
                    </button>
                </div>
            </Modal>
        </div>
    );
}
