import Router from "express";
import { Login, CreateAdmin, EditAdmin } from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js"
import {
    customerAuth,
    optionalCustomerAuth,
} from "../middleware/customerAuth.js"
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import {
    getProducts,
    getProductsById,
    createNewProducts,
    DeleteProducts,
    EditProducts,
    getProductsByCategory,
    getCategoria,
    deleteCategoriaById,
    createCategoria,
    updateCategoria
} from "../controllers/productsController.js"
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getSalesStats,
    getShippingConfig,
} from "../controllers/ordersController.js"
import {
    registerCustomer,
    loginCustomer,
    getCustomerMe,
    getMyOrders,
    getWishlist,
    addWishlistItem,
    removeWishlistItem,
    syncWishlist,
    adminGetCustomers,
    adminGetCustomerById,
    adminUpdateCustomer,
    adminDeleteCustomer,
} from "../controllers/customerController.js"
import {
    validateCoupon,
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
} from "../controllers/couponsController.js"
import {
    getProductReviews,
    createProductReview,
} from "../controllers/reviewsController.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname) || ".jpg";
        cb(null, `${unique}${ext}`);
    },
});

const upload = multer({ storage });

const router = Router()

// rotas privadas admin

router.get("/admin/products", authMiddleware, getProducts)
router.get("/admin/product/:id", authMiddleware, getProductsById)
router.get("/admin/categories/", authMiddleware, getCategoria)

router.post("/admin/auth", Login)
router.post("/admin/users/add", authMiddleware, CreateAdmin)
router.post("/admin/products/add/", authMiddleware, upload.array("images", 10), createNewProducts)
router.post("/admin/categories/add", authMiddleware, createCategoria)

router.delete("/admin/products/delete/:id", authMiddleware, DeleteProducts)
router.delete("/admin/categories/delete/:id", authMiddleware, deleteCategoriaById)

router.get("/admin/orders", authMiddleware, getOrders)
router.get("/admin/orders/:id", authMiddleware, getOrderById)
router.put("/admin/orders/:id/status", authMiddleware, updateOrderStatus)
router.get("/admin/stats", authMiddleware, getSalesStats)

router.get("/admin/customers", authMiddleware, adminGetCustomers)
router.get("/admin/customers/:id", authMiddleware, adminGetCustomerById)
router.put("/admin/customers/:id", authMiddleware, adminUpdateCustomer)
router.delete("/admin/customers/:id", authMiddleware, adminDeleteCustomer)

router.get("/admin/coupons", authMiddleware, getCoupons)
router.post("/admin/coupons", authMiddleware, createCoupon)
router.put("/admin/coupons/:id", authMiddleware, updateCoupon)
router.delete("/admin/coupons/:id", authMiddleware, deleteCoupon)

router.put("/admin/product/edit/:id", authMiddleware, upload.array("images", 10), EditProducts)
router.put("/admin/categories/edit/:id", authMiddleware, updateCategoria)
router.put("/admin/users/edit/:id", authMiddleware, EditAdmin)

// cliente (conta)
router.post("/auth/register", registerCustomer)
router.post("/auth/login", loginCustomer)
router.get("/auth/me", customerAuth, getCustomerMe)
router.get("/auth/orders", customerAuth, getMyOrders)
router.get("/auth/wishlist", customerAuth, getWishlist)
router.post("/auth/wishlist", customerAuth, addWishlistItem)
router.post("/auth/wishlist/sync", customerAuth, syncWishlist)
router.delete("/auth/wishlist/:productId", customerAuth, removeWishlistItem)

// rotas publicas

router.get("/", (_req, res) => {
    res.send("Api Dondoka Botique.Tobias Rodando")
})

router.get("/products/", getProducts)
router.get("/product/:id/reviews", getProductReviews)
router.post("/product/:id/reviews", createProductReview)
router.get("/product/:id", getProductsById)
router.get("/categories", getCategoria)
router.get("/products/category/:category", getProductsByCategory)
router.get("/shipping", getShippingConfig)
router.post("/coupons/validate", validateCoupon)

router.post("/orders", optionalCustomerAuth, createOrder)

export default router
