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

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

pool.connect()
  .then(client => {
    console.log("✅ Banco de dados conectado com sucesso!")
    client.release()
  })
  .catch(err => {
    console.error("❌ Erro ao conectar no banco:", err)
  })

export default pool
