import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useLocation, useNavigate } from "react-router-dom"
import api, { apiErrorMessage } from "../services/api"
import logo from "../assets/logo.jpeg"
import "./Login.css"

const loginSchema = z.object({
    username: z.string().trim().min(1, "Informe o usuário"),
    password: z.string().min(1, "Informe a senha"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginAdmin() {
    const navigate = useNavigate()
    const location = useLocation()
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

    async function onSubmit(values: LoginForm) {
        try {
            await api.post("/admin/auth", values)
            const from = (location.state as { from?: string } | null)?.from
            navigate(from?.startsWith("/admin/") ? from : "/admin/dashboard", { replace: true })
        } catch (error) {
            setError("root", {
                message: apiErrorMessage(error, "Não foi possível entrar. Tente novamente."),
            })
        }
    }

    return (
        <div className="container-main-login">
            <div className="container-left" aria-hidden="true">
                <div className="logo-area">
                    <img src={logo} width={1003} height={570} alt="" />
                </div>
            </div>

            <main className="container-right">
                <div className="container-forms-login">
                    <form className="container" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div className="admin-info">
                            <h1>Sistema Admin</h1>
                            <span>
                                Painel administrativo da loja.
                                <br />
                                Gerencie produtos, vendas e clientes.
                            </span>
                        </div>

                        <div className="container">
                            <label className="login-field" htmlFor="admin-username">
                                Usuário
                            </label>
                            <input
                                id="admin-username"
                                type="text"
                                autoComplete="username"
                                className="input-login"
                                aria-invalid={errors.username ? true : undefined}
                                aria-describedby={errors.username ? "admin-username-error" : undefined}
                                {...register("username")}
                            />
                            {errors.username && (
                                <p className="login-error" id="admin-username-error">
                                    {errors.username.message}
                                </p>
                            )}

                            <label className="login-field" htmlFor="admin-password">
                                Senha
                            </label>
                            <input
                                id="admin-password"
                                type="password"
                                autoComplete="current-password"
                                className="input-login"
                                aria-invalid={errors.password ? true : undefined}
                                aria-describedby={errors.password ? "admin-password-error" : undefined}
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="login-error" id="admin-password-error">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {errors.root && (
                            <p className="login-error" role="alert">
                                {errors.root.message}
                            </p>
                        )}

                        <button type="submit" className="btn-login" disabled={isSubmitting}>
                            {isSubmitting ? "Entrando..." : "Entrar"}
                        </button>

                        <div className="login-footer">
                            <p>Painel Dondoka Boutique v1.0</p>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
