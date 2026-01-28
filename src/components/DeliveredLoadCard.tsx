import React from 'react';
import { Load, Trip } from '@/types';
import { Eye, Copy, Truck, MapPin, Calendar } from 'lucide-react';

interface DeliveredLoadCardProps {
  load: Load;
  trip: Trip;
  onViewDetails?: () => void;
}

export const DeliveredLoadCard: React.FC<DeliveredLoadCardProps> = ({
  load,
  trip,
  onViewDetails
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
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all shadow-sm opacity-75">
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

      {/* Data e Hora de Entrega - SEMPRE mostrar quando entregue */}
      {(() => {
        // Se a viagem está como Completed, sempre deve ter data de entrega
        // Verificar se há entrega concluída nas legs da viagem
        const deliveredDelivery = trip.legs
          ?.flatMap(leg => (leg.deliveries || []))
          .find(d => d.status === 'Delivered');
        
        // Se encontrou entrega com deliveryDate, usar essa data
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
        
        // Se a viagem está Completed mas não tem deliveryDate nas entregas,
        // usar a data de conclusão da viagem (proofOfDelivery ou data atual)
        if (trip.status === 'Completed') {
          // Tentar usar proofOfDelivery como timestamp, ou usar data atual
          const completionDate = trip.proofOfDelivery 
            ? new Date(trip.proofOfDelivery)
            : new Date(); // Se não tem POD, usar data atual como fallback
          
          const deliveryDate = completionDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const deliveryTime = completionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          
          return (
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-green-500 shrink-0" />
              <span className="text-[11px] font-medium text-green-600">
                Entregue: {deliveryDate}, {deliveryTime}
              </span>
            </div>
          );
        }
        
        // Se não está Completed, não deve aparecer aqui, mas por segurança mostra estimativa
        const deadline = load.deliveryDeadline || (load as any).deliveryDeadline;
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

      {/* Status de Entregue */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          <span className="text-[10px] font-bold text-emerald-700">
            Entregue
          </span>
        </div>
      </div>
    </div>
  );
};
