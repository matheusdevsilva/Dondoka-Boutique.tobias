import { useEffect, useId, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import api, { apiErrorMessage, type ApiResponse } from "../services/api"
import { useDialog } from "../hooks/useDialog"
import { formatBRL, type ProductType } from "../types/product"
import { isWhatsAppConfigured, whatsappLink } from "../utils/whatsapp"
import { rememberOrder, type OrderSummary } from "../utils/orders"

const checkoutSchema = z
    .object({
        customer_name: z.string().trim().min(2, "Informe seu nome"),
        customer_phone: z
            .string()
            .trim()
            .refine((v) => v.replace(/\D/g, "").length >= 10, "Informe DDD + número"),
        shipping_method: z.enum(["pickup", "delivery"]),
        shipping_address: z.string().trim().max(500),
        customer_notes: z.string().trim().max(1000),
    })
    .refine((v) => v.shipping_method === "pickup" || v.shipping_address.length > 0, {
        path: ["shipping_address"],
        message: "Informe o endereço de entrega",
    })

type CheckoutForm = z.infer<typeof checkoutSchema>

interface Props {
    open: boolean
    onClose: () => void
    deliveryFee: number
}

export default function CheckoutDialog({ open, onClose, deliveryFee }: Props) {
    const { items, total, clearCart, setCartOpen, refreshFromCatalog } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()
    const panelRef = useDialog<HTMLFormElement>(open, onClose)
    const titleId = useId()

    const [couponInput, setCouponInput] = useState("")
    const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null)
    const [couponMsg, setCouponMsg] = useState("")
    const [cartNotice, setCartNotice] = useState("")

    const {
        register,
        handleSubmit,
        control,
        setValue,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CheckoutForm>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            customer_name: "",
            customer_phone: "",
            shipping_method: "pickup",
            shipping_address: "",
            customer_notes: "",
        },
    })

    const shippingMethod = useWatch({ control, name: "shipping_method" })
    const shippingFee = shippingMethod === "delivery" ? deliveryFee : 0
    const discount = coupon?.discount ?? 0
    const checkoutTotal = Math.max(0, total - discount + shippingFee)
    const missingSize = items.some((item) => !item.size)

    useEffect(() => {
        if (!open || !user) return
        setValue("customer_name", user.name, { shouldDirty: false })
        setValue("customer_phone", user.phone, { shouldDirty: false })
    }, [open, user, setValue])

    useEffect(() => {
        if (!open || items.length === 0) return
        const controller = new AbortController()
        const ids = [...new Set(items.map((item) => item.id))].join(",")
        api.get<ApiResponse<ProductType[]>>("/products", {
            params: { ids },
            signal: controller.signal,
        })
            .then((res) => {
                const removed = refreshFromCatalog(res.data.data)
                setCartNotice(
                    removed > 0
                        ? "Algumas peças saíram de linha e foram removidas da sacola. Os preços foram atualizados."
                        : ""
                )
            })
            .catch(() => undefined)
        return () => controller.abort()
        // Só ao abrir: refreshFromCatalog muda a cada alteração da sacola.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const [couponItems, setCouponItems] = useState(items)
    if (couponItems !== items) {
        setCouponItems(items)
        setCoupon(null)
        if (couponMsg) setCouponMsg("Sacola alterada: aplique o cupom de novo.")
    }

    const cartItemsPayload = items.map((item) => ({
        id: item.id,
        size: item.size,
        quantity: item.quantity,
    }))

    async function applyCoupon() {
        setCouponMsg("")
        const code = couponInput.trim()
        if (!code) {
            setCoupon(null)
            return
        }
        try {
            const res = await api.post<ApiResponse<{ code: string; discount: number }>>(
                "/coupons/validate",
                { code, items: cartItemsPayload }
            )
            setCoupon({ code: res.data.data.code, discount: Number(res.data.data.discount) || 0 })
            setCouponMsg(`Cupom ${res.data.data.code} aplicado`)
        } catch (error) {
            setCoupon(null)
            setCouponMsg(apiErrorMessage(error, "Cupom inválido"))
        }
    }

    async function onSubmit(values: CheckoutForm) {
        if (items.length === 0) return
        if (missingSize) {
            setError("root", { message: "Escolha o tamanho de todos os itens na sacola." })
            return
        }

        try {
            const response = await api.post<ApiResponse<OrderSummary>>("/orders", {
                ...values,
                shipping_address: values.shipping_method === "delivery" ? values.shipping_address : "",
                coupon_code: coupon?.code,
                items: cartItemsPayload,
            })

            const order = response.data.data
            const lines = order.items.map((item) => {
                const sizeLabel = item.size ? ` (${item.size})` : ""
                return `• ${item.product_name}${sizeLabel} x${item.quantity} — ${formatBRL(Number(item.unit_price) * item.quantity)}`
            })

            const message = [
                `Olá! Gostaria de finalizar meu pedido #${order.id} na Dondoka Boutique:`,
                "",
                `Nome: ${values.customer_name}`,
                `WhatsApp: ${values.customer_phone}`,
                values.shipping_method === "delivery"
                    ? `Entrega: ${values.shipping_address}`
                    : "Retirada na loja",
                order.coupon_code ? `Cupom: ${order.coupon_code}` : "",
                values.customer_notes ? `Obs: ${values.customer_notes}` : "",
                "",
                ...lines,
                "",
                Number(order.discount) > 0 ? `Desconto: -${formatBRL(Number(order.discount))}` : "",
                Number(order.shipping_fee) > 0
                    ? `Frete: ${formatBRL(Number(order.shipping_fee))}`
                    : "Frete: grátis (retirada)",
                `Total: ${formatBRL(Number(order.total))}`,
            ]
                .filter((line) => line !== "")
                .join("\n")

            rememberOrder({ id: order.id, phone: values.customer_phone, whatsappMessage: message })

            if (isWhatsAppConfigured()) {
                window.open(whatsappLink(message), "_blank", "noopener")
            }

            clearCart()
            reset()
            setCouponInput("")
            setCoupon(null)
            setCouponMsg("")
            onClose()
            setCartOpen(false)

            navigate(`/pedido-confirmado/${order.id}`, { state: { order, whatsappMessage: message } })
        } catch (error) {
            setError("root", {
                message: apiErrorMessage(error, "Não foi possível registrar o pedido. Tente novamente."),
            })
        }
    }

    if (!open) return null

    return (
        <div className="checkout-overlay" onClick={onClose}>
            <form
                ref={panelRef}
                className="checkout-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onSubmit={handleSubmit(onSubmit)}
                onClick={(e) => e.stopPropagation()}
                noValidate
            >
                <div className="checkout-modal-head">
                    <h2 id={titleId}>Finalizar pedido</h2>
                    <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <p className="checkout-hint">
                    Registramos o pedido e abrimos o WhatsApp para confirmar.
                    {user
                        ? " Pedido vinculado à sua conta."
                        : " Quer salvar o histórico? Crie uma conta em Minha conta."}
                </p>

                {cartNotice && (
                    <p className="checkout-error" role="status">
                        {cartNotice}
                    </p>
                )}

                {!isWhatsAppConfigured() && (
                    <p className="checkout-error">
                        Configure VITE_WHATSAPP no .env da loja (ex.: 5511999999999).
                    </p>
                )}

                <label>
                    Nome
                    <input
                        autoComplete="name"
                        data-autofocus
                        aria-invalid={errors.customer_name ? true : undefined}
                        aria-describedby={errors.customer_name ? `${titleId}-customer_name` : undefined}
                        {...register("customer_name")}
                    />
                    {errors.customer_name && (
                        <span id={`${titleId}-customer_name`} className="field-error">{errors.customer_name.message}</span>
                    )}
                </label>

                <label>
                    WhatsApp
                    <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="DDD + número"
                        aria-invalid={errors.customer_phone ? true : undefined}
                        aria-describedby={errors.customer_phone ? `${titleId}-customer_phone` : undefined}
                        {...register("customer_phone")}
                    />
                    {errors.customer_phone && (
                        <span id={`${titleId}-customer_phone`} className="field-error">{errors.customer_phone.message}</span>
                    )}
                </label>

                <fieldset className="checkout-shipping">
                    <legend className="checkout-label">Entrega</legend>
                    <div className="checkout-shipping-options">
                        <label className="choice">
                            <input type="radio" value="pickup" {...register("shipping_method")} />
                            Retirada · grátis
                        </label>
                        <label className="choice">
                            <input type="radio" value="delivery" {...register("shipping_method")} />
                            Entrega · {formatBRL(deliveryFee)}
                        </label>
                    </div>
                </fieldset>

                {shippingMethod === "delivery" && (
                    <label>
                        Endereço
                        <textarea
                            rows={2}
                            autoComplete="street-address"
                            placeholder="Rua, número, bairro, cidade"
                            aria-invalid={errors.shipping_address ? true : undefined}
                        aria-describedby={errors.shipping_address ? `${titleId}-shipping_address` : undefined}
                            {...register("shipping_address")}
                        />
                        {errors.shipping_address && (
                            <span id={`${titleId}-shipping_address`} className="field-error">{errors.shipping_address.message}</span>
                        )}
                    </label>
                )}

                <div className="checkout-coupon">
                    <label htmlFor="checkout-coupon">Cupom</label>
                    <div className="checkout-coupon-row">
                        <input
                            id="checkout-coupon"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    applyCoupon()
                                }
                            }}
                            placeholder="DONDOKA10"
                        />
                        <button type="button" onClick={applyCoupon}>
                            Aplicar
                        </button>
                    </div>
                    <p
                        className={coupon ? "checkout-coupon-ok" : "checkout-error"}
                        role="status"
                        aria-live="polite"
                    >
                        {couponMsg}
                    </p>
                </div>

                <label>
                    Observação
                    <textarea rows={2} placeholder="Opcional" maxLength={500} {...register("customer_notes")} />
                </label>

                <dl className="checkout-summary">
                    <div>
                        <dt>Subtotal</dt>
                        <dd>{formatBRL(total)}</dd>
                    </div>
                    {discount > 0 && (
                        <div>
                            <dt>Desconto</dt>
                            <dd>-{formatBRL(discount)}</dd>
                        </div>
                    )}
                    <div>
                        <dt>Frete</dt>
                        <dd>{shippingFee > 0 ? formatBRL(shippingFee) : "Grátis"}</dd>
                    </div>
                    <div className="checkout-summary-total">
                        <dt>Total</dt>
                        <dd>{formatBRL(checkoutTotal)}</dd>
                    </div>
                </dl>

                {(errors.root || missingSize) && (
                    <p className="checkout-error" role="alert">
                        {errors.root?.message || "Escolha o tamanho de todos os itens na sacola."}
                    </p>
                )}

                <button type="submit" disabled={isSubmitting || items.length === 0}>
                    {isSubmitting ? "Enviando..." : `Confirmar • ${formatBRL(checkoutTotal)}`}
                </button>
            </form>
        </div>
    )
}
