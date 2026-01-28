import { Load, Trip, AvailableDocument, Vehicle } from './types';

// CLIENTES SIMULAÇÃO
export const MOCK_CLIENTS = [
  { name: 'Pepsico Do Brasil Ltda', address: 'Av. das Indústrias, 100 - Porto Alegre/RS' },
  { name: 'Amazon Logística LTDA', address: 'Rod. Anhanguera, KM 26 - São Paulo/SP' },
  { name: 'Nestlé Brasil Alimentos', address: 'Rua Henry Nestle, 1000 - Cordeirópolis/SP' },
  { name: 'Ambev S.A.', address: 'Av. Antártica, 1891 - Jaguariúna/SP' },
  { name: 'Unilever Brasil', address: 'Av. das Nações Unidas, 14261 - São Paulo/SP' },
  { name: 'Cargill Agrícola', address: 'Av. Nações Unidas, 107 - Uberlândia/MG' },
  { name: 'Magazine Luiza S/A', address: 'Vol. da Pátria, 1450 - Porto Alegre/RS' },
  { name: 'B2W Digital', address: 'Rua Sacadura Cabral, 120 - Rio de Janeiro/RJ' }
];

// CIDADES SIMULAÇÃO
export const MOCK_CITIES = [
  'Porto Alegre, RS',
  'Florianópolis, SC',
  'Curitiba, PR',
  'São Paulo, SP',
  'Rio de Janeiro, RJ',
  'Belo Horizonte, MG',
  'Cuiabá, MT',
  'Goiânia, GO',
  'Brasília, DF',
  'Salvador, BA',
  'Recife, PE',
  'Fortaleza, CE'
];

// CARGAS NO BACKLOG PARA SIMULAR CRIAÇÃO
export const MOCK_LOADS: Load[] = [
  {
    id: 'load-1',
    clientName: 'Pepsico Do Brasil Ltda',
    originCity: 'Porto Alegre, RS',
    destinationCity: 'Florianópolis, SC',
    collectionDate: '2026-01-27',
    collectionWindowStart: '2026-01-27T08:00',
    collectionWindowEnd: '2026-01-27T12:00',
    deliveryDeadline: '2026-01-28T18:00',
    status: 'Pending',
    weight: 12500,
    volume: 45,
    packages: 380,
    merchandiseValue: 185000,
    priority: 'normal',
    segment: 'Industrial',
    vehicleTypeReq: 'Carreta',
    requirements: ['Lona', 'Amarração']
  },
  {
    id: 'load-2',
    clientName: 'Amazon Logística LTDA',
    originCity: 'São Paulo, SP',
    destinationCity: 'Rio de Janeiro, RJ',
    collectionDate: '2026-01-26',
    collectionWindowStart: '2026-01-26T06:00',
    collectionWindowEnd: '2026-01-26T10:00',
    deliveryDeadline: '2026-01-26T23:59',
    status: 'Pending',
    weight: 8200,
    volume: 62,
    packages: 1240,
    merchandiseValue: 420000,
    priority: 'urgent',
    segment: 'E-commerce',
    vehicleTypeReq: 'Carreta',
    requirements: ['Rastreador', 'Escolta'],
    insuranceRequired: true,
    observations: 'Carga de alto valor - exige escolta até destino'
  },
  {
    id: 'load-3',
    clientName: 'Cargill Agrícola',
    originCity: 'Uberlândia, MG',
    destinationCity: 'Paranaguá, PR',
    collectionDate: '2026-01-28',
    collectionWindowStart: '2026-01-28T06:00',
    collectionWindowEnd: '2026-01-28T18:00',
    deliveryDeadline: '2026-01-31T18:00',
    status: 'Pending',
    weight: 24000,
    volume: 52,
    packages: 1,
    merchandiseValue: 78000,
    priority: 'low',
    segment: 'Agro',
    vehicleTypeReq: 'Carreta',
    requirements: ['Lona', 'Balança']
  },
  {
    id: 'load-4',
    clientName: 'Unilever Brasil',
    originCity: 'São Paulo, SP',
    destinationCity: 'Belo Horizonte, MG',
    collectionDate: '2026-01-26',
    collectionWindowStart: '2026-01-26T10:00',
    collectionWindowEnd: '2026-01-26T14:00',
    deliveryDeadline: '2026-01-27T12:00',
    status: 'Pending',
    weight: 12600,
    volume: 40,
    packages: 620,
    merchandiseValue: 234000,
    priority: 'high',
    segment: 'Industrial',
    vehicleTypeReq: 'Truck',
    requirements: ['Baú Seco', 'Conferência Cega'],
    insuranceRequired: true
  },
];

