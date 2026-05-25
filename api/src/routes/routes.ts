import Router from "express";
import { Login, CreateAdmin, EditAdmin } from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js"
import multer from "multer";

import {
    getProducts,
    getProductsById,
    createNewProducts,
    DeleteProducts,
    getProductsByCategory,
    getCategoria,
    deleteCategoriaById,
    createCategoria
} from "../controllers/productsController.js"

const upload = multer({
    storage: multer.memoryStorage()
});

const router = Router()

// rotas privadas

// rotas get 
router.get("/admin/products", authMiddleware, getProducts)

router.get("/admin/product/:id", authMiddleware, getProductsById)

router.get("/admin/categories/", authMiddleware, getCategoria)


// rotas post
router.post("/admin/auth", Login)

router.post("/admin/users/add", authMiddleware, CreateAdmin)

router.post("/admin/products/add/", authMiddleware,upload.array("images"), createNewProducts)

router.post("/admin/categories/add", authMiddleware, createCategoria)


// rotas  delete 

router.delete("/admin/products/delete/:id", authMiddleware, DeleteProducts)

router.delete("/admin/categories/delete/:id", authMiddleware, deleteCategoriaById)

// rota put
router.put("/admin/product/edit/:id", authMiddleware)
router.put("/admin/users/edit/:id",authMiddleware, EditAdmin)








// rotas publicas

router.get("/", (res, req) => {
    req.send("Api Dondoka Botique.Tobias Rodando")
})

router.get("/products/", getProducts)

router.get("/product/:id", getProductsById)

router.get("/products/categoria=:categoria", getProductsByCategory)
router.get("/")


export default router