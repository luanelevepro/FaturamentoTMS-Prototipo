/**
 * Script para verificar contagem de registros em todas as tabelas do banco.
 * Uso: node server/db/check_counts.js
 */

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

        console.log('📊 Contagem de registros no banco SQLite:\n');
        console.log('=== TABELAS PRINCIPAIS (ERP) ===');
        
        const mainTables = ['clients', 'cities', 'vehicles', 'loads', 'available_documents', 'trips', 'legs', 'deliveries', 'documents'];
        for (const table of mainTables) {
            const result = await db.get(`SELECT count(*) as count FROM ${table}`);
            console.log(`  ${table.padEnd(20)}: ${result.count}`);
        }
        
        console.log('\n=== TABELAS TORRE DE CONTROLE ===');
        const tmsvcTables = ['tmsvc_viagem_ref', 'tmsvc_cronograma', 'tmsvc_evento_operacional', 'tmsvc_status_consolidado'];
        for (const table of tmsvcTables) {
            const result = await db.get(`SELECT count(*) as count FROM ${table}`);
            console.log(`  ${table.padEnd(20)}: ${result.count}`);
        }
        
        // Amostra de veículos
        console.log('\n=== AMOSTRA DE VEÍCULOS (5 primeiros) ===');
        const veiculos = await db.all('SELECT plate, type, driver_name, status FROM vehicles LIMIT 5');
        for (const v of veiculos) {
            console.log(`  ${v.plate.padEnd(10)} | ${v.type.padEnd(8)} | ${(v.driver_name || '-').padEnd(20)} | ${v.status}`);
        }
        
        // Amostra de viagens
        console.log('\n=== AMOSTRA DE VIAGENS (5 primeiras) ===');
        const viagens = await db.all('SELECT truck_plate, driver_name, status, origin_city, main_destination FROM trips LIMIT 5');
        for (const t of viagens) {
            console.log(`  ${t.truck_plate.padEnd(10)} | ${t.status.padEnd(12)} | ${t.origin_city.padEnd(20)} -> ${t.main_destination}`);
        }

        await db.close();
        console.log('\n✅ Verificação concluída!');
    } catch (err) {
        console.error('❌ Erro ao verificar banco:', err);
    }
})();
