import React, { useMemo, useState } from 'react';
import { Trip, Load, Vehicle, AvailableDocument } from '../types';
import {
    Calendar, MapPin, Truck, ChevronRight, Package, User, Clock,
    AlertCircle, Play, CheckCircle, Weight, Box, AlertTriangle,
    Filter, X, Bell, TrendingUp, Zap, DollarSign, Shield
} from 'lucide-react';
import { BoardColumn as Column, BoardCard as Card, EmptyState } from './BoardUI';

interface LoadBoardProps {
    loads: Load[];
    trips: Trip[];
    vehicles: Vehicle[];
    availableDocs: AvailableDocument[];
    cities: string[];
    onViewDetails: (load: Load) => void;
    onScheduleLoad: (load: Load, vehicle: Vehicle, segment: string, customOrigin: string, controlNumber: string) => void;
    onUpdateStatus: (tripId: string, status: Trip['status'], pod?: string) => void;
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
const LoadCard = ({
    load,
    status,
    tripContext,
    onClick,
    progress,
    direction
}: {
    load: Load;
    status: string;
    tripContext?: Trip;
    onClick: () => void;
    progress?: number;
    direction?: 'Ida' | 'Retorno';
}) => {
    const urgency = getUrgencyLevel(load);

    let accentColor = 'gray';
    let statusColor = 'bg-gray-100 text-gray-500 border-gray-200';
    let cardBorder = '';

    if (status === 'Pendente') {
        // Cor baseada na urgência para pendentes
        if (urgency === 'critical') {
            accentColor = 'red';
            cardBorder = 'ring-2 ring-red-500 ring-offset-2';
        } else if (urgency === 'warning') {
            accentColor = 'orange';
            cardBorder = 'ring-1 ring-orange-400';
        } else if (urgency === 'attention') {
            accentColor = 'yellow';
        }
    } else if (status === 'Agendada') {
        accentColor = 'blue';
        statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (status === 'Em Coleta') {
        accentColor = 'yellow';
        statusColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    } else if (status === 'Em Rota') {
        accentColor = 'orange';
        statusColor = 'bg-orange-50 text-orange-700 border-orange-200';
    } else if (status === 'Entregue') {
        accentColor = 'emerald';
        statusColor = 'bg-green-50 text-green-700 border-green-200';
    }

    const isVehicleBusy = tripContext && (tripContext.status === 'Picking Up' || tripContext.status === 'In Transit');

    return (
        <Card onClick={onClick} accentColor={accentColor} className={cardBorder}>
            {/* Header: ID + Status + Urgência */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        #{load.id.startsWith('leg-') ? load.id.replace('leg-', 'LEG-').substring(0, 10) : load.id.replace('load-', 'CRG-').substring(0, 10)}
                    </span>
                    {status === 'Pendente' && <UrgencyBadge level={urgency} />}
                    {direction && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wide ${direction === 'Ida'
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-orange-50 text-orange-600 border-orange-200'
                            }`}>
                            {direction}
                        </span>
                    )}
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${statusColor}`}>
                    {status}
                </span>
            </div>

            {/* Client */}
            <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[10px] text-gray-500">
                        {load.clientName.charAt(0)}
                    </div>
                    <div className="font-black text-gray-900 text-sm uppercase tracking-tight line-clamp-1" title={load.clientName}>
                        {load.clientName}
                    </div>
                </div>
                {load.segment && (
                    <span className="text-[8px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded uppercase">
                        {load.segment}
                    </span>
                )}
            </div>

            {/* Rota */}
            <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                    <span className="font-bold uppercase text-[10px] tracking-wide">{load.originCity}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-900 font-bold">
                    <ChevronRight size={12} className="text-gray-400" />
                    <span className="font-black uppercase text-[10px] tracking-wide">{load.destinationCity || 'A DEFINIR'}</span>
                </div>
            </div>

            {/* Características Físicas */}
            <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                <div className="text-center">
                    <div className="text-[8px] text-gray-400 font-bold uppercase">Peso</div>
                    <div className="text-[11px] font-black text-gray-700 flex items-center justify-center gap-0.5">
                        <Weight size={10} />
                        {formatWeight(load.weight)}
                    </div>
                </div>
                <div className="text-center border-x border-gray-200">
                    <div className="text-[8px] text-gray-400 font-bold uppercase">Volume</div>
                    <div className="text-[11px] font-black text-gray-700 flex items-center justify-center gap-0.5">
                        <Box size={10} />
                        {load.volume ? `${load.volume}m³` : '-'}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-[8px] text-gray-400 font-bold uppercase">Vols</div>
                    <div className="text-[11px] font-black text-gray-700 flex items-center justify-center gap-0.5">
                        <Package size={10} />
                        {load.packages || '-'}
                    </div>
                </div>
            </div>

            {/* SLA / Deadline */}
            {load.deliveryDeadline && status === 'Pendente' && (
                <div className={`flex items-center justify-between text-[10px] font-bold p-2 rounded-lg mb-3 ${urgency === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                    urgency === 'warning' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        urgency === 'attention' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                            'bg-gray-50 text-gray-600 border border-gray-100'
                    }`}>
                    <span className="uppercase tracking-wide flex items-center gap-1">
                        <Clock size={12} />
                        Prazo Entrega
                    </span>
                    <span className="font-black">{formatTimeRemaining(load.deliveryDeadline)}</span>
                </div>
            )}

            {/* Indicadores especiais */}
            <div className="flex gap-1 flex-wrap mb-3">
                {load.insuranceRequired && (
                    <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Shield size={8} /> Seguro
                    </span>
                )}
                {load.merchandiseValue && load.merchandiseValue > 200000 && (
                    <span className="text-[8px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <DollarSign size={8} /> Alto Valor
                    </span>
                )}
                {load.vehicleTypeReq && (
                    <span className="text-[8px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Truck size={8} /> {load.vehicleTypeReq}
                    </span>
                )}
            </div>

            {/* Data/Hora Coleta */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                <Calendar size={12} />
                {new Date(load.collectionDate).toLocaleDateString('pt-BR')}
                {load.collectionWindowStart && (
                    <>
                        <span className="text-gray-300">|</span>
                        <Clock size={12} />
                        {new Date(load.collectionWindowStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </>
                )}
            </div>

            {/* Progress Bar */}
            {progress !== undefined && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden shadow-inner ring-1 ring-black/5">
                    <div className="bg-black h-full rounded-full shadow-lg" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            {/* Vehicle Info ou CTA */}
            {tripContext ? (
                <div className="mt-auto pt-3 border-t border-gray-100">
                    {status === 'Agendada' && isVehicleBusy && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-2 mb-2 flex items-center gap-2">
                            <AlertCircle size={12} className="text-red-500" />
                            <span className="text-[9px] font-bold text-red-600 uppercase">Veículo em rota ativa</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Veículo</span>
                            <div className="flex items-center gap-1 font-mono font-bold text-gray-800">
                                {tripContext.truckPlate}
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Motorista</span>
                            <span className="font-bold text-gray-600 text-[10px] uppercase max-w-[100px] truncate">{tripContext.driverName}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <button className="mt-auto w-full py-2.5 bg-black hover:bg-gray-800 text-white text-[10px] font-black rounded-xl shadow-md transition-all uppercase tracking-widest">
                    Programar Veículo
                </button>
            )}
        </Card>
    );
};

// Card de Veículo Melhorado
const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => {
    const needsMaintenance = vehicle.nextMaintenance && new Date(vehicle.nextMaintenance) <= new Date();

    return (
        <Card accentColor="gray" className="border-l-gray-400">
            <div className="flex justify-between items-start mb-2">
                <div className="font-black text-gray-900 text-base font-mono bg-gray-50 px-2 rounded border border-gray-100">
                    {vehicle.plate}
                </div>
                <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${vehicle.status === 'Maintenance'
                    ? 'text-orange-600 bg-orange-50 border-orange-200'
                    : 'text-gray-400 border-gray-200'
                    }`}>
                    {vehicle.status === 'Available' ? 'Livre' : vehicle.status === 'Maintenance' ? 'Manutenção' : 'Em Uso'}
                </span>
            </div>

            <div className="text-[10px] text-gray-500 mb-2 font-bold uppercase">{vehicle.model} • {vehicle.type}</div>

            {/* Capacidades */}
            <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-gray-50 p-1.5 rounded text-center">
                    <div className="text-[8px] text-gray-400 uppercase">Capacidade</div>
                    <div className="text-[10px] font-black text-gray-700">{formatWeight(vehicle.capacity)}</div>
                </div>
                <div className="bg-gray-50 p-1.5 rounded text-center">
                    <div className="text-[8px] text-gray-400 uppercase">Volume</div>
                    <div className="text-[10px] font-black text-gray-700">{vehicle.volumeCapacity ? `${vehicle.volumeCapacity}m³` : '-'}</div>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <User size={12} />
                <span className="font-black uppercase text-[10px]">{vehicle.driverName || 'Sem motorista'}</span>
            </div>

            {needsMaintenance && (
                <div className="mt-2 bg-orange-50 text-orange-700 text-[9px] font-bold p-1.5 rounded flex items-center gap-1 border border-orange-200">
                    <AlertTriangle size={10} />
                    Manutenção pendente
                </div>
            )}
        </Card>
    );
};

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
    segments
}: {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    cities: string[];
    segments: string[];
}) => {
    return (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
                <Filter size={12} /> Filtros:
            </span>

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
            {(filters.urgency || filters.destinationCity || filters.segment || filters.vehicleType) && (
                <button
                    onClick={() => onFilterChange({ urgency: '', destinationCity: '', segment: '', vehicleType: '' })}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
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
}

// ===== COMPONENTE PRINCIPAL =====
export const LoadBoard: React.FC<LoadBoardProps> = ({ loads, trips, vehicles, cities, onViewDetails }) => {
    const [showAlerts, setShowAlerts] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        urgency: '',
        destinationCity: '',
        segment: '',
        vehicleType: ''
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

    // Aplicar filtros
    const filteredLoads = useMemo(() => {
        return loads.filter(l => {
            if (filters.urgency && getUrgencyLevel(l) !== filters.urgency) return false;
            if (filters.destinationCity && l.destinationCity !== filters.destinationCity) return false;
            if (filters.segment && l.segment !== filters.segment) return false;
            if (filters.vehicleType && l.vehicleTypeReq !== filters.vehicleType) return false;
            return true;
        });
    }, [loads, filters]);

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
                                    <LoadCard key={l.id} load={l} status="Pendente" onClick={() => onViewDetails(l)} />
                                ))
                            )}
                        </Column>

                        {/* COL 2: Veículos Disponíveis */}
                        <Column
                            title="Veículos Disponíveis"
                            count={availableVehicles.length}
                            headerColor="bg-gray-100 border-gray-400"
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

                        {/* COL 3: Carga Agendada */}
                        <Column title="Agendadas" count={scheduledLoads.length} headerColor="bg-blue-50 border-blue-500 text-blue-900" accentColor="blue">
                            {scheduledLoads.map((l: any) => (
                                <LoadCard key={l.id} load={l} status="Agendada" tripContext={l._trip} onClick={() => onViewDetails(l)} direction={l.direction} />
                            ))}
                        </Column>

                        {/* COL 4: Em Coleta */}
                        <Column title="Em Coleta" count={pickingUpLoads.length} headerColor="bg-yellow-50 border-yellow-400 text-yellow-900" accentColor="yellow">
                            {pickingUpLoads.map((l: any) => (
                                <LoadCard key={l.id} load={l} status="Em Coleta" tripContext={l._trip} onClick={() => onViewDetails(l)} progress={l._progress} direction={l.direction} />
                            ))}
                        </Column>

                        {/* COL 5: Em Rota */}
                        <Column title="Em Rota" count={inTransitLoads.length} headerColor="bg-orange-50 border-orange-500 text-orange-900" accentColor="orange">
                            {inTransitLoads.map((l: any) => (
                                <LoadCard key={l.id} load={l} status="Em Rota" tripContext={l._trip} onClick={() => onViewDetails(l)} progress={l._progress} direction={l.direction} />
                            ))}
                        </Column>

                        {/* COL 6: Entregue */}
                        <Column title="Entregues" count={deliveredLoads.length} headerColor="bg-emerald-50 border-emerald-500 text-emerald-900" accentColor="emerald">
                            {deliveredLoads.map((l: any) => (
                                <LoadCard key={l.id} load={l} status="Entregue" tripContext={l._trip} onClick={() => onViewDetails(l)} direction={l.direction} />
                            ))}
                        </Column>

                    </div>
                </div>

                {/* Painel de Alertas */}
                <AlertsPanel loads={loads} isOpen={showAlerts} onClose={() => setShowAlerts(false)} />
            </div>
        </div>
    );
};
