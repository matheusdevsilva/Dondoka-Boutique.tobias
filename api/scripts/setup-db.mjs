import 'dotenv/config'
import { getDatabaseUrl } from './db-url.mjs'
import pg from 'pg'
import bcrypt from 'bcrypt'

const url = getDatabaseUrl()

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

const categories = [
  'Vestidos',
  'Blusas',
  'Calças',
  'Saias',
  'Conjuntos',
  'Acessórios',
]

try {
  const client = await pool.connect()
  console.log('CONNECT: OK')

  await client.query(`
    CREATE TABLE IF NOT EXISTS admin (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      username VARCHAR(80) UNIQUE NOT NULL,
      email VARCHAR(160) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(40) DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      email VARCHAR(160) UNIQUE NOT NULL,
      phone VARCHAR(40) NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL,
      discount_price NUMERIC(10,2),
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      brand VARCHAR(120),
      image_url TEXT,
      images TEXT DEFAULT '[]',
      is_active BOOLEAN DEFAULT TRUE,
      stock INTEGER DEFAULT 0,
      sizes TEXT DEFAULT 'P,M,G,GG',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]';

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      customer_name VARCHAR(160) NOT NULL,
      customer_phone VARCHAR(40) NOT NULL,
      customer_notes TEXT,
      total NUMERIC(10,2) NOT NULL,
      status VARCHAR(40) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name VARCHAR(200) NOT NULL,
      size VARCHAR(20),
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(10,2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (customer_id, product_id)
    );

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

    CREATE TABLE IF NOT EXISTS product_reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      author_name VARCHAR(120) NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  console.log('SCHEMA: OK')

  for (const name of categories) {
    await client.query(
      `INSERT INTO categories (name) VALUES ($1)
       ON CONFLICT (name) DO NOTHING`,
      [name]
    )
  }

  const cats = await client.query('SELECT id, name FROM categories ORDER BY id')
  console.log('CATEGORIES:')
  for (const row of cats.rows) console.log(` - ${row.id}: ${row.name}`)

  const adminCount = await client.query('SELECT COUNT(*)::int AS total FROM admin')
  if (adminCount.rows[0].total === 0) {
    const hash = await bcrypt.hash('admin123', 10)
    await client.query(
      `INSERT INTO admin (name, username, email, password, role)
       VALUES ($1, $2, $3, $4, $5)`,
      ['Admin Dondoka', 'admin', 'admin@dondoka.com', hash, 'admin']
    )
    console.log('ADMIN: criado (username: admin / senha: admin123)')
  } else {
    console.log('ADMIN: já existe')
  }

  client.release()
  await pool.end()
  console.log('DONE')
  process.exit(0)
} catch (err) {
  console.error('FAIL:', err instanceof Error ? err.message : err)
  await pool.end().catch(() => {})
  process.exit(1)
}
