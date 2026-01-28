PRAGMA foreign_keys = ON;

-- ============================================================================
-- MODELAGEM: CARGA vs CT-e vs ENTREGA vs VIAGEM
-- ============================================================================
-- 
-- REGRA VISUAL/OPERACIONAL (Para o Usuário):
--   Carga, CT-e e Entrega são tratados como UMA UNIDADE INDIVISÍVEL (1:1:1)
--   O card no Kanban representa: "Tenho uma Carga que gera um CT-e para uma Entrega"
--
-- REGRA ARQUITETURAL (Para o Banco de Dados):
--   São entidades SEPARADAS com ciclos de vida distintos:
--
--   1. CARGA (loads):
--      - Nasce quando NF-es sobem para o sistema (Backlog)
--      - Status: Pending → Scheduled → Emitted → Delivered
--      - Existe ANTES do CT-e e pode SOBREVIVER após cancelamento do CT-e
--      - Se CT-e for cancelado, a carga volta para "Pending" para novo CT-e
--
--   2. CT-e (ctes):
--      - Nasce quando usuário clica "Programar Veículo" e autoriza na SEFAZ
--      - Status: Pending → Authorized → (pode ser) Cancelled
--      - Se cancelado, cria NOVO registro em ctes apontando para mesma carga
--      - FK_CARGA: ctes.load_id → loads.id
--
--   3. ENTREGA (deliveries):
--      - É um EVENTO, não uma entidade única
--      - Pode ter MÚLTIPLAS TENTATIVAS (reentregas)
--      - Cenário: Motorista chega, galpão fechado → Tentativa 1 (Failed)
--                 Motorista volta → Tentativa 2 (Delivered)
--      - Carga: 1, CT-e: 1, Eventos de Entrega: 2
--
--   4. VIAGEM (trips):
--      - Agrupa VÁRIAS CARGAS
--      - Um veículo + motorista pode fazer múltiplas cargas na mesma viagem
--
-- ============================================================================

-- Domínios básicos
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  plate TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('Truck','Carreta','Bitrem','Vuc')),
  model TEXT NOT NULL,
  driver_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('Available','In Use','Maintenance'))
);

-- Cargas (solicitações) - TABELA MESTRE
-- Esta é a entidade que alimenta o Kanban e representa a demanda logística
CREATE TABLE IF NOT EXISTS loads (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  origin_city TEXT NOT NULL,
  destination_city TEXT,
  collection_date TEXT NOT NULL, -- ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm)
  status TEXT NOT NULL CHECK (status IN ('Pending','Scheduled','Emitted','Delivered')),
  -- Pending: Carga no backlog, sem CT-e ainda
  -- Scheduled: Vinculada a uma viagem, mas CT-e ainda não emitido
  -- Emitted: CT-e emitido e autorizado na SEFAZ
  -- Delivered: Entrega concluída
  vehicle_type_req TEXT,
  observations TEXT,
  -- Enriquecimento (pode vir do DF-e / XMLs)
  weight REAL,
  volume REAL,
  packages INTEGER,
  merchandise_value REAL
);

-- Documentos disponíveis (pool para vinculação)
CREATE TABLE IF NOT EXISTS available_documents (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CTe','NF')),
  control_number TEXT,
  linked_cte_number TEXT,
  dfe_key TEXT,
  related_dfe_keys TEXT, -- JSON array (apenas para CT-e)
  is_subcontracted INTEGER NOT NULL DEFAULT 0, -- 1 quando CT-e é subcontratado
  value REAL NOT NULL,
  weight REAL NOT NULL,
  recipient_name TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  emission_date TEXT NOT NULL
);

-- Viagens
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  scheduled_date TEXT,
  estimated_return_date TEXT,
  status TEXT NOT NULL CHECK (status IN ('Planned','Picking Up','In Transit','Completed','Delayed')),
  driver_name TEXT NOT NULL,
  truck_plate TEXT NOT NULL,
  trailer1_plate TEXT,
  trailer2_plate TEXT,
  trailer3_plate TEXT,
  main_destination TEXT NOT NULL,
  origin_city TEXT NOT NULL,
  freight_value REAL NOT NULL,
  proof_of_delivery TEXT
);

