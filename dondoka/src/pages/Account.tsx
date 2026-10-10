import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth, type CustomerUser } from "../context/AuthContext";
import api, { apiErrorMessage, type ApiResponse } from "../services/api";
import Seo from "../components/Seo";
import { formatBRL } from "../types/product";
import type { OrderSummary } from "../utils/orders";
import "../styles/Account.css";

const statusLabel: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    cancelled: "Cancelado",
};

const accountSchema = z
    .object({
        mode: z.enum(["login", "register"]),
        name: z.string().trim(),
        phone: z.string().trim(),
        email: z.email("Informe um e-mail válido.").trim(),
        password: z.string(),
    })
    .superRefine((values, ctx) => {
        if (values.mode === "login") {
            if (!values.password) {
                ctx.addIssue({ code: "custom", path: ["password"], message: "Informe a senha." });
            }
            return;
        }
        if (values.name.length < 2) {
            ctx.addIssue({ code: "custom", path: ["name"], message: "Informe seu nome." });
        }
        if (values.phone.replace(/\D/g, "").length < 10) {
            ctx.addIssue({ code: "custom", path: ["phone"], message: "Informe o WhatsApp com DDD." });
        }
        if (values.password.length < 8) {
            ctx.addIssue({
                code: "custom",
                path: ["password"],
                message: "A senha precisa de pelo menos 8 caracteres.",
            });
        }
    });

type AccountForm = z.infer<typeof accountSchema>;

export default function Account() {
    const { user, loading, login, register: registerCustomer, logout } = useAuth();
    const [ordersState, setOrdersState] = useState<{ userId: CustomerUser["id"]; orders: OrderSummary[] } | null>(
        null
    );
    const orders = user && ordersState?.userId === user.id ? ordersState.orders : [];
    const ordersLoading = !!user && ordersState?.userId !== user.id;

    const {
        register,
        handleSubmit,
        control,
        setValue,
        setError,
        resetField,
        clearErrors,
        formState: { errors, isSubmitting },
    } = useForm<AccountForm>({
        resolver: zodResolver(accountSchema),
        defaultValues: { mode: "login", name: "", phone: "", email: "", password: "" },
    });
    const mode = useWatch({ control, name: "mode" });

    const userId = user?.id;
    useEffect(() => {
        if (userId == null) return;
        const controller = new AbortController();
        api.get<ApiResponse<OrderSummary[]>>("/auth/orders", { signal: controller.signal })
            .then((res) => setOrdersState({ userId, orders: res.data.data || [] }))
            .catch((error) => {
                if (controller.signal.aborted) return;
                console.error(error);
                setOrdersState({ userId, orders: [] });
            });
        return () => controller.abort();
    }, [userId]);

    function switchMode(next: AccountForm["mode"]) {
        setValue("mode", next);
        clearErrors();
    }

    async function onSubmit(values: AccountForm) {
        try {
            if (values.mode === "login") {
                await login(values.email, values.password);
            } else {
                await registerCustomer({
                    name: values.name,
                    email: values.email,
                    phone: values.phone,
                    password: values.password,
                });
            }
            resetField("password");
        } catch (error) {
            setError("root", {
                message: apiErrorMessage(
                    error,
                    values.mode === "login" ? "Não foi possível entrar." : "Não foi possível criar a conta."
                ),
            });
        }
    }

    return (
        <div className="account-page">
            <Seo title="Minha conta" noIndex />
            <div className="account-intro">
                <h1>Minha conta</h1>
                <p>
                    Cadastro opcional: salve pedidos e favoritos entre dispositivos. O checkout continua liberado
                    sem login.
                </p>
            </div>

            {loading && (
                <p className="account-state" role="status">
                    Carregando...
                </p>
            )}

            {!loading && !user && (
                <section className="account-auth" aria-labelledby="account-form-title">
                    <h2 id="account-form-title" className="sr-only">
                        {mode === "login" ? "Entrar" : "Criar conta"}
                    </h2>
                    <div className="account-tabs" role="group" aria-label="Escolha uma opção">
                        <button
                            type="button"
                            className={mode === "login" ? "active" : ""}
                            aria-pressed={mode === "login"}
                            onClick={() => switchMode("login")}
                        >
                            Entrar
                        </button>
                        <button
                            type="button"
                            className={mode === "register" ? "active" : ""}
                            aria-pressed={mode === "register"}
                            onClick={() => switchMode("register")}
                        >
                            Cadastrar
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {mode === "register" && (
                            <>
                                <label>
                                    Nome
                                    <input
                                        {...register("name")}
                                        autoComplete="name"
                                        aria-invalid={!!errors.name}
                                        aria-describedby={errors.name ? "account-name-error" : undefined}
                                    />
                                </label>
                                {errors.name && (
                                    <p id="account-name-error" className="field-error">
                                        {errors.name.message}
                                    </p>
                                )}
                                <label>
                                    WhatsApp
                                    <input
                                        {...register("phone")}
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        placeholder="11999999999"
                                        aria-invalid={!!errors.phone}
                                        aria-describedby={errors.phone ? "account-phone-error" : undefined}
                                    />
                                </label>
                                {errors.phone && (
                                    <p id="account-phone-error" className="field-error">
                                        {errors.phone.message}
                                    </p>
                                )}
                            </>
                        )}
                        <label>
                            E-mail
                            <input
                                {...register("email")}
                                type="email"
                                autoComplete="email"
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? "account-email-error" : undefined}
                            />
                        </label>
                        {errors.email && (
                            <p id="account-email-error" className="field-error">
                                {errors.email.message}
                            </p>
                        )}
                        <label>
                            Senha
                            <input
                                {...register("password")}
                                type="password"
                                autoComplete={mode === "login" ? "current-password" : "new-password"}
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? "account-password-error" : undefined}
                            />
                        </label>
                        {errors.password && (
                            <p id="account-password-error" className="field-error">
                                {errors.password.message}
                            </p>
                        )}

                        {errors.root && (
                            <p className="account-error" role="alert">
                                {errors.root.message}
                            </p>
                        )}

                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
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
                            <button type="button" onClick={() => void logout()}>
                                Sair
                            </button>
                        </div>
                    </div>

                    <div className="account-orders">
                        <h3>Meus pedidos</h3>
                        {ordersLoading && <p role="status">Carregando pedidos...</p>}
                        {!ordersLoading && orders.length === 0 && <p>Nenhum pedido ainda.</p>}
                        {orders.map((order) => (
                            <article key={order.id} className="account-order">
                                <header>
                                    <h4>Pedido #{order.id}</h4>
                                    <span>{statusLabel[order.status] || order.status}</span>
                                </header>
                                <ul>
                                    {order.items.map((item, index) => (
                                        <li key={`${order.id}-${index}`}>
                                            {item.product_name}
                                            {item.size ? ` (${item.size})` : ""} ×{item.quantity} —{" "}
                                            {formatBRL(Number(item.unit_price) * item.quantity)}
                                        </li>
                                    ))}
                                </ul>
                                <footer>Total {formatBRL(Number(order.total))}</footer>
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
