import 'dotenv/config'
import net from 'net'
import pg from 'pg'
import dns from 'dns/promises'

const url = process.env.DATABASE_URL_PUBLIC
if (!url) {
  console.error('Sem DATABASE_URL_PUBLIC')
  process.exit(1)
}

const parsed = new URL(url)
console.log('Host:', parsed.hostname)
console.log('Port:', parsed.port || '5432')

try {
  const lookup = await dns.lookup(parsed.hostname, { all: true })
  console.log('DNS:', lookup)
} catch (e) {
  console.error('DNS FAIL:', e.message)
}

await new Promise((resolve) => {
  const socket = net.connect(
    { host: parsed.hostname, port: Number(parsed.port || 5432), timeout: 8000 },
    () => {
      console.log('TCP: OK')
      socket.end()
      resolve()
    }
  )
  socket.on('error', (err) => {
    console.error('TCP FAIL:', err.message)
    resolve()
  })
  socket.on('timeout', () => {
    console.error('TCP TIMEOUT')
    socket.destroy()
    resolve()
  })
})

async function tryConnect(label, config) {
  const pool = new pg.Pool({
    ...config,
    connectionTimeoutMillis: 12000,
  })
  try {
    const client = await pool.connect()
    const r = await client.query('select now() as now')
    console.log(label, 'OK', r.rows[0].now)
    client.release()
    await pool.end()
    return true
  } catch (err) {
    console.error(label, 'FAIL:', err.message)
    await pool.end().catch(() => {})
    return false
  }
}

await tryConnect('A ssl rejectUnauthorized=false', {
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

await tryConnect('B sslmode=require in URL', {
  connectionString: url.includes('?') ? `${url}&sslmode=require` : `${url}?sslmode=require`,
})

await tryConnect('C discrete fields + ssl', {
  host: process.env.DB_HOST?.includes('.')
    ? process.env.DB_HOST
    : `${process.env.DB_HOST}.virginia-postgres.render.com`,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD?.replace(/^"|"$/g, ''),
  database: process.env.DB_NAME || 'dondoka_8s79',
  port: Number(process.env.DB_PORT || 5432),
  ssl: { rejectUnauthorized: false },
})

await tryConnect('D PUBLIC + ssl true', {
  connectionString: url,
  ssl: true,
})
