# Protótipo Torre de Controle (Viagens e Cargas)

Este repositório é um **host de demo** (Vite + React) para evolução rápida das telas de **Viagens/Cargas** (Torre de Controle).
O objetivo é entregar para o projeto oficial um conjunto de telas **plug-and-play**, com contrato de dados estável e handlers.

## Plug-and-play (entrada única)

No protótipo, o entrypoint recomendado para importações é:

- `plugin/trips` (reexporta screens, shell, tipos e contrato de bootstrap)

No projeto oficial, você pode copiar os arquivos indicados em `INTEGRATION_GUIDE.md` e manter o mesmo entrypoint.

## Rodar local (UI + API opcional)

**Pré-requisitos**: Node.js

1) Instalar dependências:

`npm install`

2) Subir backend (API) **opcional** (SQLite, leitura):

`npm run dev:api`

3) Subir frontend (Vite):

`npm run dev:ui`

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

## Integração no projeto oficial

Veja `INTEGRATION_GUIDE.md`.
