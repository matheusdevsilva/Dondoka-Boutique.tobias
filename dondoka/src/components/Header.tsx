import { Search, ShoppingBag, Menu, X } from "lucide-react"
import "../styles/Header.css"
import logo from "../assets/logo.jpeg"
import { useState } from "react"
import { Link } from "react-router-dom"

interface CartItem {
    id: number
    name: string
    price: number
    quantity: number
}

export default function Header() {

    const [cartOpen, setCartOpen] = useState(false)

    const [cartItems, setCartItems] = useState<CartItem[]>([
        { id: 1, name: "Vestido Floral", price: 120, quantity: 1 },
        { id: 2, name: "Blusa Elegante", price: 80, quantity: 1 }
    ])

    /* =========================
       FUNÇÕES CARRINHO
    ========================= */

    function increaseQty(id: number) {
        setCartItems(items =>
            items.map(item =>
                item.id === id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        )
    }

    function decreaseQty(id: number) {
        setCartItems(items =>
            items.map(item =>
                item.id === id && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
        )
    }

    function removeItem(id: number) {
        setCartItems(items => items.filter(item => item.id !== id))
    }

    const total = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    )

    /* =========================
       UI
    ========================= */

    return (
        <>
            {/* HEADER */}
            <header className="header">

                <div className="container-logo">
                    <img src={logo} width={130} />
                </div>

                <nav className="container-links">
                    <ul>
                        <li>Início</li>
                        <li><Link to="/colecao">Coleções</Link></li>
                        <li>Novidades</li>
                        <li>Contato</li>
                    </ul>
                </nav>

                <div className="container-icon">

                    <Search size={22} strokeWidth={1.5} className="icon" />

                    <ShoppingBag
                        size={22}
                        strokeWidth={1.5}
                        className="icon"
                        onClick={() => setCartOpen(true)}
                    />

                    <Menu size={25} strokeWidth={1.5} className="icon" />

                </div>

            </header>

            {/* OVERLAY */}
            {cartOpen && (
                <div
                    className="cart-overlay"
                    onClick={() => setCartOpen(false)}
                />
            )}

            {/* ASIDE CARRINHO */}
            <aside className={`cart-aside ${cartOpen ? "open" : ""}`}>

                {/* HEADER */}
                <div className="cart-header">
                    <h3>Sua sacola</h3>

                    <X
                        size={22}
                        className="icon"
                        onClick={() => setCartOpen(false)}
                    />
                </div>

                {/* PRODUTOS */}
                <div className="cart-products">

                    {cartItems.length === 0 ? (
                        <p>Nenhum produto ainda</p>
                    ) : (
                        cartItems.map(item => (
                            <div className="cart-item" key={item.id}>

                                <div>
                                    <strong>{item.name}</strong>
                                    <p>R$ {item.price.toFixed(2)}</p>
                                </div>

                                <div className="cart-controls">

                                    <button onClick={() => decreaseQty(item.id)}>
                                        -
                                    </button>

                                    <span>{item.quantity}</span>

                                    <button onClick={() => increaseQty(item.id)}>
                                        +
                                    </button>

                                    <button
                                        className="remove"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        ❌
                                    </button>

                                </div>

                            </div>
                        ))
                    )}

                </div>

                {/* FOOTER */}
                <div className="cart-footer">

                    <p style={{ marginBottom: 10 }}>
                        Total: <strong>R$ {total.toFixed(2)}</strong>
                    </p>

                    <button>
                        Finalizar compra
                    </button>

                </div>

            </aside>
        </>
    )
}