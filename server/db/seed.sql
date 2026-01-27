PRAGMA foreign_keys = ON;

-- Limpa para recriar o dataset (use apenas em ambiente local)
DELETE FROM documents;
DELETE FROM deliveries;
DELETE FROM legs;
DELETE FROM trips;
DELETE FROM available_documents;
DELETE FROM loads;
DELETE FROM vehicles;
DELETE FROM cities;
DELETE FROM clients;

-- CLIENTES
INSERT INTO clients (id, name, address) VALUES
('cli-001','Pepsico Do Brasil Ltda','Av. das Indústrias, 100 - Porto Alegre/RS'),
('cli-002','Amazon Logística LTDA','Rod. Anhanguera, KM 26 - São Paulo/SP'),
('cli-003','Nestlé Brasil Alimentos','Rua Henry Nestle, 1000 - Cordeirópolis/SP'),
('cli-004','Ambev S.A.','Av. Antártica, 1891 - Jaguariúna/SP'),
('cli-005','Unilever Brasil','Av. das Nações Unidas, 14261 - São Paulo/SP'),
('cli-006','Cargill Agrícola','Av. Nações Unidas, 107 - Uberlândia/MG'),
('cli-007','Magazine Luiza S/A','Vol. da Pátria, 1450 - Porto Alegre/RS'),
('cli-008','B2W Digital','Rua Sacadura Cabral, 120 - Rio de Janeiro/RJ');

-- CIDADES
INSERT INTO cities (id, full_name) VALUES
('city-001','Porto Alegre, RS'),
('city-002','Florianópolis, SC'),
('city-003','Curitiba, PR'),
('city-004','São Paulo, SP'),
('city-005','Rio de Janeiro, RJ'),
('city-006','Belo Horizonte, MG'),
('city-007','Cuiabá, MT'),
('city-008','Goiânia, GO'),
('city-009','Brasília, DF'),
('city-010','Salvador, BA'),
('city-011','Recife, PE'),
('city-012','Fortaleza, CE'),
('city-013','Uberlândia, MG'),
('city-014','Paranaguá, PR');


-- VEÍCULOS (MOCK_VEHICLES + extras from Trips if needed)
INSERT INTO vehicles (id, plate, type, model, driver_name, status) VALUES
('v1','CAR-4234','Carreta','Volvo FH540','João da Silva','Available'),
('v2','CAR-9876','Carreta','Scania R450','Marcos Oliveira','In Use'),
('v3','TRK-5678','Truck','VW Constellation','Lucas Pereira','Available'),
('v4','ABC-1234','Carreta','Iveco Hi-Way','Roberto Xtutz','In Use'),
('v6','CAV-9900','Carreta','Mercedes Actros','Ana Souza','Available'),
-- Adicionando reboques/outros placas mencionados nas viagens para integridade, se necessário, ou assumindo que são apenas assets
('trl-001', 'SC-9988', 'Carreta', 'Randon', NULL, 'In Use'),
('trl-002', 'TR-1122', 'Carreta', 'Randon', NULL, 'In Use'),
('trl-003', 'CAR-1122', 'Carreta', 'Randon', NULL, 'Available'),
('veh-007', 'XYZ-9876', 'Carreta', 'Scania R500', 'Marcos Oliveira', 'Available'); -- Veículo da Trip 1002 (Planned)


-- CARGAS (MOCK_LOADS)
INSERT INTO loads (id, client_id, origin_city, destination_city, collection_date, status, vehicle_type_req, observations) VALUES
('load-1', (SELECT id FROM clients WHERE name='Pepsico Do Brasil Ltda'), 'Porto Alegre, RS', 'Florianópolis, SC', '2026-01-27', 'Pending', 'Carreta', NULL),
('load-2', (SELECT id FROM clients WHERE name='Amazon Logística LTDA'), 'São Paulo, SP', 'Rio de Janeiro, RJ', '2026-01-26', 'Pending', 'Carreta', 'Carga de alto valor - exige escolta até destino'),
('load-3', (SELECT id FROM clients WHERE name='Cargill Agrícola'), 'Uberlândia, MG', 'Paranaguá, PR', '2026-01-28', 'Pending', 'Carreta', NULL),
('load-4', (SELECT id FROM clients WHERE name='Unilever Brasil'), 'São Paulo, SP', 'Belo Horizonte, MG', '2026-01-26', 'Pending', 'Truck', NULL);


-- DOCUMENTOS DISPONÍVEIS (MOCK_AVAILABLE_DOCS)
INSERT INTO available_documents (
  id, number, type, control_number, linked_cte_number, dfe_key, related_dfe_keys, value, weight,
  recipient_name, destination_city, destination_address, emission_date
) VALUES
('ad-1', 'NF-5501', 'NF', '10293847', NULL, '35260100000000000000550010000000011029384701', NULL, 5000, 300, 'Magazine Luiza', 'Porto Alegre, RS', 'Av. Ipiranga, 100', '2025-09-20'),
('ad-2', 'NF-5502', 'NF', '10293847', NULL, '35260100000000000000550010000000021029384708', NULL, 7500, 450, 'Magazine Luiza', 'Porto Alegre, RS', 'Av. Ipiranga, 100', '2025-09-20'),
('ad-3', 'NF-5503', 'NF', '38475610', 'CTE-559900', '35260100000000000000550010000000033847561007', NULL, 12890, 980, 'Amazon Logística', 'Rio de Janeiro, RJ', 'CD Norte - Rua A, 200', '2025-09-21'),
('ad-4', 'NF-5504', 'NF', '38475610', 'CTE-559900', '35260100000000000000550010000000043847561004', NULL, 8350, 560, 'Amazon Logística', 'Rio de Janeiro, RJ', 'CD Norte - Rua A, 200', '2025-09-21'),
('ad-5', 'CTE-559900', 'CTe', '38475610', 'CTE-559900', '35260100000000000000570010000055990038475610', '["35260100000000000000550010000000033847561007", "35260100000000000000550010000000043847561004"]', 0, 0, 'Amazon Logística', 'Rio de Janeiro, RJ', 'CD Norte - Rua A, 200', '2025-09-21');


