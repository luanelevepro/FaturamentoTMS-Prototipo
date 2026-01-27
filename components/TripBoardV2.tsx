import React, { useState, useMemo } from 'react';
import { Trip, AvailableDocument, Vehicle, Load, Leg, Delivery } from '../types';

import {
    Truck, MapPin, Play, CheckCircle, Package, ArrowRight, X, Calendar, MoreVertical, Eye, Info, AlertCircle, Weight, Box, AlertTriangle,
    Filter, Bell, TrendingUp, Zap, DollarSign, Shield, FileText, ChevronRight, ChevronDown, Clock
} from 'lucide-react';
import { TripDetails } from './TripDetails';
import { BoardColumn as Column, BoardCard as Card, EmptyState } from './BoardUI';

interface TripBoardV2Props {
    trips: Trip[];
    loads: Load[];
    vehicles: Vehicle[];
    availableDocs: AvailableDocument[];
    clients: { name: string, address: string }[];
    cities: string[];
    onCreateNew: () => void;
    // Handlers
    onCreateLoad: (loadData: Omit<Load, 'id' | 'status'>) => void;
    onScheduleLoad: (load: Load, vehicle: Vehicle, segment: string, customOrigin: string, controlNumber: string) => void;
    onUpdateStatus: (tripId: string, status: Trip['status'], pod?: string) => void;
    onUpdateDeliveryStatus: (tripId: string, legId: string, deliveryId: string, status: Delivery['status'], pod?: string) => void;
    // Others
    onAddLeg: (tripId: string, leg: any) => void;
    onAddDelivery: (tripId: string, legId: string, selectedDocs: AvailableDocument[]) => void;
    onAddDocument: (tripId: string, legId: string, deliveryId: string, doc: any) => void;
    onCreateTrip: (tripData: any) => void;
    onAddLoadWithDeliveries?: (tripId: string, payload: any) => void;
    onAttachLoadsToTrip?: (tripId: string, payload: { loadIds: string[]; vehicleTypeReq: string }) => void;
    onReorderDeliveries?: (tripId: string, legId: string, newOrder: Delivery[]) => void;
    showFilters?: boolean;
    onCloseFilters?: () => void;
}

const BODY_TYPE_OPTIONS = [
    'Frigorífico',
    'Graneleira',
    'Baú',
    'Sider',
    'Prancha',
    'Basculante',
    'Porta-Container',
    'Cegonheira'
];

const REQUIREMENTS_OPTIONS = [
    'EPI Básico (Capacete/Bota)', 'EPI Completo (Óculos/Luva)',
    'Ajudante Extra', 'Paletes Vazios',
    'Corda / Cinta de Amarração', 'Lona de Proteção',
    'Manuseio Frágil', 'Rastreamento em Tempo Real'
];

interface FilterState {
    urgency: string;
    destinationCity: string;
    segment: string;
    vehicleType: string;
}

