import 'dotenv/config'

import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import cors from "cors"
import helmet from "helmet"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { IS_PRODUCTION } from "./config.js"
import router from "./routes/routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express()

const PORT: number = Number(process.env.PORT) || 5000
const uploadsDir = path.join(__dirname, "../uploads")
fs.mkdirSync(uploadsDir, { recursive: true })

const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
]
  .flatMap((value) => (value ? value.split(",") : []))
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean)

if (IS_PRODUCTION && configuredOrigins.length === 0) {
  throw new Error("Defina CORS_ORIGIN ou FRONTEND_URL com a URL da loja.")
}

const allowedOrigins = new Set(
  configuredOrigins.length ? configuredOrigins : ["http://localhost:5173"]
)

/**
 * Sessão vai em cookie, então requisições que alteram dados exigem origem permitida
 * e o cabeçalho X-Requested-With (formulários de outros sites não conseguem enviá-lo).
 */
const csrfGuard: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next()

  const origin = req.headers.origin
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ success: false, message: "Origem não permitida" })
  }
  if (req.headers["x-requested-with"] !== "XMLHttpRequest") {
    return res.status(403).json({ success: false, message: "Requisição inválida" })
  }
  return next()
}

app.disable("x-powered-by")
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? (IS_PRODUCTION ? 1 : 0)))

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
)
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin))
    },
    credentials: true,
  })
)
app.use(express.json({ limit: "100kb" }))
app.use(
  "/uploads",
  express.static(uploadsDir, {
    dotfiles: "deny",
    index: false,
    maxAge: "30d",
    immutable: true,
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff")
      res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; sandbox")
    },
  })
)

app.use("/api", csrfGuard, router)

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Rota não encontrada" })
})

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = Number(err?.status || err?.statusCode) || 500
  if (status >= 500) console.error(err)
  res.status(status).json({
    success: false,
    message: status === 413 ? "Requisição grande demais" : status < 500 ? "Requisição inválida" : "Erro interno",
  })
}
app.use(errorHandler)

app.listen(PORT, "0.0.0.0", () => {
    console.log("servidor dondoka botique.tobias rodando na porta:", PORT)
})
