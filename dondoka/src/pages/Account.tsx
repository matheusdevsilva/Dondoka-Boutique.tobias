import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { formatBRL } from "../types/product";
import "../styles/Account.css";

interface OrderItem {
    product_name: string;
    size?: string;
    quantity: number;
    unit_price: number;
}

interface Order {
    id: number;
    total: number;
    status: string;
    created_at: string;
    items: OrderItem[];
}

const statusLabel: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    cancelled: "Cancelado",
};

export default function Account() {
    const { user, loading, login, register, logout } = useAuth();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    useEffect(() => {
        async function loadOrders() {
            if (!user) {
                setOrders([]);
                return;
            }
            try {
                setOrdersLoading(true);
                const res = await api.get("/auth/orders");
                setOrders(res.data.data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setOrdersLoading(false);
            }
        }
        loadOrders();
    }, [user]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setMessage("");
        try {
            setSubmitting(true);
            if (mode === "login") {
                await login(email, password);
            } else {
                await register({ name, email, phone, password });
            }
            setPassword("");
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setMessage(
                err.response?.data?.message || "Não foi possível entrar."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <Header />
            <main className="account-page">
                <div className="account-intro">
                    <h1>Minha conta</h1>
                    <p>
                        Cadastro opcional: salve pedidos e favoritos entre
                        dispositivos. O checkout continua liberado sem login.
                    </p>
                </div>

                {loading && <p className="account-state">Carregando...</p>}

                {!loading && !user && (
                    <section className="account-auth">
                        <div className="account-tabs">
                            <button
                                type="button"
                                className={mode === "login" ? "active" : ""}
                                onClick={() => setMode("login")}
                            >
                                Entrar
                            </button>
                            <button
                                type="button"
                                className={mode === "register" ? "active" : ""}
                                onClick={() => setMode("register")}
                            >
                                Cadastrar
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {mode === "register" && (
                                <>
                                    <label>
                                        Nome
                                        <input
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            required
                                        />
                                    </label>
                                    <label>
                                        WhatsApp
                                        <input
                                            value={phone}
                                            onChange={(e) =>
                                                setPhone(e.target.value)
                                            }
                                            placeholder="11999999999"
                                            required
                                        />
                                    </label>
                                </>
                            )}
                            <label>
                                E-mail
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Senha
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    minLength={6}
                                    required
                                />
                            </label>

                            {message && (
                                <p className="account-error">{message}</p>
                            )}

                            <button type="submit" disabled={submitting}>
                                {submitting
                                    ? "Aguarde..."
                                    : mode === "login"
                                      ? "Entrar"
                                      : "Criar conta"}
                            </button>
                        </form>
                    </section>
                )}

                {!loading && user && (
                    <section className="account-panel">
                        <div className="account-profile">
                            <div>
                                <h2>{user.name}</h2>
                                <p>{user.email}</p>
                                <p>{user.phone}</p>
                            </div>
                            <div className="account-actions">
                                <Link to="/favoritos">Ver favoritos</Link>
                                <button type="button" onClick={logout}>
                                    Sair
                                </button>
                            </div>
                        </div>

                        <div className="account-orders">
                            <h3>Meus pedidos</h3>
                            {ordersLoading && <p>Carregando pedidos...</p>}
                            {!ordersLoading && orders.length === 0 && (
                                <p>Nenhum pedido ainda.</p>
                            )}
                            {orders.map((order) => (
                                <article key={order.id} className="account-order">
                                    <header>
                                        <strong>Pedido #{order.id}</strong>
                                        <span>
                                            {statusLabel[order.status] ||
                                                order.status}
                                        </span>
                                    </header>
                                    <ul>
                                        {order.items.map((item, index) => (
                                            <li key={`${order.id}-${index}`}>
                                                {item.product_name}
                                                {item.size
                                                    ? ` (${item.size})`
                                                    : ""}{" "}
                                                ×{item.quantity} —{" "}
                                                {formatBRL(
                                                    Number(item.unit_price) *
                                                        item.quantity
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                    <footer>
                                        Total {formatBRL(Number(order.total))}
                                    </footer>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </main>
            <Footer />
        </>
    );
}
