import express from "express";
import dotenv from "dotenv"
import cors from "cors"
import router from "./routes/Routes.js";

dotenv.config()

const app = express()
const PORT: number = Number(process.env.PORT) || 5000

app.use(cors())
app.use("/api", router)


app.listen(PORT, "0.0.0.0", () => {
    console.log("servidor dondoka botique.tobias rodando na porta:", PORT)
})
