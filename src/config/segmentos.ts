/**
 * Configuração de Segmentos Operacionais e Compatibilidade com Veículos
 * 
 * Baseado nos segmentos da Tomazi: Ração, Palete, Tijolo, etc.
 * Define quais tipos de veículos são compatíveis com cada segmento.
 */

export interface SegmentConfig {
  id: string;
  name: string;
  description: string;
  compatibleVehicleTypes: string[]; // Tipos de veículo compatíveis
  compatibleBodyTypes: string[]; // Tipos de carroceria compatíveis
}

export const SEGMENTOS: Record<string, SegmentConfig> = {
  'Ração': {
    id: 'racao',
    name: 'Ração',
    description: 'Transporte de ração animal (exige silo/graneleira)',
    compatibleVehicleTypes: ['Truck', 'Carreta'],
    compatibleBodyTypes: ['Silo', 'Graneleira']
  },
  'Palete': {
    id: 'palete',
    name: 'Palete',
    description: 'Cargas paletizadas (exige baú/sider)',
    compatibleVehicleTypes: ['Truck', 'Carreta', 'Bitrem'],
    compatibleBodyTypes: ['Baú', 'Sider', 'Frigorífico']
  },
  'Tijolo': {
    id: 'tijolo',
    name: 'Tijolo',
    description: 'Material de construção (exige carroceria aberta/sider)',
    compatibleVehicleTypes: ['Truck', 'Carreta'],
    compatibleBodyTypes: ['Sider', 'Prancha', 'Basculante']
  },
  'Graneleiro': {
    id: 'graneleiro',
    name: 'Graneleiro',
    description: 'Grãos e commodities (exige graneleira)',
    compatibleVehicleTypes: ['Truck', 'Carreta', 'Bitrem'],
    compatibleBodyTypes: ['Graneleira', 'Silo']
  },
  'Frigorífico': {
    id: 'frigorifico',
    name: 'Frigorífico',
    description: 'Produtos refrigerados (exige frigorífico)',
    compatibleVehicleTypes: ['Truck', 'Carreta'],
    compatibleBodyTypes: ['Frigorífico']
  },
  'Industrial': {
    id: 'industrial',
    name: 'Industrial',
    description: 'Cargas industriais diversas',
    compatibleVehicleTypes: ['Truck', 'Carreta', 'Bitrem'],
    compatibleBodyTypes: ['Baú', 'Sider', 'Prancha']
  },
  'E-commerce': {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Cargas de e-commerce (exige baú)',
    compatibleVehicleTypes: ['Truck', 'Carreta'],
    compatibleBodyTypes: ['Baú', 'Sider']
  }
};

/**
 * Verifica se um veículo é compatível com um segmento
 */
export function isVehicleCompatibleWithSegment(
  vehicleType: string,
  vehicleBodyType: string | undefined,
  segment: string | undefined
): boolean {
  if (!segment) return true; // Se não há segmento definido, aceita qualquer veículo
  
  const segmentConfig = SEGMENTOS[segment];
  if (!segmentConfig) return true; // Segmento desconhecido, aceita por padrão
  
  // Verifica tipo de veículo
  const vehicleTypeMatch = segmentConfig.compatibleVehicleTypes.includes(vehicleType);
  
  // Verifica tipo de carroceria (se disponível)
  const bodyTypeMatch = !vehicleBodyType || segmentConfig.compatibleBodyTypes.includes(vehicleBodyType);
  
  return vehicleTypeMatch && bodyTypeMatch;
}

/**
 * Filtra veículos compatíveis com um segmento
 */
export function filterCompatibleVehicles<T extends { type: string; model?: string }>(
  vehicles: T[],
  segment: string | undefined
): T[] {
  if (!segment) return vehicles;
  
  return vehicles.filter(v => {
    // Extrai tipo de carroceria do modelo (ex: "Mercedes-Benz Actros - Baú")
    const bodyType = v.model?.split(' - ')[1] || v.model?.split(' ').pop();
    
    return isVehicleCompatibleWithSegment(v.type, bodyType, segment);
  });
}

/**
 * Obtém lista de segmentos disponíveis
 */
export function getAvailableSegments(): SegmentConfig[] {
  return Object.values(SEGMENTOS);
}

/**
 * Obtém segmento por ID ou nome
 */
export function getSegmentByIdOrName(idOrName: string): SegmentConfig | undefined {
  return Object.values(SEGMENTOS).find(s => 
    s.id === idOrName || s.name === idOrName
  );
}
