import  Router  from "express";
import Login from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js"


const router = Router()


router.get("/",(res,req)=>{
    req.send("Api Dondoka Botique.Tobias Rodando")
})


router.post("/admin/auth",Login)

router.get("/admin", authMiddleware, (req, res) => {
    res.json({
        message: "Área protegida"
    })
})

export default router