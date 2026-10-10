import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import StoreLayout from "../components/StoreLayout"
import PageLoader from "../components/PageLoader"
import HomePage from "../pages/HomePage"
import { CartProvider } from "../context/CartContext"
import { AuthProvider } from "../context/AuthContext"
import { WishlistProvider } from "../context/WishlistContext"

const Products = lazy(() => import("../pages/Products"))
const Novidades = lazy(() => import("../pages/Novidades"))
const Promocoes = lazy(() => import("../pages/Promocoes"))
const Sobre = lazy(() => import("../pages/Sobre"))
const Contato = lazy(() => import("../pages/Contato"))
const ProductDetail = lazy(() => import("../pages/ProductDetail"))
const Wishlist = lazy(() => import("../pages/Wishlist"))
const Account = lazy(() => import("../pages/Account"))
const OrderConfirmed = lazy(() => import("../pages/OrderConfirmed"))
const NotFound = lazy(() => import("../pages/NotFound"))

const AdminRoute = lazy(() => import("./AdminRoutes"))
const Login = lazy(() => import("../admin/Login"))
const Dashboard = lazy(() => import("../admin/Dashboard"))
const CadProducts = lazy(() => import("../admin/pages/CadProducts"))
const ListProducts = lazy(() => import("../admin/pages/ListProducts"))
const EditProducts = lazy(() => import("../admin/pages/EditProducts"))
const Categories = lazy(() => import("../admin/pages/Categories"))
const Orders = lazy(() => import("../admin/pages/Orders"))
const ListClient = lazy(() => import("../admin/pages/ListClient"))
const Coupons = lazy(() => import("../admin/pages/Coupons"))

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <WishlistProvider>
                    <CartProvider>
                        <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route element={<StoreLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/colecao" element={<Products />} />
                                <Route path="/novidades" element={<Novidades />} />
                                <Route path="/promocoes" element={<Promocoes />} />
                                <Route path="/sobre" element={<Sobre />} />
                                <Route path="/contato" element={<Contato />} />
                                <Route path="/produto/:id" element={<ProductDetail />} />
                                <Route path="/favoritos" element={<Wishlist />} />
                                <Route path="/conta" element={<Account />} />
                                <Route path="/pedido-confirmado/:id" element={<OrderConfirmed />} />
                                <Route path="*" element={<NotFound />} />
                            </Route>

                            <Route path="/admin/login" element={<Login />} />
                            <Route path="/admin" element={<AdminRoute />}>
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="produtos/novo" element={<CadProducts />} />
                                <Route path="produtos/editar/:id" element={<EditProducts />} />
                                <Route path="produtos" element={<ListProducts />} />
                                <Route path="categorias" element={<Categories />} />
                                <Route path="pedidos" element={<Orders />} />
                                <Route path="clientes" element={<ListClient />} />
                                <Route path="cupons" element={<Coupons />} />
                            </Route>
                        </Routes>
                        </Suspense>
                    </CartProvider>
                </WishlistProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
