import { useEffect, useState, type FormEvent } from "react";
import api, { apiErrorMessage, type ApiResponse } from "../../services/api";
import Modal from "../../components/Modal";
import { formatBRL } from "../../types/product";
import "./Coupons.css";

interface Coupon {
    id: number;
    code: string;
    type: "percent" | "fixed";
    value: number;
    min_order: number;
    max_uses: number | null;
    used_count: number;
    is_active: boolean;
    expires_at?: string | null;
}

export default function Coupons() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState("");
    const [type, setType] = useState<"percent" | "fixed">("percent");
    const [value, setValue] = useState("10");
    const [minOrder, setMinOrder] = useState("0");
    const [maxUses, setMaxUses] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [message, setMessage] = useState("");
    const [listError, setListError] = useState("");
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [version, setVersion] = useState(0);
    const load = () => setVersion((v) => v + 1);

    useEffect(() => {
        const controller = new AbortController();
        api.get<ApiResponse<Coupon[]>>("/admin/coupons", { signal: controller.signal })
            .then((res) => setCoupons(res.data.data || []))
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setListError(apiErrorMessage(error, "Erro ao carregar cupons."));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [version]);

    function closeForm() {
        setOpen(false);
        setMessage("");
    }

    async function createCoupon(e: FormEvent) {
        e.preventDefault();
        setMessage("");
        try {
            await api.post("/admin/coupons", {
                code,
                type,
                value: Number(value),
                min_order: Number(minOrder) || 0,
                max_uses: maxUses ? Number(maxUses) : null,
                expires_at: expiresAt || null,
                is_active: true,
            });
            setOpen(false);
            setCode("");
            setValue("10");
            setMinOrder("0");
            setMaxUses("");
            setExpiresAt("");
            load();
        } catch (error) {
            setMessage(apiErrorMessage(error, "Erro ao criar cupom"));
        }
    }

    async function toggleActive(coupon: Coupon) {
        try {
            await api.put(`/admin/coupons/${coupon.id}`, {
                is_active: !coupon.is_active,
            });
            setCoupons((prev) =>
                prev.map((c) =>
                    c.id === coupon.id
                        ? { ...c, is_active: !c.is_active }
                        : c
                )
            );
        } catch (error) {
            setListError(apiErrorMessage(error, "Erro ao atualizar cupom."));
        }
    }

    async function confirmRemove() {
        if (deleteId == null) return;
        try {
            await api.delete(`/admin/coupons/${deleteId}`);
            setCoupons((prev) => prev.filter((c) => c.id !== deleteId));
        } catch (error) {
            setListError(apiErrorMessage(error, "Erro ao remover cupom."));
        } finally {
            setDeleteId(null);
        }
    }

    return (
        <div className="coupons-page">
            <div className="coupons-header">
                <div>
                    <h1>Cupons</h1>
                    <p>{coupons.length} cupons</p>
                </div>
                <button type="button" onClick={() => setOpen(true)}>
                    Novo cupom
                </button>
            </div>

            {listError && (
                <p className="coupons-error" role="alert">
                    {listError}
                </p>
            )}

            {loading && <p className="coupons-empty" role="status">Carregando...</p>}

            {!loading && coupons.length === 0 && (
                <p className="coupons-empty">Nenhum cupom ainda.</p>
            )}

            <div className="coupons-list">
                {coupons.map((coupon) => (
                    <article key={coupon.id} className="coupon-card">
                        <div>
                            <h2>{coupon.code}</h2>
                            <p>
                                {coupon.type === "percent"
                                    ? `${Number(coupon.value)}% off`
                                    : `${formatBRL(Number(coupon.value))} off`}
                                {Number(coupon.min_order) > 0
                                    ? ` · mín. ${formatBRL(Number(coupon.min_order))}`
                                    : ""}
                            </p>
                            <small>
                                Usos: {coupon.used_count}
                                {coupon.max_uses != null
                                    ? ` / ${coupon.max_uses}`
                                    : " · ilimitado"}
                                {coupon.expires_at
                                    ? ` · expira ${new Date(
                                          coupon.expires_at
                                      ).toLocaleDateString("pt-BR")}`
                                    : ""}
                            </small>
                        </div>
                        <div className="coupon-actions">
                            <span
                                className={
                                    coupon.is_active ? "on" : "off"
                                }
                            >
                                {coupon.is_active ? "Ativo" : "Inativo"}
                            </span>
                            <button
                                type="button"
                                onClick={() => toggleActive(coupon)}
                                aria-label={`${coupon.is_active ? "Desativar" : "Ativar"} cupom ${coupon.code}`}
                            >
                                {coupon.is_active ? "Desativar" : "Ativar"}
                            </button>
                            <button
                                type="button"
                                className="danger"
                                onClick={() => setDeleteId(coupon.id)}
                                aria-label={`Remover cupom ${coupon.code}`}
                            >
                                Remover
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <Modal
                open={open}
                onClose={closeForm}
                title="Novo cupom"
                overlayClassName="modal-overlay"
                panelClassName="modal-content"
                headClassName="modal-head"
            >
                    <form onSubmit={createCoupon}>
                        <label>
                            Código
                            <input
                                value={code}
                                onChange={(e) =>
                                    setCode(e.target.value.toUpperCase())
                                }
                                maxLength={40}
                                required
                            />
                        </label>
                        <label>
                            Tipo
                            <select
                                value={type}
                                onChange={(e) =>
                                    setType(
                                        e.target.value as "percent" | "fixed"
                                    )
                                }
                            >
                                <option value="percent">Percentual</option>
                                <option value="fixed">Valor fixo</option>
                            </select>
                        </label>
                        <label>
                            Valor
                            <input
                                type="number"
                                min={0.01}
                                max={type === "percent" ? 100 : undefined}
                                step="0.01"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Pedido mínimo
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={minOrder}
                                onChange={(e) => setMinOrder(e.target.value)}
                            />
                        </label>
                        <label>
                            Máx. usos (vazio = ilimitado)
                            <input
                                type="number"
                                min={1}
                                value={maxUses}
                                onChange={(e) => setMaxUses(e.target.value)}
                            />
                        </label>
                        <label>
                            Expira em
                            <input
                                type="date"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                        </label>
                        {message && (
                            <p className="coupons-error" role="alert">
                                {message}
                            </p>
                        )}
                        <div className="modal-actions">
                            <button type="button" onClick={closeForm}>
                                Cancelar
                            </button>
                            <button type="submit">Salvar</button>
                        </div>
                    </form>
            </Modal>

            <Modal
                open={deleteId != null}
                onClose={() => setDeleteId(null)}
                title="Remover este cupom?"
                overlayClassName="modal-overlay"
                panelClassName="modal-content"
                headClassName="modal-head"
            >
                <p>Essa ação não pode ser desfeita.</p>
                <div className="modal-actions">
                    <button type="button" onClick={() => setDeleteId(null)}>
                        Cancelar
                    </button>
                    <button type="button" className="danger" onClick={confirmRemove}>
                        Remover
                    </button>
                </div>
            </Modal>
        </div>
    );
}
