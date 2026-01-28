import React from 'react';
import { Vehicle } from '@/types';
import {
    User,
    Truck,
    Layers,
    AlertTriangle,
    Settings,
    MoreVertical,
    ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VehicleCardProps {
    vehicle: Vehicle;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
    const isAvailable = vehicle.status === 'Available';
    // Para o ID, usar os últimos caracteres do ID do veículo ou uma parte da placa
    const vehicleId = vehicle.id.split('-').pop()?.toUpperCase().substring(0, 8) || vehicle.plate.substring(0, 4);

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all p-4 flex flex-col gap-3 group relative">
            {/* Tipo de Veículo em Azul */}
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-tight">
                    {vehicle.type}
                </span>
            </div>

            {/* Placa do Veículo - Destacada */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-2">
                <div className="flex items-center gap-2">
                    <Truck size={16} className="text-blue-600 shrink-0" />
                    <span className="text-[12px] font-black text-blue-700 font-mono tracking-wide">
                        {vehicle.plate} {vehicleId !== vehicle.plate.substring(0, 4) ? `/ ${vehicleId}` : ''}
                    </span>
                </div>
            </div>

            {/* Modelo e Motorista */}
            <div className="text-[11px] font-medium text-gray-700">
                {vehicle.model} - {vehicle.driverName || 'Motorista não atribuído'}
            </div>

            {/* Status */}
            <div className="text-[11px] font-medium text-gray-400">
                Aguardando programação
            </div>

            {/* Tag "+2 na fila" - Mock para demonstração */}
            <div className="flex items-center gap-1">
                <Badge className="text-[10px] font-bold text-yellow-700 bg-yellow-100 border-yellow-200 px-2 py-0.5 flex items-center gap-1">
                    <ChevronRight size={10} />
                    +2 na fila
                </Badge>
            </div>

            {/* Footer / Meta - Peso e Volume */}
            {(vehicle.capacity || vehicle.volumeCapacity) && (
                <div className="flex gap-3 text-[10px] font-bold text-gray-400 uppercase pt-2 border-t border-gray-50">
                    {vehicle.capacity && <span>{(vehicle.capacity / 1000).toFixed(1)}t</span>}
                    {vehicle.volumeCapacity && <span>{vehicle.volumeCapacity}m³</span>}
                </div>
            )}

            {vehicle.status === 'Maintenance' && (
                <div className="absolute top-0 right-0 p-1">
                    <div className="text-orange-500 animate-pulse">
                        <AlertTriangle size={12} strokeWidth={3} />
                    </div>
                </div>
            )}
        </div>
    );
};
