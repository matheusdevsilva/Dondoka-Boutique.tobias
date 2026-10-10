import { useId, type ReactNode } from "react"
import { X } from "lucide-react"
import { useDialog } from "../hooks/useDialog"

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    hideTitle?: boolean
    overlayClassName: string
    panelClassName: string
    headClassName?: string
    children: ReactNode
}

export default function Modal({
    open,
    onClose,
    title,
    hideTitle,
    overlayClassName,
    panelClassName,
    headClassName,
    children,
}: ModalProps) {
    const panelRef = useDialog<HTMLDivElement>(open, onClose)
    const titleId = useId()

    if (!open) return null

    return (
        <div className={overlayClassName} onClick={onClose}>
            <div
                ref={panelRef}
                className={panelClassName}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={headClassName}>
                    <h2 id={titleId} className={hideTitle ? "sr-only" : undefined}>
                        {title}
                    </h2>
                    <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Fechar">
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
