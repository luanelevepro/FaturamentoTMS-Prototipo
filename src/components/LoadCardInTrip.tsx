import React from 'react';
import { Load, CTe, Trip } from '@/types';
import { Package, FileText, CheckCircle, AlertCircle, MapPin, Calendar, Clock, Zap, Eye, Download } from 'lucide-react';
import { validateEmitCTe } from '@/lib/validations';

interface LoadCardInTripProps {
  load: Load;
  tripId: string;
  trip?: Trip | null;
  onEmitFiscal?: (loadId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showProgress?: boolean; // Para mostrar barra de progresso quando em coleta
  progress?: number; // Percentual de progresso (0-100)
  onViewDetails?: () => void; // Handler para visualizar detalhes
  onDownloadPDF?: () => void; // Handler para baixar PDF
}

/**
 * Card de Carga dentro de uma Viagem
 * Mostra o ciclo de vida fiscal da carga e permite emitir CT-e
 */
export const LoadCardInTrip: React.FC<LoadCardInTripProps> = ({
  load,
  tripId,
  trip = null,
  onEmitFiscal,
  isExpanded = false,
  onToggleExpand,
  showProgress = false,
  progress = 0,
  onViewDetails,
  onDownloadPDF
}) => {
  const hasCTe = load.cte && load.cte.status === 'Authorized';
  const hasMDFe = load.mdfe && load.mdfe.status === 'Authorized';

  // Validação para habilitar/desabilitar botão de fiscal
  const canEmitFiscal = load.status === 'Scheduled' || (load.status === 'Emitted' && !hasMDFe);

  // Determina o status visual da carga baseado no status e CT-e
  const getLoadStatusInfo = () => {
    if (load.status === 'Delivered') {
      return { label: 'Entregue', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle };
    }
    if (load.status === 'Emitted' && hasCTe && hasMDFe) {
      return { label: 'Fiscal OK', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle };
    }
    if (load.status === 'Emitted' && hasCTe && !hasMDFe) {
      return { label: 'CT-e OK | MDF-e Pend.', color: 'text-blue-600 bg-blue-100 border-blue-200', icon: FileText };
    }
    if (load.status === 'Scheduled' && !hasCTe) {
      return { label: 'Aguardando Fiscal', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: AlertCircle };
    }
    if (load.status === 'Pending') {
      return { label: 'Pendente', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Package };
    }
    return { label: load.status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Package };
  };

  const statusInfo = getLoadStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all shadow-sm">
      {/* Header: Status + Cliente + Ícones de Ação */}
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
          <div className="font-bold text-sm text-gray-900">
            {load.clientName}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Ícones de visualizar e baixar PDF */}
          <div className="flex items-center gap-1 text-gray-400 opacity-60 hover:opacity-100 transition-opacity">
            {onViewDetails && (
              <button 
                onClick={onViewDetails} 
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                title="Visualizar detalhes"
              >
                <Eye size={14} />
              </button>
            )}
            {onDownloadPDF && (
              <button 
                onClick={onDownloadPDF} 
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                title="Baixar PDF"
              >
                <Download size={14} />
              </button>
            )}
          </div>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>

      {/* Rota */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
        <MapPin size={12} className="text-gray-400" />
        <span className="font-medium">{load.originCity}</span>
        {load.destinationCity && (
          <>
            <span className="text-gray-300">→</span>
            <span className="font-medium">{load.destinationCity}</span>
          </>
        )}
      </div>

      {/* Data de Coleta - Sempre visível quando em coleta */}
      {showProgress && load.collectionDate && (
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
          <Calendar size={12} className="text-gray-400" />
          <span className="font-medium">
            Coleta: {new Date(load.collectionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            {load.collectionWindowStart && `, ${new Date(load.collectionWindowStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>
      )}

      {/* Descrição - Sempre visível quando em coleta */}
      {showProgress && load.observations && (
        <div className="text-[10px] text-gray-500 mb-3 italic">
          {load.observations}
        </div>
      )}

      {/* Barra de Progresso (quando em coleta) */}
      {showProgress && (
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
      )}

      {/* CT-e & MDF-e Info */}
      <div className="space-y-2 mb-3">
        {hasCTe && load.cte && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-green-600" />
              <span className="text-xs font-bold text-green-700">CT-e Autorizado</span>
            </div>
            <div className="text-xs text-green-600 font-mono">
              Nº: {load.cte.number} | Chave: {load.cte.accessKey.substring(0, 20)}...
            </div>
          </div>
        )}

        {hasMDFe && load.mdfe && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className={hasMDFe ? 'text-emerald-600' : 'text-gray-400'} />
              <span className="text-xs font-bold text-emerald-700">MDF-e Autorizado</span>
            </div>
            <div className="text-xs text-emerald-600 font-mono">
              Nº: {load.mdfe.number} | Chave: {load.mdfe.accessKey.substring(0, 20)}...
            </div>
          </div>
        )}
      </div>

      {/* Botão Fiscal Combinado */}
      {load.status !== 'Delivered' && (!hasCTe || !hasMDFe) && (
        <div className="mt-2">
          {canEmitFiscal ? (
            <button
              onClick={() => {
                onEmitFiscal?.(load.id);
              }}
              className="w-full py-3 bg-slate-900 hover:bg-black text-white text-[10px] font-black rounded-xl shadow-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2"
              title="Emite CT-e (se pendente) e MDF-e para esta carga"
            >
              <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              Emitir CT-e's/MDF-e da Carga
            </button>
          ) : (
            <div className="w-full py-3 bg-gray-100 text-gray-400 text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 border border-gray-200">
              <AlertCircle size={14} /> Fiscal Indisponível
            </div>
          )}
        </div>
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
