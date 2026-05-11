import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "../admin/Login"
import Dashboard from "../admin/Dashboard"
import AdminRoute from "./AdminRoutes"
import HomePage from "../pages/HomePage"
import CadProducts from "../admin/pages/CadProducts"
import ListProducts from "../admin/pages/ListProducts"
import Categories from "../admin/pages/Categories"

export default function AppRoutes() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/admin/login" element={<Login />} />

                <Route element={<AdminRoute />}>
                    <Route path="/admin/dashboard" element={<Dashboard />} />
                    <Route path="/admin/produtos/novo" element={<CadProducts />} />
                    <Route path="/admin/produtos" element={<ListProducts />} />
                    <Route path="/admin/categorias" element={<Categories />} />
                </Route>
            </Routes>
        </BrowserRouter>

    )
}