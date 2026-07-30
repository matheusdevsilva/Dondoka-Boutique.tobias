import 'dotenv/config'
import { getDatabaseUrl } from './db-url.mjs'
import pg from 'pg'

const url = getDatabaseUrl()

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

try {
  const client = await pool.connect()
  console.log('CONNECT: OK')

  await client.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sizes TEXT DEFAULT 'P,M,G,GG';

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(160) NOT NULL,
      customer_phone VARCHAR(40) NOT NULL,
      customer_notes TEXT,
      total NUMERIC(10,2) NOT NULL,
      status VARCHAR(40) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name VARCHAR(200) NOT NULL,
      size VARCHAR(20),
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(10,2) NOT NULL
    );
  `)

  await client.query(`
    UPDATE products
    SET stock = 20,
        sizes = COALESCE(NULLIF(sizes, ''), 'P,M,G,GG')
    WHERE stock IS NULL OR stock = 0
  `)

  console.log('MIGRATION: orders + stock/sizes OK')
  client.release()
  await pool.end()
  process.exit(0)
} catch (err) {
  console.error('FAIL:', err instanceof Error ? err.message : err)
  await pool.end().catch(() => {})
  process.exit(1)
}
