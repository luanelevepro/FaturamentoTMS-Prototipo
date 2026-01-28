import express from 'express';
import cors from 'cors';
import { openDb as createDb } from './lib/db.js';
import { buildBootstrapPayload } from './lib/bootstrap.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const DB_PATH = process.env.DB_PATH || 'data/app.sqlite';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/bootstrap', async (req, res) => {
  let db;
  try {
    db = await createDb(DB_PATH);
    const payload = await buildBootstrapPayload(db);
    res.json(payload);
  } catch (err) {
    console.error('[api] Bootstrap failed:', err);
    res.status(500).json({ error: 'Bootstrap failed' });
  } finally {
    if (db) await db.close();
  }
});

// Importante: Endpoint de Sincronização (Força atualização da Torre de Controle)
import { syncTripsToSchedule } from './lib/sync.js';

app.post('/api/sync', async (req, res) => {
  let db;
  try {
    db = await createDb(DB_PATH);
    const result = await syncTripsToSchedule(db);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (db) await db.close();
  }
});

app.get('/api/cronograma', async (req, res) => {
  let db;
  try {
    const { start, end } = req.query;
    db = await createDb(DB_PATH);

    // Filtro básico por data (se fornecido)
    // Se não, traz tudo (para protótipo ok, em prod limitaria)
    let query = `
      SELECT * FROM tmsvc_cronograma 
      ORDER BY veiculo_placa, data_inicio
    `;
    const params = [];

    if (start && end) {
      query = `
        SELECT * FROM tmsvc_cronograma 
        WHERE data_inicio >= ? AND data_fim <= ?
        ORDER BY veiculo_placa, data_inicio
      `;
      params.push(start, end);
    }

    const items = await db.all(query, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (db) await db.close();
  }
});

// Importante: por enquanto sem endpoints de escrita (POST/PUT/DELETE).

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] http://localhost:${PORT} (db: ${DB_PATH})`);
});
