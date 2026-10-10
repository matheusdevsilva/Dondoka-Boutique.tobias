import { useId } from "react"
import { Minus, Plus, X } from "lucide-react"
import { useCart } from "../context/CartContext"
import { resolveImageUrl } from "../services/api"
import { useDialog } from "../hooks/useDialog"
import { formatBRL } from "../types/product"

export default function CartDrawer({ onCheckout }: { onCheckout: () => void }) {
    const { items, cartOpen, setCartOpen, increaseQty, decreaseQty, removeItem, total } = useCart()
    const close = () => setCartOpen(false)
    const panelRef = useDialog<HTMLElement>(cartOpen, close)
    const titleId = useId()

    return (
        <>
            {cartOpen && <div className="cart-overlay" onClick={close} aria-hidden="true" />}

            <aside
                ref={panelRef}
                id="cart-drawer"
                className={`cart-aside ${cartOpen ? "open" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                inert={!cartOpen}
                tabIndex={-1}
            >
                <div className="cart-header">
                    <h2 id={titleId}>Sua sacola</h2>
                    <button type="button" className="icon-btn" onClick={close} aria-label="Fechar sacola">
                        <X size={22} aria-hidden="true" />
                    </button>
                </div>

                <div className="cart-products">
                    {items.length === 0 ? (
                        <p className="cart-empty">Nenhum produto ainda</p>
                    ) : (
                        <ul className="cart-list">
                            {items.map((item) => (
                                <li className="cart-item" key={`${item.id}-${item.size || "default"}`}>
                                    <img
                                        className="cart-item-image"
                                        src={resolveImageUrl(item.image_url)}
                                        alt=""
                                        width={64}
                                        height={80}
                                        loading="lazy"
                                    />
                                    <div className="cart-item-info">
                                        <strong>{item.name}</strong>
                                        {item.size ? (
                                            <small>Tam. {item.size}</small>
                                        ) : (
                                            <small className="cart-size-missing">Sem tamanho</small>
                                        )}
                                        <p>{formatBRL(item.price)}</p>
                                    </div>
                                    <div className="cart-controls" role="group" aria-label={`Quantidade de ${item.name}`}>
                                        <button
                                            type="button"
                                            onClick={() => decreaseQty(item.id, item.size)}
                                            aria-label="Diminuir quantidade"
                                        >
                                            <Minus size={14} aria-hidden="true" />
                                        </button>
                                        <span aria-live="polite">{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => increaseQty(item.id, item.size)}
                                            aria-label="Aumentar quantidade"
                                        >
                                            <Plus size={14} aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            className="remove"
                                            onClick={() => removeItem(item.id, item.size)}
                                            aria-label={`Remover ${item.name}`}
                                        >
                                            <X size={14} aria-hidden="true" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="cart-footer">
                    <div className="cart-total">
                        <span>Total</span>
                        <strong>{formatBRL(total)}</strong>
                    </div>
                    <button type="button" onClick={onCheckout} disabled={items.length === 0}>
                        Finalizar pedido
                    </button>
                </div>
            </aside>
        </>
    )
}