-- CT-es (Documentos Fiscais) - TABELA FILHA DE CARGAS
-- Um CT-e pertence a uma Carga. Se cancelar, cria novo registro apontando para mesma carga
CREATE TABLE IF NOT EXISTS ctes (
  id TEXT PRIMARY KEY,
  load_id TEXT NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  -- FK_CARGA: Este CT-e pertence à Carga X
  number TEXT NOT NULL,
  access_key TEXT NOT NULL UNIQUE, -- CHAVE_ACESSO (chave de acesso do CT-e na SEFAZ)
  freight_value REAL NOT NULL, -- VALOR_FRETE
  status TEXT NOT NULL CHECK (status IN ('Authorized','Cancelled','Pending')),
  -- Authorized: Autorizado na SEFAZ
  -- Cancelled: Cancelado (mas a carga continua existindo)
  -- Pending: Em processamento
  emission_date TEXT NOT NULL,
  authorization_date TEXT,
  cancellation_date TEXT,
  cancellation_reason TEXT,
  is_subcontracted INTEGER NOT NULL DEFAULT 0, -- 1 quando CT-e é subcontratado
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS legs (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  load_id TEXT REFERENCES loads(id), -- Vínculo opcional: esta perna representa uma carga específica
  type TEXT NOT NULL CHECK (type IN ('LOAD','EMPTY')),
  sequence INTEGER NOT NULL,
  origin_city TEXT NOT NULL,
  origin_address TEXT NOT NULL,
  destination_city TEXT,
  hub_name TEXT,
  control_number TEXT,
  vehicle_type_req TEXT,
  segment TEXT
);

-- Entregas (Eventos de Entrega) - TABELA DE EVENTOS
-- Pode haver múltiplas tentativas de entrega para a mesma carga (reentregas)
CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  leg_id TEXT NOT NULL REFERENCES legs(id) ON DELETE CASCADE,
  load_id TEXT REFERENCES loads(id), -- Vínculo direto à carga (para facilitar consultas)
  sequence INTEGER NOT NULL, -- Sequência da tentativa (1, 2, 3...)
  attempt_number INTEGER NOT NULL DEFAULT 1, -- Número da tentativa de entrega
  destination_city TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending','Delivered','Returned','Failed')),
  -- Failed: Tentativa falhou (galpão fechado, etc.) - permite nova tentativa
  proof_of_delivery TEXT,
  delivery_date TEXT,
  failure_reason TEXT -- Motivo da falha (se status = 'Failed')
);

-- Documentos (NF-es e referências de CT-e)
-- NF-es vinculadas a entregas, CT-es vinculados diretamente às cargas via tabela ctes
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  delivery_id TEXT REFERENCES deliveries(id) ON DELETE CASCADE, -- NF-es vinculadas a entregas
  cte_id TEXT REFERENCES ctes(id) ON DELETE CASCADE, -- Referência ao CT-e (para consultas rápidas)
  number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CTe','NF')),
  control_number TEXT,
  linked_cte_number TEXT, -- CT-e que cobre esta NF (quando type='NF')
  dfe_key TEXT,
  related_dfe_keys TEXT, -- JSON array (apenas para CT-e)
  value REAL NOT NULL,
  weight REAL
);

-- ============================================================================
-- TORRE DE CONTROLE (tmsvc_*)
-- ============================================================================

-- Espelho/Referência de viagem (usado pela sincronização)
CREATE TABLE IF NOT EXISTS tmsvc_viagem_ref (
  viagem_id_origem TEXT PRIMARY KEY,
  veiculo_placa TEXT,
  motorista_nome TEXT,
  data_inicio_prevista TEXT,
  data_fim_prevista TEXT,
  status_operacional TEXT,
  updated_at TEXT
);

-- Itens de cronograma (timeline)
CREATE TABLE IF NOT EXISTS tmsvc_cronograma (
  id TEXT PRIMARY KEY,
  veiculo_id TEXT,
  veiculo_placa TEXT,
  data_inicio TEXT,
  data_fim TEXT,
  tipo_evento TEXT,
  referencia_id TEXT,
  status TEXT,
  cor TEXT,
  origem_dado TEXT,
  meta_dados TEXT
);

-- Evento operacional (placeholder para evolução)
CREATE TABLE IF NOT EXISTS tmsvc_evento_operacional (
  id TEXT PRIMARY KEY,
  viagem_id_origem TEXT,
  veiculo_placa TEXT,
  tipo_evento TEXT,
  data_evento TEXT,
  descricao TEXT,
  origem_dado TEXT,
  meta_dados TEXT
);

-- Status consolidado (placeholder para evolução)
CREATE TABLE IF NOT EXISTS tmsvc_status_consolidado (
  id TEXT PRIMARY KEY,
  viagem_id_origem TEXT,
  veiculo_placa TEXT,
  status TEXT,
  atualizado_em TEXT,
  origem_dado TEXT,
  meta_dados TEXT
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_client ON loads(client_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_truck ON trips(truck_plate);
CREATE INDEX IF NOT EXISTS idx_trips_scheduled ON trips(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_legs_trip ON legs(trip_id);
CREATE INDEX IF NOT EXISTS idx_legs_load ON legs(load_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_leg ON deliveries(leg_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_load ON deliveries(load_id);
CREATE INDEX IF NOT EXISTS idx_documents_delivery ON documents(delivery_id);
CREATE INDEX IF NOT EXISTS idx_documents_cte ON documents(cte_id);
CREATE INDEX IF NOT EXISTS idx_ctes_load ON ctes(load_id);
CREATE INDEX IF NOT EXISTS idx_ctes_status ON ctes(status);
CREATE INDEX IF NOT EXISTS idx_ctes_access_key ON ctes(access_key);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

CREATE INDEX IF NOT EXISTS idx_tmsvc_cronograma_placa ON tmsvc_cronograma(veiculo_placa);
CREATE INDEX IF NOT EXISTS idx_tmsvc_cronograma_inicio ON tmsvc_cronograma(data_inicio);
