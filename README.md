<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xZy2ocTvPWF6B0H7ko2WTGU2hPvr9dRb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## SQLite local (para trabalhar com dados “quase reais”)

Este projeto agora suporta um **SQLite local** + um **mini backend de leitura** (Express) que expõe o endpoint `GET /api/bootstrap` consumido pelo front.

### 1) Criar o arquivo `.sqlite` (seed)

Rode:

`npm run db:setup`

Isso cria `data/app.sqlite` usando:
- `server/db/schema.sql`
- `server/db/seed.sql`

### 2) Subir o backend (API)

Em um terminal:

`npm run dev:api`

Por padrão ele sobe em `http://localhost:3001` e lê `data/app.sqlite`.

### 3) Subir o front (Vite)

Em outro terminal:

`npm run dev:ui`

O Vite faz proxy de `/api/*` para `http://localhost:3001` (configurado em `vite.config.ts`).

### Observações

- O backend está **somente leitura** por enquanto (sem POST/PUT/DELETE).
- Se o backend não estiver rodando, o front faz **fallback automático** para os mocks em `mocks.ts`.
