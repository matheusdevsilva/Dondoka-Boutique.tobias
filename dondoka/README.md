# Loja Dondoka Boutique (front)

React 19 + React Router 7 + Vite + TypeScript (strict). Inclui a vitrine e o painel `/admin`.

## Rodar local

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
```

Sem `VITE_API_URL`, o front chama `/api` e o Vite faz proxy para `VITE_PROXY_TARGET` (padrão `http://localhost:5000`). Assim front e API ficam na mesma origem e o cookie de sessão funciona com `SameSite=Lax`.

## Variáveis

| Variável | Uso |
| --- | --- |
| `VITE_API_URL` | URL da API com `/api`. Padrão: `/api` (mesma origem). |
| `VITE_PROXY_TARGET` | Destino do proxy `/api` e `/uploads` no `npm run dev`. |
| `VITE_WHATSAPP` | Número da loja com DDI, só dígitos. |
| `VITE_INSTAGRAM` | URL do perfil. |

As variáveis `VITE_*` entram no build: mude e gere o build de novo.

## Scripts

- `npm run lint` — ESLint (inclui as regras do React Compiler)
- `npm run build` — `tsc -b` + build do Vite em `dist/`
- `npm run preview` — serve o `dist/`

## Estrutura

- `src/routes` — rotas com carregamento sob demanda; a loja compartilha um único layout
- `src/components` — Header, sacola, checkout (carregado só ao finalizar), `Modal`, `Seo`
- `src/context` — sacola e favoritos (sincronizados entre abas e com a conta)
- `src/admin` — painel; a sessão vem de `GET /api/admin/me`
- Formulários de checkout, conta e login admin usam react-hook-form + Zod
