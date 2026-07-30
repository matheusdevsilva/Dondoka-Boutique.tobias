import 'dotenv/config'

import express from "express";
import cors from "cors"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import router from "./routes/routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express()

const PORT: number = Number(process.env.PORT) || 5000
const uploadsDir = path.join(__dirname, "../uploads")
fs.mkdirSync(uploadsDir, { recursive: true })

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
]
  .flatMap((value) => (value ? value.split(",") : []))
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors(
    allowedOrigins.length
      ? {
          origin(
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void
          ) {
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true)
              return
            }
            callback(null, false)
          },
          credentials: true,
        }
      : undefined
  )
)
app.use(express.json())
app.use("/uploads", express.static(uploadsDir))

app.use("/api", router)

app.listen(PORT, "0.0.0.0", () => {
    console.log("servidor dondoka botique.tobias rodando na porta:", PORT)
})
