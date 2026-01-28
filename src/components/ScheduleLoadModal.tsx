import React, { useState, useMemo } from 'react';
import { Load, Vehicle, Trip } from '@/types';
import { X, Calendar, Truck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { filterCompatibleVehicles, getSegmentByIdOrName } from '@/config/segmentos';
import { validateAddLoadToTrip, validateSegmentCompatibility } from '@/lib/validations';

interface ScheduleLoadModalProps {
    isOpen: boolean;
    onClose: () => void;
    load: Load | null;
    vehicles: Vehicle[];
    activeTrips: Trip[];
    onConfirm: (load: Load, vehicle: Vehicle, date: string) => void;
    existingTrip?: Trip | null; // Se estiver adicionando carga a viagem existente
}

export const ScheduleLoadModal: React.FC<ScheduleLoadModalProps> = ({
    isOpen,
    onClose,
    load,
    vehicles,
    activeTrips,
    onConfirm,
    existingTrip = null
}) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    if (!isOpen || !load) return null;

    // Filtro por segmento: Match de Segmentos (A Trava de Segurança)
    const compatibleVehicles = useMemo(() => {
        return filterCompatibleVehicles(vehicles, load.segment);
    }, [vehicles, load.segment]);

    // Categorize Vehicles
    const recommended = compatibleVehicles.filter(v =>
        v.status === 'Available' &&
        !activeTrips.some(t => t.truckPlate === v.plate)
    );

    // Veículos em rota que são compatíveis (para adicionar carga de retorno)
    const enRoute = compatibleVehicles.filter(v =>
        (v.status === 'In Use' || activeTrips.some(t => t.truckPlate === v.plate)) &&
        activeTrips.some(t => t.truckPlate === v.plate && t.status === 'In Transit')
    );

    // Veículos incompatíveis (para mostrar aviso)
    const incompatible = vehicles.filter(v =>
        v.status === 'Available' &&
        !activeTrips.some(t => t.truckPlate === v.plate) &&
        !compatibleVehicles.some(cv => cv.id === v.id)
    );

    const handleSelect = (vehicle: Vehicle) => {
        // Permite seleção de veículos em rota para adicionar carga de retorno
        const isEnRoute = enRoute.some(ev => ev.id === vehicle.id);
        if (!isEnRoute && vehicle.status !== 'Available') {
            return; // Só permite veículos disponíveis ou em rota compatíveis
        }

        // Se está adicionando a uma viagem existente, valida completamente
        if (existingTrip) {
            const trip = activeTrips.find(t => t.truckPlate === vehicle.plate) || existingTrip;
            const loadType = isEnRoute ? 'RETORNO' : 'COMPLEMENTO';

            const validation = validateAddLoadToTrip(trip, load, vehicle, loadType);

            if (!validation.valid) {
                setValidationError(validation.errors.join('\n'));
                return;
            }

            // Se há warnings, mostra confirmação
            if (validation.warnings.length > 0) {
                const confirmed = window.confirm(
                    validation.warnings.join('\n\n') + '\n\nDeseja continuar mesmo assim?'
                );
                if (!confirmed) {
                    return;
                }
            }
        } else {
            // Validação básica de compatibilidade de segmento
            const segmentValidation = validateSegmentCompatibility(vehicle, load);
            if (!segmentValidation.valid) {
                setValidationError(segmentValidation.error || 'Veículo incompatível com a carga.');
                return;
            }
        }

        setValidationError(null);
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
                    <div className="flex items-center gap-2">
                        {load.segment && (
                            <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide">
                                Segmento: {load.segment}
                            </div>
                        )}
                        {load.vehicleTypeReq && (
                            <div className="bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide">
                                Exige: {load.vehicleTypeReq}
                            </div>
                        )}
                    </div>
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

                        {/* Validation Error */}
                        {validationError && (
                            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2 text-red-700">
                                    <AlertTriangle size={18} />
                                    <span className="text-xs font-bold uppercase">Bloqueio de Segurança</span>
                                </div>
                                <p className="text-xs text-red-700 whitespace-pre-line font-semibold">
                                    {validationError}
                                </p>
                            </div>
                        )}

                        {/* Incompatible Warning */}
                        {incompatible.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2 text-red-700">
                                    <AlertTriangle size={16} />
                                    <span className="text-xs font-bold uppercase">Veículos Incompatíveis Ocultos</span>
                                </div>
                                <p className="text-xs text-red-600">
                                    {incompatible.length} veículo(s) foram ocultos por incompatibilidade com o segmento "{load.segment || 'não definido'}".
                                    {load.segment && getSegmentByIdOrName(load.segment) && (
                                        <span className="block mt-1 text-[10px] text-red-500">
                                            Segmento "{load.segment}" requer: {getSegmentByIdOrName(load.segment)?.compatibleBodyTypes.join(', ') || 'tipos específicos'}
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Recommended */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-green-600">
                                <CheckCircle size={14} />
                                <span className="text-xs font-bold uppercase tracking-wide">
                                    Compatíveis e Disponíveis ({recommended.length})
                                </span>
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
                                                <div className="text-sm font-black text-gray-900 flex items-center gap-2">
                                                    {v.plate}
                                                    <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded border border-green-200 uppercase font-black">Segment Match</span>
                                                </div>
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
                                {recommended.length === 0 && (
                                    <div className="text-xs text-gray-400 italic text-center py-4">
                                        {compatibleVehicles.length === 0
                                            ? `Nenhum veículo compatível com o segmento "${load.segment || 'não definido'}" disponível.`
                                            : 'Nenhum veículo disponível no momento.'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* En Route - Para adicionar carga de retorno */}
                        {enRoute.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 text-yellow-600">
                                    <Clock size={14} />
                                    <span className="text-xs font-bold uppercase tracking-wide">
                                        Em Rota - Adicionar Retorno ({enRoute.length})
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-500 mb-2 italic">
                                    Você pode adicionar esta carga como retorno para veículos já em movimento.
                                </p>
                                <div className="space-y-2">
                                    {enRoute.map(v => {
                                        const trip = activeTrips.find(t => t.truckPlate === v.plate);
                                        const returnDate = trip?.estimatedReturnDate ? new Date(trip.estimatedReturnDate).toLocaleDateString('pt-BR') : 'Data não prevista';

                                        return (
                                            <div
                                                key={v.id}
                                                onClick={() => handleSelect(v)}
                                                className="p-3 border border-yellow-200 bg-yellow-50 rounded-xl flex items-center justify-between cursor-pointer hover:border-yellow-400 hover:bg-yellow-100 transition-all group"
                                            >
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
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="text-[9px] text-yellow-600 font-bold uppercase">Retorno Previsto</div>
                                                        <div className="text-xs font-black text-yellow-900">{returnDate}</div>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-yellow-700 uppercase bg-yellow-200 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Adicionar Retorno
                                                    </div>
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
