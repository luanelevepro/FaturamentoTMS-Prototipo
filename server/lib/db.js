import Database from 'better-sqlite3';

export function createDb(dbPath) {
  const db = new Database(dbPath, {
    readonly: true,
    fileMustExist: true
  });

  db.pragma('foreign_keys = ON');
  return db;
}
