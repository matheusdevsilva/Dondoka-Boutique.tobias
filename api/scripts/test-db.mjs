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
  connectionTimeoutMillis: 20000,
})

try {
  const client = await pool.connect()
  console.log('CONNECT: OK')

  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `)
  console.log('TABLES:', tables.rows.map((r) => r.table_name).join(', ') || '(none)')

  const hasCategories = tables.rows.some((r) => r.table_name === 'categories')
  const hasProducts = tables.rows.some((r) => r.table_name === 'products')

  if (hasCategories) {
    const cats = await client.query('SELECT id, name FROM categories ORDER BY id')
    console.log('CATEGORIES:', cats.rowCount)
    for (const row of cats.rows) console.log(` - ${row.id}: ${row.name}`)
  } else {
    console.log('CATEGORIES: table missing')
  }

  if (hasProducts) {
    const prods = await client.query('SELECT COUNT(*)::int AS total FROM products')
    console.log('PRODUCTS:', prods.rows[0].total)
  }

  client.release()
  await pool.end()
  process.exit(0)
} catch (err) {
  console.error('CONNECT FAIL:', err instanceof Error ? err.message : err)
  await pool.end().catch(() => {})
  process.exit(1)
}
