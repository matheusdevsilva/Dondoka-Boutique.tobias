import 'dotenv/config'
import { getDatabaseUrl } from './db-url.mjs'
import pg from 'pg'

const url = getDatabaseUrl()

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

const products = [
  {
    name: 'Vestido Floral Midi',
    description: 'Vestido midi com estampa floral delicada, tecido leve e caimento fluido. Ideal para o dia a dia e ocasiões especiais.',
    price: 189.9,
    discount_price: 149.9,
    category: 'Vestidos',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
  },
  {
    name: 'Vestido Preto Elegante',
    description: 'Clássico vestido preto com modelagem justa e acabamento sofisticado. Peça coringa do guarda-roupa.',
    price: 219.9,
    discount_price: null,
    category: 'Vestidos',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80',
  },
  {
    name: 'Blusa Manga Bufante',
    description: 'Blusa feminina com mangas bufantes e detalhe em laço. Confortável e moderna.',
    price: 99.9,
    discount_price: 79.9,
    category: 'Blusas',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99dbaa?w=800&q=80',
  },
  {
    name: 'Blusa Cropped Linho',
    description: 'Cropped em linho natural, perfeita para looks de verão com saia ou calça jeans.',
    price: 89.9,
    discount_price: null,
    category: 'Blusas',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
  },
  {
    name: 'Calça Wide Leg',
    description: 'Calça wide leg de alfaiataria, cintura alta e tecido com caimento impecável.',
    price: 169.9,
    discount_price: 139.9,
    category: 'Calças',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80',
  },
  {
    name: 'Calça Jeans Skinny',
    description: 'Jeans skinny com elastano, modelagem confortável e lavagem moderna.',
    price: 159.9,
    discount_price: null,
    category: 'Calças',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
  },
  {
    name: 'Saia Plissada Midi',
    description: 'Saia plissada midi em tecido leve, movimento elegante a cada passo.',
    price: 129.9,
    discount_price: 99.9,
    category: 'Saias',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=80',
  },
  {
    name: 'Saia Lápis Marrom',
    description: 'Saia lápis em tom marrom, modelagem clássica para looks de trabalho e passeio.',
    price: 119.9,
    discount_price: null,
    category: 'Saias',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=800&q=80',
  },
  {
    name: 'Conjunto Blazer + Short',
    description: 'Conjunto coordenado com blazer estruturado e short de alfaiataria.',
    price: 279.9,
    discount_price: 229.9,
    category: 'Conjuntos',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
  },
  {
    name: 'Conjunto Tricot Nude',
    description: 'Conjunto de tricot macio em tom nude, perfeito para conforto com estilo.',
    price: 199.9,
    discount_price: null,
    category: 'Conjuntos',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
  },
  {
    name: 'Bolsa Tiracolo Rosa',
    description: 'Bolsa tiracolo compacta na cor rosa da marca, acabamento sofisticado.',
    price: 149.9,
    discount_price: 119.9,
    category: 'Acessórios',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80',
  },
  {
    name: 'Cinto Couro Marrom',
    description: 'Cinto em couro sintético marrom com fivela dourada, combina com toda a coleção.',
    price: 69.9,
    discount_price: null,
    category: 'Acessórios',
    brand: 'Dondoka',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  },
]

try {
  const client = await pool.connect()
  console.log('CONNECT: OK')

  const cats = await client.query('SELECT id, name FROM categories')
  const byName = Object.fromEntries(cats.rows.map((c) => [c.name, c.id]))

  let inserted = 0
  for (const product of products) {
    const categoryId = byName[product.category]
    if (!categoryId) {
      console.warn('Categoria não encontrada:', product.category)
      continue
    }

    const exists = await client.query(
      'SELECT id FROM products WHERE name = $1 LIMIT 1',
      [product.name]
    )
    if (exists.rowCount > 0) {
      console.log('SKIP:', product.name)
      continue
    }

    await client.query(
      `INSERT INTO products
        (name, description, price, discount_price, category_id, brand, image_url, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE)`,
      [
        product.name,
        product.description,
        product.price,
        product.discount_price,
        categoryId,
        product.brand,
        product.image_url,
      ]
    )
    inserted++
    console.log('ADD:', product.name)
  }

  const total = await client.query('SELECT COUNT(*)::int AS total FROM products')
  console.log(`DONE: +${inserted} | total=${total.rows[0].total}`)

  client.release()
  await pool.end()
  process.exit(0)
} catch (err) {
  console.error('FAIL:', err instanceof Error ? err.message : err)
  await pool.end().catch(() => {})
  process.exit(1)
}
