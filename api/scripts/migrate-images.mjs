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
    ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]'
  `)

  await client.query(`
    UPDATE products
    SET images = CASE
      WHEN image_url IS NOT NULL AND image_url <> ''
        THEN json_build_array(image_url)::text
      ELSE COALESCE(NULLIF(images, ''), '[]')
    END
    WHERE images IS NULL
       OR images = ''
       OR images = '[]'
       OR images = 'null'
  `)

  const count = await client.query(
    `SELECT COUNT(*)::int AS total
     FROM products
     WHERE images IS NOT NULL AND images <> '[]'`
  )

  console.log(`IMAGES: ${count.rows[0].total} produtos com galeria`)
  client.release()
  await pool.end()
  console.log('DONE')
  process.exit(0)
} catch (err) {
  console.error('FAIL:', err instanceof Error ? err.message : err)
  await pool.end().catch(() => {})
  process.exit(1)
}
