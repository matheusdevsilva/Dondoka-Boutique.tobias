import 'dotenv/config'

import express from "express";
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import router from "./routes/routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express()

const PORT: number = Number(process.env.PORT) || 5000

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

app.use("/api", router)


app.listen(PORT, "0.0.0.0", () => {
    console.log("servidor dondoka botique.tobias rodando na porta:", PORT)
})
