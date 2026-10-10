import { Pool } from 'pg';

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

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : false,
});

pool.connect()
  .then(client => {
    console.log("✅ Banco de dados conectado com sucesso!")
    client.release()
  })
  .catch((err: unknown) => {
    console.error("❌ Erro ao conectar no banco:", err)
  })

export default pool
