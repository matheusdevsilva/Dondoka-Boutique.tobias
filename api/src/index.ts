import 'dotenv/config'

import express from "express";
import cors from "cors"
import router from "./routes/routes.js";



const app = express()

const PORT: number = Number(process.env.PORT) || 5000

app.use(cors())
app.use(express.json())

app.use("/api", router)


app.listen(PORT, "0.0.0.0", () => {
    console.log("servidor dondoka botique.tobias rodando na porta:", PORT)
})
