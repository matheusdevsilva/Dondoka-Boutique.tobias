import 'dotenv/config'
import pg from 'pg'

const base = process.env.DATABASE_URL_PUBLIC
if (!base) process.exit(1)

const variants = [
  `${base}?sslmode=require&uselibpqcompat=true`,
  `${base}?ssl=true`,
  base,
]

for (const connectionString of variants) {
  const label = connectionString.includes('?')
    ? connectionString.slice(connectionString.indexOf('?'))
    : '(plain)'
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })
  try {
    await client.connect()
    const r = await client.query('select version()')
    console.log('OK', label)
    console.log(r.rows[0].version)
    await client.end()
    process.exit(0)
  } catch (err) {
    console.error('FAIL', label, '-', err.message)
    console.error(' code:', err.code, 'severity:', err.severity)
    try { await client.end() } catch {}
  }
}

process.exit(1)
