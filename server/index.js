import express from 'express';
import cors from 'cors';
import { createDb } from './lib/db.js';
import { buildBootstrapPayload } from './lib/bootstrap.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const DB_PATH = process.env.DB_PATH || 'data/app.sqlite';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/bootstrap', (req, res) => {
  const db = createDb(DB_PATH);
  try {
    const payload = buildBootstrapPayload(db);
    res.json(payload);
  } finally {
    db.close();
  }
});

// Importante: por enquanto sem endpoints de escrita (POST/PUT/DELETE).

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] http://localhost:${PORT} (db: ${DB_PATH})`);
});
