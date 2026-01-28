/**
 * Sistema de Validações e Bloqueios
 * 
 * Implementa regras de negócio para evitar operações fisicamente ou fiscalmente impossíveis.
 * Divide-se em:
 * - Hard Blocks: Sistema impede a ação
 * - Warnings: Sistema avisa, mas deixa o gerente decidir
 */

import { Load, Trip, Vehicle, CTe } from '@/types';
import { isVehicleCompatibleWithSegment, getSegmentByIdOrName } from '@/config/segmentos';

export type ValidationResult = {
  valid: boolean;
  error?: string;
  warning?: string;
  type: 'hard_block' | 'warning';
};

/**
 * 1. VALIDAÇÃO DE COMPATIBILIDADE (Veículo x Carga)
 * Hard Block: Impede vinculação se incompatível
 */
export function validateSegmentCompatibility(
  vehicle: Vehicle,
  load: Load
): ValidationResult {
  // Se carga não tem segmento definido, permite (assume compatível)
  if (!load.segment) {
    return { valid: true, type: 'hard_block' };
  }

  // Verifica compatibilidade usando o sistema de segmentos
  const isCompatible = isVehicleCompatibleWithSegment(
    vehicle.type,
    vehicle.bodyType,
    load.segment
  );

  if (!isCompatible) {
    const segmentConfig = getSegmentByIdOrName(load.segment);
    const requiredTypes = segmentConfig?.compatibleBodyTypes.join(', ') || 'tipos específicos';
    
    return {
      valid: false,
      type: 'hard_block',
      error: `Veículo incompatível! Carga de "${load.segment}" requer: ${requiredTypes}. Veículo atual: ${vehicle.bodyType || vehicle.type}`
    };
  }

  return { valid: true, type: 'hard_block' };
}

/**
 * Validação de Veículo Dedicado
 * Hard Block: Impede adicionar outra carga se carga é exclusiva/lotação
 */
export function validateDedicatedVehicle(
  trip: Trip,
  newLoad: Load
): ValidationResult {
  // Verifica se há alguma carga marcada como exclusiva ou lotação
  const hasExclusiveLoad = trip.loads?.some(l => 
    l.requirements?.includes('Exclusiva') || 
    l.requirements?.includes('Lotação')
  );

  if (hasExclusiveLoad && trip.loads && trip.loads.length > 0) {
    return {
      valid: false,
      type: 'hard_block',
      error: 'Não é possível adicionar carga adicional. Viagem contém carga exclusiva/lotação.'
    };
  }

  // Verifica se a nova carga é exclusiva e já há outras cargas
  const isNewLoadExclusive = newLoad.requirements?.includes('Exclusiva') || 
                              newLoad.requirements?.includes('Lotação');
  
  if (isNewLoadExclusive && trip.loads && trip.loads.length > 0) {
    return {
      valid: false,
      type: 'hard_block',
      error: 'Não é possível adicionar carga exclusiva/lotação a uma viagem que já contém outras cargas.'
    };
  }

  return { valid: true, type: 'hard_block' };
}

/**
 * 2. VALIDAÇÃO DE CAPACIDADE (Peso e Volume)
 * Hard Block: Impede se excede capacidade física
 */
