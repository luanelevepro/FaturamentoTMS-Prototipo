
// CT-e (Documento Fiscal) - Entidade separada vinculada à Carga
// Permite cancelamento sem perder a carga (cria novo CT-e apontando para mesma carga)
export interface CTe {
  id: string;
  loadId: string; // FK_CARGA: Este CT-e pertence à Carga X
  number: string;
  accessKey: string; // CHAVE_ACESSO (chave de acesso do CT-e na SEFAZ)
  freightValue: number; // VALOR_FRETE
  status: 'Authorized' | 'Cancelled' | 'Pending';
  emissionDate: string;
  authorizationDate?: string;
  cancellationDate?: string;
  cancellationReason?: string;
  isSubcontracted?: boolean; // 1 quando CT-e é subcontratado
  createdAt: string;
}

// Manifesto Eletrônico (Documento de Viagem)
export interface MDFe {
  id: string;
  tripId: string;
  number: string;
  accessKey: string;
  status: 'Authorized' | 'Cancelled' | 'Pending';
  emissionDate: string;
  authorizationDate?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  number: string;
  type: 'CTe' | 'NF';
  controlNumber?: string; // O Nº Controle do Embarcador (Agrupador)
  linkedCteNumber?: string; // O CT-e emitido pela transportadora que cobre esta NF/Controle
  dfeKey?: string; // Chave de acesso do DF-e (NF-e/CT-e) quando aplicável
  relatedDfeKeys?: string[]; // Para CT-e: chaves de DF-es (NF-e/CT-e) referenciados
  isSubcontracted?: boolean; // Para CT-e: indica subcontratação (não codificar no número)
  value: number;
  weight?: number;
  deliveryId?: string; // NF-es vinculadas a entregas
  cteId?: string; // Referência ao CT-e (para consultas rápidas)
}

// Entrega (Evento de Entrega) - Pode ter múltiplas tentativas (reentregas)
export interface Delivery {
  id: string;
  sequence: number; // #1, #2...
  loadId?: string; // Vínculo direto à carga (para facilitar consultas)
  attemptNumber: number; // Número da tentativa de entrega (1, 2, 3...)
  destinationCity: string;
  destinationAddress: string;
  recipientName: string;
  status: 'Pending' | 'Delivered' | 'Returned' | 'Failed';
  // Failed: Tentativa falhou (galpão fechado, etc.) - permite nova tentativa
  proofOfDelivery?: string; // URL/Path to POD image
  deliveryDate?: string;
  failureReason?: string; // Motivo da falha (se status = 'Failed')
  documents: Document[]; // NF-es vinculadas a esta entrega
}

export interface Leg {
  id: string;
  type: 'LOAD' | 'EMPTY'; // Distinguish between cargo legs and positioning legs
  sequence: number; // Global sequence in timeline
  loadId?: string; // Vínculo opcional: esta perna representa uma carga específica
  originCity: string;
  originAddress: string;
  destinationCity?: string; // Where this leg ends (crucial for empty legs)
  hubName?: string; // e.g. Centro de distribuição POA123
  controlNumber?: string; // Nº de Controle Operacional (por carga)
  segment?: string; // New field: Segment definition (e.g. Agro, Industrial, Frigo)
  vehicleTypeReq?: string; // Tipo de carroceria exigida (ex.: baú/sider/frigorífico...)
  direction?: 'Ida' | 'Retorno'; // Direção da carga relativa à viagem
  deliveries: Delivery[];
}

export interface Trip {
  id: string;
  createdAt: string;
  scheduledDate?: string; // Data de saída prevista
  estimatedReturnDate?: string; // Data de retorno prevista (Opcional)

  // Resources
  driverName: string;

  // New Vehicle Structure
  truckPlate: string;      // Cavalo
  trailer1Plate?: string;  // Carreta 1 (Opcional)
  trailer2Plate?: string;  // Carreta 2 (Opcional)
  trailer3Plate?: string;  // Carreta 3 (Opcional - Rodotrem/Tritrem)
  segment?: string;        // Segmento operacional da viagem (determinado pela primeira carga)

  // Route Info (Macro)
  mainDestination: string; // Just for reference in list
  originCity: string; // Initial origin


  // Financials
  freightValue: number;

