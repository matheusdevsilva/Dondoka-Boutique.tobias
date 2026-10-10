import { Router, type ErrorRequestHandler, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import {
    Login,
    CreateAdmin,
    EditAdmin,
    DeleteAdmin,
    getAdminMe,
    LogoutAdmin,
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js"
import {
    customerAuth,
    optionalCustomerAuth,
} from "../middleware/customerAuth.js"
import multer from "multer";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { checkDatabase } from "../database/db.js";

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
    getPublicOrder,
} from "../controllers/ordersController.js"
import {
    registerCustomer,
    loginCustomer,
    logoutCustomer,
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

const IMAGE_TYPES: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${crypto.randomUUID()}${IMAGE_TYPES[file.mimetype]}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 10, fields: 30 },
    fileFilter: (_req, file, cb) => {
        if (IMAGE_TYPES[file.mimetype]) return cb(null, true);
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    },
});

const uploadImages = upload.array("images", 10);

const handleUploadError: ErrorRequestHandler = (err, _req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message =
            err.code === "LIMIT_FILE_SIZE"
                ? "Imagem maior que 5 MB"
                : "Envie até 10 imagens JPEG, PNG ou WebP";
        return res.status(400).json({ success: false, message });
    }
    return next(err);
};

function limiter(windowMinutes: number, limit: number, message: string): RequestHandler {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        limit,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: { success: false, message },
    });
}

const authLimiter = limiter(15, 10, "Muitas tentativas. Tente novamente em alguns minutos.");
const orderLimiter = limiter(60, 20, "Muitos pedidos em sequência. Tente mais tarde.");
const reviewLimiter = limiter(60, 5, "Muitas avaliações em sequência. Tente mais tarde.");
const couponLimiter = limiter(15, 30, "Muitas tentativas de cupom. Tente mais tarde.");
const lookupLimiter = limiter(15, 30, "Muitas consultas. Tente mais tarde.");

const router = Router()

// rotas privadas admin

router.post("/admin/auth", authLimiter, Login)
router.post("/admin/logout", LogoutAdmin)
router.get("/admin/me", authMiddleware, getAdminMe)

router.get("/admin/products", authMiddleware, getProducts)
router.get("/admin/product/:id", authMiddleware, getProductsById)
router.get("/admin/categories/", authMiddleware, getCategoria)

router.post("/admin/users/add", authMiddleware, CreateAdmin)
router.put("/admin/users/edit/:id", authMiddleware, EditAdmin)
router.delete("/admin/users/:id", authMiddleware, DeleteAdmin)

router.post("/admin/products/add/", authMiddleware, uploadImages, createNewProducts)
router.put("/admin/product/edit/:id", authMiddleware, uploadImages, EditProducts)
router.delete("/admin/products/delete/:id", authMiddleware, DeleteProducts)

router.post("/admin/categories/add", authMiddleware, createCategoria)
router.put("/admin/categories/edit/:id", authMiddleware, updateCategoria)
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

// cliente (conta)
router.post("/auth/register", authLimiter, registerCustomer)
router.post("/auth/login", authLimiter, loginCustomer)
router.post("/auth/logout", logoutCustomer)
router.get("/auth/me", customerAuth, getCustomerMe)
router.get("/auth/orders", customerAuth, getMyOrders)
router.get("/auth/wishlist", customerAuth, getWishlist)
router.post("/auth/wishlist", customerAuth, addWishlistItem)
router.post("/auth/wishlist/sync", customerAuth, syncWishlist)
router.delete("/auth/wishlist/:productId", customerAuth, removeWishlistItem)

// rotas publicas

router.get("/", async (_req, res) => {
    const database = await checkDatabase()
    res.status(database ? 200 : 503).json({
        success: database,
        status: database ? "ok" : "degraded",
        database,
    })
})

router.get("/products/", getProducts)
router.get("/product/:id/reviews", getProductReviews)
router.post("/product/:id/reviews", reviewLimiter, createProductReview)
router.get("/product/:id", getProductsById)
router.get("/categories", getCategoria)
router.get("/products/category/:category", getProductsByCategory)
router.get("/shipping", getShippingConfig)
router.post("/coupons/validate", couponLimiter, validateCoupon)

router.post("/orders", orderLimiter, optionalCustomerAuth, createOrder)
router.get("/orders/:id", lookupLimiter, optionalCustomerAuth, getPublicOrder)

router.use(handleUploadError)

export default router
