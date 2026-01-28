import React, { useMemo, useState } from 'react';
import { Trip, Load, Vehicle, AvailableDocument } from '../types';
import {
    Calendar, MapPin, Truck, ChevronRight, Package, User, Clock,
    AlertCircle, Play, CheckCircle, Weight, Box, AlertTriangle,
    Filter, X, Bell, TrendingUp, Zap, DollarSign, Shield, Search
} from 'lucide-react';
import { BoardColumn as Column, BoardCard as Card, EmptyState } from './BoardUI';
import { LoadCard } from '@/modules/trips/ui/LoadCard';
import { LoadCardInTrip } from './LoadCardInTrip';
import { VehicleCard } from '@/modules/trips/ui/VehicleCard';
import { ScheduledLoadCard } from './ScheduledLoadCard';
import { PickingUpLoadCard } from './PickingUpLoadCard';
import { InTransitLoadCard } from './InTransitLoadCard';
import { DeliveredLoadCard } from './DeliveredLoadCard';

interface LoadBoardProps {
    loads: Load[];
    trips: Trip[];
    vehicles: Vehicle[];
    availableDocs: AvailableDocument[];
    cities: string[];
    onViewDetails: (load: Load) => void;
    onScheduleLoad: (load: Load, vehicle: Vehicle, segment: string, customOrigin: string, controlNumber: string) => void;
    onUpdateStatus: (tripId: string, status: Trip['status'], pod?: string) => void;
    onEmitFiscal?: (loadId: string) => void;
}

const inferLegDirection = (trip: Trip, leg: any): 'Ida' | 'Retorno' | undefined => {
    if (!leg || leg.type !== 'LOAD') return undefined;
    if (leg.direction) return leg.direction;
    const o = (leg.originCity || '').trim();
    const d = (leg.destinationCity || '').trim();
    const tripOrigin = (trip.originCity || '').trim();
    const tripMain = (trip.mainDestination || '').trim();
    if (tripOrigin && o === tripOrigin) return 'Ida';
    if (tripOrigin && d === tripOrigin) return 'Retorno';
    if (tripMain && d === tripMain) return 'Ida';
    if (tripMain && o === tripMain) return 'Retorno';
    return undefined;
};

// ===== HELPERS =====

// Calcula horas até o deadline
const getHoursUntilDeadline = (deadline?: string): number | null => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
};

// Determina urgência baseada no SLA
const getUrgencyLevel = (load: Load): 'critical' | 'warning' | 'attention' | 'normal' => {
    // Primeiro verifica prioridade explícita
    if (load.priority === 'urgent') return 'critical';

    const hours = getHoursUntilDeadline(load.deliveryDeadline);
    if (hours === null) return 'normal';

    if (hours <= 12) return 'critical';      // Menos de 12h - CRÍTICO
    if (hours <= 24) return 'warning';       // Menos de 24h - ALERTA
    if (hours <= 48) return 'attention';     // Menos de 48h - ATENÇÃO
    return 'normal';
};

// Formata peso para exibição
const formatWeight = (weight?: number): string => {
    if (!weight) return '-';
    if (weight >= 1000) return `${(weight / 1000).toFixed(1)}t`;
    return `${weight}kg`;
};

// Formata valor monetário
const formatCurrency = (value?: number): string => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

// Formata tempo restante
const formatTimeRemaining = (deadline?: string): string => {
    const hours = getHoursUntilDeadline(deadline);
    if (hours === null) return 'Sem prazo';
    if (hours < 0) return 'ATRASADO';
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${Math.round(hours % 24)}h`;
};

// Helper to determine Load Status based on Trip Status
const getLoadStatusFromTrip = (tripStatus: Trip['status']): string => {
    switch (tripStatus) {
        case 'Planned': return 'Agendada';
        case 'Picking Up': return 'Em Coleta';
        case 'In Transit': return 'Em Rota';
        case 'Completed': return 'Entregue';
        default: return 'Pendente';
    }
};

// ===== COMPONENTES =====

// Badge de Urgência
const UrgencyBadge = ({ level }: { level: ReturnType<typeof getUrgencyLevel> }) => {
    const config = {
        critical: { bg: 'bg-red-500', text: 'text-white', label: 'URGENTE', icon: Zap, animate: 'animate-pulse' },
        warning: { bg: 'bg-orange-500', text: 'text-white', label: 'ALERTA', icon: AlertTriangle, animate: '' },
        attention: { bg: 'bg-yellow-400', text: 'text-yellow-900', label: 'ATENÇÃO', icon: Clock, animate: '' },
        normal: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'NORMAL', icon: null, animate: '' }
    };

    const c = config[level];
    if (level === 'normal') return null;

    return (
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 ${c.bg} ${c.text} ${c.animate}`}>
            {c.icon && <c.icon size={10} />}
            {c.label}
        </span>
    );
};

