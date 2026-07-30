# API Dondoka Boutique

Backend Express + PostgreSQL da loja.

## Rodar local

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL / JWT_SECRET
npm run db:setup
npm run dev
```

Porta padrão: `5000`

## Variáveis de ambiente

```env
PORT=5000
JWT_SECRET=sua_chave
DATABASE_URL=postgresql://...          # Render usa este nome
# ou local:
DATABASE_URL_PUBLIC=postgresql://...
DATABASE_URL_PRIVATE=postgresql://...
CORS_ORIGIN=https://seu-front.onrender.com
FRONTEND_URL=https://seu-front.onrender.com
SHIPPING_FEE=15
```

## Deploy no Render (API + banco + front)

O arquivo `render.yaml` na raiz do repositório sobe:

1. **PostgreSQL** (`dondoka-db`)
2. **API** (`dondoka-api`) — Node, pasta `api/`
3. **Front** (`dondoka-web`) — static Vite, pasta `dondoka/`

### Passos

1. Push do código no GitHub.
2. No [Render](https://dashboard.render.com): **New → Blueprint** → selecione o repo.
3. Confirme os 3 serviços do `render.yaml`.
4. Depois do primeiro deploy da API, abra o serviço **dondoka-web** e defina:
   - `VITE_API_URL` = `https://SEU-API.onrender.com/api`
5. No serviço **dondoka-api**, defina:
   - `CORS_ORIGIN` = `https://SEU-FRONT.onrender.com`
   - `FRONTEND_URL` = mesma URL do front
6. Redeploy do front (para gravar `VITE_*` no build) e da API.

O `startCommand` da API roda `postdeploy` (= `db:setup`) e depois sobe o servidor (plano free não aceita `preDeployCommand`).

Opcional após o banco estar ok (Shell do Render na API):

```bash
npm run db:seed
```

### Observações

- Uploads de imagem ficam em disco local da API — no plano free do Render o disco **não é persistente**. Para produção, use Cloudinary/S3.
- Plano free de Postgres no Render pode exigir upgrade; se o Blueprint falhar no banco, crie um PostgreSQL manual e ligue `DATABASE_URL` na API.
- WhatsApp/Instagram do front vêm de `VITE_WHATSAPP` e `VITE_INSTAGRAM`.

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