// Painel de Filtros estilo Popover/Overlay
const FilterPanel = ({
    filters,
    onFilterChange,
    cities,
    isOpen,
    onClose
}: {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    cities: string[];
    isOpen: boolean;
    onClose: () => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute top-4 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-gray-900 uppercase flex items-center gap-2">
                    <Filter size={14} /> Filtros
                </span>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Destino</label>
                    <select
                        className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 uppercase outline-none focus:border-black transition-all"
                        value={filters.destinationCity}
                        onChange={(e) => onFilterChange({ ...filters, destinationCity: e.target.value })}
                    >
                        <option value="">Todos Destinos</option>
                        {cities.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Conjunto</label>
                    <select
                        className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 uppercase outline-none focus:border-black transition-all"
                        value={filters.vehicleType}
                        onChange={(e) => onFilterChange({ ...filters, vehicleType: e.target.value })}
                    >
                        <option value="">Todos Conjuntos</option>
                        <option value="Bitrem">Bitrem</option>
                        <option value="Carreta">Carreta</option>
                        <option value="Truck">Truck</option>
                        <option value="Vuc">VUC</option>
                    </select>
                </div>

                {(filters.destinationCity || filters.vehicleType) && (
                    <button
                        onClick={() => onFilterChange({ urgency: '', destinationCity: '', segment: '', vehicleType: '' })}
                        className="w-full py-2 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase flex items-center justify-center gap-2"
                    >
                        <X size={12} /> Limpar Filtros
                    </button>
                )}
            </div>
        </div>
    );
};

const formatWeight = (weight?: number): string => {
    if (!weight) return '-';
    if (weight >= 1000) return `${(weight / 1000).toFixed(1)}t`;
    return `${weight}kg`;
};

const formatCurrency = (value?: number): string => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

export const TripBoardV2: React.FC<TripBoardV2Props> = ({
    trips,
    loads,
    vehicles,
    availableDocs,
    clients,
    cities,
    onCreateNew,
    onCreateLoad,
    onScheduleLoad,
    onUpdateStatus,
    onUpdateDeliveryStatus,
    onAddLeg,
    onAddDelivery,
    onAddDocument,
    onCreateTrip,
    onAddLoadWithDeliveries,
    onAttachLoadsToTrip,
    onReorderDeliveries,
    showFilters,
    onCloseFilters
}) => {


    const [schedulingLoad, setSchedulingLoad] = useState<Load | null>(null);
    const [selectedSegment, setSelectedSegment] = useState(''); // agora usado como "tipo de carroceria"
    const [customOrigin, setCustomOrigin] = useState('');
    const [controlNumber, setControlNumber] = useState('');

    // Create Load Modal State


    // View Details Modal State
    const [detailsData, setDetailsData] = useState<any | null>(null);
    const [detailsTitle, setDetailsTitle] = useState('');

    // Document Form State
    const [showAddDoc, setShowAddDoc] = useState<string | null>(null); // deliveryId

    const [newDocForm, setNewDocForm] = useState({ number: '', type: 'NF' as 'NF' | 'CTe', value: '' });

    // POD Modal State
    const [podTrip, setPodTrip] = useState<Trip | null>(null);
    const [podFile, setPodFile] = useState<string | null>(null); // For mock file upload

    const handleSaveDoc = (tripId: string, legId: string, deliveryId: string) => {
        if (!newDocForm.number) {
            alert("Número do documento é obrigatório.");
            return;
        }
        onAddDocument(tripId, legId, deliveryId, {
            number: newDocForm.number,
            type: newDocForm.type,
            value: Number(newDocForm.value) || 0,
            controlNumber: 'MANUAL'
        });
        setShowAddDoc(null);
        setNewDocForm({ number: '', type: 'NF', value: '' });
    };

    // --- Filter Lists ---
    const availableVehicles = useMemo(() => vehicles.filter(v => v.status === 'Available'), [vehicles]);
    const inUseVehicles = useMemo(() => vehicles.filter(v => v.status !== 'Available'), [vehicles]);

    const [filters, setFilters] = useState<FilterState>({
        urgency: '',
        destinationCity: '',
        segment: '',
        vehicleType: ''
    });

    // Helper to filter trips based on current filters
    const filterTrips = (list: Trip[]) => {
        return list.filter(t => {
            // Filter by Destination
            if (filters.destinationCity && t.mainDestination !== filters.destinationCity) return false;

            // Filter by Conjunto (Vehicle Type)
            if (filters.vehicleType) {
                const truck = vehicles.find(v => v.plate === t.truckPlate);
                // If vehicle not found or type mismatch (optional: could also check vehicleTypeReq on legs)
                if (!truck || truck.type !== filters.vehicleType) return false;
            }
            return true;
        });
    };

    const plannedTrips = useMemo(() => filterTrips(trips.filter(t => t.status === 'Planned')), [trips, filters, vehicles]);
    const pickingUpTrips = useMemo(() => filterTrips(trips.filter(t => t.status === 'Picking Up')), [trips, filters, vehicles]);
    const activeTrips = useMemo(() => filterTrips(trips.filter(t => t.status === 'In Transit')), [trips, filters, vehicles]);
    const completedTrips = useMemo(() => filterTrips(trips.filter(t => t.status === 'Completed')), [trips, filters, vehicles]);

    const parseMaybeDate = (value?: string) => {
        if (!value) return 0;
        const t = new Date(value).getTime();
        return Number.isFinite(t) ? t : 0;
    };

    const sortedLoads = useMemo(() => {
        return [...loads].sort((a, b) => parseMaybeDate(a.collectionDate) - parseMaybeDate(b.collectionDate));
    }, [loads]);

    const inUseVehiclesSorted = useMemo(() => {
        const getEta = (plate: string) => {
            const trip = trips.find(t =>
                t.truckPlate === plate &&
                t.status !== 'Completed'
            );
            return parseMaybeDate(trip?.estimatedReturnDate) || parseMaybeDate(trip?.scheduledDate) || parseMaybeDate(trip?.createdAt);
        };

        return [...inUseVehicles].sort((a, b) => getEta(a.plate) - getEta(b.plate));
    }, [inUseVehicles, trips]);

    // Helper to check if a vehicle is busy
    const isVehicleBusy = (plate: string) => {
        return trips.some(t =>
            (t.status === 'In Transit' || t.status === 'Picking Up') &&
            t.truckPlate === plate
        );
    };

    // --- Handlers ---
    const handleOpenSchedule = (load: Load) => {
        setSchedulingLoad(load);
        setSelectedSegment('');
        setControlNumber('');
        setCustomOrigin(load.originCity);
    };

    const handleConfirmSchedule = (vehicle: Vehicle) => {
        if (schedulingLoad) {
            if (!selectedSegment) {
                alert('Por favor, selecione o tipo de carroceria para a carga.');
                return;
            }
            onScheduleLoad(schedulingLoad, vehicle, selectedSegment, customOrigin, controlNumber);
            setSchedulingLoad(null);
        }
    };



    const handleViewDetails = (title: string, data: any) => {
        setDetailsTitle(title);
        setDetailsData(data);
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-100 font-sans relative text-gray-800" >

            {/* Header / Filters */}
            {/* Filter Panel Overlay */}
            <FilterPanel
                isOpen={!!showFilters}
                onClose={() => onCloseFilters?.()}
                filters={filters}
                onFilterChange={setFilters}
                cities={cities}
            />

            {/* DMAIC / Kanban Board */}
            < div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar" >
                <div className="flex gap-4 h-full min-w-[1800px]">

                    {/* COL 1: Cargas Disponíveis - CINZA */}
                    <Column
                        title="Cargas Disponíveis"
                        count={loads.length}
                        headerColor="bg-gray-100 border-gray-400"
                        accentColor="gray"
                        tooltip="Cargas programadas, mas ainda não vinculada a nenhuma viagem."
                    >
                        <div className="space-y-4">
                            {loads.length === 0 && <EmptyState text="Nenhuma carga pendente" />}
                            {sortedLoads.map(load => (
                                <Card key={load.id} accentColor="gray">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] font-black text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 uppercase">
                                            Pendente
                                        </span>
                                        {load.collectionDate && (
                                            <span className="text-[10px] font-black text-gray-500 flex items-center gap-1 uppercase tracking-tighter">
                                                <Calendar size={12} /> {new Date(load.collectionDate).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                        <button onClick={() => handleViewDetails(`Carga: ${load.clientName}`, { type: 'LOAD_DETAIL', ...load })} className="text-gray-300 hover:text-gray-900 transition-colors">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                    <div className="mb-4">
                                        <div className="font-black text-gray-900 text-sm uppercase tracking-tight">{load.clientName}</div>
                                        <div className="space-y-1.5 mt-3">
                                            <div className="text-xs font-bold text-gray-500 flex items-center gap-2">
                                                <MapPin size={14} className="text-gray-300" /> {load.originCity}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenSchedule(load)}
                                        className="w-full py-2.5 bg-black hover:bg-gray-800 text-white text-[10px] font-black rounded-xl shadow-md transition-all uppercase tracking-widest"
                                    >
                                        Programar Veículo
                                    </button>
                                </Card>
                            ))}
                        </div>
                    </Column>

                    {/* COL 2: Veículos Disponíveis - CINZA */}
                    <Column
                        title="Veículos Disponíveis"
                        count={availableVehicles.length}
                        headerColor="bg-gray-100 border-gray-400"
                        accentColor="gray"
                        tooltip="Veículos + motoristas disponíveis, em prioridade de disponibilidade."
                    >
                        <div className="space-y-4">
                            {availableVehicles.length === 0 && <EmptyState text="Sem veículos livres" />}
                            {availableVehicles.map(v => (
                                <Card key={v.id} accentColor="gray">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="font-black text-gray-900 text-base font-mono bg-gray-50 px-2 rounded border border-gray-100">{v.plate}</div>
                                        <span className="text-[10px] uppercase font-black text-gray-400">Livre</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-4 font-bold">{v.model} • <span className="uppercase">{v.type}</span></div>
                                    <div className="flex items-center gap-3 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-black text-[10px] text-gray-600">
                                            {v.driverName ? v.driverName.substring(0, 2).toUpperCase() : '?'}
                                        </div>
                                        <span className="font-black">{v.driverName || 'Sem motorista'}</span>
                                    </div>
                                </Card>
                            ))}

                            {/* Ocupados (bem abaixo) */}
                            {inUseVehiclesSorted.length > 0 && (
                                <div className="pt-6">
                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.25em] px-2 mb-3">
                                        Em operação ({inUseVehiclesSorted.length})
                                    </div>
                                    <div className="space-y-3 opacity-60 grayscale">
                                        {inUseVehiclesSorted.map(v => {
                                            const trip = trips.find(t => t.truckPlate === v.plate && t.status !== 'Completed');
                                            const eta = trip?.estimatedReturnDate ? new Date(trip.estimatedReturnDate).toLocaleDateString('pt-BR') : undefined;
                                            return (
                                                <Card key={`busy-${v.id}`} accentColor="gray">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-black text-gray-700 text-base font-mono bg-gray-50 px-2 rounded border border-gray-100">{v.plate}</div>
                                                        <span className="text-[10px] uppercase font-black text-gray-300">Ocupado</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mb-2 font-bold">
                                                        {v.model} • <span className="uppercase">{v.type}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-bold">
                                                        Motorista: <span className="text-gray-600">{v.driverName || 'Não informado'}</span>
                                                    </div>
                                                    {eta && (
                                                        <div className="text-[10px] text-gray-400 font-bold mt-1">
                                                            Prev. chegada: <span className="text-gray-600">{eta}</span>
                                                        </div>
                                                    )}
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Column>

                    {/* COL 3: Viagem Agendada - AZUL */}
                    <TripColumn
                        title="Viagem Agendada"
                        trips={plannedTrips}
                        headerColor="bg-blue-50 border-blue-500 text-blue-900"
                        accentColor="blue"
                        tooltip="Junção de motorista+conjunto, e carga."
                        statusColor="text-blue-600 bg-white border-blue-200"
                        statusLabel="Aguardando"
                        onViewDetails={handleViewDetails}
                        actionButton={(trip) => {
                            const busy = isVehicleBusy(trip.truckPlate);
                            return (
                                <button
                                    disabled={busy}
                                    onClick={() => onUpdateStatus(trip.id, 'Picking Up')}
                                    className={`flex items-center gap-2 px-5 py-2 text-white text-[10px] font-black rounded-xl shadow-lg uppercase tracking-widest transition-all
                                ${busy ? 'bg-gray-300 cursor-not-allowed grayscale' : 'bg-black hover:bg-gray-800'}`}
                                >
                                    <Play size={14} fill="white" /> Iniciar Coleta
                                </button>
                            )
                        }}
                    />

                    {/* COL 4: Em Coleta - AMARELO */}
                    <TripColumn
                        title="Em Coleta"
                        trips={pickingUpTrips}
                        headerColor="bg-yellow-50 border-yellow-400 text-yellow-900"
                        accentColor="yellow"
                        tooltip="Inicio da viagem, mas ainda sem sem a respectiva carga."
                        statusColor="text-yellow-600 bg-white border-yellow-200"
                        statusLabel="Coletando"
                        onViewDetails={handleViewDetails}
                        showProgress
                        actionButton={(trip) => (
                            <button
                                onClick={() => onUpdateStatus(trip.id, 'In Transit')}
                                className="flex items-center gap-2 px-5 py-2 bg-black hover:bg-gray-800 text-white text-[10px] font-black rounded-xl shadow-lg uppercase tracking-widest transition-all"
                            >
                                <Truck size={14} /> Iniciar Viagem
                            </button>
                        )}
                    />

                    {/* COL 5: Em Rota - LARANJA */}
                    <TripColumn
                        title="Em Rota"
                        trips={activeTrips}
                        headerColor="bg-orange-50 border-orange-500 text-orange-900"
                        accentColor="orange"
                        tooltip="Já carregado e iniciou seu percurso de carga/entrega."
                        statusColor="text-orange-600 bg-white border-orange-200"
                        statusLabel="Em Trânsito"
                        showProgress
                        onViewDetails={handleViewDetails}
                        actionButton={(trip) => (
                            <button
                                onClick={() => setPodTrip(trip)}
                                className="flex items-center gap-2 px-5 py-2 bg-black hover:bg-gray-800 text-white text-[10px] font-black rounded-xl shadow-lg uppercase tracking-widest transition-all"
                            >
                                <CheckCircle size={14} /> Finalizar
                            </button>
                        )}
                    />

                    {/* COL 6: Entregue - VERDE */}
                    <TripColumn
                        title="Viagem Entregue"
                        trips={completedTrips}
                        headerColor="bg-emerald-50 border-emerald-500 text-emerald-900"
                        accentColor="emerald"
                        tooltip="Motorista fez a ida e o retorno, está de volta na cidade da empresa e concluiu a viagem."
                        statusColor="text-emerald-600 bg-white border-emerald-200"
                        statusLabel="Concluído"
                        isCompleted
                        onViewDetails={handleViewDetails}
                    />

                </div>
            </div >



            {/* --- SCHEDULING MODAL --- */}
            {
                schedulingLoad && (
                    <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="font-black text-xl text-gray-900 tracking-tighter uppercase">Programação</h3>
                                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">{schedulingLoad.clientName}</p>
                                </div>
                                <button onClick={() => setSchedulingLoad(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                            </div>

                            <div className="p-7 space-y-7">
                                <div className="bg-black p-5 rounded-3xl border-2 border-gray-800 shadow-2xl">
                                    <label className="block text-[9px] font-black text-gray-500 mb-2 uppercase tracking-widest leading-none">Nº de Controle Operacional <span className="text-white">*</span></label>
                                    <input
                                        type="text" className="w-full border-2 border-gray-800 bg-gray-900 text-white rounded-2xl p-4 text-base outline-none focus:border-blue-500 transition-all font-black placeholder:text-gray-700"
                                        value={controlNumber} onChange={(e) => setControlNumber(e.target.value)}
                                        placeholder="Opcional (pode ficar em branco)..."
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 mb-2 uppercase tracking-widest">Tipo de Carroceria <span className="text-red-500">*</span></label>
                                        <select
                                            className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 text-xs outline-none focus:border-black font-black transition-all bg-white"
                                            value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)}
                                        >
                                            <option value="">Escolha...</option>
                                            {BODY_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 mb-2 uppercase tracking-widest">Cidade Origem</label>
                                        <input
                                            type="text" className="w-full border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 text-xs outline-none focus:border-black font-black transition-all"
                                            value={customOrigin} onChange={(e) => setCustomOrigin(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Conjuntos Disponíveis</div>
                                    {availableVehicles.map(v => (
                                        <div
                                            key={v.id}
                                            onClick={() => handleConfirmSchedule(v)}
                                            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex justify-between items-center group
                                  ${(!selectedSegment) ? 'opacity-40 grayscale pointer-events-none' : 'border-gray-50 bg-gray-50 hover:border-black hover:bg-white shadow-sm'}
                              `}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-white rounded-xl border border-gray-200 group-hover:border-black group-hover:bg-black group-hover:text-white transition-all">
                                                    <Truck size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 text-sm font-mono">{v.plate}</div>
                                                    <div className="text-[9px] text-gray-400 font-bold uppercase">{v.driverName}</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={24} className="text-gray-300 group-hover:text-black transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- WIZARD MODAL --- */}
            {/* -------------------- */}

            {/* --- POD MODAL --- */}
            {
                podTrip && (
                    <div className="absolute inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="font-black text-xl text-gray-900 tracking-tighter uppercase">Finalizar Entrega</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Anexar comprovante para encerrar viagem</p>
                                </div>
                                <button onClick={() => { setPodTrip(null); setPodFile(null); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Rota</div>
                                    <div className="text-sm font-bold text-gray-900">
                                        {podTrip.originCity} ➔ {podTrip.mainDestination}
                                    </div>
                                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">
                                        <MapPin size={10} /> Em Rota de Entrega
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Comprovante de Entrega (Obrigatório)</label>

                                    {!podFile ? (
                                        <div
                                            onClick={() => setPodFile('Comprovante-Assinado.jpg')}
                                            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all group"
                                        >
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <FileText size={24} className="text-gray-400 group-hover:text-gray-600" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-600">Clique para anexar arquivo</p>
                                            <p className="text-[10px] text-gray-400 mt-1">JPG, PNG ou PDF</p>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-green-100 bg-green-50/30 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                                <CheckCircle size={20} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-green-700 uppercase">Documento Aceito</div>
                                                <div className="text-[10px] text-green-600 font-medium">Canhoto de Nota Fiscal assinado</div>
                                                <div className="text-[9px] text-green-500 font-mono mt-0.5">NF-490123 • Série 1</div>
                                            </div>
                                            <button onClick={() => setPodFile(null)} className="absolute top-2 right-2 text-[10px] font-bold text-green-700 hover:underline">Trocar imagem</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => { setPodTrip(null); setPodFile(null); }} className="px-6 py-3 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest">Cancelar</button>
                                <button
                                    disabled={!podFile}
                                    onClick={() => {
                                        if (podTrip) onUpdateStatus(podTrip.id, 'Completed', podFile || undefined);
                                        setPodTrip(null);
                                        setPodFile(null);
                                    }}
                                    className="bg-black text-white px-8 py-3 rounded-xl text-xs font-black shadow-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest flex items-center gap-2"
                                >
                                    <CheckCircle size={16} /> Concluir Viagem
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- DETAILS MODAL --- */}
            {
                detailsData && (
                    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/10 relative">

                            {(detailsData.id && detailsData.truckPlate) ? (
                                // USE THE NEW COMPONENT FOR TRIP DETAILS
                                <div className="h-full overflow-y-auto custom-scrollbar bg-gray-50">
                                    <TripDetails
                                        trip={detailsData}
                                        loads={loads}
                                        availableDocs={availableDocs}
                                        isInline={true}
                                        onBack={() => setDetailsData(null)}
                                        onAddLeg={onAddLeg}
                                        onAddDelivery={onAddDelivery}
                                        onAddDocument={onAddDocument}
                                        onAddLoadWithDeliveries={onAddLoadWithDeliveries}
                                        onAttachLoadsToTrip={onAttachLoadsToTrip}
                                        onUpdateStatus={onUpdateStatus}
                                        onUpdateDeliveryStatus={onUpdateDeliveryStatus}
                                        onReorderDeliveries={onReorderDeliveries}
                                    />
                                    <button
                                        onClick={() => setDetailsData(null)}
                                        className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-gray-400 hover:text-gray-900 transition-all z-50 backdrop-blur-sm"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            ) : (
                                // FALLBACK FOR LOAD DETAILS (Or other types if any)
                                <>
                                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                                        <div>
                                            <h3 className="font-black text-3xl tracking-tighter text-gray-900 uppercase">Detalhes da Carga</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Informações do Pedido</p>
                                        </div>
                                        <button onClick={() => setDetailsData(null)} className="p-3 hover:bg-gray-200 rounded-full transition-colors"><X size={32} /></button>
                                    </div>
                                    <div className="p-10 overflow-y-auto bg-white custom-scrollbar space-y-12">
                                        <div className="grid grid-cols-2 gap-10">
                                            <BigItem label="Cliente Principal" value={detailsData.clientName} />
                                            <BigItem label="Data para Coleta" value={detailsData.collectionDate} />
                                            <BigItem label="Cidade Origem" value={detailsData.originCity} />
                                            <BigItem label="Cidade Destino" value={detailsData.destinationCity} />
                                        </div>
                                    </div>
                                    <div className="p-8 border-t border-gray-100 bg-gray-50 shrink-0 text-right">
                                        <button onClick={() => setDetailsData(null)} className="bg-black text-white px-12 py-5 rounded-[22px] text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-2xl active:scale-95">Fechar</button>
                                    </div>
                                </>
                            )}

                        </div>
                    </div>
                )
            }

        </div >
    );
};

// --- Sub-components ---

const BigItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none">{label}</p>
        <p className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none" title={String(value)}>{value}</p>
    </div>
);



interface TripColumnProps {
    title: string;
    trips: Trip[];
    headerColor: string;
    accentColor: string;
    statusColor: string;
    statusLabel: string;
    showProgress?: boolean;
    isCompleted?: boolean;
    onViewDetails: (t: string, d: any) => void;
    actionButton?: (trip: Trip) => React.ReactNode;
    tooltip?: string;
}

const TripColumn: React.FC<TripColumnProps> = ({ title, trips, headerColor, accentColor, statusColor, statusLabel, showProgress, isCompleted, onViewDetails, actionButton, tooltip }) => (
    <Column title={title} count={trips.length} headerColor={headerColor} accentColor={accentColor} tooltip={tooltip}>
        <div className="space-y-5">
            {trips.length === 0 && <EmptyState text={`Sem ${statusLabel.toLowerCase()}`} />}
            {trips.map(trip => (
                <TripCard key={trip.id} trip={trip} statusColor={statusColor} statusLabel={statusLabel} showProgress={showProgress} isCompleted={isCompleted} onViewDetails={onViewDetails} actionButton={actionButton} accentColor={accentColor} />
            ))}
        </div>
    </Column>
);



interface TripCardProps {
    trip: Trip;
    statusColor: string;
    statusLabel: string;
    showProgress?: boolean;
    isCompleted?: boolean;
    onViewDetails: (t: string, d: any) => void;
    actionButton?: (trip: Trip) => React.ReactNode;
    accentColor: string;
}

const TripCard: React.FC<TripCardProps> = ({ trip, statusColor, statusLabel, showProgress, isCompleted, onViewDetails, actionButton, accentColor }) => {
    const lastLeg = trip.legs.length > 0 ? trip.legs[trip.legs.length - 1] : null;
    const finalDest = lastLeg ? (lastLeg.type === 'EMPTY' ? lastLeg.destinationCity : (lastLeg.deliveries[lastLeg.deliveries.length - 1]?.destinationCity || '...')) : '...';

    // Collect all documents from all legs/deliveries
    const allDocs = trip.legs.flatMap(l => l.deliveries.flatMap(d => d.documents));
    const totalWeight = allDocs.reduce((acc, d) => acc + (d.weight || 0), 0);
    const totalValue = allDocs.reduce((acc, d) => acc + (d.value || 0), 0);

    return (
        <Card
            accentColor={accentColor}
            className={`${isCompleted ? 'opacity-60 grayscale scale-95' : ''} transition-all duration-300 ring-offset-2 hover:ring-2 hover:ring-black/5`}
        >
            {/* Header: ID + Status */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        #{trip.id.replace('trip-', '').substring(0, 10)}
                    </span>
                    {/* Badge de Status/Docs */}
                    {allDocs.length > 0 && (
                        <span className="text-[8px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded flex items-center gap-1 border border-gray-100" title="Documentos">
                            <FileText size={8} /> {allDocs.length}
                        </span>
                    )}
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${statusColor}`}>
                    {statusLabel}
                </span>
            </div>

            {/* Main Info: Driver & Plate (Replicating Client Name style from LoadCard) */}
            <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[10px] text-gray-500 uppercase">
                        {trip.driverName.charAt(0)}
                    </div>
                    <div className="font-black text-gray-900 text-sm uppercase tracking-tight line-clamp-1" title={trip.driverName}>
                        {trip.driverName}
                    </div>
                </div>
                <span className="text-[8px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded uppercase border border-gray-100 font-mono">
                    {trip.truckPlate}
                </span>
            </div>

            {/* Route */}
            <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                    <span className="font-bold uppercase text-[10px] tracking-wide">{trip.originCity}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-900 font-bold">
                    <ChevronRight size={12} className="text-gray-400" />
                    <span className="font-black uppercase text-[10px] tracking-wide">{finalDest}</span>
                </div>
                {trip.legs.length > 1 && (
                    <div className="pl-4 text-[8px] font-bold text-gray-400 uppercase">
                        + {trip.legs.length - 1} paradas
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                <div className="text-center">
                    <div className="text-[8px] text-gray-400 font-bold uppercase">Peso</div>
                    <div className="text-[11px] font-black text-gray-700 flex items-center justify-center gap-0.5">
                        <Weight size={10} />
                        {formatWeight(totalWeight)}
                    </div>
                </div>
                <div className="text-center border-x border-gray-200">
                    <div className="text-[8px] text-gray-400 font-bold uppercase">Valor</div>
                    <div className="text-[11px] font-black text-gray-700 flex items-center justify-center gap-0.5">
                        <DollarSign size={10} />
                        {new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short", style: 'currency', currency: 'BRL' }).format(totalValue)}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-[8px] text-gray-400 font-bold uppercase">Docs</div>
                    <div className="text-[11px] font-black text-gray-700 flex items-center justify-center gap-0.5">
                        <FileText size={10} />
                        {allDocs.length}
                    </div>
                </div>
            </div>

            {/* Date / Schedule */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                <Calendar size={12} />
                {trip.scheduledDate ? new Date(trip.scheduledDate).toLocaleDateString('pt-BR') : new Date(trip.createdAt).toLocaleDateString('pt-BR')}
                {trip.estimatedReturnDate && (
                    <>
                        <span className="text-gray-300">|</span>
                        <Clock size={12} /> Previsão: {new Date(trip.estimatedReturnDate).toLocaleDateString('pt-BR')}
                    </>
                )}
            </div>

            {/* Progress Bar */}
            {showProgress && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden shadow-inner ring-1 ring-black/5">
                    <div className="bg-black h-full w-[60%] rounded-full shadow-lg relative"> {/* Mock progress 60% */}
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            )}

            {/* Footer / Action Button */}
            <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center gap-3">
                <button onClick={() => onViewDetails('Detalhes da Viagem', trip)} className="text-[10px] font-bold text-gray-500 hover:text-black flex items-center gap-1">
                    <Eye size={12} /> Ver Detalhes
                </button>
                {actionButton && actionButton(trip)}
            </div>
        </Card>
    );
};


