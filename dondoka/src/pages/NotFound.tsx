import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import "../styles/NotFound.css";

export default function NotFound() {
    return (
        <div className="not-found-page">
            <Seo title="Página não encontrada" noIndex />
            <p className="not-found-code">404</p>
            <h1>Página não encontrada</h1>
            <p>Esse endereço não existe na boutique.</p>
            <Link to="/">Voltar ao início</Link>
        </div>
    );
}
