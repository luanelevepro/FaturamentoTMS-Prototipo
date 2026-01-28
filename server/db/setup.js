import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const ROOT = process.cwd();
const DB_PATH = process.env.DB_PATH || path.join(ROOT, 'data', 'app.sqlite');
const SCHEMA_PATH = path.join(ROOT, 'server', 'db', 'schema.sql');
const SEED_PATH = path.join(ROOT, 'server', 'db', 'seed.sql');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readSql(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function splitSqlValueList(listStr) {
  // Split por vírgula, respeitando strings SQL com aspas simples e escapes por ''.
  const out = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < listStr.length; i++) {
    const ch = listStr[i];
    if (ch === "'") {
      if (inQuote && listStr[i + 1] === "'") {
        // escape de aspas: '' dentro de string
        cur += "''";
        i++;
        continue;
      }
      inQuote = !inQuote;
      cur += ch;
      continue;
    }
    if (ch === ',' && !inQuote) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim().length) out.push(cur.trim());
  return out;
}

function unquoteSqlString(v) {
  const s = String(v || '').trim();
  if (s.toUpperCase() === 'NULL') return null;
  if (s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
}

function quoteSqlString(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sanitizeAvailableDocumentsSeed(seedSql) {
  const lines = seedSql.split(/\r?\n/);
  const re = /^INSERT INTO available_documents\s*\(([^)]+)\)\s*VALUES\s*\((.*)\);\s*$/i;

  return lines
    .map(line => {
      const m = line.match(re);
      if (!m) return line;

      const columns = m[1].split(',').map(s => s.trim());
      const values = splitSqlValueList(m[2]);
      if (columns.length !== values.length) return line; // fallback: mantém original

      const idxNumber = columns.findIndex(c => c.toLowerCase() === 'number');
      const idxType = columns.findIndex(c => c.toLowerCase() === 'type');
      const idxControl = columns.findIndex(c => c.toLowerCase() === 'control_number');

      if (idxNumber < 0 || idxType < 0) return line;

      const rawNumber = unquoteSqlString(values[idxNumber]);
      const type = unquoteSqlString(values[idxType]);

      let isSub = 0;
      let cleanNumber = rawNumber;

      if (typeof rawNumber === 'string') {
        const n = rawNumber.trim();
        if (/^EXT-/i.test(n)) {
          isSub = 1;
          const parts = n.split('-');
          cleanNumber = parts[parts.length - 1] || n;
        } else if (/^NF-/i.test(n)) {
          cleanNumber = n.replace(/^NF-/i, '');
        } else if (/^CTe-/i.test(n)) {
          cleanNumber = n.replace(/^CTe-/i, '');
        }
      }

      // Aplica regras:
      // - number: apenas número (sem prefixo)
      // - control_number: sempre NULL
      values[idxNumber] = quoteSqlString(cleanNumber);
      if (idxControl >= 0) values[idxControl] = 'NULL';

      // - is_subcontracted: adiciona/ajusta (1 quando era EXT-)
      const idxIsSub = columns.findIndex(c => c.toLowerCase() === 'is_subcontracted');
      if (idxIsSub >= 0) {
        values[idxIsSub] = String(isSub);
      } else {
        columns.push('is_subcontracted');
        values.push(String(isSub));
      }

      return `INSERT INTO available_documents (${columns.join(', ')}) VALUES (${values.join(', ')});`;
    })
    .join('\n');
}

(async () => {
  // ⚠️ Este script cria/reescreve o SQLite local.
  // Não é executado automaticamente; rode manualmente:
  //   npm run db:setup

  ensureDir(path.dirname(DB_PATH));

  // Recria o arquivo para manter o seed determinístico
  if (fs.existsSync(DB_PATH)) {
    try {
      fs.unlinkSync(DB_PATH);
    } catch (e) {
      console.error(`[db] Falha ao deletar banco existente: ${e.message}`);
    }
  }

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  try {
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA foreign_keys = ON');

    const schemaSql = readSql(SCHEMA_PATH);
    const seedSql = sanitizeAvailableDocumentsSeed(readSql(SEED_PATH));

    console.log('[db] Running Schema...');
    await db.exec(schemaSql);

    console.log('[db] Running Seed...');
    await db.exec(seedSql);

    // eslint-disable-next-line no-console
    console.log(`[db] SQLite criado em: ${DB_PATH}`);
  } catch (err) {
    console.error('[db] Setup failed:', err);
    process.exit(1);
  } finally {
    await db.close();
  }
})();
