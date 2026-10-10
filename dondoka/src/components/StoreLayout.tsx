import { Suspense, useEffect, useRef } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import PageLoader from "./PageLoader"
import ErrorBoundary from "./ErrorBoundary"

export default function StoreLayout() {
    const { pathname } = useLocation()
    const mainRef = useRef<HTMLElement>(null)
    const firstRender = useRef(true)

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false
            return
        }
        window.scrollTo({ top: 0 })
        mainRef.current?.focus({ preventScroll: true })
    }, [pathname])

    return (
        <>
            <a href="#conteudo" className="skip-link">
                Pular para o conteúdo
            </a>
            <Header />
            <main id="conteudo" ref={mainRef} tabIndex={-1}>
                <ErrorBoundary key={pathname}>
                    <Suspense fallback={<PageLoader />}>
                        <Outlet />
                    </Suspense>
                </ErrorBoundary>
            </main>
            <Footer />
        </>
    )
}
