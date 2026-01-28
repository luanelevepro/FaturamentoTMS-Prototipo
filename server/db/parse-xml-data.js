/**
 * Script para parsear XMLs exportados do ERP Esteira Contador
 * e gerar dados para o seed.sql do módulo TMS.
 * 
 * Uso: node server/db/parse-xml-data.js
 */

import fs from 'fs';
import path from 'path';
import { extractTomaziAvailableDocs } from './dfe-to-available-docs.js';

const ROOT = process.cwd();
const EXTERNAL_DATA = path.join(ROOT, 'external_data');
const OUTPUT_SEED = path.join(ROOT, 'server', 'db', 'seed.sql');
const DEFAULT_DFE_FILE = path.join(EXTERNAL_DATA, 'fis_documento_dfe_202601272318_reduced.xml');

// ============================================================================
// HELPERS
// ============================================================================

function parseXMLSimple(xml) {
  // Parser simplificado para a estrutura DATA_RECORD
  const records = [];
  const recordRegex = /<DATA_RECORD>([\s\S]*?)<\/DATA_RECORD>/g;
  let match;
  
  while ((match = recordRegex.exec(xml)) !== null) {
    const record = {};
    const content = match[1];
    const fieldRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let fieldMatch;
    
    while ((fieldMatch = fieldRegex.exec(content)) !== null) {
      const [, fieldName, fieldValue] = fieldMatch;
      record[fieldName] = fieldValue.trim();
    }
    records.push(record);
  }
  
  return records;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function sqlEscape(str) {
  if (str === null || str === undefined || str === '') return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  // Converter de "2026-01-09 13:54:35.728" para ISO
  return dateStr.split('.')[0].replace(' ', 'T');
}

// ============================================================================
// CLASSIFICAÇÃO DE VEÍCULOS
// ============================================================================

function classifyVehicleType(record) {
  const nome = (record.ds_nome || '').toUpperCase();
  const placa = (record.ds_placa || '').toUpperCase();
  
  // Carretas/Reboques
  if (nome.includes('REBOQUE') || nome.includes('CONTAINER') || nome.includes('CARRETA') || 
      nome.includes('BITREM') || nome.includes('SIDER') || nome.includes('BAÚ') ||
      nome.includes('GRANELEIRA') || nome.includes('TANQUE') || nome.includes('CARGA SECA')) {
    return 'Carreta';
  }
  
  // Cavalos mecânicos (Caminhões/Trucks)
  if (record.is_tracionador === 'true' || 
      nome.includes('FH ') || nome.includes('VOLVO') || nome.includes('SCANIA') || 
      nome.includes('MERCEDES') || nome.includes('MAN ') || nome.includes('DAF') ||
      nome.includes('CAMINHAO') || nome.includes('TRUCK') || nome.includes('AXOR') ||
      nome.includes('ACTROS') || nome.includes('VM ') || nome.includes('6X2') ||
      nome.includes('6X4') || nome.includes('4X2')) {
    return 'Truck';
  }
  
  // VUCs e veículos menores
  if (nome.includes('VUC') || nome.includes('3/4') || nome.includes('DELIVERY') ||
      nome.includes('TOCO') || nome.includes('CARGO') || nome.includes('ACCELO')) {
    return 'Vuc';
  }
  
  // Veículos administrativos/passeio (não usar no TMS)
  if (nome.includes('SW4') || nome.includes('FIAT') || nome.includes('MOBI') || 
      nome.includes('UNO') || nome.includes('COROLLA') || nome.includes('GOL') ||
      nome.includes('ONIX') || nome.includes('CIVIC') || nome.includes('HB20') ||
      nome.includes('KWID') || nome.includes('ARGO') || nome.includes('SAVEIRO') ||
      nome.includes('S10 ') || nome.includes('RANGER') || nome.includes('HILUX') ||
      nome.includes('PICK-UP') || nome.includes('PICKUP') || nome.includes('MONTANA')) {
    return 'Admin'; // Será filtrado
  }
  
  // Equipamentos e outros
  if (nome.includes('EMPILHADEIRA') || nome.includes('GUINCHO') || nome.includes('TRATOR') ||
      nome.includes('MAQUINA') || nome.includes('CARREGADEIRA')) {
    return 'Equipamento'; // Será filtrado
  }
  
  // Default baseado em is_tracionador
  if (record.is_tracionador === 'true') {
    return 'Truck';
  }
  
  return 'Carreta'; // Default para não classificados
}

function isRelevantForTMS(record) {
  const tipo = classifyVehicleType(record);
  return tipo === 'Truck' || tipo === 'Carreta' || tipo === 'Vuc' || tipo === 'Bitrem';
}

// ============================================================================
// GERAÇÃO DE DADOS FICTÍCIOS REALISTAS
// ============================================================================

const MOTORISTAS = [
  { nome: 'João da Silva', telefone: '51999001001' },
  { nome: 'Pedro Oliveira', telefone: '51999002002' },
  { nome: 'Carlos Santos', telefone: '51999003003' },
  { nome: 'Marcos Pereira', telefone: '51999004004' },
  { nome: 'Lucas Lima', telefone: '51999005005' },
  { nome: 'André Costa', telefone: '51999006006' },
  { nome: 'Rafael Souza', telefone: '51999007007' },
  { nome: 'Fernando Alves', telefone: '51999008008' },
  { nome: 'Ricardo Mendes', telefone: '51999009009' },
  { nome: 'Paulo Ribeiro', telefone: '51999010010' },
];

const CLIENTES = [
  { id: generateUUID(), name: 'Henn Indústria', address: 'Rua das Indústrias, 500 - Panambi, RS' },
  { id: generateUUID(), name: 'Agropecuária São José', address: 'Rod. BR-386, Km 45 - Carazinho, RS' },
  { id: generateUUID(), name: 'Cooperativa Tritícola', address: 'Av. Central, 1200 - Não-Me-Toque, RS' },
  { id: generateUUID(), name: 'Indústria Metalúrgica do Sul', address: 'Av. das Indústrias, 1000 - Porto Alegre, RS' },
  { id: generateUUID(), name: 'Comércio Varejista XYZ', address: 'Rua XV de Novembro, 500 - Curitiba, PR' },
  { id: generateUUID(), name: 'Exportadora Grãos Brasil', address: 'Porto Seco, Área 12 - Paranaguá, PR' },
  { id: generateUUID(), name: 'Distribuidora Centro-Oeste', address: 'Rod. GO-060, Km 8 - Goiânia, GO' },
  { id: generateUUID(), name: 'Frigorífico Pampa', address: 'Av. Industrial, 300 - Bagé, RS' },
];

const CIDADES = [
  { id: generateUUID(), full_name: 'Porto Alegre, RS' },
  { id: generateUUID(), full_name: 'Panambi, RS' },
  { id: generateUUID(), full_name: 'Ijuí, RS' },
  { id: generateUUID(), full_name: 'Carazinho, RS' },
  { id: generateUUID(), full_name: 'Passo Fundo, RS' },
  { id: generateUUID(), full_name: 'Santa Maria, RS' },
  { id: generateUUID(), full_name: 'Cruz Alta, RS' },
  { id: generateUUID(), full_name: 'Florianópolis, SC' },
  { id: generateUUID(), full_name: 'Curitiba, PR' },
  { id: generateUUID(), full_name: 'São Paulo, SP' },
  { id: generateUUID(), full_name: 'Rio de Janeiro, RJ' },
  { id: generateUUID(), full_name: 'Paranaguá, PR' },
  { id: generateUUID(), full_name: 'Goiânia, GO' },
  { id: generateUUID(), full_name: 'Cuiabá, MT' },
  { id: generateUUID(), full_name: 'Campo Grande, MS' },
];

const SEGMENTOS = ['Industrial', 'Agro', 'Container', 'Carga Geral', 'Frigorífico'];

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('[parse] Lendo XMLs do diretório external_data...');
  
  // Ler XMLs
  const veiculosXml = fs.readFileSync(path.join(EXTERNAL_DATA, 'tms_veiculos_202601272132.xml'), 'utf-8');
  const segmentosXml = fs.readFileSync(path.join(EXTERNAL_DATA, 'tms_segmentos_202601272133.xml'), 'utf-8');
  
  // Parsear
  const veiculosRaw = parseXMLSimple(veiculosXml);
  const segmentosRaw = parseXMLSimple(segmentosXml);
  
  console.log(`[parse] Encontrados ${veiculosRaw.length} veículos no XML`);
  console.log(`[parse] Encontrados ${segmentosRaw.length} segmentos no XML`);
  
  // Filtrar veículos relevantes para TMS (ativos)
  const veiculosTMS = veiculosRaw.filter(v => 
    v.is_ativo === 'true' && isRelevantForTMS(v)
  );
  
  console.log(`[parse] ${veiculosTMS.length} veículos relevantes para TMS`);
  
  // Separar cavalos e carretas
  const cavalos = veiculosTMS.filter(v => classifyVehicleType(v) === 'Truck');
  const carretas = veiculosTMS.filter(v => classifyVehicleType(v) === 'Carreta');
  const vucs = veiculosTMS.filter(v => classifyVehicleType(v) === 'Vuc');
  
  console.log(`[parse] Cavalos: ${cavalos.length}, Carretas: ${carretas.length}, VUCs: ${vucs.length}`);
  
  // Limitar para um conjunto gerenciável (primeiros 15 cavalos, 20 carretas)
  const cavalosSelecionados = cavalos.slice(0, 15);
  const carretasSelecionadas = carretas.slice(0, 20);
  const vucsSelecionados = vucs.slice(0, 5);
  
  // =========================================================================
  // GERAR SQL
  // =========================================================================
  
  let sql = `-- Seed gerado automaticamente a partir dos XMLs do ERP Tomazi
-- Data: ${new Date().toISOString()}
-- Fonte: external_data/tms_veiculos_*.xml, tms_segmentos_*.xml

-- Limpeza (ordem inversa de dependência)
DELETE FROM tmsvc_status_consolidado;
DELETE FROM tmsvc_evento_operacional;
DELETE FROM tmsvc_cronograma;
DELETE FROM tmsvc_viagem_ref;
DELETE FROM documents;
DELETE FROM deliveries;
DELETE FROM legs;
DELETE FROM trips;
DELETE FROM available_documents;
DELETE FROM loads;
DELETE FROM vehicles;
DELETE FROM cities;
DELETE FROM clients;

-- ============================================================================
-- 1. CLIENTES
-- ============================================================================
`;

  for (const c of CLIENTES) {
    sql += `INSERT INTO clients (id, name, address) VALUES (${sqlEscape(c.id)}, ${sqlEscape(c.name)}, ${sqlEscape(c.address)});\n`;
  }

  sql += `
-- ============================================================================
-- 2. CIDADES
-- ============================================================================
`;

  for (const c of CIDADES) {
    sql += `INSERT INTO cities (id, full_name) VALUES (${sqlEscape(c.id)}, ${sqlEscape(c.full_name)});\n`;
  }

  sql += `
-- ============================================================================
-- 3. VEÍCULOS (Dados reais da Tomazi)
-- ============================================================================
`;

  // Veículos: cavalos
  let motorIdx = 0;
  const veiculosParaViagem = [];
  
  for (const v of cavalosSelecionados) {
    const motorista = MOTORISTAS[motorIdx % MOTORISTAS.length];
    const status = Math.random() > 0.8 ? 'Maintenance' : (Math.random() > 0.5 ? 'In Use' : 'Available');
    
    sql += `INSERT INTO vehicles (id, plate, type, model, driver_name, status) VALUES (${sqlEscape(v.id)}, ${sqlEscape(v.ds_placa)}, 'Truck', ${sqlEscape(v.ds_nome.substring(0, 100))}, ${sqlEscape(motorista.nome)}, ${sqlEscape(status)});\n`;
    
    if (status !== 'Maintenance') {
      veiculosParaViagem.push({ ...v, motorista, status });
    }
    motorIdx++;
  }
  
  // Veículos: carretas
  for (const v of carretasSelecionadas) {
    sql += `INSERT INTO vehicles (id, plate, type, model, driver_name, status) VALUES (${sqlEscape(v.id)}, ${sqlEscape(v.ds_placa)}, 'Carreta', ${sqlEscape(v.ds_nome.substring(0, 100))}, NULL, 'Available');\n`;
  }
  
  // Veículos: VUCs
  for (const v of vucsSelecionados) {
    const motorista = MOTORISTAS[motorIdx % MOTORISTAS.length];
    sql += `INSERT INTO vehicles (id, plate, type, model, driver_name, status) VALUES (${sqlEscape(v.id)}, ${sqlEscape(v.ds_placa)}, 'Vuc', ${sqlEscape(v.ds_nome.substring(0, 100))}, ${sqlEscape(motorista.nome)}, 'Available');\n`;
    motorIdx++;
  }

  sql += `
-- ============================================================================
-- 4. VIAGENS (Dados fictícios com veículos reais)
-- ============================================================================
`;

  // Gerar viagens fictícias
  const statuses = ['Planned', 'Picking Up', 'In Transit', 'Completed', 'Delayed'];
  const trips = [];
  const usedCavalhos = veiculosParaViagem.slice(0, 8);
  
  for (let i = 0; i < usedCavalhos.length; i++) {
    const cavalo = usedCavalhos[i];
    const carreta = carretasSelecionadas[i % carretasSelecionadas.length];
    const status = statuses[i % statuses.length];
    const cliente = CLIENTES[i % CLIENTES.length];
    const origem = CIDADES[i % 5]; // Cidades do RS
    const destino = CIDADES[5 + (i % 10)]; // Outras cidades
    
    const tripId = generateUUID();
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - (i * 2));
    const scheduledDate = new Date(baseDate);
    scheduledDate.setDate(scheduledDate.getDate() + 1);
    const returnDate = new Date(scheduledDate);
    returnDate.setDate(returnDate.getDate() + 3);
    
    const trip = {
      id: tripId,
      createdAt: baseDate.toISOString(),
      scheduledDate: scheduledDate.toISOString(),
      returnDate: returnDate.toISOString(),
      status,
      driverName: cavalo.motorista.nome,
      truckPlate: cavalo.ds_placa,
      trailer1Plate: carreta.ds_placa,
      mainDestination: destino.full_name,
      originCity: origem.full_name,
      freightValue: 2500 + Math.floor(Math.random() * 5000),
      cliente,
    };
    
    trips.push(trip);
    
    sql += `INSERT INTO trips (id, created_at, scheduled_date, estimated_return_date, status, driver_name, truck_plate, trailer1_plate, main_destination, origin_city, freight_value) VALUES (${sqlEscape(trip.id)}, ${sqlEscape(trip.createdAt)}, ${sqlEscape(trip.scheduledDate)}, ${sqlEscape(trip.returnDate)}, ${sqlEscape(trip.status)}, ${sqlEscape(trip.driverName)}, ${sqlEscape(trip.truckPlate)}, ${sqlEscape(trip.trailer1Plate)}, ${sqlEscape(trip.mainDestination)}, ${sqlEscape(trip.originCity)}, ${trip.freightValue});\n`;
  }

  sql += `
-- ============================================================================
-- 5. PERNAS (LEGS) E ENTREGAS
-- ============================================================================
`;

  for (const trip of trips) {
    const legId = generateUUID();
    const segmento = SEGMENTOS[Math.floor(Math.random() * SEGMENTOS.length)];
    
    sql += `INSERT INTO legs (id, trip_id, type, sequence, origin_city, origin_address, destination_city, segment) VALUES (${sqlEscape(legId)}, ${sqlEscape(trip.id)}, 'LOAD', 1, ${sqlEscape(trip.originCity)}, 'CD Tomazi - Matriz', ${sqlEscape(trip.mainDestination)}, ${sqlEscape(segmento)});\n`;
    
    // 1-3 entregas por leg
    const numDeliveries = 1 + Math.floor(Math.random() * 3);
    for (let d = 0; d < numDeliveries; d++) {
      const deliveryId = generateUUID();
      const deliveryStatus = trip.status === 'Completed' ? 'Delivered' : 'Pending';
      
      sql += `INSERT INTO deliveries (id, leg_id, sequence, destination_city, destination_address, recipient_name, status) VALUES (${sqlEscape(deliveryId)}, ${sqlEscape(legId)}, ${d + 1}, ${sqlEscape(trip.mainDestination)}, 'Rua ${100 + d * 100}, Centro', ${sqlEscape(trip.cliente.name)}, ${sqlEscape(deliveryStatus)});\n`;
      
      // 1-2 documentos por entrega
      const numDocs = 1 + Math.floor(Math.random() * 2);
      for (let doc = 0; doc < numDocs; doc++) {
        const docId = generateUUID();
        const docType = Math.random() > 0.3 ? 'NF' : 'CTe';
        const docNumber = `${docType}-${Math.floor(100000 + Math.random() * 900000)}`;
        const docValue = 1000 + Math.floor(Math.random() * 50000);
        const docWeight = 500 + Math.floor(Math.random() * 10000);
        const controlNumber = `CTRL-${Math.floor(10000 + Math.random() * 90000)}`;
        
        sql += `INSERT INTO documents (id, delivery_id, number, type, value, weight, control_number) VALUES (${sqlEscape(docId)}, ${sqlEscape(deliveryId)}, ${sqlEscape(docNumber)}, ${sqlEscape(docType)}, ${docValue}, ${docWeight}, ${sqlEscape(controlNumber)});\n`;
      }
    }
  }

  sql += `
-- ============================================================================
-- 6. CARGAS DISPONÍVEIS (Aguardando alocação)
-- ============================================================================
`;

  // 5 cargas pendentes
  for (let i = 0; i < 5; i++) {
    const loadId = generateUUID();
    const cliente = CLIENTES[i % CLIENTES.length];
    const origem = CIDADES[i % CIDADES.length];
    const destino = CIDADES[(i + 5) % CIDADES.length];
    const collectionDate = new Date();
    collectionDate.setDate(collectionDate.getDate() + i + 1);
    
    sql += `INSERT INTO loads (id, client_id, origin_city, destination_city, collection_date, status, vehicle_type_req) VALUES (${sqlEscape(loadId)}, ${sqlEscape(cliente.id)}, ${sqlEscape(origem.full_name)}, ${sqlEscape(destino.full_name)}, ${sqlEscape(collectionDate.toISOString().split('T')[0])}, 'Pending', 'Carreta');\n`;
  }

  sql += `
-- ============================================================================
-- 7. DOCUMENTOS DISPONÍVEIS (Pool para vinculação)
-- ============================================================================
`;

  // Preferir dados reais do DF-e (se o arquivo existir); caso contrário, mantém mock.
  const DFE_FILE = process.env.DFE_FILE || DEFAULT_DFE_FILE;
  const TARGET_CNPJ = (process.env.TARGET_CNPJ || '04896658000184').replace(/\D/g, '');
  const MAX_NFE = Number(process.env.DFE_MAX_NFE || '1500');
  const MAX_CTE = Number(process.env.DFE_MAX_CTE || '800');
  const MAX_CTE_SUB = Number(process.env.DFE_MAX_CTE_SUB || '300');

  if (fs.existsSync(DFE_FILE)) {
    console.log(`[parse] Extraindo DF-e para available_documents: ${DFE_FILE}`);
    const { docs, stats } = await extractTomaziAvailableDocs({
      filePath: DFE_FILE,
      targetCnpj: TARGET_CNPJ,
      maxNfe: MAX_NFE,
      maxCte: MAX_CTE,
      maxCteSub: MAX_CTE_SUB
    });

    console.log(
      `[parse] DF-e extraído: docs=${docs.length} (stats: nfeSeen=${stats.nfeSeen}, cteSeen=${stats.cteSeen}, nfTomazi=${stats.nfTomaziCandidate}, cteEmit=${stats.cteTomaziEmit}, cteSub=${stats.cteTomaziSub}, links=${stats.linksCreated})`
    );

    for (const d of docs) {
      const id = generateUUID();
      const relatedJson = d.relatedDfeKeys ? JSON.stringify(d.relatedDfeKeys) : null;

      // Importante: não preencher control_number (será gerado pelo sistema depois).
      sql += `INSERT INTO available_documents (id, number, type, control_number, linked_cte_number, dfe_key, related_dfe_keys, is_subcontracted, value, weight, recipient_name, destination_city, destination_address, emission_date) VALUES (${sqlEscape(id)}, ${sqlEscape(d.number)}, ${sqlEscape(d.type)}, NULL, ${sqlEscape(d.linkedCteNumber)}, ${sqlEscape(d.dfeKey)}, ${sqlEscape(relatedJson)}, ${Number(d.isSubcontracted ? 1 : 0)}, ${Number(d.value) || 0}, ${Number(d.weight) || 0}, ${sqlEscape(d.recipientName)}, ${sqlEscape(d.destinationCity)}, ${sqlEscape(d.destinationAddress)}, ${sqlEscape(d.emissionDate)});\n`;
    }

    // ============================================================================
    // 6.b CARGAS DERIVADAS DO DF-e (Backlog enriquecido com peso/valor)
    // ============================================================================
    // Estratégia simples:
    // - Agrupa por CT-e (se existir) via linked_cte_number/CTe number
    // - Caso NF-e sem CT-e, vira um grupo próprio (por NF-e)
    const groups = new Map();
    const getKey = (doc) => {
      if (doc.type === 'CTe') return `CTE:${doc.number}`;
      if (doc.linkedCteNumber) return `CTE:${doc.linkedCteNumber}`;
      return `NFE:${doc.number}`;
    };
    for (const doc of docs) {
      const k = getKey(doc);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(doc);
    }

    // Gera algumas cargas derivadas (limita para não poluir a UI)
    const groupEntries = Array.from(groups.entries()).slice(0, 40);
    for (let i = 0; i < groupEntries.length; i++) {
      const [key, gdocs] = groupEntries[i];
      const loadId = generateUUID();
      const cliente = CLIENTES[i % CLIENTES.length];
      const origem = CIDADES[i % CIDADES.length];
      const first = gdocs[0];

      const totalValue = gdocs.reduce((acc, it) => acc + (Number(it.value) || 0), 0);
      const totalWeight = gdocs.reduce((acc, it) => acc + (Number(it.weight) || 0), 0);
      const packages = gdocs.filter(it => it.type === 'NF').length || gdocs.length;
      const collectionDate = first?.emissionDate || new Date().toISOString().split('T')[0];

      const obs = `Derivado DF-e (${key.replace('CTE:', 'CT-e ').replace('NFE:', 'NF-e ')})`;

      sql += `INSERT INTO loads (id, client_id, origin_city, destination_city, collection_date, status, vehicle_type_req, observations, weight, packages, merchandise_value) VALUES (${sqlEscape(loadId)}, ${sqlEscape(cliente.id)}, ${sqlEscape(origem.full_name)}, ${sqlEscape(first.destinationCity)}, ${sqlEscape(collectionDate)}, 'Pending', 'Carreta', ${sqlEscape(obs)}, ${Number(totalWeight) || 0}, ${Number(packages) || 0}, ${Number(totalValue) || 0});\n`;
    }
  } else {
    console.log(`[parse] DF-e não encontrado (${DFE_FILE}). Gerando mock de available_documents...`);
    // 10 documentos disponíveis (mock)
    for (let i = 0; i < 10; i++) {
      const docId = generateUUID();
      const docType = Math.random() > 0.4 ? 'NF' : 'CTe';
      // `number` deve ser apenas o número do documento (sem prefixos).
      const docNumber = `${Math.floor(100000 + Math.random() * 900000)}`;
      const cliente = CLIENTES[i % CLIENTES.length];
      const destino = CIDADES[(i + 3) % CIDADES.length];
      const emissionDate = new Date();
      emissionDate.setDate(emissionDate.getDate() - i);

      sql += `INSERT INTO available_documents (id, number, type, control_number, is_subcontracted, value, weight, recipient_name, destination_city, destination_address, emission_date) VALUES (${sqlEscape(docId)}, ${sqlEscape(docNumber)}, ${sqlEscape(docType)}, NULL, 0, ${5000 + i * 1000}, ${1000 + i * 500}, ${sqlEscape(cliente.name)}, ${sqlEscape(destino.full_name)}, 'Endereço Padrão', ${sqlEscape(emissionDate.toISOString().split('T')[0])});\n`;
    }
  }

  sql += `
-- ============================================================================
-- FIM DO SEED
-- ============================================================================
`;

  // Salvar
  fs.writeFileSync(OUTPUT_SEED, sql, 'utf-8');
  console.log(`[parse] Seed SQL gerado em: ${OUTPUT_SEED}`);
  console.log('[parse] Execute: npm run db:setup para recriar o banco');
}

main().catch(err => {
  console.error('[parse] Erro:', err);
  process.exit(1);
});
