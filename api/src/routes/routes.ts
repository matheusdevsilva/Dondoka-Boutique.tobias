import Router from "express";
import { Login, CreateAdmin } from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js"
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


const router = Router()

// rotas privadas

router.get("/admin/products", authMiddleware, getProducts)

router.get("/admin/product/:id", authMiddleware, getProductsById)

router.get("/admin/categories/", authMiddleware, getCategoria)



router.post("/admin/auth", Login)

router.post("/admin/products/add/", authMiddleware, createNewProducts)

router.post("/admin/categories/add", authMiddleware, createCategoria)


router.delete("/admin/products/delete/:id", authMiddleware, DeleteProducts)

router.delete("/admin/categories/delete/:id", authMiddleware, deleteCategoriaById)


router.put("/admin/product/edit/:id", authMiddleware)




router.post("/admin/users/add", authMiddleware, CreateAdmin)


router.get("/admin", authMiddleware, (req, res) => {
    res.json({
        message: "Área protegida"
    })
})



// rotas publicas

router.get("/", (res, req) => {
    req.send("Api Dondoka Botique.Tobias Rodando")
})

router.get("/products/", getProducts)

router.get("/product/:id", getProductsById)

router.get("/products/categoria=:categoria", getProductsByCategory)


export default router