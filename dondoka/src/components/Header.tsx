import { Search, ShoppingBag, Menu, Heart, User, X } from "lucide-react"
import "../styles/Header.css"
import logo from "../assets/logo_sem_fundo.png"
import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useWishlist } from "../context/WishlistContext"
import api, { resolveImageUrl, type ApiResponse } from "../services/api"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { formatBRL, productCover, productPrice, type ProductType } from "../types/product"
import CartDrawer from "./CartDrawer"
import MobileMenu from "./MobileMenu"

const CheckoutDialog = lazy(() => import("./CheckoutDialog"))

const NAV_LINKS = [
    { to: "/", label: "Início" },
    { to: "/colecao", label: "Coleção" },
    { to: "/novidades", label: "Novidades" },
    { to: "/promocoes", label: "Promoções" },
    { to: "/sobre", label: "Sobre" },
    { to: "/contato", label: "Contato" },
]

export default function Header() {
    const { cartOpen, setCartOpen, checkoutOpen, setCheckoutOpen, count } = useCart()
    const [checkoutRequested, setCheckoutRequested] = useState(checkoutOpen)
    if (checkoutOpen && !checkoutRequested) setCheckoutRequested(true)
    const { count: wishlistCount } = useWishlist()
    const navigate = useNavigate()

    const searchWrapRef = useRef<HTMLDivElement>(null)
    const searchButtonRef = useRef<HTMLButtonElement>(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [suggestions, setSuggestions] = useState<ProductType[]>([])
    const [deliveryFee, setDeliveryFee] = useState(15)
    const debouncedSearch = useDebouncedValue(search.trim(), 250)

    useEffect(() => {
        api.get<ApiResponse<{ delivery_fee: number }>>("/shipping")
            .then((res) => setDeliveryFee(Number(res.data.data?.delivery_fee ?? 15)))
            .catch(() => undefined)
    }, [])

    useEffect(() => {
        if (debouncedSearch.length < 2) return
        const controller = new AbortController()
        api.get<ApiResponse<ProductType[]>>("/products", {
            params: { q: debouncedSearch, page: 1, limit: 6 },
            signal: controller.signal,
        })
            .then((res) => setSuggestions(res.data.data || []))
            .catch(() => undefined)
        return () => controller.abort()
    }, [debouncedSearch])

    useEffect(() => {
        if (!searchOpen) return
        function onPointerDown(e: PointerEvent) {
            if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
                closeSearch(false)
            }
        }
        document.addEventListener("pointerdown", onPointerDown)
        return () => document.removeEventListener("pointerdown", onPointerDown)
    }, [searchOpen])

    const visibleSuggestions = search.trim().length >= 2 ? suggestions : []

    function closeSearch(restoreFocus = true) {
        setSearchOpen(false)
        setSearch("")
        setSuggestions([])
        if (restoreFocus) requestAnimationFrame(() => searchButtonRef.current?.focus())
    }

    function goToResults() {
        const q = search.trim()
        if (!q) return
        navigate(`/colecao?q=${encodeURIComponent(q)}`)
        closeSearch(false)
    }

    return (
        <>
            <header className="header">
                <div className="container-logo">
                    <Link to="/" aria-label="Dondoka Boutique, página inicial">
                        <img src={logo} alt="" width={52} height={52} />
                    </Link>
                </div>

                <nav className="container-links" aria-label="Principal">
                    <ul>
                        {NAV_LINKS.map((link) => (
                            <li key={link.to}>
                                <NavLink to={link.to} end={link.to === "/"}>
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="container-icon">
                    <div
                        className="search-wrap"
                        ref={searchWrapRef}
                        onKeyDown={(e) => {
                            if (e.key === "Escape" && searchOpen) closeSearch()
                        }}
                    >
                        {searchOpen ? (
                            <form
                                className="search-box"
                                role="search"
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    goToResults()
                                }}
                            >
                                <Search size={18} strokeWidth={1.5} aria-hidden="true" />
                                <label htmlFor="header-search" className="sr-only">
                                    Buscar peças
                                </label>
                                <input
                                    id="header-search"
                                    type="search"
                                    autoFocus
                                    autoComplete="off"
                                    placeholder="Buscar peças..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    aria-controls="search-suggestions"
                                    aria-expanded={visibleSuggestions.length > 0}
                                />
                                <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() => closeSearch()}
                                    aria-label="Fechar busca"
                                >
                                    <X size={16} aria-hidden="true" />
                                </button>
                            </form>
                        ) : (
                            <button
                                ref={searchButtonRef}
                                type="button"
                                className="icon-btn icon"
                                onClick={() => setSearchOpen(true)}
                                aria-label="Abrir busca"
                            >
                                <Search size={22} strokeWidth={1.5} aria-hidden="true" />
                            </button>
                        )}

                        {searchOpen && visibleSuggestions.length > 0 && (
                            <ul className="search-suggestions" id="search-suggestions" aria-label="Sugestões">
                                {visibleSuggestions.map((product) => (
                                    <li key={product.id}>
                                        <Link to={`/produto/${product.id}`} onClick={() => closeSearch(false)}>
                                            <img
                                                src={resolveImageUrl(productCover(product))}
                                                alt=""
                                                width={44}
                                                height={56}
                                                loading="lazy"
                                            />
                                            <span>
                                                <strong>{product.name}</strong>
                                                <small>{formatBRL(productPrice(product))}</small>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                                <li>
                                    <button type="button" className="search-all" onClick={goToResults}>
                                        Ver todos os resultados
                                    </button>
                                </li>
                            </ul>
                        )}
                    </div>

                    <Link to="/conta" className="icon-link icon" aria-label="Minha conta">
                        <User size={22} strokeWidth={1.5} aria-hidden="true" />
                    </Link>

                    <Link
                        to="/favoritos"
                        className="cart-area icon-link icon"
                        aria-label={`Favoritos, ${wishlistCount} ${wishlistCount === 1 ? "peça" : "peças"}`}
                    >
                        <Heart size={22} strokeWidth={1.5} aria-hidden="true" />
                        {wishlistCount > 0 && (
                            <span className="cart-badge" aria-hidden="true">
                                {wishlistCount}
                            </span>
                        )}
                    </Link>

                    <button
                        type="button"
                        className="cart-area icon-btn icon"
                        onClick={() => setCartOpen(true)}
                        aria-label={`Abrir sacola, ${count} ${count === 1 ? "item" : "itens"}`}
                        aria-haspopup="dialog"
                        aria-expanded={cartOpen}
                        aria-controls="cart-drawer"
                    >
                        <ShoppingBag size={22} strokeWidth={1.5} aria-hidden="true" />
                        {count > 0 && (
                            <span className="cart-badge" aria-hidden="true">
                                {count}
                            </span>
                        )}
                    </button>
                    <span className="sr-only" aria-live="polite">
                        {count > 0 ? `${count} ${count === 1 ? "item" : "itens"} na sacola` : ""}
                    </span>

                    <button
                        type="button"
                        className="icon-btn icon menu-mobile-btn"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Abrir menu"
                        aria-haspopup="dialog"
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                    >
                        <Menu size={25} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                </div>
            </header>

            <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

            <CartDrawer
                onCheckout={() => {
                    setCartOpen(false)
                    setCheckoutOpen(true)
                }}
            />

            {checkoutRequested && (
                <Suspense fallback={null}>
                    <CheckoutDialog
                        open={checkoutOpen}
                        onClose={() => setCheckoutOpen(false)}
                        deliveryFee={deliveryFee}
                    />
                </Suspense>
            )}
        </>
    )
}