export function validateCapacity(
  vehicle: Vehicle,
  trip: Trip,
  newLoad: Load,
  loadType: 'COMPLEMENTO' | 'RETORNO'
): ValidationResult {
  const vehicleCapacity = vehicle.capacity || 0; // Capacidade em kg
  const vehicleVolume = vehicle.volumeCapacity || 0; // Capacidade em m³

  // Validação de Peso
  if (newLoad.weight && vehicleCapacity > 0) {
    let availableCapacity = vehicleCapacity;

    // Se for carga complementar (mesmo trecho), desconta o que já está no caminhão
    if (loadType === 'COMPLEMENTO') {
      const currentWeight = trip.legs
        .filter(l => l.type === 'LOAD')
        .reduce((sum, leg) => {
          const legLoad = trip.loads?.find(l => l.id === leg.loadId);
          return sum + (legLoad?.weight || 0);
        }, 0);
      
      availableCapacity = vehicleCapacity - currentWeight;
    }
    // Se for retorno, assume caminhão vazio (ou parcialmente vazio após entrega)

    if (newLoad.weight > availableCapacity) {
      return {
        valid: false,
        type: 'hard_block',
        error: `Peso da carga (${newLoad.weight}kg) excede a capacidade disponível (${availableCapacity}kg). Capacidade total do veículo: ${vehicleCapacity}kg.`
      };
    }
  }

  // Validação de Volume
  if (newLoad.volume && vehicleVolume > 0) {
    let availableVolume = vehicleVolume;

    if (loadType === 'COMPLEMENTO') {
      const currentVolume = trip.legs
        .filter(l => l.type === 'LOAD')
        .reduce((sum, leg) => {
          const legLoad = trip.loads?.find(l => l.id === leg.loadId);
          return sum + (legLoad?.volume || 0);
        }, 0);
      
      availableVolume = vehicleVolume - currentVolume;
    }

    if (newLoad.volume > availableVolume) {
      return {
        valid: false,
        type: 'hard_block',
        error: `Volume da carga (${newLoad.volume}m³) excede a capacidade disponível (${availableVolume}m³). Capacidade total do veículo: ${vehicleVolume}m³.`
      };
    }
  }

  return { valid: true, type: 'hard_block' };
}

/**
 * Validação de Sequência Logística (Retorno)
 * Warning: Alerta se datas são incompatíveis
 */
export function validateReturnSequence(
  trip: Trip,
  newLoad: Load
): ValidationResult {
  // Se não é retorno, não precisa validar
  const isReturn = trip.legs.some(l => 
    l.loadId && 
    trip.loads?.find(load => load.id === l.loadId)?.originCity === newLoad.originCity
  );

  if (!isReturn) {
    return { valid: true, type: 'warning' };
  }

  // Verifica se há carga de ida com previsão de entrega
  const idaLoad = trip.loads?.find(l => 
    trip.legs.some(leg => leg.loadId === l.id && leg.direction === 'Ida')
  );

  if (idaLoad && trip.estimatedReturnDate && newLoad.collectionDate) {
    const returnDate = new Date(newLoad.collectionDate);
    const estimatedDelivery = new Date(trip.estimatedReturnDate);

    if (returnDate < estimatedDelivery) {
      return {
        valid: true,
        type: 'warning',
        warning: `Atenção: Data de coleta do retorno (${returnDate.toLocaleDateString('pt-BR')}) é anterior à previsão de entrega da ida (${estimatedDelivery.toLocaleDateString('pt-BR')}). Confirma a sequência?`
      };
    }
  }

  return { valid: true, type: 'warning' };
}

/**
 * 3. REGRAS FISCAIS (CT-e e MDF-e)
 */

/**
 * Validação: Emissão de CT-e requer Viagem com Motorista e Veículo
 * Hard Block: Bloqueia botão se não há viagem vinculada
 */
export function validateCTeEmission(
  load: Load,
  trip: Trip | null
): ValidationResult {
  if (!trip) {
    return {
      valid: false,
      type: 'hard_block',
      error: 'CT-e só pode ser emitido após vincular a carga a uma viagem com motorista e veículo.'
    };
  }

  if (!trip.driverName || trip.driverName === 'A definir') {
    return {
      valid: false,
      type: 'hard_block',
      error: 'CT-e requer motorista confirmado na viagem.'
    };
  }

  if (!trip.truckPlate) {
    return {
      valid: false,
      type: 'hard_block',
      error: 'CT-e requer placa do veículo confirmada na viagem.'
    };
  }

  return { valid: true, type: 'hard_block' };
}

/**
 * Validação: Trava de Alteração Pós-Emissão
 * Hard Block: Impede trocar motorista/veículo após CT-e autorizado
 */
export function validatePostEmissionChange(
  trip: Trip,
  newDriverName?: string,
  newTruckPlate?: string
): ValidationResult {
  // Verifica se há algum CT-e autorizado nas cargas da viagem
  const hasAuthorizedCTe = trip.loads?.some(l => 
    l.cte && l.cte.status === 'Authorized'
  );

  if (!hasAuthorizedCTe) {
    return { valid: true, type: 'hard_block' };
  }

  // Se tentar trocar motorista
  if (newDriverName && newDriverName !== trip.driverName) {
    return {
      valid: false,
      type: 'hard_block',
      error: 'Não é possível alterar motorista após CT-e autorizado. Cancele o CT-e primeiro ou emita evento de encerramento.'
    };
  }

  // Se tentar trocar veículo
  if (newTruckPlate && newTruckPlate !== trip.truckPlate) {
    return {
      valid: false,
      type: 'hard_block',
      error: 'Não é possível alterar veículo após CT-e autorizado. Cancele o CT-e primeiro ou emita evento de encerramento.'
    };
  }

  return { valid: true, type: 'hard_block' };
}

