import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamento de diálogo modal: foco inicial, Tab preso dentro do painel,
 * Escape fecha, rolagem do body bloqueada e foco devolvido ao gatilho ao fechar.
 */
export function useDialog<T extends HTMLElement>(
    open: boolean,
    onClose: () => void
): RefObject<T | null> {
    const ref = useRef<T>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        const panel = ref.current;
        if (!panel) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const focusables = () =>
            Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
                (el) => el.offsetParent !== null || el === document.activeElement
            );

        const initial =
            panel.querySelector<HTMLElement>("[data-autofocus]") || focusables()[0] || panel;
        initial.focus();

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.stopPropagation();
                onCloseRef.current();
                return;
            }
            if (event.key !== "Tab") return;
            const items = focusables();
            if (items.length === 0) {
                event.preventDefault();
                return;
            }
            const first = items[0]!;
            const last = items[items.length - 1]!;
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        panel.addEventListener("keydown", onKeyDown);
        return () => {
            panel.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus?.();
        };
    }, [open]);

    return ref;
}
