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
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code VARCHAR(40) UNIQUE NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'percent',
      value NUMERIC(10,2) NOT NULL,
      min_order NUMERIC(10,2) DEFAULT 0,
      max_uses INTEGER,
      used_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(40) DEFAULT 'pickup',
      ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS shipping_address TEXT,
      ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(40),
      ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);
  `)

  // seed welcome coupon if empty
  const count = await client.query('SELECT COUNT(*)::int AS total FROM coupons')
  if (count.rows[0].total === 0) {
    await client.query(
      `INSERT INTO coupons (code, type, value, min_order, max_uses, is_active)
       VALUES ('DONDOKA10', 'percent', 10, 0, NULL, TRUE)`
    )
    console.log('COUPON: DONDOKA10 (10%) criado')
  }

  console.log('CHECKOUT FIELDS + COUPONS: OK')
  client.release()
  await pool.end()
  console.log('DONE')
  process.exit(0)
} catch (err) {
  console.error('FAIL:', err instanceof Error ? err.message : err)
  await pool.end().catch(() => {})
  process.exit(1)
}
