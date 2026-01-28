import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DB_PATH = path.join(process.cwd(), 'data', 'app.sqlite');

(async () => {
    try {
        const db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });

        console.log('📋 Tabelas no banco SQLite:\n');
        
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        
        if (tables.length === 0) {
            console.log('❌ NENHUMA TABELA ENCONTRADA!');
        } else {
            for (const t of tables) {
                console.log(`  - ${t.name}`);
            }
            console.log(`\n✅ Total: ${tables.length} tabelas`);
        }

        await db.close();
    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
})();
