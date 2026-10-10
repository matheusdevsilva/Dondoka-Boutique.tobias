import { X } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useDialog } from "../hooks/useDialog"

const LINKS = [
    { to: "/", label: "Início" },
    { to: "/colecao", label: "Coleção" },
    { to: "/novidades", label: "Novidades" },
    { to: "/promocoes", label: "Promoções" },
    { to: "/favoritos", label: "Favoritos" },
    { to: "/conta", label: "Minha conta" },
    { to: "/sobre", label: "Sobre" },
    { to: "/contato", label: "Contato" },
]

export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
    const panelRef = useDialog<HTMLElement>(open, onClose)

    return (
        <>
            {open && <div className="cart-overlay" onClick={onClose} aria-hidden="true" />}

            <aside
                ref={panelRef}
                id="mobile-menu"
                className={`mobile-sidebar ${open ? "open" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                inert={!open}
                tabIndex={-1}
            >
                <div className="mobile-header">
                    <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar menu">
                        <X size={22} aria-hidden="true" />
                    </button>
                </div>
                <nav aria-label="Menu principal">
                    <ul>
                        {LINKS.map((link) => (
                            <li key={link.to}>
                                <NavLink to={link.to} end={link.to === "/"} onClick={onClose}>
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    )
}
