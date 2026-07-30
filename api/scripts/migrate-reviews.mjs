import 'dotenv/config'
import pg from 'pg'

const url = process.env.DATABASE_URL_PUBLIC
if (!url) {
  console.error('Sem DATABASE_URL_PUBLIC')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

try {
  const client = await pool.connect()
  await client.query(`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      author_name VARCHAR(120) NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('REVIEWS: OK')
  client.release()
  await pool.end()
  process.exit(0)
} catch (err) {
  console.error('FAIL:', err instanceof Error ? err.message : err)
  await pool.end().catch(() => {})
  process.exit(1)
}