  // Máquina de Estados conforme fluxo operacional:
  // 'Planned' → 'Picking Up' → 'In Transit' → 'Completed'
  // Estados intermediários podem ser 'Delayed'
  status: 'Planned' | 'Picking Up' | 'In Transit' | 'Completed' | 'Delayed';

  // Hierarchy
  legs: Leg[];
  proofOfDelivery?: string;

  // Cargas vinculadas (para facilitar acesso)
  loads?: Load[];
  mdfes?: MDFe[]; // Lista de MDF-es da viagem (um ou mais)
}

export interface AvailableDocument {
  id: string;
  number: string;
  type: 'CTe' | 'NF';
  controlNumber?: string; // New field for grouping (Nº Controle/Carga)
  linkedCteNumber?: string;
  dfeKey?: string;
  relatedDfeKeys?: string[];
  isSubcontracted?: boolean; // CT-e subcontratado (não usar prefixo no número)
  value: number;
  weight: number;
  recipientName: string;
  destinationCity: string;
  destinationAddress: string;
  emissionDate: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  type: 'Truck' | 'Carreta' | 'Bitrem' | 'Vuc';
  model: string;
  driverName?: string;
  driverPhone?: string;           // Telefone do motorista
  status: 'Available' | 'In Use' | 'Maintenance';
  bodyType?: string;              // Tipo de carroceria (Baú, Sider, Graneleira, etc.)
  segment?: string;               // Segmento operacional do veículo (Ração, Palete, etc.)
  // Capacidades
  capacity?: number;              // Capacidade em kg
  volumeCapacity?: number;        // Capacidade em m³
  // Manutenção
  lastMaintenance?: string;       // Data última manutenção
  nextMaintenance?: string;       // Data próxima manutenção
}

// Carga (Tabela Mestre) - Entidade que alimenta o Kanban
// Representa a demanda logística. Existe antes do CT-e e pode sobreviver após cancelamento
export interface Load {
  id: string;
  clientName: string;
  originCity: string;
  destinationCity?: string; // pode ser indefinido enquanto a carga está só "agendada no embarcador"
  collectionDate: string;
  status: 'Pending' | 'Scheduled' | 'Emitted' | 'Delivered';
  // Pending: Carga no backlog, sem CT-e ainda
  // Scheduled: Vinculada a uma viagem, mas CT-e ainda não emitido
  // Delivered: Entrega concluída
  cte?: CTe; // CT-e atual (pode ser null se ainda não emitido, ou se foi cancelado)
  mdfe?: MDFe; // MDF-e vinculado a esta carga na viagem
  documents?: AvailableDocument[]; // Documentos disponíveis para vinculação
  // Advanced Fields
  requirements?: string[]; // e.g. ['EPI', 'Paletes']
  vehicleTypeReq?: string; // e.g. 'Carreta', 'Truck'
  observations?: string;

  // ===== NOVOS CAMPOS - TORRE DE CONTROLE =====
  // Características Físicas
  weight?: number;                // Peso bruto (kg)
  netWeight?: number;             // Peso líquido (kg)  
  volume?: number;                // Cubagem (m³)
  packages?: number;              // Quantidade de volumes
  maxStacking?: number;           // Empilhamento máximo

  // Janelas de Tempo (SLA)
  collectionWindowStart?: string; // Início janela coleta
  collectionWindowEnd?: string;   // Fim janela coleta
  deliveryDeadline?: string;      // Prazo limite entrega (SLA)

  // Financeiro & Risco
  merchandiseValue?: number;      // Valor da mercadoria (R$)
  insuranceRequired?: boolean;    // Requer seguro

  // Prioridade & Classificação
  priority?: 'low' | 'normal' | 'high' | 'urgent';  // Prioridade
  segment?: string;               // Segmento (Agro, Industrial, Frigo, E-commerce)
}

export type ViewState = 'LIST' | 'LIST_V2' | 'CREATE_TRIP' | 'TRIP_DETAILS' | 'TIMELINE';

export interface ScheduleItem {
  id: string;
  veiculo_id: string;
  veiculo_placa: string;
  data_inicio: string;
  data_fim: string;
  tipo_evento: string;
  referencia_id: string;
  status: string;
  cor: string;
  origem_dado: string;
  meta_dados?: string;
}
