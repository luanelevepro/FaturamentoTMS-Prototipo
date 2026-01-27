
export interface Document {
  id: string;
  number: string;
  type: 'CTe' | 'NF';
  controlNumber?: string; // O Nº Controle do Embarcador (Agrupador)
  linkedCteNumber?: string; // O CT-e emitido pela transportadora que cobre esta NF/Controle
  dfeKey?: string; // Chave de acesso do DF-e (NF-e/CT-e) quando aplicável
  relatedDfeKeys?: string[]; // Para CT-e: chaves de DF-es (NF-e/CT-e) referenciados
  value: number;
  weight?: number;
}

export interface Delivery {
  id: string;
  sequence: number; // #1, #2...
  destinationCity: string;
  destinationAddress: string;
  recipientName: string;
  status: 'Pending' | 'Delivered' | 'Returned';
  proofOfDelivery?: string; // URL/Path to POD image
  documents: Document[];
}

export interface Leg {
  id: string;
  type: 'LOAD' | 'EMPTY'; // Distinguish between cargo legs and positioning legs
  sequence: number; // Global sequence in timeline
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

  // Route Info (Macro)
  mainDestination: string; // Just for reference in list
  originCity: string; // Initial origin


  // Financials
  freightValue: number;

  status: 'Planned' | 'Picking Up' | 'In Transit' | 'Completed' | 'Delayed';

  // Hierarchy
  legs: Leg[];
  proofOfDelivery?: string;
}

export interface AvailableDocument {
  id: string;
  number: string;
  type: 'CTe' | 'NF';
  controlNumber?: string; // New field for grouping (Nº Controle/Carga)
  linkedCteNumber?: string;
  dfeKey?: string;
  relatedDfeKeys?: string[];
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
  // Capacidades
  capacity?: number;              // Capacidade em kg
  volumeCapacity?: number;        // Capacidade em m³
  // Manutenção
  lastMaintenance?: string;       // Data última manutenção
  nextMaintenance?: string;       // Data próxima manutenção
}

export interface Load {
  id: string;
  clientName: string;
  originCity: string;
  destinationCity?: string; // pode ser indefinido enquanto a carga está só "agendada no embarcador"
  collectionDate: string;
  status: 'Pending' | 'Scheduled';
  documents?: AvailableDocument[];
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
