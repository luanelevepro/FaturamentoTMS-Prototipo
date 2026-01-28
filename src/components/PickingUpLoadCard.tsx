import React from 'react';
import { Load, Trip } from '@/types';
import { Eye, Copy, Truck, MapPin, Calendar } from 'lucide-react';

interface PickingUpLoadCardProps {
  load: Load;
  trip: Trip;
  progress?: number;
  onViewDetails?: () => void;
  onStartTrip?: () => void;
}

export const PickingUpLoadCard: React.FC<PickingUpLoadCardProps> = ({
  load,
  trip,
  progress = 0,
  onViewDetails,
  onStartTrip
}) => {
  // Formatar ID da carga (ex: SHP-615092)
  const formattedId = load.id.includes('SHP') ? load.id : `SHP-${load.id.replace(/\D/g, '').substring(0, 6)}`;
  
  // Obter placas do veículo
  const vehiclePlates = [
    trip.truckPlate,
    trip.trailer1Plate,
    trip.trailer2Plate,
    trip.trailer3Plate
  ].filter(Boolean).join(' / ');
  
  // Formatar data de coleta
  const collectionDate = load.collectionDate 
    ? new Date(load.collectionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : '';
  
  const collectionTime = load.collectionWindowStart
    ? new Date(load.collectionWindowStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';

  // Extrair etiquetas EPI e Ajudante dos requirements
  const epiTag = load.requirements?.some(r => r.includes('EPI')) ? 'EPI' : null;
  const ajudanteTag = load.requirements?.some(r => r.includes('Ajudante')) ? 'Ajudante' : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all shadow-sm">
      {/* Cabeçalho: ID + Tipo + Ícones */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-gray-600">#{formattedId}</span>
          <span className="text-[11px] font-black text-blue-600 uppercase tracking-tight">
            {load.vehicleTypeReq || 'CARGA GERAL'}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-gray-400 opacity-60 hover:opacity-100 transition-opacity">
          <button 
            onClick={onViewDetails} 
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Visualizar"
          >
            <Eye size={14} />
          </button>
          <button 
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Copiar"
            onClick={() => navigator.clipboard.writeText(load.id)}
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Nome do Cliente */}
      <div className="mb-2">
        <h3 className="text-base font-black text-gray-900 leading-tight">
          {load.clientName}
        </h3>
      </div>

      {/* Etiquetas EPI e Ajudante */}
      {(epiTag || ajudanteTag) && (
        <div className="flex items-center gap-1.5 mb-2">
          {epiTag && (
            <span className="text-[9px] font-bold text-white bg-gray-600 px-2 py-0.5 rounded uppercase">
              EPI
            </span>
          )}
          {ajudanteTag && (
            <span className="text-[9px] font-bold text-white bg-gray-600 px-2 py-0.5 rounded uppercase">
              Ajudante
            </span>
          )}
        </div>
      )}

      {/* Veículo - Destacado */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-2">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-blue-600 shrink-0" />
          <span className="text-[12px] font-black text-blue-700 font-mono tracking-wide">
            {vehiclePlates}
          </span>
        </div>
      </div>

      {/* Rota */}
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={14} className="text-gray-400 shrink-0" />
        <span className="text-[11px] font-medium text-gray-700">
          {load.originCity} → {load.destinationCity || 'Destino Indefinido'}
        </span>
      </div>

      {/* Data e Hora de Coleta */}
      {collectionDate && (
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={14} className="text-orange-500 shrink-0" />
          <span className="text-[11px] font-medium text-orange-600">
            Coleta: {collectionDate}{collectionTime ? `, ${collectionTime}` : ''}
          </span>
        </div>
      )}

      {/* Data e Hora de Entrega */}
      {(() => {
        // Verificar se há entrega concluída nas legs da viagem
        const deliveredDelivery = trip.legs
          ?.flatMap(leg => (leg.deliveries || []))
          .find(d => d.status === 'Delivered' && d.deliveryDate);
        
        // Tentar obter deliveryDeadline do load
        const deadline = load.deliveryDeadline || (load as any).deliveryDeadline;
        
        // Se há entrega concluída, usar data real
        if (deliveredDelivery?.deliveryDate) {
          const deliveryDate = new Date(deliveredDelivery.deliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const deliveryTime = new Date(deliveredDelivery.deliveryDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          
          return (
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-green-500 shrink-0" />
              <span className="text-[11px] font-medium text-green-600">
                Entregue: {deliveryDate}, {deliveryTime}
              </span>
            </div>
          );
        }
        
        // Se não há entrega concluída mas há deadline previsto
        if (deadline) {
          const deliveryDate = new Date(deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const deliveryTime = new Date(deadline).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          
          return (
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-green-500 shrink-0" />
              <span className="text-[11px] font-medium text-green-600">
                Entrega prevista: {deliveryDate}, {deliveryTime}
              </span>
            </div>
          );
        }
        
        // Se não tem nenhuma data, calcular estimativa baseada na coleta + 1 dia
        if (collectionDate) {
          const collectionDateTime = load.collectionWindowStart 
            ? new Date(load.collectionWindowStart)
            : load.collectionDate 
            ? new Date(load.collectionDate)
            : null;
          
          if (collectionDateTime) {
            // Adicionar 1 dia como estimativa padrão
            const estimatedDelivery = new Date(collectionDateTime);
            estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
            
            const deliveryDate = estimatedDelivery.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const deliveryTime = estimatedDelivery.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-green-500 shrink-0" />
                <span className="text-[11px] font-medium text-green-600">
                  Entrega prevista: {deliveryDate}, {deliveryTime}
                </span>
              </div>
            );
          }
        }
        
        return null;
      })()}

      {/* Descrição */}
      {load.observations && (
        <div className="flex items-start gap-2 mb-3">
          <div className="w-0.5 h-4 bg-gray-300 mt-0.5 shrink-0"></div>
          <span className="text-[10px] text-gray-500 italic leading-relaxed">
            {load.observations}
          </span>
        </div>
      )}

      {/* Barra de Progresso */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Progresso</span>
          <span className="text-[10px] font-black text-green-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-green-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Botão de Ação */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={onStartTrip}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-lg transition-colors uppercase"
        >
          Iniciar Viagem
        </button>
      </div>
    </div>
  );
};
