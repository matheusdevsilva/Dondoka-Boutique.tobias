# API Dondoka Boutique

Backend Express + PostgreSQL da loja.

## Rodar

```bash
npm install
npm run dev
```

Porta padrão: `5000`

## Variáveis de ambiente

```env
PORT=5000
JWT_SECRET=sua_chave
DATABASE_URL_PUBLIC=postgresql://...
# ou
DATABASE_URL_PRIVATE=postgresql://...
```

## Endpoints principais

### Públicos
- `GET /api/` — health
- `GET /api/products/?page=1&limit=12` — listar (paginado)
- `GET /api/product/:id` — detalhe
- `GET /api/products/category/:category` — filtrar por categoria
- `GET /uploads/:file` — imagens enviadas

### Admin (Bearer JWT)
- `POST /api/admin/auth` — login `{ username, password }`
- `GET /api/admin/products`
- `POST /api/admin/products/add/` — multipart (`images` + campos)
- `PUT /api/admin/product/edit/:id`
- `DELETE /api/admin/products/delete/:id`
- `GET /api/admin/categories/`
- `POST /api/admin/categories/add`
- `DELETE /api/admin/categories/delete/:id`
- `POST /api/admin/users/add`
- `PUT /api/admin/users/edit/:id`
