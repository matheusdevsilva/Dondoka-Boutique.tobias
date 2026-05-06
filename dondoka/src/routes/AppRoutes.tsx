import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "../admin/Login"
import Dashboard from "../admin/Dashboard"
import AdminRoute from "./AdminRoutes"
import HomePage from "../pages/HomePage"

export default function AppRoutes() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/admin/login" element={<Login />} />
                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <Dashboard />
                        </AdminRoute>
                    }
                />

            </Routes>
        </BrowserRouter>

    )
}