
/**
 * Sincroniza dados do ERP (trips, vehicles) para as tabelas da Torre de Controle (vec_*).
 * Regra: O ERP é somente leitura. O SQLite (vec_*) é quem alimenta a UI de Cronograma.
 */
export async function syncTripsToSchedule(db) {
    console.log('[sync] Iniciando sincronização ERP -> Torre de Controle...');

    // 1. Ler todas as viagens do ERP
    const trips = await db.all(`
    SELECT
      id,
      driver_name,
      truck_plate,
      scheduled_date,
      estimated_return_date,
      status,
      created_at
    FROM trips
  `);

    let count = 0;

    await db.run('BEGIN TRANSACTION');

    try {
        for (const t of trips) {
            // 2. Atualizar tmsvc_viagem_ref (Tabela sombra)
            // Garante que temos um espelho local da viagem para metadados extras
            await db.run(`
        INSERT INTO tmsvc_viagem_ref (
          viagem_id_origem,
          veiculo_placa,
          motorista_nome,
          data_inicio_prevista,
          data_fim_prevista,
          status_operacional,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(viagem_id_origem) DO UPDATE SET
          veiculo_placa = excluded.veiculo_placa,
          motorista_nome = excluded.motorista_nome,
          data_inicio_prevista = excluded.data_inicio_prevista,
          data_fim_prevista = excluded.data_fim_prevista,
          status_operacional = excluded.status_operacional,
          updated_at = excluded.updated_at
      `, [
                t.id,
                t.truck_plate,
                t.driver_name,
                t.scheduled_date || t.created_at,
                t.estimated_return_date,
                t.status
            ]);

            // 3. Atualizar tmsvc_cronograma (Tabela de UI)
            // Define cor e status visual basedo no status do ERP
            const { color, label } = mapStatusToVisuals(t.status);

            // Se não tiver data prevista, usa criação + 1 dia (fallback)
            const start = t.scheduled_date || t.created_at;
            const end = t.estimated_return_date || addDays(start, 1);

            await db.run(`
        INSERT INTO tmsvc_cronograma (
          id,
          veiculo_id,
          veiculo_placa,
          data_inicio,
          data_fim,
          tipo_evento,
          referencia_id,
          status,
          cor,
          origem_dado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          veiculo_placa = excluded.veiculo_placa,
          data_inicio = excluded.data_inicio,
          data_fim = excluded.data_fim,
          status = excluded.status,
          cor = excluded.cor
      `, [
                `viagem_${t.id}`, // ID sintético para o cronograma
                t.truck_plate,    // Usando placa como ID de veículo por enquanto (simplificação)
                t.truck_plate,
                start,
                end,
                'VIAGEM',
                t.id,
                label,
                color,
                'ERP'
            ]);

            count++;
        }

        await db.run('COMMIT');
        console.log(`[sync] Sincronização concluída. ${count} viagens processadas.`);
        return { success: true, count };

    } catch (err) {
        await db.run('ROLLBACK');
        console.error('[sync] Erro durante sincronização:', err);
        throw err;
    }
}

// Utilitários

function mapStatusToVisuals(status) {
    // Cores Tailwind para usar no frontend
    switch (status) {
        case 'Planned':
            return { color: 'bg-blue-500', label: 'Planejado' };
        case 'Picking Up':
            return { color: 'bg-indigo-500', label: 'Coletando' };
        case 'In Transit':
            return { color: 'bg-yellow-500', label: 'Em Trânsito' };
        case 'Completed':
            return { color: 'bg-green-500', label: 'Concluído' };
        case 'Delayed':
            return { color: 'bg-red-500', label: 'Atrasado' };
        default:
            return { color: 'bg-gray-400', label: status };
    }
}

function addDays(dateStr, days) {
    if (!dateStr) return new Date().toISOString();
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString();
}
