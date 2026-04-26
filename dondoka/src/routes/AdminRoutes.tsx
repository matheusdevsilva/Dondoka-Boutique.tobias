import { Navigate } from "react-router-dom"

export default function AdminRoute({ children }: any) {

    const token = localStorage.getItem("token")

    if (!token) {
        return <Navigate to="/admin/login" />
    }

    return children
}