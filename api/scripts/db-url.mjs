import pg from 'pg'

/** Resolve connection string for local Render / scripts */
export function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_PUBLIC ||
    process.env.DATABASE_URL_PRIVATE ||
    ""

  if (!url) {
    console.error(
      "Defina DATABASE_URL (Render) ou DATABASE_URL_PUBLIC / DATABASE_URL_PRIVATE"
    )
    process.exit(1)
  }

  return url
}

function shouldUseSsl(connectionUrl) {
  if (process.env.DATABASE_SSL === "false") return false
  if (process.env.DATABASE_SSL === "true") return true

  try {
    const host = new URL(connectionUrl).hostname
    const localHosts = new Set(["localhost", "127.0.0.1", "::1", "db", "postgres"])
    return !localHosts.has(host)
  } catch {
    return !connectionUrl.includes("localhost")
  }
}

/** Verifica o certificado por padrão; DATABASE_SSL_CA ou DATABASE_SSL_REJECT_UNAUTHORIZED=false ajustam. */
export function sslConfig(connectionUrl) {
  if (!shouldUseSsl(connectionUrl)) return false
  return {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
    ca: process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n") || undefined,
  }
}

export function createPool() {
  const url = getDatabaseUrl()
  return new pg.Pool({ connectionString: url, ssl: sslConfig(url) })
}
