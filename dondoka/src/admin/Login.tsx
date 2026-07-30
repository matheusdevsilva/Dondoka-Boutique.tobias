import api from "../services/api"
import { useState } from "react"
import logo from "../assets/logo.jpeg"
import "./Login.css"
import { useNavigate } from "react-router-dom";


export default function LoginAdmin() {

    const [username, setUsername] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const navigate = useNavigate();
    async function handleSubmit(e: React.FormEvent) {

        e.preventDefault()

        try {

            if (!username || !password) {
                alert("Os campos precisam ser preenchidos")
                return; // <-- faltava isso
            }
            const response = await api.post("/admin/auth", {
                username,
                password
            })

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            navigate("/admin/dashboard")

        } catch (error) {
            console.error("Erro no login", error)
            alert("Usuário ou senha inválidos")
        }
    }

    return (
        <div className="container-main-login">

            <div className="container-left">
                <div className="logo-area">
                    <img src={logo} width={420} />
                </div>

            </div>

            <div className="container-right">

                <div className="container-forms-login">

                    <form className="container" onSubmit={handleSubmit}>
                        <div className="admin-info">
                            <h2>Sistema Admin</h2>
                            <span>
                                Painel administrativo da loja.
                                <br />
                                Gerencie produtos, vendas e clientes.
                            </span>
                        </div>
                        <div className="container">

                            <input
                                type="text"
                                placeholder="Usuario"
                                className="input-login"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            <input
                                type="password"
                                placeholder="Senha"
                                className="input-login"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                        </div>

                        <div className="login-options">

                            <label className="remember">
                                <input type="checkbox" />
                                Lembrar acesso
                            </label>

                            <a href="#">Esqueci minha senha</a>

                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <button type="submit" className="bnt-login">
                                Entrar
                            </button>
                        </div>

                        <div className="login-footer">
                            <p>Painel Dondoka Boutique v1.0</p>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    )
}