/**
 * Validação: MDF-e Aberto
 * Hard Block: Impede iniciar viagem se há MDF-e não encerrado
 * Nota: Esta validação requer verificação no banco/API (implementar depois)
 */
export function validateOpenMDFe(
  vehicle: Vehicle,
  driverName: string,
  originState: string
): ValidationResult {
  // TODO: Implementar verificação real no banco/API
  // Por enquanto, retorna válido (será implementado quando houver integração)
  
  return {
    valid: true,
    type: 'hard_block',
    warning: 'Validação de MDF-e aberto será implementada na integração com SEFAZ.'
  };
}

/**
 * 4. REGRAS OPERACIONAIS DE STATUS
 */

/**
 * Validação: Viagem Finalizada
 * Hard Block: Impede adicionar cargas a viagem concluída/cancelada
 */
export function validateTripStatus(
  trip: Trip
): ValidationResult {
  if (trip.status === 'Completed') {
    return {
      valid: false,
      type: 'hard_block',
      error: 'Não é possível adicionar cargas a uma viagem concluída. Crie uma nova viagem.'
    };
  }

  if (trip.status === 'Delayed') {
    // Delayed pode ainda receber cargas (depende da regra de negócio)
    return {
      valid: true,
      type: 'warning',
      warning: 'Viagem está com status "Atrasada". Confirma adicionar carga mesmo assim?'
    };
  }

  return { valid: true, type: 'hard_block' };
}

/**
 * Função Principal: Validação Completa para Adicionar Carga
 * Agrega todas as validações necessárias
 */
export function validateAddLoadToTrip(
  trip: Trip,
  newLoad: Load,
  vehicle: Vehicle,
  loadType: 'COMPLEMENTO' | 'RETORNO' = 'COMPLEMENTO'
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validação de Status da Viagem
  const statusValidation = validateTripStatus(trip);
  if (!statusValidation.valid) {
    errors.push(statusValidation.error!);
  } else if (statusValidation.warning) {
    warnings.push(statusValidation.warning);
  }

  // 2. Validação de Compatibilidade de Segmento
  const segmentValidation = validateSegmentCompatibility(vehicle, newLoad);
  if (!segmentValidation.valid) {
    errors.push(segmentValidation.error!);
  }

  // 3. Validação de Veículo Dedicado
  const dedicatedValidation = validateDedicatedVehicle(trip, newLoad);
  if (!dedicatedValidation.valid) {
    errors.push(dedicatedValidation.error!);
  }

  // 4. Validação de Capacidade
  const capacityValidation = validateCapacity(vehicle, trip, newLoad, loadType);
  if (!capacityValidation.valid) {
    errors.push(capacityValidation.error!);
  }

  // 5. Validação de Sequência (Retorno)
  const sequenceValidation = validateReturnSequence(trip, newLoad);
  if (sequenceValidation.warning) {
    warnings.push(sequenceValidation.warning);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validação para Emitir CT-e
 */
export function validateEmitCTe(
  load: Load,
  trip: Trip | null
): ValidationResult {
  // Validação básica de viagem/motorista/veículo
  const basicValidation = validateCTeEmission(load, trip);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  // Verifica se carga já tem CT-e autorizado
  if (load.cte && load.cte.status === 'Authorized') {
    return {
      valid: false,
      type: 'hard_block',
      error: 'Esta carga já possui CT-e autorizado.'
    };
  }

  // Verifica se carga está vinculada à viagem
  if (load.status !== 'Scheduled' && load.status !== 'Emitted') {
    return {
      valid: false,
      type: 'hard_block',
      error: 'CT-e só pode ser emitido para cargas agendadas em viagem.'
    };
  }

  return { valid: true, type: 'hard_block' };
}
