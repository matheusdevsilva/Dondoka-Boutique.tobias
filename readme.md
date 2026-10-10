# Dondoka Boutique

Loja online da Dondoka Boutique: vitrine com sacola, favoritos, conta do cliente e checkout via WhatsApp, mais um painel administrativo.

- `dondoka/` — front React + Vite ([README](dondoka/README.md))
- `api/` — API Express + PostgreSQL ([README](api/Readme.md))
- `docker-compose.yml` — Postgres, migração, API e nginx servindo o front
- `render.yaml` — Blueprint do Render

## Desenvolvimento

```bash
# terminal 1
cd api && npm install && cp .env.example .env && npm run db:setup && npm run dev

# terminal 2
cd dondoka && npm install && npm run dev
```

## Docker

```bash
cp .env.example .env   # preencha POSTGRES_PASSWORD, JWT_SECRET e ADMIN_INITIAL_PASSWORD
docker compose up --build
```

A loja abre em `http://localhost:5173`. O nginx serve o front e repassa `/api` e `/uploads` para a API, que fica só na rede interna. Front e API ficam na mesma origem, então o cookie de sessão usa `SameSite=Lax`.

Em produção, coloque um proxy com HTTPS na frente e defina `PUBLIC_URL` com o endereço público. O cookie de sessão é `Secure`, então só trafega em HTTPS (o `localhost` é exceção nos navegadores).

Para cadastrar produtos de exemplo:

```bash
docker compose run --rm migrate node scripts/seed-products.mjs
```