-- VIAGENS (MOCK_TRIPS)
INSERT INTO trips (
  id, created_at, scheduled_date, estimated_return_date, status,
  driver_name, truck_plate, trailer1_plate, trailer2_plate, trailer3_plate,
  main_destination, origin_city, freight_value, proof_of_delivery
) VALUES
('trip-1001', '2025-09-21T08:00:00', NULL, '2025-09-22T18:00:00', 'Picking Up', 'Roberto Xtutz', 'ABC-1234', 'SC-9988', NULL, NULL, 'Florianópolis, SC', 'Curitiba, PR', 2500, NULL),
('trip-1002', datetime('now'), NULL, datetime('now','+2 days'), 'Planned', 'Marcos Oliveira', 'XYZ-9876', 'TR-1122', NULL, NULL, 'Rio de Janeiro, RJ', 'São Paulo, SP', 4200, NULL),
('trip-1003', datetime('now'), NULL, datetime('now','+1 day'), 'In Transit', 'Lucas Pereira', 'TRK-5678', NULL, NULL, NULL, 'Brasília, DF', 'Belo Horizonte, MG', 3800, NULL),
('trip-1004', datetime('now'), NULL, datetime('now','-2 days'), 'Completed', 'Ana Souza', 'CAV-9900', 'CAR-1122', NULL, NULL, 'Recife, PE', 'Salvador, BA', 1800, NULL);


-- LEGS (MOCK_TRIPS legs)
INSERT INTO legs (
  id, trip_id, type, sequence, origin_city, origin_address, destination_city, hub_name, control_number, segment
) VALUES
-- Trip 1001
('leg-1', 'trip-1001', 'LOAD', 1, 'Curitiba, PR', 'CD HUB', 'Florianópolis, SC', NULL, '10293847', 'Industrial'),
-- Trip 1002
('leg-1002-1', 'trip-1002', 'LOAD', 1, 'São Paulo, SP', 'CD Matriz', 'Rio de Janeiro, RJ', NULL, '38475610', 'E-commerce'),
-- Trip 1003
('leg-1003-1', 'trip-1003', 'LOAD', 1, 'Belo Horizonte, MG', 'Fabrica Textil', 'Brasília, DF', NULL, 'BR-9900', 'Têxtil'),
-- Trip 1004
('leg-1004-1', 'trip-1004', 'LOAD', 1, 'Salvador, BA', 'Porto', 'Recife, PE', NULL, 'NE-2211', 'Químico');


-- DELIVERIES
INSERT INTO deliveries (
  id, leg_id, sequence, destination_city, destination_address, recipient_name, status, proof_of_delivery
) VALUES
-- Trip 1001
('del-1', 'leg-1', 1, 'Florianópolis, SC', 'Loja Central', 'Mercado Livre', 'Pending', NULL),
-- Trip 1002
('del-1002-1', 'leg-1002-1', 1, 'Rio de Janeiro, RJ', 'Centro de Distribuição Norte', 'Amazon Logística', 'Pending', NULL),
-- Trip 1003
('del-1003-1', 'leg-1003-1', 1, 'Brasília, DF', 'Shopping Sul', 'Riachuelo S/A', 'Pending', NULL),
-- Trip 1004
('del-1004-1', 'leg-1004-1', 1, 'Recife, PE', 'Ind. Química', 'Braskem', 'Delivered', NULL);


-- DOCUMENTS (vinculados nas entregas das Trips)
INSERT INTO documents (
  id, delivery_id, number, type, control_number, linked_cte_number, dfe_key, related_dfe_keys, value, weight
) VALUES
-- Trip 1001
('d1', 'del-1', 'CTE-001', 'CTe', '10293847', 'CTE-001', NULL, NULL, 100, 10),
('d2', 'del-1', 'NF-1001', 'NF', '10293847', 'CTE-001', NULL, NULL, 12000, 1500),

-- Trip 1002
('doc-cte-3', 'del-1002-1', 'CTE-888', 'CTe', '38475610', 'CTE-888', NULL, NULL, 3500, 0),
('doc-nf-1', 'del-1002-1', 'NF-102030', 'NF', '38475610', 'CTE-888', NULL, NULL, 15000, 1200),
('doc-nf-2', 'del-1002-1', 'NF-102031', 'NF', '38475610', 'CTE-888', NULL, NULL, 8500, 450),

-- Trip 1003
('doc-cte-4', 'del-1003-1', 'CTE-1010', 'CTe', 'BR-9900', 'CTE-1010', NULL, NULL, 3800, 0),
('doc-nf-3', 'del-1003-1', 'NF-5566', 'NF', 'BR-9900', 'CTE-1010', NULL, NULL, 65000, 4500),

-- Trip 1004
('doc-cte-5', 'del-1004-1', 'CTE-7744', 'CTe', 'NE-2211', 'CTE-7744', NULL, NULL, 1800, 0),
('doc-nf-4', 'del-1004-1', 'NF-8811', 'NF', 'NE-2211', 'CTE-7744', NULL, NULL, 120000, 12000);
