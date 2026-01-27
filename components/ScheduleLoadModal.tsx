import React, { useState } from 'react';
import { Load, Vehicle } from '@/types';
import { X, Calendar, Truck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface ScheduleLoadModalProps {
    isOpen: boolean;
    onClose: () => void;
    load: Load | null;
    vehicles: Vehicle[];
    activeTrips: any[];
    onConfirm: (load: Load, vehicle: Vehicle, date: string) => void;
}

export const ScheduleLoadModal: React.FC<ScheduleLoadModalProps> = ({
    isOpen,
    onClose,
    load,
    vehicles,
    activeTrips,
    onConfirm
}) => {
    const [selectedDate, setSelectedDate] = useState('');

    if (!isOpen || !load) return null;

    // Categorize Vehicles
    const recommended = vehicles.filter(v =>
        v.status === 'Available' &&
        !activeTrips.some(t => t.truckPlate === v.plate)
    );

    const enRoute = vehicles.filter(v =>
        v.status === 'In Use' || activeTrips.some(t => t.truckPlate === v.plate)
    );

    // Incompatible would be those that don't match requirements, but for now we list others or mock
    const incompatible = vehicles.filter(v =>
        false // Placeholder for logic: v.type !== load.vehicleTypeReq
    );

    const handleSelect = (vehicle: Vehicle) => {
        if (vehicle.status !== 'Available') return; // Prevent selection of enNodes for now or handle appropriately
        onConfirm(load, vehicle, selectedDate || new Date().toISOString());
        onClose();
    };

    return (
        <div className="absolute inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-white/20">

                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">Programar Carga</h3>
                        <p className="text-xs text-gray-500">Selecione um veículo compatível</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"><X size={24} /></button>
                </div>

                {/* Load Summary Bar */}
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                    <div>
                        <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">{load.clientName}</div>
                        <div className="text-[10px] text-blue-500 font-semibold mt-0.5">
                            {load.originCity} <span className="text-blue-300 mx-1">➔</span> {load.destinationCity || '...'}
                        </div>
                    </div>
                    {load.vehicleTypeReq && (
                        <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                            EXIGE: {load.vehicleTypeReq}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-white">

                    {/* Date Picker */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
                            <Calendar size={12} /> Data e Hora da Coleta
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all font-medium text-gray-600"
                            value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-400 mt-1 italic">Se não informado, será considerado o horário atual.</p>
                    </div>

                    {/* Vehicle Lists */}
                    <div className="space-y-6">

                        {/* Recommended */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-green-600">
                                <CheckCircle size={14} />
                                <span className="text-xs font-bold uppercase tracking-wide">Recomendados (Disponíveis)</span>
                            </div>
                            <div className="space-y-2">
                                {recommended.map(v => (
                                    <div
                                        key={v.id}
                                        onClick={() => handleSelect(v)}
                                        className="p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all flex items-center justify-between group bg-white"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs border border-green-200">
                                                {v.plate.slice(-1)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-gray-900">{v.plate}</div>
                                                <div className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 group-hover:text-green-700">
                                                    <span>{v.model}</span>
                                                    <span className="text-gray-300 group-hover:text-green-300">•</span>
                                                    <span>{v.driverName || 'Sem motorista'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-bold text-green-600 uppercase bg-green-100 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            Selecionar
                                        </div>
                                    </div>
                                ))}
                                {recommended.length === 0 && <div className="text-xs text-gray-400 italic text-center py-4">Nenhum veículo disponível no momento.</div>}
                            </div>
                        </div>

                        {/* En Route */}
                        {enRoute.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 text-yellow-600">
                                    <Clock size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wide">Em Rota (Compatíveis)</span>
                                </div>
                                <div className="space-y-2">
                                    {enRoute.map(v => {
                                        const trip = activeTrips.find(t => t.truckPlate === v.plate);
                                        const returnDate = trip?.estimatedReturnDate ? new Date(trip.estimatedReturnDate).toLocaleDateString('pt-BR') : 'Data não prevista';

                                        return (
                                            <div key={v.id} className="p-3 border border-yellow-200 bg-yellow-50 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xs border border-yellow-200">
                                                        {v.plate.slice(-1)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-gray-900">{v.plate}</div>
                                                        <div className="text-[10px] text-yellow-700 font-bold uppercase flex items-center gap-1">
                                                            <span>Em Operação</span>
                                                            <span className="text-yellow-400">•</span>
                                                            <span>{v.model}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[9px] text-yellow-600 font-bold uppercase">Retorno Previsto</div>
                                                    <div className="text-xs font-black text-yellow-900">{returnDate}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};
