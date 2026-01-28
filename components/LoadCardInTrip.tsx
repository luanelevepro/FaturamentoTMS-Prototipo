import React from 'react';
import { Load, CTe, Trip } from '@/types';
import { Package, FileText, CheckCircle, AlertCircle, MapPin, Calendar, Clock } from 'lucide-react';
import { validateEmitCTe } from '@/lib/validations';

interface LoadCardInTripProps {
  load: Load;
  tripId: string;
  trip?: Trip | null;
  onEmitCTe?: (loadId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

/**
 * Card de Carga dentro de uma Viagem
 * Mostra o ciclo de vida fiscal da carga e permite emitir CT-e
 */
export const LoadCardInTrip: React.FC<LoadCardInTripProps> = ({
  load,
  tripId,
  trip = null,
  onEmitCTe,
  isExpanded = false,
  onToggleExpand
}) => {
  const hasCTe = load.cte && load.cte.status === 'Authorized';
  const cteStatus = load.cte?.status;
  
  // Validação para habilitar/desabilitar botão de emitir CT-e
  const cteValidation = validateEmitCTe(load, trip);
  const canEmitCTe = cteValidation.valid && load.status === 'Scheduled' && !hasCTe;
  
  // Determina o status visual da carga baseado no status e CT-e
  const getLoadStatusInfo = () => {
    if (load.status === 'Delivered') {
      return { label: 'Entregue', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle };
    }
    if (load.status === 'Emitted' && hasCTe) {
      return { label: 'CT-e Emitido', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle };
    }
    if (load.status === 'Scheduled' && !hasCTe) {
      return { label: 'Aguardando CT-e', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: AlertCircle };
    }
    if (load.status === 'Pending') {
      return { label: 'Pendente', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Package };
    }
    return { label: load.status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Package };
  };

  const statusInfo = getLoadStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all">
      {/* Header: Status + Cliente */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon size={16} className={statusInfo.color.split(' ')[0]} />
            <span className={`text-xs font-bold px-2 py-1 rounded-md border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {load.segment && (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
                {load.segment}
              </span>
            )}
          </div>
          <div className="font-black text-base text-gray-900 uppercase tracking-tight">
            {load.clientName}
          </div>
        </div>
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Rota */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <MapPin size={14} className="text-gray-500" />
        <span className="font-semibold">{load.originCity}</span>
        {load.destinationCity && (
          <>
            <span className="text-gray-400">→</span>
            <span className="font-semibold">{load.destinationCity}</span>
          </>
        )}
      </div>

      {/* CT-e Info */}
      {hasCTe && load.cte && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-green-600" />
            <span className="text-xs font-bold text-green-700">CT-e Autorizado</span>
          </div>
          <div className="text-xs text-green-600 font-mono">
            Nº: {load.cte.number} | Chave: {load.cte.accessKey.substring(0, 20)}...
          </div>
          <div className="text-[10px] text-green-500 mt-1">
            Emitido em: {new Date(load.cte.emissionDate).toLocaleDateString('pt-BR')}
          </div>
        </div>
      )}

      {/* Botão EMITIR CT-e - Apenas Visual/Gerencial */}
      {load.status === 'Scheduled' && !hasCTe && (
        <>
          {canEmitCTe ? (
            <button
              onClick={() => {
                onEmitCTe?.(load.id);
                // Feedback visual imediato (o estado será atualizado pelo handler)
              }}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-black rounded-xl shadow-md transition-all uppercase tracking-wide flex items-center justify-center gap-2"
              title="Simula a emissão do CT-e (apenas visual/gerencial, sem integração real)"
            >
              <FileText size={16} />
              EMITIR CT-e
            </button>
          ) : (
            <div className="w-full py-3 bg-gray-300 text-gray-600 text-xs font-black rounded-xl uppercase tracking-wide flex items-center justify-center gap-2 cursor-not-allowed">
              <AlertCircle size={16} />
              {cteValidation.error || 'CT-e Indisponível'}
            </div>
          )}
        </>
      )}

      {/* Info Expandida */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          {load.collectionDate && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar size={12} className="text-gray-400" />
              <span>Coleta: {new Date(load.collectionDate).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          {load.weight && (
            <div className="text-xs text-gray-600">
              <span className="font-semibold">Peso:</span> {load.weight}kg
            </div>
          )}
          {load.volume && (
            <div className="text-xs text-gray-600">
              <span className="font-semibold">Volume:</span> {load.volume}m³
            </div>
          )}
          {load.observations && (
            <div className="text-xs text-gray-600 italic">
              {load.observations}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
