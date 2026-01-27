import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

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

function runSql(db, sql) {
  db.exec(sql);
}

// ⚠️ Este script cria/reescreve o SQLite local.
// Não é executado automaticamente; rode manualmente:
//   npm run db:setup

ensureDir(path.dirname(DB_PATH));

// Recria o arquivo para manter o seed determinístico
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const db = new Database(DB_PATH);
try {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schemaSql = readSql(SCHEMA_PATH);
  const seedSql = readSql(SEED_PATH);

  runSql(db, schemaSql);
  runSql(db, seedSql);

  // eslint-disable-next-line no-console
  console.log(`[db] SQLite criado em: ${DB_PATH}`);
} finally {
  db.close();
}
