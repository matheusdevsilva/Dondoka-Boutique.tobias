import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/NotFound.css";

export default function NotFound() {
    return (
        <>
            <Header />
            <main className="not-found-page">
                <p className="not-found-code">404</p>
                <h1>Página não encontrada</h1>
                <p>Esse endereço não existe na boutique.</p>
                <Link to="/">Voltar ao início</Link>
            </main>
            <Footer />
        </>
    );
}
