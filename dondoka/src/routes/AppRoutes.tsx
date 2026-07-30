import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "../admin/Login"
import Dashboard from "../admin/Dashboard"
import AdminRoute from "./AdminRoutes"
import HomePage from "../pages/HomePage"
import CadProducts from "../admin/pages/CadProducts"
import ListProducts from "../admin/pages/ListProducts"
import EditProducts from "../admin/pages/EditProducts"
import Categories from "../admin/pages/Categories"
import Orders from "../admin/pages/Orders"
import ListClient from "../admin/pages/ListClient"
import Coupons from "../admin/pages/Coupons"
import Products from "../pages/Products"
import Novidades from "../pages/Novidades"
import Promocoes from "../pages/Promocoes"
import Sobre from "../pages/Sobre"
import Contato from "../pages/Contato"
import ProductDetail from "../pages/ProductDetail"
import Wishlist from "../pages/Wishlist"
import Account from "../pages/Account"
import OrderConfirmed from "../pages/OrderConfirmed"
import NotFound from "../pages/NotFound"
import { CartProvider } from "../context/CartContext"
import { AuthProvider } from "../context/AuthContext"
import { WishlistProvider } from "../context/WishlistContext"

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <WishlistProvider>
                    <CartProvider>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/colecao" element={<Products />} />
                            <Route path="/novidades" element={<Novidades />} />
                            <Route path="/promocoes" element={<Promocoes />} />
                            <Route path="/sobre" element={<Sobre />} />
                            <Route path="/contato" element={<Contato />} />
                            <Route path="/produto/:id" element={<ProductDetail />} />
                            <Route path="/favoritos" element={<Wishlist />} />
                            <Route path="/conta" element={<Account />} />
                            <Route
                                path="/pedido-confirmado/:id"
                                element={<OrderConfirmed />}
                            />
                            <Route path="/admin/login" element={<Login />} />

                            <Route element={<AdminRoute />}>
                                <Route path="/admin/dashboard" element={<Dashboard />} />
                                <Route path="/admin/produtos/novo" element={<CadProducts />} />
                                <Route path="/admin/produtos/editar/:id" element={<EditProducts />} />
                                <Route path="/admin/produtos" element={<ListProducts />} />
                                <Route path="/admin/categorias" element={<Categories />} />
                                <Route path="/admin/pedidos" element={<Orders />} />
                                <Route path="/admin/clientes" element={<ListClient />} />
                                <Route path="/admin/cupons" element={<Coupons />} />
                            </Route>

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </CartProvider>
                </WishlistProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