// VIAGENS (CENÁRIOS CAVALO / CARRETA / TRUCK)
export const MOCK_TRIPS: Trip[] = [
  {
    id: '1001',
    createdAt: new Date('2025-09-21T08:00:00').toISOString(),
    status: 'Picking Up',
    driverName: 'Roberto Xtutz',
    truckPlate: 'ABC-1234', // Cavalo
    trailer1Plate: 'SC-9988', // Carreta
    originCity: 'Curitiba, PR',
    mainDestination: 'Florianópolis, SC',
    freightValue: 2500,
    legs: [
      {
        id: 'leg-1', type: 'LOAD', sequence: 1, originCity: 'Curitiba, PR', originAddress: 'CD HUB', destinationCity: 'Florianópolis, SC', segment: 'Industrial', controlNumber: '10293847', direction: 'Ida',
        deliveries: [
          {
            id: 'del-1', sequence: 1, destinationCity: 'Florianópolis, SC', destinationAddress: 'Loja Central', recipientName: 'Mercado Livre', status: 'Pending', attemptNumber: 1,
            documents: [
              { id: 'd1', number: 'CTE-001', type: 'CTe', value: 100, weight: 10, controlNumber: '10293847', linkedCteNumber: 'CTE-001' },
              { id: 'd2', number: 'NF-1001', type: 'NF', value: 12000, weight: 1500, controlNumber: '10293847', linkedCteNumber: 'CTE-001' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: '1002',
    createdAt: new Date().toISOString(),
    status: 'Planned',
    driverName: 'Marcos Oliveira',
    truckPlate: 'XYZ-9876', // Cavalo
    trailer1Plate: 'TR-1122', // Carreta
    originCity: 'São Paulo, SP',
    mainDestination: 'Rio de Janeiro, RJ',
    freightValue: 4200,
    legs: [
      {
        id: 'leg-1002-1', type: 'LOAD', sequence: 1, originCity: 'São Paulo, SP', originAddress: 'CD Matriz', destinationCity: 'Rio de Janeiro, RJ', segment: 'E-commerce', controlNumber: '38475610', direction: 'Ida',
        deliveries: [
          {
            id: 'del-1002-1', sequence: 1, destinationCity: 'Rio de Janeiro, RJ', destinationAddress: 'Centro de Distribuição Norte', recipientName: 'Amazon Logística', status: 'Pending', attemptNumber: 1,
            documents: [
              { id: 'doc-cte-3', number: 'CTE-888', type: 'CTe', value: 3500, weight: 0, controlNumber: '38475610', linkedCteNumber: 'CTE-888' },
              { id: 'doc-nf-1', number: 'NF-102030', type: 'NF', value: 15000, weight: 1200, controlNumber: '38475610', linkedCteNumber: 'CTE-888' },
              { id: 'doc-nf-2', number: 'NF-102031', type: 'NF', value: 8500, weight: 450, controlNumber: '38475610', linkedCteNumber: 'CTE-888' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: '1003',
    createdAt: new Date().toISOString(),
    status: 'In Transit',
    driverName: 'Lucas Pereira',
    truckPlate: 'TRK-5678', // Truck (Sem Carreta)
    originCity: 'Belo Horizonte, MG',
    mainDestination: 'Brasília, DF',
    freightValue: 3800,
    legs: [
      {
        id: 'leg-1003-1', type: 'LOAD', sequence: 1, originCity: 'Belo Horizonte, MG', originAddress: 'Fabrica Textil', destinationCity: 'Brasília, DF', segment: 'Têxtil', controlNumber: 'BR-9900', direction: 'Ida',
        deliveries: [
          {
            id: 'del-1003-1', sequence: 1, destinationCity: 'Brasília, DF', destinationAddress: 'Shopping Sul', recipientName: 'Riachuelo S/A', status: 'Pending', attemptNumber: 1,
            documents: [
              { id: 'doc-cte-4', number: 'CTE-1010', type: 'CTe', value: 3800, weight: 0, controlNumber: 'BR-9900', linkedCteNumber: 'CTE-1010' },
              { id: 'doc-nf-3', number: 'NF-5566', type: 'NF', value: 65000, weight: 4500, controlNumber: 'BR-9900', linkedCteNumber: 'CTE-1010' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: '1004',
    createdAt: new Date().toISOString(),
    status: 'Completed',
    driverName: 'Ana Souza',
    truckPlate: 'CAV-9900', // Cavalo
    trailer1Plate: 'CAR-1122', // Carreta
    originCity: 'Salvador, BA',
    mainDestination: 'Recife, PE',
    freightValue: 1800,
    legs: [
      {
        id: 'leg-1004-1', type: 'LOAD', sequence: 1, originCity: 'Salvador, BA', originAddress: 'Porto', destinationCity: 'Recife, PE', segment: 'Químico', controlNumber: 'NE-2211', direction: 'Retorno',
        deliveries: [
          {
            id: 'del-1004-1', sequence: 1, destinationCity: 'Recife, PE', destinationAddress: 'Ind. Química', recipientName: 'Braskem', status: 'Delivered', attemptNumber: 1,
            documents: [
              { id: 'doc-cte-5', number: 'CTE-7744', type: 'CTe', value: 1800, weight: 0, controlNumber: 'NE-2211', linkedCteNumber: 'CTE-7744' },
              { id: 'doc-nf-4', number: 'NF-8811', type: 'NF', value: 120000, weight: 12000, controlNumber: 'NE-2211', linkedCteNumber: 'CTE-7744' }
            ]
          }
        ]
      }
    ]
  }
];

// DOCUMENTOS DISPONÍVEIS (SIMULANDO CT-e e NFs)
export const MOCK_AVAILABLE_DOCS: AvailableDocument[] = [
  { id: 'ad-1', number: 'NF-5501', type: 'NF', controlNumber: '10293847', dfeKey: '35260100000000000000550010000000011029384701', value: 5000, weight: 300, recipientName: 'Magazine Luiza', destinationCity: 'Porto Alegre, RS', destinationAddress: 'Av. Ipiranga, 100', emissionDate: '2025-09-20' },
  { id: 'ad-2', number: 'NF-5502', type: 'NF', controlNumber: '10293847', dfeKey: '35260100000000000000550010000000021029384708', value: 7500, weight: 450, recipientName: 'Magazine Luiza', destinationCity: 'Porto Alegre, RS', destinationAddress: 'Av. Ipiranga, 100', emissionDate: '2025-09-20' },
  { id: 'ad-3', number: 'NF-5503', type: 'NF', controlNumber: '38475610', linkedCteNumber: 'CTE-559900', dfeKey: '35260100000000000000550010000000033847561007', value: 12890, weight: 980, recipientName: 'Amazon Logística', destinationCity: 'Rio de Janeiro, RJ', destinationAddress: 'CD Norte - Rua A, 200', emissionDate: '2025-09-21' },
  { id: 'ad-4', number: 'NF-5504', type: 'NF', controlNumber: '38475610', linkedCteNumber: 'CTE-559900', dfeKey: '35260100000000000000550010000000043847561004', value: 8350, weight: 560, recipientName: 'Amazon Logística', destinationCity: 'Rio de Janeiro, RJ', destinationAddress: 'CD Norte - Rua A, 200', emissionDate: '2025-09-21' },
  { id: 'ad-5', number: 'CTE-559900', type: 'CTe', controlNumber: '38475610', linkedCteNumber: 'CTE-559900', dfeKey: '35260100000000000000570010000055990038475610', relatedDfeKeys: ['35260100000000000000550010000000033847561007', '35260100000000000000550010000000043847561004'], value: 0, weight: 0, recipientName: 'Amazon Logística', destinationCity: 'Rio de Janeiro, RJ', destinationAddress: 'CD Norte - Rua A, 200', emissionDate: '2025-09-21' },
];

// FROTA (VEÍCULOS - SOMENTE TRUCK E CARRETA)
export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    plate: 'CAR-4234', // Cavalo (Available)
    type: 'Bitrem',
    model: 'Volvo FH540',
    driverName: 'João da Silva',
    driverPhone: '(11) 99999-1234',
    status: 'Available',
    bodyType: 'Graneleira',
    segment: 'Agro',
    capacity: 37000,
    volumeCapacity: 90,
    lastMaintenance: '2026-01-10',
    nextMaintenance: '2026-02-10'
  },
  {
    id: 'v2',
    plate: 'CAR-9876', // Cavalo (In Use)
    type: 'Carreta',
    model: 'Scania R450',
    driverName: 'Marcos Oliveira',
    driverPhone: '(11) 98888-4234',
    status: 'In Use',
    bodyType: 'Baú',
    segment: 'Industrial',
    capacity: 25000,
    volumeCapacity: 75,
    lastMaintenance: '2026-01-05',
    nextMaintenance: '2026-02-05'
  },
  {
    id: 'v3',
    plate: 'TRK-5678', // Truck (Available)
    type: 'Truck',
    model: 'VW Constellation',
    driverName: 'Lucas Pereira',
    driverPhone: '(11) 97777-5678',
    status: 'Available',
    bodyType: 'Sider',
    segment: 'Industrial',
    capacity: 14000,
    volumeCapacity: 45,
    lastMaintenance: '2026-01-15',
    nextMaintenance: '2026-02-15'
  },
  {
    id: 'v4',
    plate: 'ABC-1234', // Cavalo (In Use) - Trip 1001
    type: 'Carreta',
    model: 'Iveco Hi-Way',
    driverName: 'Roberto Xtutz',
    driverPhone: '(11) 96666-9876',
    status: 'In Use',
    capacity: 25000,
    volumeCapacity: 75,
    lastMaintenance: '2025-12-20',
    nextMaintenance: '2026-01-20'
  },
  {
    id: 'v6',
    plate: 'CAV-9900', // Cavalo (Available - Trip Completed)
    type: 'Carreta',
    model: 'Mercedes Actros',
    driverName: 'Ana Souza',
    driverPhone: '(11) 94444-1357',
    status: 'Available',
    capacity: 3500,
    volumeCapacity: 18,
    lastMaintenance: '2026-01-24',
    nextMaintenance: '2026-01-30'
  },
];
