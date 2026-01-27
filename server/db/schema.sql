PRAGMA foreign_keys = ON;

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

-- Cargas (solicitações)
CREATE TABLE IF NOT EXISTS loads (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  origin_city TEXT NOT NULL,
  destination_city TEXT,
  collection_date TEXT NOT NULL, -- ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm)
  status TEXT NOT NULL CHECK (status IN ('Pending','Scheduled')),
  vehicle_type_req TEXT,
  observations TEXT
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

CREATE TABLE IF NOT EXISTS legs (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  leg_id TEXT NOT NULL REFERENCES legs(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  destination_city TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending','Delivered','Returned')),
  proof_of_delivery TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  delivery_id TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CTe','NF')),
  control_number TEXT,
  linked_cte_number TEXT,
  dfe_key TEXT,
  related_dfe_keys TEXT, -- JSON array (apenas para CT-e)
  value REAL NOT NULL,
  weight REAL
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_legs_trip ON legs(trip_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_leg ON deliveries(leg_id);
CREATE INDEX IF NOT EXISTS idx_documents_delivery ON documents(delivery_id);
