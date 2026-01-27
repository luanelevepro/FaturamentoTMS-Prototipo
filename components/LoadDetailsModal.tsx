import React from 'react';
import { Load } from '@/types';
import { 
    X, MapPin, Calendar, Package, ArrowRight, Truck, StickyNote, User,
    Weight, Box, Clock, DollarSign, Shield, Zap, AlertTriangle, Tag, Target
} from 'lucide-react';

interface LoadDetailsModalProps {
    load: Load | null;
    onClose: () => void;
    onSchedule: (load: Load) => void;
}

// ===== HELPERS =====

const getHoursUntilDeadline = (deadline?: string): number | null => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
};

const getUrgencyLevel = (load: Load): 'critical' | 'warning' | 'attention' | 'normal' => {
    if (load.priority === 'urgent') return 'critical';
    const hours = getHoursUntilDeadline(load.deliveryDeadline);
    if (hours === null) return 'normal';
    if (hours <= 12) return 'critical';
    if (hours <= 24) return 'warning';
    if (hours <= 48) return 'attention';
    return 'normal';
};

const formatWeight = (weight?: number): string => {
    if (!weight) return '-';
    if (weight >= 1000) return `${(weight / 1000).toFixed(1)} ton`;
    return `${weight} kg`;
};

const formatCurrency = (value?: number): string => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatTimeRemaining = (deadline?: string): string => {
    const hours = getHoursUntilDeadline(deadline);
    if (hours === null) return 'Sem prazo definido';
    if (hours < 0) return 'PRAZO VENCIDO';
    if (hours < 1) return `${Math.round(hours * 60)} minutos`;
    if (hours < 24) return `${Math.round(hours)} horas`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days} dia${days > 1 ? 's' : ''} e ${remainingHours}h`;
};

const formatPriority = (priority?: Load['priority']): { label: string; color: string } => {
    switch (priority) {
        case 'urgent': return { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200' };
        case 'high': return { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-200' };
        case 'normal': return { label: 'Normal', color: 'bg-gray-100 text-gray-600 border-gray-200' };
        case 'low': return { label: 'Baixa', color: 'bg-blue-100 text-blue-600 border-blue-200' };
        default: return { label: 'Normal', color: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
};

// ===== COMPONENT =====

export const LoadDetailsModal: React.FC<LoadDetailsModalProps> = ({
    load,
    onClose,
    onSchedule
}) => {
    if (!load) return null;

    const urgency = getUrgencyLevel(load);
    const priority = formatPriority(load.priority);

    const urgencyConfig = {
        critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: Zap, label: 'CRÍTICO' },
        warning: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: AlertTriangle, label: 'ALERTA' },
        attention: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: Clock, label: 'ATENÇÃO' },
        normal: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: null, label: 'NO PRAZO' }
    };

    const urg = urgencyConfig[urgency];

    return (
        <div className="absolute inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-white/20">

                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200">
                                {load.status === 'Pending' ? 'Pendente' : load.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${priority.color}`}>
                                {priority.label}
                            </span>
                            {load.segment && (
                                <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-200 flex items-center gap-1">
                                    <Tag size={10} /> {load.segment}
                                </span>
                            )}
                            <span className="text-gray-300 text-xs font-mono">#{load.id}</span>
                        </div>
                        <h3 className="font-black text-2xl text-gray-900 uppercase tracking-tight">{load.clientName}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                        <X size={24} />
                    </button>
                </div>

                {/* SLA Banner */}
                {load.deliveryDeadline && load.status === 'Pending' && (
                    <div className={`px-8 py-4 ${urg.bg} border-b ${urg.border} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            {urg.icon && <urg.icon size={20} className={urg.text} />}
                            <div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${urg.text}`}>
                                    Status do SLA: {urg.label}
                                </div>
                                <div className={`text-sm font-bold ${urg.text}`}>
                                    Prazo de entrega: {new Date(load.deliveryDeadline).toLocaleDateString('pt-BR')} às {new Date(load.deliveryDeadline).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                        <div className={`text-right`}>
                            <div className={`text-2xl font-black ${urg.text}`}>{formatTimeRemaining(load.deliveryDeadline)}</div>
                            <div className={`text-[10px] font-bold uppercase ${urg.text} opacity-70`}>restantes</div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                        {/* Column 1: Route & Dates */}
                        <div className="space-y-8">
                            {/* Rota */}
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <MapPin size={14} /> Rota
                                </h4>
                                <div className="relative pl-6 border-l-2 border-gray-100 space-y-8">
                                    <div className="relative">
                                        <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-black ring-4 ring-white shadow-sm"></div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Origem</div>
                                        <div className="text-lg font-black text-gray-900 uppercase">{load.originCity}</div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-gray-300 ring-4 ring-white"></div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Destino</div>
                                        <div className="text-lg font-black text-gray-900 uppercase">{load.destinationCity || 'A definir'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Janelas de Tempo */}
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Calendar size={14} /> Janelas de Tempo
                                </h4>
                                <div className="space-y-3">
                                    {/* Coleta */}
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm text-gray-600">
                                                <Target size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Janela de Coleta</div>
                                                <div className="text-sm font-black text-gray-900">
                                                    {load.collectionDate ? new Date(load.collectionDate).toLocaleDateString('pt-BR') : 'A definir'}
                                                </div>
                                            </div>
                                            {(load.collectionWindowStart || load.collectionWindowEnd) && (
                                                <div className="text-right">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">Horário</div>
                                                    <div className="text-sm font-bold text-gray-700">
                                                        {load.collectionWindowStart && new Date(load.collectionWindowStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        {load.collectionWindowEnd && ` - ${new Date(load.collectionWindowEnd).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Entrega */}
                                    {load.deliveryDeadline && (
                                        <div className={`rounded-2xl p-4 border ${urg.bg} ${urg.border}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 bg-white rounded-xl shadow-sm ${urg.text}`}>
                                                    <Clock size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`text-[10px] font-bold uppercase tracking-wide ${urg.text}`}>Prazo de Entrega (SLA)</div>
                                                    <div className={`text-sm font-black ${urg.text}`}>
                                                        {new Date(load.deliveryDeadline).toLocaleDateString('pt-BR')} às {new Date(load.deliveryDeadline).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Observações */}
                            {load.observations && (
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <StickyNote size={14} /> Observações
                                    </h4>
                                    <div className="bg-yellow-50/50 p-5 rounded-2xl border border-yellow-100 text-xs font-medium text-yellow-900 italic leading-relaxed">
                                        "{load.observations}"
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Column 2: Specs & Requirements */}
                        <div className="space-y-8">
                            {/* Características Físicas */}
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Package size={14} /> Características Físicas
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                                            <Weight size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Peso Bruto</span>
                                        </div>
                                        <div className="text-xl font-black text-gray-900">{formatWeight(load.weight)}</div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                                            <Box size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Cubagem</span>
                                        </div>
                                        <div className="text-xl font-black text-gray-900">{load.volume ? `${load.volume} m³` : '-'}</div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                                            <Package size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Volumes</span>
                                        </div>
                                        <div className="text-xl font-black text-gray-900">{load.packages || '-'}</div>
                                    </div>
                                    {load.maxStacking && (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Empilhamento Máx.</div>
                                            <div className="text-xl font-black text-gray-900">{load.maxStacking}x</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Financeiro */}
                            {(load.merchandiseValue || load.insuranceRequired) && (
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <DollarSign size={14} /> Informações Financeiras
                                    </h4>
                                    <div className="space-y-3">
                                        {load.merchandiseValue && (
                                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                                <div className="text-[9px] text-purple-400 font-black uppercase tracking-widest mb-1">Valor da Mercadoria</div>
                                                <div className="text-xl font-black text-purple-900">{formatCurrency(load.merchandiseValue)}</div>
                                            </div>
                                        )}
                                        {load.insuranceRequired && (
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                                                <Shield size={24} className="text-blue-500" />
                                                <div>
                                                    <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Seguro Obrigatório</div>
                                                    <div className="text-sm font-bold text-blue-900">RCTR-C / RCF-DC necessário</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Especificações de Veículo */}
                            <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Truck size={14} /> Especificações de Veículo
                                </h4>
                                <div className="space-y-3">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Tipo de Veículo</div>
                                        <div className="text-sm font-black text-gray-900 uppercase">{load.vehicleTypeReq || 'Qualquer'}</div>
                                    </div>
                                    
                                    {load.requirements && load.requirements.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-3">Requisitos Especiais</div>
                                            <div className="flex flex-wrap gap-2">
                                                {load.requirements.map(req => (
                                                    <span key={req} className="text-[10px] font-bold text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm uppercase">
                                                        {req}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="text-[10px] text-gray-400">
                        {load.weight && load.volume && (
                            <span>
                                Densidade: <strong className="text-gray-600">{(load.weight / load.volume).toFixed(0)} kg/m³</strong>
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">
                            Fechar
                        </button>
                        {load.status === 'Pending' && (
                            <button
                                onClick={() => { onClose(); onSchedule(load); }}
                                className="bg-black text-white px-8 py-3 rounded-xl text-xs font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all uppercase tracking-widest flex items-center gap-2"
                            >
                                Programar Veículo <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