// Card de Carga Melhorado
// Modular components imported from @/modules/trips/ui/


// Painel de Alertas
const AlertsPanel = ({ loads, isOpen, onClose }: { loads: Load[]; isOpen: boolean; onClose: () => void }) => {
    const criticalLoads = loads.filter(l => getUrgencyLevel(l) === 'critical');
    const warningLoads = loads.filter(l => getUrgencyLevel(l) === 'warning');
    const attentionLoads = loads.filter(l => getUrgencyLevel(l) === 'attention');

    if (!isOpen) return null;

    return (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                    <Bell size={18} className="text-red-500" />
                    <span className="font-black text-sm uppercase tracking-wide">Central de Alertas</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Críticos */}
                {criticalLoads.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-red-600 uppercase">Crítico ({criticalLoads.length})</span>
                        </div>
                        <div className="space-y-2">
                            {criticalLoads.map(l => (
                                <div key={l.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="font-bold text-xs text-red-900 mb-1">{l.clientName}</div>
                                    <div className="text-[10px] text-red-700">{l.originCity} → {l.destinationCity}</div>
                                    <div className="text-[10px] font-black text-red-600 mt-1">
                                        ⏱ {formatTimeRemaining(l.deliveryDeadline)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Alertas */}
                {warningLoads.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-[10px] font-black text-orange-600 uppercase">Alerta ({warningLoads.length})</span>
                        </div>
                        <div className="space-y-2">
                            {warningLoads.map(l => (
                                <div key={l.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <div className="font-bold text-xs text-orange-900 mb-1">{l.clientName}</div>
                                    <div className="text-[10px] text-orange-700">{l.originCity} → {l.destinationCity}</div>
                                    <div className="text-[10px] font-black text-orange-600 mt-1">
                                        ⏱ {formatTimeRemaining(l.deliveryDeadline)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Atenção */}
                {attentionLoads.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-[10px] font-black text-yellow-600 uppercase">Atenção ({attentionLoads.length})</span>
                        </div>
                        <div className="space-y-2">
                            {attentionLoads.map(l => (
                                <div key={l.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="font-bold text-xs text-yellow-900 mb-1">{l.clientName}</div>
                                    <div className="text-[10px] text-yellow-700">{l.originCity} → {l.destinationCity}</div>
                                    <div className="text-[10px] font-black text-yellow-600 mt-1">
                                        ⏱ {formatTimeRemaining(l.deliveryDeadline)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {criticalLoads.length === 0 && warningLoads.length === 0 && attentionLoads.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                        <div className="text-sm font-bold">Tudo sob controle!</div>
                        <div className="text-xs">Nenhum alerta no momento</div>
                    </div>
                )}
            </div>

            {/* KPIs Rápidos */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="text-[9px] font-black text-gray-400 uppercase mb-2">Resumo do Backlog</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded border">
                        <div className="text-lg font-black text-gray-900">{loads.length}</div>
                        <div className="text-[8px] text-gray-400 uppercase">Total</div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                        <div className="text-lg font-black text-red-600">{criticalLoads.length + warningLoads.length}</div>
                        <div className="text-[8px] text-gray-400 uppercase">Urgentes</div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                        <div className="text-lg font-black text-gray-900">
                            {formatWeight(loads.reduce((acc, l) => acc + (l.weight || 0), 0))}
                        </div>
                        <div className="text-[8px] text-gray-400 uppercase">Peso Total</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Barra de Filtros
const FiltersBar = ({
    filters,
    onFilterChange,
    cities,
    segments,
    clients,
    searchTerm,
    onSearchChange
}: {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    cities: string[];
    segments: string[];
    clients: string[];
    searchTerm: string;
    onSearchChange: (value: string) => void;
}) => {
    return (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Buscar carga, cliente, cidade..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <span className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
                <Filter size={12} /> Filtros:
            </span>

            {/* Cliente */}
            <select
                className="text-[10px] font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 uppercase"
                value={filters.client}
                onChange={(e) => onFilterChange({ ...filters, client: e.target.value })}
            >
                <option value="">Todos Clientes</option>
                {clients.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>

            {/* Urgência */}
            <select
                className="text-[10px] font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 uppercase"
                value={filters.urgency}
                onChange={(e) => onFilterChange({ ...filters, urgency: e.target.value })}
            >
                <option value="">Todas Urgências</option>
                <option value="critical">🔴 Crítico</option>
                <option value="warning">🟠 Alerta</option>
                <option value="attention">🟡 Atenção</option>
                <option value="normal">⚪ Normal</option>
            </select>

            {/* Região/Cidade */}
            <select
                className="text-[10px] font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 uppercase"
                value={filters.destinationCity}
                onChange={(e) => onFilterChange({ ...filters, destinationCity: e.target.value })}
            >
                <option value="">Todos Destinos</option>
                {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>

            {/* Segmento */}
            <select
                className="text-[10px] font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 uppercase"
                value={filters.segment}
                onChange={(e) => onFilterChange({ ...filters, segment: e.target.value })}
            >
                <option value="">Todos Segmentos</option>
                {segments.map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>

            {/* Conjunto (Tipo Veículo) */}
            <select
                className="text-[10px] font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 uppercase"
                value={filters.vehicleType}
                onChange={(e) => onFilterChange({ ...filters, vehicleType: e.target.value })}
            >
                <option value="">Todos Conjuntos</option>
                <option value="Bitrem">Bitrem</option>
                <option value="Carreta">Carreta</option>
                <option value="Truck">Truck</option>
                <option value="Vuc">VUC</option>
            </select>

            {/* Limpar */}
            {(filters.urgency || filters.destinationCity || filters.segment || filters.vehicleType || filters.client || searchTerm) && (
                <button
                    onClick={() => {
                        onFilterChange({ urgency: '', destinationCity: '', segment: '', vehicleType: '', client: '' });
                        onSearchChange('');
                    }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <X size={12} /> Limpar
                </button>
            )}
        </div>
    );
};

interface FilterState {
    urgency: string;
    destinationCity: string;
    segment: string;
    vehicleType: string;
    client: string;
}

// ===== COMPONENTE PRINCIPAL =====
export const LoadBoard: React.FC<LoadBoardProps> = ({ loads, trips, vehicles, cities, onViewDetails, onEmitFiscal, onUpdateStatus }) => {
    const [showAlerts, setShowAlerts] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<FilterState>({
        urgency: '',
        destinationCity: '',
        segment: '',
        vehicleType: '',
        client: ''
    });

    // Segmentos únicos
    const segments = useMemo(() => {
        const segs = new Set<string>();
        loads.forEach(l => l.segment && segs.add(l.segment));
        return Array.from(segs);
    }, [loads]);

    // Cidades de destino únicas
    const destinationCities = useMemo(() => {
        const citiesSet = new Set<string>();
        loads.forEach(l => l.destinationCity && citiesSet.add(l.destinationCity));
        return Array.from(citiesSet);
    }, [loads]);

    // Clientes únicos
    const uniqueClients = useMemo(() => {
        const clientsSet = new Set<string>();
        loads.forEach(l => l.clientName && clientsSet.add(l.clientName));
        return Array.from(clientsSet).sort();
    }, [loads]);

    // Aplicar filtros e busca
    const filteredLoads = useMemo(() => {
        return loads.filter(l => {
            // Busca textual
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch = 
                    l.clientName.toLowerCase().includes(searchLower) ||
                    l.id.toLowerCase().includes(searchLower) ||
                    l.originCity.toLowerCase().includes(searchLower) ||
                    (l.destinationCity || '').toLowerCase().includes(searchLower) ||
                    (l.segment || '').toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Filtros
            if (filters.urgency && getUrgencyLevel(l) !== filters.urgency) return false;
            if (filters.destinationCity && l.destinationCity !== filters.destinationCity) return false;
            if (filters.segment && l.segment !== filters.segment) return false;
            if (filters.vehicleType && l.vehicleTypeReq !== filters.vehicleType) return false;
            if (filters.client && l.clientName !== filters.client) return false;
            return true;
        });
    }, [loads, filters, searchTerm]);

    // Ordenar por urgência (mais urgentes primeiro)
    const sortedLoads = useMemo(() => {
        const urgencyOrder = { critical: 0, warning: 1, attention: 2, normal: 3 };
        return [...filteredLoads].sort((a, b) => {
            return urgencyOrder[getUrgencyLevel(a)] - urgencyOrder[getUrgencyLevel(b)];
        });
    }, [filteredLoads]);

    const availableVehicles = useMemo(() => vehicles.filter(v => {
        if (v.status !== 'Available') return false;
        if (filters.vehicleType && v.type !== filters.vehicleType) return false;
        return true;
    }), [vehicles, filters.vehicleType]);

    const maintenanceVehicles = useMemo(() => vehicles.filter(v => {
        if (v.status !== 'Maintenance') return false;
        if (filters.vehicleType && v.type !== filters.vehicleType) return false;
        return true;
    }), [vehicles, filters.vehicleType]);

    const getLoadsByTripStatus = (status: Trip['status']) => {
        return trips
            .filter(t => {
                if (t.status !== status) return false;

                // Filter by Conjunto (Vehicle Type)
                // Assuming we look for the truck type. If we don't have truck type directly on trip, 
                // we might need to look it up from vehicles list or assume the user wants to filter by the ASSIGNED vehicle's type.
                // However, trips table has truck_plate. Let's find the vehicle in our `vehicles` prop to check type.
                if (filters.vehicleType) {
                    const truck = vehicles.find(v => v.plate === t.truckPlate);
                    if (!truck || truck.type !== filters.vehicleType) return false;
                }

                // Filter by Destination City (Main Destination or any leg destination?)
                // Let's use Main Destination for Trip-level filtering
                if (filters.destinationCity && t.mainDestination !== filters.destinationCity) return false;

                return true;
            })
            .flatMap(t => t.legs
                .filter(l => {
                    // Additional Leg-level filtering
                    if (l.type !== 'LOAD') return false;
                    if (filters.segment && l.segment !== filters.segment) return false;
                    // Note: We don't filter legs by destination separately if we already filtered the TRIP by destination.
                    // But if the user wants to see specific legs going to a city, we might need to adjust.
                    // Current behavior: Filter TRIP by destinationCity.

                    return true;
                })
                .flatMap(leg => ({
                    ...leg,
                    id: leg.id,
                    clientName: leg.deliveries[0]?.recipientName || 'Cliente',
                    originCity: leg.originCity,
                    destinationCity: leg.destinationCity,
                    collectionDate: t.scheduledDate || t.createdAt,
                    status: getLoadStatusFromTrip(status),
                    _trip: t,
                    _progress: status === 'Picking Up' ? 30 : (status === 'In Transit' ? 60 : 100),
                    direction: inferLegDirection(t, leg) // Ida/Retorno (mesmo quando não vier explícito)
                } as any))
            );
    };

    const scheduledLoads = useMemo(() => getLoadsByTripStatus('Planned'), [trips]);
    const pickingUpLoads = useMemo(() => getLoadsByTripStatus('Picking Up'), [trips]);
    const inTransitLoads = useMemo(() => getLoadsByTripStatus('In Transit'), [trips]);
    const deliveredLoads = useMemo(() => getLoadsByTripStatus('Completed'), [trips]);

    // Contagem de alertas
    const alertCount = useMemo(() => {
        return loads.filter(l => ['critical', 'warning', 'attention'].includes(getUrgencyLevel(l))).length;
    }, [loads]);

    return (
        <div className="flex flex-col h-full bg-gray-100">
            {/* Barra de Filtros */}
            <FiltersBar
                filters={filters}
                onFilterChange={setFilters}
                cities={destinationCities}
                segments={segments}
                clients={uniqueClients}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />

            {/* Conteúdo Principal */}
            <div className="flex flex-1 overflow-hidden">
                {/* Board */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-4 custom-scrollbar">
                    <div className="flex gap-3 lg:gap-4 h-full min-w-[1300px] sm:min-w-[1500px] lg:min-w-[1800px]">

                        {/* COL 1: Cargas Disponíveis (Backlog) */}
                        <Column
                            title="Backlog de Cargas"
                            count={sortedLoads.length}
                            headerColor="bg-gray-100 border-gray-400"
                            accentColor="gray"
                            headerExtra={
                                <button
                                    onClick={() => setShowAlerts(!showAlerts)}
                                    className={`relative p-1.5 rounded-lg transition-colors ${showAlerts ? 'bg-red-100 text-red-600' : 'hover:bg-gray-200 text-gray-400'}`}
                                >
                                    <Bell size={14} />
                                    {alertCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                                            {alertCount}
                                        </span>
                                    )}
                                </button>
                            }
                        >
                            {sortedLoads.length === 0 ? (
                                <EmptyState message="Nenhuma carga no backlog" />
                            ) : (
                                sortedLoads.map(l => (
                                    <LoadCard key={l.id} load={l} onSchedule={() => onViewDetails(l)} />
                                ))
                            )}
                        </Column>

                        {/* COL 2: Veículos Disponíveis - CINZA COM BOLINHA VERDE */}
                        <Column
                            title={
                                <div className="flex items-center gap-2">
                                    <span>Veículos Disponíveis</span>
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
                                </div>
                            }
                            count={availableVehicles.length}
                            headerColor="bg-gray-100 border-gray-400 text-gray-900"
                            accentColor="gray"
                        >
                            {availableVehicles.map(v => (
                                <VehicleCard key={v.id} vehicle={v} />
                            ))}
                            {maintenanceVehicles.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="text-[9px] font-black text-orange-500 uppercase mb-2 flex items-center gap-1">
                                        <AlertTriangle size={10} /> Em Manutenção ({maintenanceVehicles.length})
                                    </div>
                                    {maintenanceVehicles.map(v => (
                                        <VehicleCard key={v.id} vehicle={v} />
                                    ))}
                                </div>
                            )}
                        </Column>

                        {/* COL 3: Carga Agendada - AMARELO/ATENÇÃO */}
                        <Column title="Carga Agendada" count={scheduledLoads.length} headerColor="bg-yellow-50 border-yellow-400 text-yellow-900" accentColor="yellow">
                            {scheduledLoads.map((l: any) => {
                                const originalLoad = loads.find(load => load.id === l.loadId);
                                // Verificar se há outra viagem em andamento para o mesmo veículo
                                const hasActiveTripForVehicle = trips.some(t => 
                                    t.id !== l._trip.id && 
                                    t.truckPlate === l._trip.truckPlate && 
                                    (t.status === 'In Transit' || t.status === 'Picking Up')
                                );
                                return (
                                    <ScheduledLoadCard
                                        key={l.id}
                                        load={originalLoad || (l as any)}
                                        trip={l._trip}
                                        hasActiveRoute={hasActiveTripForVehicle}
                                        onViewDetails={() => onViewDetails(originalLoad || l)}
                                        onStartCollection={() => {
                                            onUpdateStatus(l._trip.id, 'Picking Up');
                                        }}
                                    />
                                );
                            })}
                        </Column>

                        {/* COL 4: Em Coleta - LARANJA */}
                        <Column title="Em Coleta" count={pickingUpLoads.length} headerColor="bg-orange-50 border-orange-400 text-orange-900" accentColor="orange">
                            {pickingUpLoads.map((l: any) => {
                                const originalLoad = loads.find(load => load.id === l.loadId);
                                const progress = l._progress || 30; // Progresso padrão de 30% quando em coleta
                                return (
                                    <PickingUpLoadCard
                                        key={l.id}
                                        load={originalLoad || (l as any)}
                                        trip={l._trip}
                                        progress={progress}
                                        onViewDetails={() => onViewDetails(originalLoad || l)}
                                        onStartTrip={() => {
                                            onUpdateStatus(l._trip.id, 'In Transit');
                                        }}
                                    />
                                );
                            })}
                        </Column>

                        {/* COL 5: Em Rota - ROXO/ÍNDIGO */}
                        <Column title="Em Rota" count={inTransitLoads.length} headerColor="bg-purple-50 border-purple-500 text-purple-900" accentColor="purple">
                            {inTransitLoads.map((l: any) => {
                                const originalLoad = loads.find(load => load.id === l.loadId);
                                const progress = l._progress || 60; // Progresso padrão de 60% quando em rota
                                return (
                                    <InTransitLoadCard
                                        key={l.id}
                                        load={originalLoad || (l as any)}
                                        trip={l._trip}
                                        progress={progress}
                                        onViewDetails={() => onViewDetails(originalLoad || l)}
                                        onFinishTrip={() => {
                                            onUpdateStatus(l._trip.id, 'Completed');
                                        }}
                                    />
                                );
                            })}
                        </Column>

                        {/* COL 6: Entregue */}
                        <Column title="Entregues" count={deliveredLoads.length} headerColor="bg-emerald-50 border-emerald-500 text-emerald-900" accentColor="emerald">
                            {deliveredLoads.map((l: any) => {
                                const originalLoad = loads.find(load => load.id === l.loadId);
                                // Garantir que o load tenha deliveryDeadline se o originalLoad tiver
                                const loadWithDeadline = originalLoad 
                                  ? { ...(l as any), ...originalLoad, deliveryDeadline: originalLoad.deliveryDeadline || (l as any).deliveryDeadline }
                                  : (l as any);
                                return (
                                    <DeliveredLoadCard
                                        key={l.id}
                                        load={loadWithDeadline}
                                        trip={l._trip}
                                        onViewDetails={() => onViewDetails(originalLoad || l)}
                                    />
                                );
                            })}
                        </Column>

                    </div>
                </div>

                {/* Painel de Alertas */}
                <AlertsPanel loads={loads} isOpen={showAlerts} onClose={() => setShowAlerts(false)} />
            </div>
        </div>
    );
};
