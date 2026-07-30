import { Search, ShoppingBag, Menu, X, Heart, User } from "lucide-react"
import "../styles/Header.css"
import logo from "../assets/logo_sem_fundo.png"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useWishlist } from "../context/WishlistContext"
import { useAuth } from "../context/AuthContext"
import api, { resolveImageUrl } from "../services/api"
import {
    formatBRL,
    productCover,
    productPrice,
    type ProductType,
} from "../types/product"
import {
    isWhatsAppConfigured,
    whatsappLink,
} from "../utils/whatsapp"

export default function Header() {
    const {
        items,
        cartOpen,
        setCartOpen,
        increaseQty,
        decreaseQty,
        removeItem,
        clearCart,
        total,
        count,
    } = useCart()
    const { count: wishlistCount } = useWishlist()
    const { user } = useAuth()

    const navigate = useNavigate()
    const searchWrapRef = useRef<HTMLDivElement>(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [allProducts, setAllProducts] = useState<ProductType[]>([])
    const [checkoutOpen, setCheckoutOpen] = useState(false)
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [customerNotes, setCustomerNotes] = useState("")
    const [shippingMethod, setShippingMethod] = useState<"pickup" | "delivery">(
        "pickup"
    )
    const [shippingAddress, setShippingAddress] = useState("")
    const [deliveryFee, setDeliveryFee] = useState(15)
    const [couponInput, setCouponInput] = useState("")
    const [couponCode, setCouponCode] = useState("")
    const [discount, setDiscount] = useState(0)
    const [couponMsg, setCouponMsg] = useState("")
    const [checkoutLoading, setCheckoutLoading] = useState(false)
    const [checkoutError, setCheckoutError] = useState("")

    useEffect(() => {
        if (!user) return
        setCustomerName((prev) => prev || user.name)
        setCustomerPhone((prev) => prev || user.phone)
    }, [user])

    useEffect(() => {
        api.get("/shipping")
            .then((res) => {
                setDeliveryFee(Number(res.data.data?.delivery_fee ?? 15))
            })
            .catch(() => setDeliveryFee(15))
    }, [])

    useEffect(() => {
        api.get("/products/")
            .then((res) => setAllProducts(res.data.data || []))
            .catch(() => setAllProducts([]))
    }, [])

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (
                searchWrapRef.current &&
                !searchWrapRef.current.contains(e.target as Node)
            ) {
                if (!search) setSearchOpen(false)
            }
        }
        document.addEventListener("mousedown", onClickOutside)
        return () => document.removeEventListener("mousedown", onClickOutside)
    }, [search])

    const suggestions = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (q.length < 2) return []
        return allProducts
            .filter((p) => p.is_active !== false)
            .filter((p) => p.name.toLowerCase().includes(q))
            .slice(0, 6)
    }, [search, allProducts])

    const shippingFee = shippingMethod === "delivery" ? deliveryFee : 0
    const checkoutTotal = Math.max(0, total - discount + shippingFee)

    async function applyCoupon() {
        setCouponMsg("")
        if (!couponInput.trim()) {
            setCouponCode("")
            setDiscount(0)
            return
        }
        try {
            const res = await api.post("/coupons/validate", {
                code: couponInput.trim(),
                subtotal: total,
            })
            setCouponCode(res.data.data.code)
            setDiscount(Number(res.data.data.discount) || 0)
            setCouponMsg(`Cupom ${res.data.data.code} aplicado`)
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } }
            setCouponCode("")
            setDiscount(0)
            setCouponMsg(err.response?.data?.message || "Cupom inválido")
        }
    }

    async function handleCheckoutSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (items.length === 0) return

        if (!customerName.trim() || !customerPhone.trim()) {
            setCheckoutError("Preencha nome e WhatsApp.")
            return
        }

        if (items.some((item) => !item.size)) {
            setCheckoutError("Escolha o tamanho de todos os itens na sacola.")
            return
        }

        if (shippingMethod === "delivery" && !shippingAddress.trim()) {
            setCheckoutError("Informe o endereço de entrega.")
            return
        }

        try {
            setCheckoutLoading(true)
            setCheckoutError("")

            const response = await api.post("/orders", {
                customer_name: customerName.trim(),
                customer_phone: customerPhone.trim(),
                customer_notes: customerNotes.trim(),
                shipping_method: shippingMethod,
                shipping_address: shippingAddress.trim(),
                coupon_code: couponCode || undefined,
                items: items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                })),
            })

            const order = response.data.data
            const orderId = order.id
            const finalTotal = Number(order.total)

            const lines = items.map((item) => {
                const sizeLabel = item.size ? ` (${item.size})` : ""
                return `• ${item.name}${sizeLabel} x${item.quantity} — ${formatBRL(item.price * item.quantity)}`
            })

            const message = [
                `Olá! Gostaria de finalizar meu pedido #${orderId} na Dondoka Boutique:`,
                "",
                `Nome: ${customerName.trim()}`,
                `WhatsApp: ${customerPhone.trim()}`,
                shippingMethod === "delivery"
                    ? `Entrega: ${shippingAddress.trim()}`
                    : "Retirada na loja",
                couponCode ? `Cupom: ${couponCode}` : "",
                customerNotes.trim() ? `Obs: ${customerNotes.trim()}` : "",
                "",
                ...lines,
                "",
                discount > 0
                    ? `Desconto: -${formatBRL(Number(order.discount || discount))}`
                    : "",
                shippingFee > 0
                    ? `Frete: ${formatBRL(Number(order.shipping_fee || shippingFee))}`
                    : "Frete: grátis (retirada)",
                `Total: ${formatBRL(finalTotal)}`,
            ]
                .filter((line) => line !== "")
                .join("\n")

            if (isWhatsAppConfigured()) {
                window.open(whatsappLink(message), "_blank")
            }

            const orderState = {
                id: orderId,
                total: finalTotal,
                customer_name: customerName.trim(),
                shipping_method: shippingMethod,
                items: items.map((item) => ({
                    name: item.name,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price,
                })),
                whatsappMessage: message,
            }

            clearCart()
            setCheckoutOpen(false)
            setCartOpen(false)
            setCustomerName("")
            setCustomerPhone("")
            setCustomerNotes("")
            setShippingAddress("")
            setShippingMethod("pickup")
            setCouponInput("")
            setCouponCode("")
            setDiscount(0)
            setCouponMsg("")

            navigate(`/pedido-confirmado/${orderId}`, { state: orderState })
        } catch (error: unknown) {
            console.error(error)
            const err = error as { response?: { data?: { message?: string } } }
            setCheckoutError(
                err.response?.data?.message ||
                    "Não foi possível registrar o pedido. Tente novamente."
            )
        } finally {
            setCheckoutLoading(false)
        }
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        if (!search.trim()) return
        navigate(`/colecao?q=${encodeURIComponent(search.trim())}`)
        setSearchOpen(false)
        setSearch("")
    }

    return (
        <>
            <header className="header">
                <div className="container-logo">
                    <Link to="/">
                        <img src={logo} alt="Dondoka Boutique" />
                    </Link>
                </div>

                <nav className="container-links">
                    <ul>
                        <li><Link to="/">Início</Link></li>
                        <li><Link to="/colecao">Coleção</Link></li>
                        <li><Link to="/novidades">Novidades</Link></li>
                        <li><Link to="/promocoes">Promoções</Link></li>
                        <li><Link to="/sobre">Sobre</Link></li>
                        <li><Link to="/contato">Contato</Link></li>
                    </ul>
                </nav>

                <div className="container-icon">
                    <div className="search-wrap" ref={searchWrapRef}>
                        {searchOpen ? (
                            <form className="search-box" onSubmit={handleSearch}>
                                <Search size={18} strokeWidth={1.5} />
                                <input
                                    autoFocus
                                    placeholder="Buscar peças..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </form>
                        ) : (
                            <Search
                                size={22}
                                strokeWidth={1.5}
                                className="icon"
                                onClick={() => setSearchOpen(true)}
                            />
                        )}

                        {searchOpen && suggestions.length > 0 && (
                            <div className="search-suggestions">
                                {suggestions.map((product) => (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => {
                                            navigate(`/produto/${product.id}`)
                                            setSearch("")
                                            setSearchOpen(false)
                                        }}
                                    >
                                        <img
                                            src={resolveImageUrl(
                                                productCover(product)
                                            )}
                                            alt=""
                                        />
                                        <span>
                                            <strong>{product.name}</strong>
                                            <small>
                                                {formatBRL(productPrice(product))}
                                            </small>
                                        </span>
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="search-all"
                                    onClick={() => {
                                        navigate(
                                            `/colecao?q=${encodeURIComponent(search.trim())}`
                                        )
                                        setSearchOpen(false)
                                        setSearch("")
                                    }}
                                >
                                    Ver todos os resultados
                                </button>
                            </div>
                        )}
                    </div>

                    <Link to="/conta" className="icon-link" aria-label="Minha conta">
                        <User size={22} strokeWidth={1.5} className="icon" />
                    </Link>

                    <Link to="/favoritos" className="cart-area icon-link" aria-label="Favoritos">
                        <Heart size={22} strokeWidth={1.5} className="icon" />
                        {wishlistCount > 0 && (
                            <span className="cart-badge">{wishlistCount}</span>
                        )}
                    </Link>

                    <div className="cart-area">
                        <ShoppingBag
                            size={22}
                            strokeWidth={1.5}
                            className="icon"
                            onClick={() => setCartOpen(true)}
                        />
                        {count > 0 && (
                            <span className="cart-badge">{count}</span>
                        )}
                    </div>

                    <Menu
                        size={25}
                        strokeWidth={1.5}
                        className="icon menu-mobile-btn"
                        onClick={() => setMenuOpen(true)}
                    />
                </div>
            </header>

            {menuOpen && (
                <div className="cart-overlay" onClick={() => setMenuOpen(false)} />
            )}

            <aside className={`mobile-sidebar ${menuOpen ? "open" : ""}`}>
                <div className="mobile-header">
                    <X size={22} className="icon" onClick={() => setMenuOpen(false)} />
                </div>
                <ul>
                    <li><Link to="/" onClick={() => setMenuOpen(false)}>Início</Link></li>
                    <li><Link to="/colecao" onClick={() => setMenuOpen(false)}>Coleção</Link></li>
                    <li><Link to="/novidades" onClick={() => setMenuOpen(false)}>Novidades</Link></li>
                    <li><Link to="/promocoes" onClick={() => setMenuOpen(false)}>Promoções</Link></li>
                    <li><Link to="/favoritos" onClick={() => setMenuOpen(false)}>Favoritos</Link></li>
                    <li><Link to="/conta" onClick={() => setMenuOpen(false)}>Minha conta</Link></li>
                    <li><Link to="/sobre" onClick={() => setMenuOpen(false)}>Sobre</Link></li>
                    <li><Link to="/contato" onClick={() => setMenuOpen(false)}>Contato</Link></li>
                </ul>
            </aside>

            {cartOpen && (
                <div className="cart-overlay" onClick={() => setCartOpen(false)} />
            )}

            <aside className={`cart-aside ${cartOpen ? "open" : ""}`}>
                <div className="cart-header">
                    <h3>Sua sacola</h3>
                    <X size={22} className="icon" onClick={() => setCartOpen(false)} />
                </div>

                <div className="cart-products">
                    {items.length === 0 ? (
                        <p className="cart-empty">Nenhum produto ainda</p>
                    ) : (
                        items.map((item) => (
                            <div
                                className="cart-item"
                                key={`${item.id}-${item.size || "default"}`}
                            >
                                <img
                                    className="cart-item-image"
                                    src={resolveImageUrl(item.image_url)}
                                    alt={item.name}
                                />
                                <div className="cart-item-info">
                                    <strong>{item.name}</strong>
                                    {item.size ? (
                                        <small>Tam. {item.size}</small>
                                    ) : (
                                        <small className="cart-size-missing">
                                            Sem tamanho
                                        </small>
                                    )}
                                    <p>{formatBRL(item.price)}</p>
                                </div>
                                <div className="cart-controls">
                                    <button onClick={() => decreaseQty(item.id, item.size)}>-</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => increaseQty(item.id, item.size)}>+</button>
                                    <button
                                        className="remove"
                                        onClick={() => removeItem(item.id, item.size)}
                                        aria-label="Remover"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="cart-footer">
                    <div className="cart-total">
                        <span>Total</span>
                        <strong>{formatBRL(total)}</strong>
                    </div>
                    <button
                        onClick={() => {
                            setCheckoutError("")
                            setCheckoutOpen(true)
                        }}
                        disabled={items.length === 0}
                    >
                        Finalizar pedido
                    </button>
                </div>
            </aside>

            {checkoutOpen && (
                <div className="checkout-overlay">
                    <form className="checkout-modal" onSubmit={handleCheckoutSubmit}>
                        <div className="checkout-modal-head">
                            <h3>Finalizar pedido</h3>
                            <X
                                size={20}
                                className="icon"
                                onClick={() => setCheckoutOpen(false)}
                            />
                        </div>

                        <p className="checkout-hint">
                            Registramos o pedido e abrimos o WhatsApp para confirmar.
                            {user
                                ? " Pedido vinculado à sua conta."
                                : " Quer salvar o histórico? Crie uma conta em Minha conta."}
                        </p>

                        {!isWhatsAppConfigured() && (
                            <p className="checkout-error">
                                Configure VITE_WHATSAPP no .env da loja (ex.: 5511999999999).
                            </p>
                        )}

                        <label>
                            Nome
                            <input
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </label>

                        <label>
                            WhatsApp
                            <input
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="DDD + número"
                            />
                        </label>

                        <div className="checkout-shipping">
                            <span className="checkout-label">Entrega</span>
                            <div className="checkout-shipping-options">
                                <button
                                    type="button"
                                    className={shippingMethod === "pickup" ? "active" : ""}
                                    onClick={() => setShippingMethod("pickup")}
                                >
                                    Retirada · grátis
                                </button>
                                <button
                                    type="button"
                                    className={shippingMethod === "delivery" ? "active" : ""}
                                    onClick={() => setShippingMethod("delivery")}
                                >
                                    Entrega · {formatBRL(deliveryFee)}
                                </button>
                            </div>
                        </div>

                        {shippingMethod === "delivery" && (
                            <label>
                                Endereço
                                <textarea
                                    value={shippingAddress}
                                    onChange={(e) => setShippingAddress(e.target.value)}
                                    placeholder="Rua, número, bairro, cidade"
                                    rows={2}
                                />
                            </label>
                        )}

                        <div className="checkout-coupon">
                            <label>
                                Cupom
                                <div className="checkout-coupon-row">
                                    <input
                                        value={couponInput}
                                        onChange={(e) =>
                                            setCouponInput(e.target.value.toUpperCase())
                                        }
                                        placeholder="DONDOKA10"
                                    />
                                    <button type="button" onClick={applyCoupon}>
                                        Aplicar
                                    </button>
                                </div>
                            </label>
                            {couponMsg && (
                                <p className={couponCode ? "checkout-coupon-ok" : "checkout-error"}>
                                    {couponMsg}
                                </p>
                            )}
                        </div>

                        <label>
                            Observação
                            <textarea
                                value={customerNotes}
                                onChange={(e) => setCustomerNotes(e.target.value)}
                                placeholder="Opcional"
                                rows={2}
                            />
                        </label>

                        <div className="checkout-summary">
                            <div>
                                <span>Subtotal</span>
                                <strong>{formatBRL(total)}</strong>
                            </div>
                            {discount > 0 && (
                                <div>
                                    <span>Desconto</span>
                                    <strong>-{formatBRL(discount)}</strong>
                                </div>
                            )}
                            <div>
                                <span>Frete</span>
                                <strong>
                                    {shippingFee > 0 ? formatBRL(shippingFee) : "Grátis"}
                                </strong>
                            </div>
                            <div className="checkout-summary-total">
                                <span>Total</span>
                                <strong>{formatBRL(checkoutTotal)}</strong>
                            </div>
                        </div>

                        {checkoutError && (
                            <p className="checkout-error">{checkoutError}</p>
                        )}

                        <button type="submit" disabled={checkoutLoading}>
                            {checkoutLoading
                                ? "Enviando..."
                                : `Confirmar • ${formatBRL(checkoutTotal)}`}
                        </button>
                    </form>
                </div>
            )}
        </>
    )
}
