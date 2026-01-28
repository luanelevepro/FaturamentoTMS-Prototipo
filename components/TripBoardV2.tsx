import React, { useState, useMemo } from 'react';
import { Trip, AvailableDocument, Vehicle, Load, Leg, Delivery } from '../types';

import {
    Truck, MapPin, Play, CheckCircle, Package, ArrowRight, X, Calendar, MoreVertical, Eye, Info, AlertCircle, Weight, Box, AlertTriangle,
    Filter, Bell, TrendingUp, Zap, DollarSign, Shield, FileText, ChevronRight, ChevronDown, Clock
} from 'lucide-react';
import { TripDetails } from './TripDetails';
import { ErrorBoundary } from './ErrorBoundary';
import { BoardColumn as Column, BoardCard as Card, EmptyState } from './BoardUI';

const inferLegDirection = (trip: Trip, leg: { type: string; originCity?: string; destinationCity?: string; direction?: 'Ida' | 'Retorno' }): 'Ida' | 'Retorno' | undefined => {
    if (leg.type !== 'LOAD') return undefined;
    if (leg.direction) return leg.direction;

    const o = (leg.originCity || '').trim();
    const d = (leg.destinationCity || '').trim();
    const tripOrigin = (trip.originCity || '').trim();
    const tripMain = (trip.mainDestination || '').trim();

    // Heurística simples para protótipo:
    // - Saindo da origem macro → Ida
    // - Voltando para origem macro → Retorno
    // - Indo para o destino macro → Ida
    // - Saindo do destino macro → Retorno
    if (tripOrigin && o === tripOrigin) return 'Ida';
    if (tripOrigin && d === tripOrigin) return 'Retorno';
    if (tripMain && d === tripMain) return 'Ida';
    if (tripMain && o === tripMain) return 'Retorno';
    return undefined;
};

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
    onRequestScheduleLoad?: (load: Load) => void; // abre o modal padrão (evita modal duplicado/bugado)
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
    onEmitCTe?: (loadId: string) => void; // Handler para "emitir" CT-e (apenas visual/gerencial)
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
    onRequestScheduleLoad,
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

    const isTripFiscalOk = (trip: Trip): boolean => {
        // Modelo alvo: 1 Carga (Leg LOAD) => 1 destino => 1 CT-e
        // Consideramos "OK" quando toda Leg de carga possui ao menos 1 CT-e vinculado nos documentos.
        const loadLegs = trip.legs.filter(l => l.type === 'LOAD');
        if (loadLegs.length === 0) return false;
        return loadLegs.every(l => {
            const docs = l.deliveries.flatMap(d => d.documents || []);
            return docs.some(d => d.type === 'CTe');
        });
    };

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
        // Preferir o modal padrão do host (TripsAndLoadsScreen) para manter layout consistente
        if (onRequestScheduleLoad) return onRequestScheduleLoad(load);
        // Fallback: mantém comportamento antigo (caso o host não passe o callback)
        alert('Ação de programação não configurada nesta tela.');
    };



    const handleViewDetails = (title: string, data: any) => {
        setDetailsTitle(title);
        setDetailsData(data);
    };

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden bg-gray-100 font-sans relative text-gray-800" >

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
            < div className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-4 lg:p-6 custom-scrollbar" >
                <div className="flex gap-3 lg:gap-4 h-full min-w-[1300px] sm:min-w-[1500px] lg:min-w-[1800px]">

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
                                        <span className="text-xs font-black text-gray-600 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 uppercase">
                                            Pendente
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {load.collectionDate && (
                                                <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-gray-500" /> 
                                                    <span className="font-bold">{new Date(load.collectionDate).toLocaleDateString('pt-BR')}</span>
                                                </span>
                                            )}
                                            <button 
                                                onClick={() => handleViewDetails(`Carga: ${load.clientName}`, { type: 'LOAD_DETAIL', ...load })} 
                                                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="font-black text-gray-900 text-base uppercase tracking-tight mb-2">{load.clientName}</div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin size={16} className="text-gray-500" /> 
                                            <span className="font-semibold">{load.originCity}</span>
                                            {load.destinationCity && (
                                                <>
                                                    <ChevronRight size={14} className="text-gray-400" />
                                                    <span className="font-semibold">{load.destinationCity}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenSchedule(load)}
                                        className="w-full py-3 bg-black hover:bg-gray-800 text-white text-xs font-black rounded-xl shadow-md transition-all uppercase tracking-wide"
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
                            const fiscalOk = isTripFiscalOk(trip);
                            const disabled = busy || !fiscalOk;
                            return (
                                <button
                                    disabled={disabled}
                                    onClick={() => onUpdateStatus(trip.id, 'Picking Up')}
                                    className={`flex items-center gap-2 px-6 py-2.5 text-white text-xs font-black rounded-xl shadow-lg uppercase tracking-wide transition-all
                                ${disabled ? 'bg-gray-300 cursor-not-allowed grayscale' : 'bg-black hover:bg-gray-800'}`}
                                    title={!fiscalOk ? 'Vínculo fiscal pendente: associe CT-e à(s) Carga(s) antes de iniciar.' : undefined}
                                >
                                    <Play size={16} fill="white" /> Iniciar Coleta
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
                                disabled={!isTripFiscalOk(trip)}
                                onClick={() => onUpdateStatus(trip.id, 'In Transit')}
                                className={`flex items-center gap-2 px-6 py-2.5 text-white text-xs font-black rounded-xl shadow-lg uppercase tracking-wide transition-all ${
                                    !isTripFiscalOk(trip) ? 'bg-gray-300 cursor-not-allowed grayscale' : 'bg-black hover:bg-gray-800'
                                }`}
                                title={!isTripFiscalOk(trip) ? 'Vínculo fiscal pendente: associe CT-e à(s) Carga(s) antes de iniciar.' : undefined}
                            >
                                <Truck size={16} /> Iniciar Viagem
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
                                className="flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-black rounded-xl shadow-lg uppercase tracking-wide transition-all"
                            >
                                <CheckCircle size={16} /> Finalizar
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



            {/* Programação: modal unificado fica no host (TripsAndLoadsScreen) */}

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
                                    <ErrorBoundary title="Erro nos detalhes da viagem">
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
                                    </ErrorBoundary>
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

    // Gerencial: valor do frete vem do CT-e (não da NF-e)
    const cteDocs = allDocs.filter(d => d.type === 'CTe');
    const nfDocs = allDocs.filter(d => d.type === 'NF');
    const totalFreight = cteDocs.reduce((acc, d) => acc + (d.value || 0), 0);

    const uniqCte = new Set(cteDocs.map(d => d.number));
    const uniqNf = new Set(nfDocs.map(d => d.dfeKey || d.number));

    const cteOwn = new Set(cteDocs.filter(d => !d.isSubcontracted).map(d => d.number));
    const dfeCount = uniqNf.size;
    const cteOwnCount = cteOwn.size;

    const cargaLegs = trip.legs.filter(l => l.type === 'LOAD');
    const cargasCount = cargaLegs.length;
    const paradasCount = cargaLegs.reduce((acc, l) => acc + l.deliveries.length, 0);
    const idaCount = cargaLegs.filter(l => inferLegDirection(trip, l as any) === 'Ida').length;
    const retornoCount = cargaLegs.filter(l => inferLegDirection(trip, l as any) === 'Retorno').length;

    return (
        <Card
            accentColor={accentColor}
            className={`${isCompleted ? 'opacity-60 grayscale scale-95' : ''} transition-all duration-300 ring-offset-2 hover:ring-2 hover:ring-black/5`}
        >
            {/* Header: ID + Status */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide font-mono">
                        #{trip.id.replace('trip-', '').substring(0, 8)}
                    </span>
                    {/* Badges Gerenciais - Melhorados */}
                    {cargasCount > 0 && (
                        <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1.5 border border-gray-200" title="Cargas (Legs LOAD)">
                            <Package size={12} className="text-gray-600" /> <span className="font-black">{cargasCount}</span>
                        </span>
                    )}
                    {cteOwnCount > 0 && (
                        <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1.5 border border-gray-200" title="CT-e próprio (únicos)">
                            <FileText size={12} className="text-gray-600" /> <span className="font-black">{cteOwnCount}</span>
                        </span>
                    )}
                    {dfeCount > 0 && (
                        <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1.5 border border-gray-200" title="DF-e/NF-e atendidos (únicos)">
                            <FileText size={12} className="text-gray-600" /> <span className="font-black">{dfeCount}</span>
                        </span>
                    )}
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-lg border-2 uppercase tracking-wide ${statusColor}`}>
                    {statusLabel}
                </span>
            </div>

            {/* Main Info: Driver & Plate - Melhorado */}
            <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm text-gray-700 uppercase shrink-0">
                        {trip.driverName.charAt(0)}
                    </div>
                    <div className="font-black text-gray-900 text-base uppercase tracking-tight line-clamp-1 flex-1" title={trip.driverName}>
                        {trip.driverName}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Truck size={14} className="text-gray-500" />
                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-md uppercase border border-gray-200 font-mono tracking-wider">
                        {trip.truckPlate}
                    </span>
                </div>
            </div>

            {/* Route - Melhorado */}
            <div className="space-y-2 mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0"></div>
                    <span className="font-bold text-sm text-gray-700 uppercase tracking-wide">{trip.originCity}</span>
                </div>
                <div className="flex items-center gap-2">
                    <ChevronRight size={16} className="text-gray-500 shrink-0" />
                    <span className="font-black text-base text-gray-900 uppercase tracking-wide">{finalDest}</span>
                </div>
                {(cargasCount > 1 || paradasCount > 1 || idaCount > 0 || retornoCount > 0) && (
                    <div className="pt-2 mt-2 border-t border-gray-200 flex flex-wrap gap-2 text-xs text-gray-600">
                        {cargasCount > 1 && (
                            <span className="font-semibold">{cargasCount} cargas</span>
                        )}
                        {paradasCount > 1 && (
                            <span className="font-semibold">{paradasCount} paradas</span>
                        )}
                        {idaCount > 0 && (
                            <span className="font-semibold text-blue-600">Ida: {idaCount}</span>
                        )}
                        {retornoCount > 0 && (
                            <span className="font-semibold text-orange-600">Retorno: {retornoCount}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Stats Grid - Melhorado */}
            <div className="grid grid-cols-3 gap-3 mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">
                <div className="text-center">
                    <div className="text-[10px] text-gray-600 font-bold uppercase mb-1.5 tracking-wide">Peso</div>
                    <div className="text-sm font-black text-gray-900 flex items-center justify-center gap-1.5">
                        <Weight size={14} className="text-gray-600" />
                        <span>{formatWeight(totalWeight)}</span>
                    </div>
                </div>
                <div className="text-center border-x border-gray-300 px-3">
                    <div className="text-[10px] text-gray-600 font-bold uppercase mb-1.5 tracking-wide">Frete</div>
                    <div className="text-sm font-black text-gray-900 flex items-center justify-center gap-1.5">
                        <DollarSign size={14} className="text-gray-600" />
                        <span>{new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short", style: 'currency', currency: 'BRL' }).format(totalFreight)}</span>
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-[10px] text-gray-600 font-bold uppercase mb-1.5 tracking-wide">Documentos</div>
                    <div className="text-xs font-black text-gray-900 flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                            <Package size={12} className="text-gray-600" />
                            <span>{cargasCount}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-600">
                            <FileText size={10} />
                            <span>{cteOwnCount} CT-e / {dfeCount} DF-e</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Date / Schedule - Melhorado */}
            <div className="flex items-center gap-3 text-xs font-semibold text-gray-600 mb-3">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-500" />
                    <span className="font-bold text-gray-700">
                        {trip.scheduledDate ? new Date(trip.scheduledDate).toLocaleDateString('pt-BR') : new Date(trip.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                </div>
                {trip.estimatedReturnDate && (
                    <>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-500" />
                            <span className="text-gray-600">Previsão: <span className="font-bold text-gray-700">{new Date(trip.estimatedReturnDate).toLocaleDateString('pt-BR')}</span></span>
                        </div>
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

            {/* Footer / Action Button - Melhorado */}
            <div className="mt-auto pt-4 border-t-2 border-gray-200 flex justify-between items-center gap-3">
                <button 
                    onClick={() => onViewDetails('Detalhes da Viagem', trip)} 
                    className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
                >
                    <Eye size={14} /> Ver Detalhes
                </button>
                {actionButton && actionButton(trip)}
            </div>
        </Card>
    );
};


