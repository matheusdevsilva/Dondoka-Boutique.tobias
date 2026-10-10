import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Erro ao renderizar a página:", error, info.componentStack)
    }

    render() {
        if (!this.state.hasError) return this.props.children

        return (
            <div className="page-loader" role="alert">
                <p>
                    Algo deu errado ao carregar esta página.{" "}
                    <button type="button" className="link-button" onClick={() => window.location.reload()}>
                        Recarregar
                    </button>
                </p>
            </div>
        )
    }
}
