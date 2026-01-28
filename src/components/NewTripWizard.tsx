import React, { useState } from 'react';
import { Load, Vehicle, Trip } from '@/types';
import { X, CheckCircle, Truck, Clock, Check } from 'lucide-react';

interface NewTripWizardProps {
    isOpen: boolean;
    onClose: () => void;
    loads: Load[];
    vehicles: Vehicle[];
    activeTrips: Trip[];
    onCreateTrip: (tripData: any) => void;
}

export const NewTripWizard: React.FC<NewTripWizardProps> = ({
    isOpen,
    onClose,
    loads,
    vehicles,
    activeTrips,
    onCreateTrip
}) => {
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedLoads, setSelectedLoads] = useState<Load[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [selectedDriver, setSelectedDriver] = useState('');

    const handleWizardSubmit = () => {
        if (!selectedVehicle) return;
        onCreateTrip({
            loads: selectedLoads,
            vehicle: selectedVehicle,
            driverName: selectedDriver || selectedVehicle.driverName || 'Motorista Não Informado'
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/10">

                {/* Wizard Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <div>
                        <h3 className="font-black text-2xl tracking-tighter text-gray-900 uppercase flex items-center gap-3">
                            <span className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">{wizardStep}</span>
                            Nova Viagem
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-11">
                            {wizardStep === 1 ? 'Selecione as Cargas' : 'Defina o Veículo e Motorista'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
                </div>

                {/* Wizard Content */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
                    {wizardStep === 1 && (
                        <div className="space-y-6">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Cargas Disponíveis ({loads.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {loads.map(load => {
                                    const isSelected = selectedLoads.some(l => l.id === load.id);
                                    return (
                                        <div
                                            key={load.id}
                                            onClick={() => {
                                                if (isSelected) setSelectedLoads(prev => prev.filter(l => l.id !== load.id));
                                                else setSelectedLoads(prev => [...prev, load]);
                                            }}
                                            className={`
                                        p-5 rounded-3xl border-2 cursor-pointer transition-all flex justify-between items-center
                                        ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-500' : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'}
                                    `}
                                        >
                                            <div>
                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                    {load.originCity} ➔ {load.destinationCity || 'A definir'}
                                                </div>
                                                <div className="text-sm font-black text-gray-900 uppercase tracking-tighter">{load.clientName}</div>
                                                <div className="text-[10px] text-gray-500 font-bold mt-2 flex items-center gap-1">
                                                    <Clock size={12} /> {new Date(load.collectionDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                            {isSelected && <CheckCircle className="text-blue-600" size={24} />}
                                        </div>
                                    );
                                })}
                                {loads.length === 0 && <div className="col-span-2 text-center text-gray-400 py-10">Nenhuma carga disponível.</div>}
                            </div>
                        </div>
                    )}

                    {wizardStep === 2 && (
                        <div className="space-y-8">
                            {/* Selected Loads Summary */}
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {selectedLoads.map(l => (
                                    <div key={l.id} className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shrink-0">
                                        <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Carga</div>
                                        <div className="text-xs font-black text-blue-900 uppercase">{l.clientName}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Selecionar Cavalo/Conjunto</h4>

                                    {/* Categorized List */}
                                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">

                                        {/* Recommended */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 text-green-600">
                                                <CheckCircle size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Recomendados (Disponíveis)</span>
                                            </div>
                                            <div className="space-y-2">
                                                {vehicles.filter(v =>
                                                    v.status === 'Available' &&
                                                    activeTrips.every(t => t.truckPlate !== v.plate)
                                                ).map(v => (
                                                    <div
                                                        key={v.id}
                                                        onClick={() => { setSelectedVehicle(v); setSelectedDriver(v.driverName || ''); }}
                                                        className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between group
                                                    ${selectedVehicle?.id === v.id ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'}
                                                `}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-lg border border-gray-100"><Truck size={16} className="text-green-600" /></div>
                                                            <div>
                                                                <div className="text-xs font-black uppercase text-gray-900">{v.plate}</div>
                                                                <div className="text-[9px] font-bold text-gray-400 uppercase">{v.model} • {v.type}</div>
                                                                <div className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">
                                                                    Motorista: <span className="text-gray-700">{v.driverName || 'Não informado'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {selectedVehicle?.id === v.id && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                                                    </div>
                                                ))}
                                                {vehicles.filter(v => v.status === 'Available').length === 0 && (
                                                    <div className="text-[10px] text-gray-400 italic pl-2">Nenhum veículo disponível compatível.</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* En Route (Compatible) */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 text-yellow-600">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Em Rota (Compatíveis)</span>
                                            </div>
                                            <div className="space-y-2">
                                                {vehicles.filter(v =>
                                                    (v.status === 'In Use' || activeTrips.some(t => t.truckPlate === v.plate))
                                                ).map(v => (
                                                    <div key={v.id} className="p-3 border border-yellow-200 bg-yellow-50/30 rounded-xl flex items-center justify-between opacity-80">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-lg border border-gray-100"><Truck size={16} className="text-yellow-600" /></div>
                                                            <div>
                                                                <div className="text-xs font-black uppercase text-gray-900">{v.plate}</div>
                                                                <div className="text-[9px] font-bold text-yellow-600 uppercase flex items-center gap-1">
                                                                    Em Operação <span className="text-gray-400">• {v.model}</span>
                                                                </div>
                                                                <div className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">
                                                                    Motorista: <span className="text-gray-700">{v.driverName || 'Não informado'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">Ocupado</span>
                                                    </div>
                                                ))}
                                                {vehicles.filter(v => v.status === 'In Use').length === 0 && (
                                                    <div className="text-[10px] text-gray-400 italic pl-2">Nenhum veículo em rota compatível.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Motorista Principal</label>
                                        <input
                                            type="text"
                                            className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 text-sm outline-none focus:border-black focus:bg-white transition-all font-black uppercase"
                                            value={selectedDriver}
                                            onChange={e => setSelectedDriver(e.target.value)}
                                            placeholder="Nome do Motorista"
                                        />
                                    </div>

                                    {selectedVehicle && (
                                        <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100">
                                            <h4 className="font-black text-yellow-800 uppercase tracking-widest text-xs mb-2 flex items-center gap-2">⚠️ Atenção</h4>
                                            <p className="text-[10px] text-yellow-700 leading-relaxed font-medium">
                                                Ao confirmar, uma nova viagem será criada com <b>{selectedLoads.length} pernas de carga</b> sequenciais baseadas na seleção.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Wizard Footer */}
                <div className="p-8 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-between items-center">
                    {wizardStep > 1 ? (
                        <button onClick={() => setWizardStep(prev => prev - 1)} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900">Voltar</button>
                    ) : (
                        <span />
                    )}

                    {wizardStep === 1 ? (
                        <button
                            disabled={selectedLoads.length === 0}
                            onClick={() => setWizardStep(2)}
                            className="bg-black text-white px-10 py-4 rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transition-all"
                        >
                            Próximo: Veículo
                        </button>
                    ) : (
                        <button
                            disabled={!selectedVehicle}
                            onClick={handleWizardSubmit}
                            className="bg-blue-600 text-white px-12 py-4 rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-200 transition-all"
                        >
                            Confirmar Viagem
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};
