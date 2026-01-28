import React from 'react';
import { Load } from '@/types';
import {
    Eye,
    FileText,
    MapPin,
    Calendar,
    Truck,
    Clock,
    MoreHorizontal,
    Copy
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LoadCardProps {
    load: Load;
    onViewDetails?: (load: Load) => void;
    onSchedule?: (load: Load) => void;
}

export const LoadCard: React.FC<LoadCardProps> = ({ load, onViewDetails, onSchedule }) => {
    // Padronizar número de controle: tentar extrair apenas números ou usar o ID
    const controlNumber = load.id.replace(/\D/g, '') || load.id.split('-').pop()?.toUpperCase() || '---';
    // Formatar ID similar ao print 2 (ex: SHP-301710)
    const formattedId = load.id.includes('SHP') ? load.id : `SHP-${controlNumber.substring(0, 6)}`;

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all p-4 flex flex-col gap-3 group relative overflow-hidden">
            {/* Top Bar: Control Number + Icons + Status */}
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-gray-400">#{formattedId}</span>
                    <span className="text-[11px] font-black text-blue-600 uppercase tracking-tight">
                        {load.vehicleTypeReq || 'CARGA GERAL'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onViewDetails?.(load)} className="p-1 hover:bg-gray-100 rounded-md transition-colors" title="Visualizar">
                            <Eye size={14} />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded-md transition-colors" title="Copiar" onClick={() => navigator.clipboard.writeText(load.id)}>
                            <Copy size={14} />
                        </button>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold text-orange-500 border-orange-200 bg-orange-50/50 flex items-center gap-1 py-0 px-2 h-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        Pendente
                    </Badge>
                </div>
            </div>

            {/* Main Info: Client */}
            <div>
                <h3 className="text-sm font-black text-gray-900 leading-tight truncate" title={load.clientName}>
                    {load.clientName}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-gray-400">
                    <Truck size={12} strokeWidth={2.5} />
                    <span className="text-[11px] font-medium italic">Sem veículo atribuído</span>
                </div>
            </div>

            {/* Route: Origin -> Dest */}
            <div className="flex items-start gap-2 py-1">
                <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div className="text-[11px] font-bold text-gray-600 leading-tight">
                    {load.originCity} <span className="text-gray-300 font-medium px-0.5">→</span> {load.destinationCity || 'Destino Indefinido'}
                </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-[11px] font-bold text-orange-600">
                <Calendar size={13} strokeWidth={2.5} />
                <span>Coleta: {new Date(load.collectionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, {load.collectionWindowStart ? new Date(load.collectionWindowStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
            </div>

            {/* Observation (Subtle) */}
            {load.observations && (
                <div className="text-[10px] text-gray-400 line-clamp-1 italic border-l-2 border-gray-100 pl-2 py-0.5">
                    {load.observations}
                </div>
            )}

            {/* Action Button */}
            <Button
                onClick={() => onSchedule?.(load)}
                variant="default"
                className="w-full h-9 bg-black hover:bg-gray-800 text-[11px] font-black uppercase tracking-widest rounded-lg mt-1 shadow-md active:scale-[0.98] transition-all"
            >
                Programar Veículo
            </Button>
        </div>
    );
};
