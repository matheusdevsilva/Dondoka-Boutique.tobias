import { Pool } from 'pg';


/*const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});*/


/*const pool = new Pool({
  connectionString: process.env.DATABASE_URL_PRIVATE,
  ssl: {
    rejectUnauthorized: false, 
  },
});*/


if (!process.env.DATABASE_URL_PRIVATE) {
  throw new Error("DATABASE_URL não definida");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_PRIVATE,
  ssl: {
    rejectUnauthorized: false,
  },
});



pool.connect()
  .then(client => {
    console.log("✅ Banco de dados conectado com sucesso!")

    client.release() // importante liberar a conexão
  })
  .catch(err => {
    console.error("❌ Erro ao conectar no banco:", err)
  })

export default pool