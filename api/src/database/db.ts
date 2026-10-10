import { Pool, type PoolConfig } from 'pg';

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_PUBLIC ||
  process.env.DATABASE_URL_PRIVATE;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL, DATABASE_URL_PUBLIC ou DATABASE_URL_PRIVATE não definida"
  );
}

function shouldUseSsl(url: string): boolean {
  if (process.env.DATABASE_SSL === "false") return false;
  if (process.env.DATABASE_SSL === "true") return true;

  try {
    const host = new URL(url).hostname;
    const localHosts = new Set(["localhost", "127.0.0.1", "::1", "db", "postgres"]);
    return !localHosts.has(host);
  } catch {
    return !url.includes("localhost");
  }
}

function sslConfig(url: string): PoolConfig["ssl"] {
  if (!shouldUseSsl(url)) return false;
  return {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
    ca: process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n") || undefined,
  };
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslConfig(databaseUrl),
  max: Number(process.env.DATABASE_POOL_MAX) || 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  console.error("Erro inesperado no pool do banco:", err);
});

export async function checkDatabase(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export default pool
