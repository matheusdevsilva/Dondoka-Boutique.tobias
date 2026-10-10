# API Dondoka Boutique

Backend Express 5 + PostgreSQL da loja.

## Rodar local

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL, JWT_SECRET e ADMIN_INITIAL_PASSWORD
npm run db:setup       # cria/atualiza tabelas e índices; cria o primeiro admin
npm run db:seed        # opcional: produtos de exemplo
npm run dev
```

Porta padrão: `5000`. Com `NODE_ENV=production` a API exige `JWT_SECRET` (32+ caracteres) e `CORS_ORIGIN`.

## Variáveis de ambiente

O arquivo `.env.example` descreve todas. As principais:

| Variável | Uso |
| --- | --- |
| `JWT_SECRET` | Obrigatória. Gere com `openssl rand -hex 32`. |
| `DATABASE_URL` | Conexão Postgres (ou `DATABASE_URL_PUBLIC` / `DATABASE_URL_PRIVATE`). |
| `DATABASE_SSL`, `DATABASE_SSL_CA` | SSL verificado por padrão em hosts remotos. |
| `ADMIN_INITIAL_USERNAME`, `ADMIN_INITIAL_PASSWORD` | Primeiro admin, criado pelo `db:setup` quando a tabela está vazia. |
| `CORS_ORIGIN` | Origens do front separadas por vírgula. Também valida o `Origin` das requisições que alteram dados. |
| `COOKIE_SAMESITE`, `COOKIE_SECURE` | Cookie de sessão. Padrão em produção: `none` + `Secure`. Use `lax` quando front e API estão na mesma origem. |
| `TRUST_PROXY` | Quantidade de proxies na frente da API (IP usado no rate limit). |
| `SHIPPING_FEE` | Frete de entrega em reais. |

## Autenticação

- Admin e cliente recebem a sessão em cookie `httpOnly` (o JWT nunca fica no `localStorage`).
- Toda requisição que altera dados precisa vir de uma origem do `CORS_ORIGIN` e enviar o header `X-Requested-With: XMLHttpRequest` (o front já faz isso no `services/api.ts`).
- Cookies `Secure` só trafegam em HTTPS; `localhost` é a exceção dos navegadores.
- Login, cadastro, cupom, pedido e avaliações têm rate limit em memória por IP.

## Regras de negócio no servidor

- Preço, desconto, nome e estoque dos itens vêm do banco; o cliente envia só `id`, `size` e `quantity`.
- O pedido baixa o estoque na mesma transação. Cancelar devolve; reativar baixa de novo (409 se faltar estoque).
- Produtos com estoque 0 não podem ser comprados.
- Categoria com produtos não pode ser excluída (409).
- Uploads aceitam só JPEG, PNG e WebP (até 5 MB, 10 arquivos), com nome gerado pelo servidor.

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
   - `JWT_SECRET` e `ADMIN_INITIAL_PASSWORD`
6. Redeploy do front (para gravar `VITE_*` no build) e da API.

O `preDeployCommand` da API roda `npm run postdeploy` (= `db:setup`) e cria as tabelas.

### Observações

- Front e API em domínios diferentes usam cookie `SameSite=None; Secure`. Navegadores com bloqueio de cookies de terceiros podem recusar a sessão; um domínio próprio com front e API no mesmo site evita isso.
- Uploads de imagem ficam em disco local da API — no plano free do Render o disco **não é persistente**. Para produção, use Cloudinary/S3.
- O rate limit fica em memória: com mais de uma instância da API, cada uma conta separado.

## Endpoints principais

Todos sob `/api`.

### Públicos
- `GET /` — health
- `GET /products/` — lista com filtros: `q`, `category`, `exclude`, `promo=true`, `size`, `min_price`, `max_price`, `ids=1,2,3`, `sort=new|asc|desc`, `page`, `limit` (máx. 50). Com paginação, a resposta traz `meta`.
- `GET /product/:id`, `GET /product/:id/reviews`, `POST /product/:id/reviews`
- `GET /categories`, `GET /shipping`
- `POST /coupons/validate` — `{ code, items }`; o desconto é calculado no servidor
- `POST /orders` — `{ customer_name, customer_phone, items: [{ id, size, quantity }], shipping_method, shipping_address?, coupon_code?, customer_notes? }`
- `GET /orders/:id?phone=` — consulta do pedido pelo cliente (telefone obrigatório para convidados)
- `GET /uploads/:file` — imagens enviadas

### Cliente (cookie `dondoka_customer`)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET /auth/orders`
- `GET|POST /auth/wishlist`, `POST /auth/wishlist/sync`, `DELETE /auth/wishlist/:productId`

### Admin (cookie de sessão admin)
- `POST /admin/auth` — login `{ username, password }`; `POST /admin/logout`; `GET /admin/me`
- `GET /admin/stats`
- `GET /admin/products`, `GET /admin/product/:id`
- `POST /admin/products/add/` — multipart (`images` + campos)
- `PUT /admin/product/edit/:id`, `DELETE /admin/products/delete/:id`
- `GET /admin/categories/`, `POST /admin/categories/add`, `PUT /admin/categories/edit/:id`, `DELETE /admin/categories/delete/:id`
- `GET /admin/orders`, `GET /admin/orders/:id`, `PUT /admin/orders/:id/status`
- `GET|PUT|DELETE /admin/customers/:id`, `GET /admin/customers`
- `GET|POST /admin/coupons`, `PUT|DELETE /admin/coupons/:id`
- `POST /admin/users/add`, `PUT /admin/users/edit/:id`, `DELETE /admin/users/:id`
