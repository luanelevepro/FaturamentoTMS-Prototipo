import React, { useState } from 'react';
import { Load, Vehicle } from '@/types';
import { 
    X, Check, Plus, Truck, Calendar, Weight, Box, Package, 
    Clock, DollarSign, Shield, Tag, AlertTriangle, Zap
} from 'lucide-react';
import type { Client } from '../bootstrap';

interface CreateLoadModalProps {
    isOpen: boolean;
    onClose: () => void;
    clients: Client[];
    cities: string[];
    vehicles: Vehicle[];
    activeTrips: any[];
    onCreateLoad: (loadData: any, vehicle: Vehicle | null) => void;
}

const BODY_TYPE_OPTIONS = [
    'Carreta', 'Truck', 'VUC', 'Utilitário', 'Bitrem', 'Rodotrem'
];

const REQUIREMENTS_OPTIONS = [
    'EPI Básico (Capacete/Bota)', 'EPI Completo (Óculos/Luva)',
    'Ajudante Extra', 'Paletes Vazios',
    'Corda / Cinta de Amarração', 'Lona de Proteção',
    'Manuseio Frágil', 'Rastreamento em Tempo Real',
    'Conferência Cega', 'Escolta', 'Baú Seco', 'Sider'
];

const SEGMENT_OPTIONS = [
    'Industrial', 'E-commerce', 'Alimentos', 'Bebidas', 'Agro', 'Farmacêutico', 'Químico', 'Automotivo', 'Varejo', 'Outro'
];

const PRIORITY_OPTIONS: { value: Load['priority']; label: string; color: string; icon: any }[] = [
    { value: 'low', label: 'Baixa', color: 'border-blue-300 bg-blue-50 text-blue-700', icon: null },
    { value: 'normal', label: 'Normal', color: 'border-gray-300 bg-gray-50 text-gray-700', icon: null },
    { value: 'high', label: 'Alta', color: 'border-orange-300 bg-orange-50 text-orange-700', icon: AlertTriangle },
    { value: 'urgent', label: 'Urgente', color: 'border-red-400 bg-red-50 text-red-700', icon: Zap },
];

export const CreateLoadModal: React.FC<CreateLoadModalProps> = ({
    isOpen,
    onClose,
    clients,
    cities,
    vehicles,
    activeTrips,
    onCreateLoad
}) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'physical' | 'sla' | 'requirements'>('basic');
    
    const [form, setForm] = useState({
        // Básico
        clientName: '',
        originCity: '',
        destinationCity: '',
        vehicleTypeReq: 'Carreta',
        segment: '',
        observations: '',
        selectedVehicleId: '',
        
        // Físico
        weight: '',
        volume: '',
        packages: '',
        maxStacking: '',
        
        // SLA / Tempo
        collectionDate: '',
        collectionWindowStart: '',
        collectionWindowEnd: '',
        deliveryDeadline: '',
        priority: 'normal' as Load['priority'],
        
        // Financeiro
        merchandiseValue: '',
        insuranceRequired: false,
        
        // Requisitos
        requirements: [] as string[],
    });

    const handleToggleRequirement = (req: string) => {
        setForm(prev => ({
            ...prev,
            requirements: prev.requirements.includes(req)
                ? prev.requirements.filter(r => r !== req)
                : [...prev.requirements, req]
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientName || !form.originCity || !form.destinationCity) {
            alert('Preencha os campos obrigatórios: Cliente, Origem e Destino.');
            return;
        }

        const selectedVehicle = vehicles.find(v => v.id === form.selectedVehicleId) || null;

        // Montar objeto com novos campos
        onCreateLoad({
            clientName: form.clientName,
            originCity: form.originCity,
            destinationCity: form.destinationCity,
            vehicleTypeReq: form.vehicleTypeReq,
            segment: form.segment || undefined,
            collectionDate: form.collectionDate || new Date().toISOString(),
            collectionWindowStart: form.collectionWindowStart || undefined,
            collectionWindowEnd: form.collectionWindowEnd || undefined,
            deliveryDeadline: form.deliveryDeadline || undefined,
            priority: form.priority,
            weight: form.weight ? parseFloat(form.weight) : undefined,
            volume: form.volume ? parseFloat(form.volume) : undefined,
            packages: form.packages ? parseInt(form.packages) : undefined,
            maxStacking: form.maxStacking ? parseInt(form.maxStacking) : undefined,
            merchandiseValue: form.merchandiseValue ? parseFloat(form.merchandiseValue) : undefined,
            insuranceRequired: form.insuranceRequired,
            requirements: form.requirements,
            observations: form.observations
        }, selectedVehicle);

        onClose();
        // Reset form
        setForm({
            clientName: '',
            originCity: '',
            destinationCity: '',
            vehicleTypeReq: 'Carreta',
            segment: '',
            observations: '',
            selectedVehicleId: '',
            weight: '',
            volume: '',
            packages: '',
            maxStacking: '',
            collectionDate: '',
            collectionWindowStart: '',
            collectionWindowEnd: '',
            deliveryDeadline: '',
            priority: 'normal',
            merchandiseValue: '',
            insuranceRequired: false,
            requirements: [],
        });
        setActiveTab('basic');
    };

    if (!isOpen) return null;

    const availableVehicles = vehicles.filter(v =>
        v.status === 'Available' &&
        !activeTrips.some(t => t.truckPlate === v.plate)
    );

    const tabs = [
        { id: 'basic', label: 'Dados Básicos', icon: Package },
        { id: 'physical', label: 'Características', icon: Weight },
        { id: 'sla', label: 'SLA / Prazos', icon: Clock },
        { id: 'requirements', label: 'Requisitos', icon: Check },
    ];

    return (
        <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-black text-xl text-gray-900 uppercase tracking-tight">Nova Carga</h3>
                        <p className="text-xs text-gray-500">Cadastrar carga com dados completos para Torre de Controle</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-white px-6">
                    <div className="flex gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2
                                    ${activeTab === tab.id 
                                        ? 'border-black text-black' 
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }
                                `}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                    
                    {/* TAB: Dados Básicos */}
                    {activeTab === 'basic' && (
                        <div className="space-y-5">
                            {/* Cliente e Segmento */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cliente <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                        value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {clients.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Tag size={10} /> Segmento
                                    </label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                        value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {SEGMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Origem e Destino */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Origem <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                        value={form.originCity} onChange={e => setForm({ ...form, originCity: e.target.value })}
                                    >
                                        <option value="">Cidade...</option>
                                        {cities.map(c => <option key={`orig-${c}`} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Destino <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                        value={form.destinationCity} onChange={e => setForm({ ...form, destinationCity: e.target.value })}
                                    >
                                        <option value="">Cidade...</option>
                                        {cities.map(c => <option key={`dest-${c}`} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Tipo de Veículo */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <Truck size={10} /> Tipo de Veículo Exigido
                                </label>
                                <select
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                    value={form.vehicleTypeReq} onChange={e => setForm({ ...form, vehicleTypeReq: e.target.value })}
                                >
                                    {BODY_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            {/* Veículo para Agendamento */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Veículo para Agendamento (Opcional)</label>
                                <select
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                    value={form.selectedVehicleId} onChange={e => setForm({ ...form, selectedVehicleId: e.target.value })}
                                >
                                    <option value="">Deixar no Backlog (sem veículo)</option>
                                    {availableVehicles.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.plate} - {v.model} ({v.driverName || 'S/ Motorista'}) | Cap: {v.capacity ? `${(v.capacity/1000).toFixed(0)}t` : '-'}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-gray-400">Se selecionado, a carga será criada já com status "Agendada".</p>
                            </div>

                            {/* Observações */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Observações</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all h-20 resize-none"
                                    placeholder="Detalhes adicionais, instruções especiais..."
                                    value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB: Características Físicas */}
                    {activeTab === 'physical' && (
                        <div className="space-y-5">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
                                <strong>Dica:</strong> Preencha as características físicas para validação automática de capacidade dos veículos.
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Weight size={10} /> Peso Bruto (kg)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 12500"
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                        value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Box size={10} /> Cubagem (m³)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ex: 45.5"
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                        value={form.volume} onChange={e => setForm({ ...form, volume: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Package size={10} /> Quantidade de Volumes
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 380"
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                        value={form.packages} onChange={e => setForm({ ...form, packages: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Empilhamento Máximo</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 3"
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                        value={form.maxStacking} onChange={e => setForm({ ...form, maxStacking: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Valor e Seguro */}
                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                                    <DollarSign size={10} /> Informações Financeiras
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Valor da Mercadoria (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Ex: 185000.00"
                                            className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                            value={form.merchandiseValue} onChange={e => setForm({ ...form, merchandiseValue: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5 flex items-end">
                                        <label
                                            onClick={() => setForm({ ...form, insuranceRequired: !form.insuranceRequired })}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all w-full
                                                ${form.insuranceRequired 
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${form.insuranceRequired ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 bg-white'}`}>
                                                {form.insuranceRequired && <Check size={12} strokeWidth={4} />}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Shield size={16} />
                                                <span className="text-xs font-bold uppercase">Requer Seguro</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: SLA / Prazos */}
                    {activeTab === 'sla' && (
                        <div className="space-y-5">
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-xs text-orange-700">
                                <strong>Importante:</strong> Defina os prazos para que a Torre de Controle alerte automaticamente sobre cargas próximas do vencimento.
                            </div>

                            {/* Prioridade */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Prioridade</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {PRIORITY_OPTIONS.map(p => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setForm({ ...form, priority: p.value })}
                                            className={`
                                                p-3 rounded-xl border-2 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1
                                                ${form.priority === p.value 
                                                    ? `${p.color} ring-2 ring-offset-2 ring-gray-300` 
                                                    : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {p.icon && <p.icon size={12} />}
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Data de Coleta */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data de Coleta</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                    value={form.collectionDate} onChange={e => setForm({ ...form, collectionDate: e.target.value })}
                                />
                            </div>

                            {/* Janela de Coleta */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Janela Coleta - Início</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                        value={form.collectionWindowStart} onChange={e => setForm({ ...form, collectionWindowStart: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Janela Coleta - Fim</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                        value={form.collectionWindowEnd} onChange={e => setForm({ ...form, collectionWindowEnd: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Prazo de Entrega (SLA) */}
                            <div className="space-y-1.5 pt-4 border-t border-gray-100">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <Clock size={10} /> Prazo Limite de Entrega (SLA)
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-black focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                                    value={form.deliveryDeadline} onChange={e => setForm({ ...form, deliveryDeadline: e.target.value })}
                                />
                                <p className="text-[9px] text-gray-400">A Torre de Controle alertará quando o prazo estiver próximo (&lt;48h, &lt;24h, &lt;12h).</p>
                            </div>
                        </div>
                    )}

                    {/* TAB: Requisitos */}
                    {activeTab === 'requirements' && (
                        <div className="space-y-5">
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-600">
                                Selecione os requisitos especiais para esta carga. Isso ajuda na alocação correta de veículos e recursos.
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {REQUIREMENTS_OPTIONS.map(req => {
                                    const isSelected = form.requirements.includes(req);
                                    return (
                                        <div
                                            key={req}
                                            onClick={() => handleToggleRequirement(req)}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs font-medium
                                                ${isSelected ? 'border-green-500 bg-green-50/50 text-green-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                                                {isSelected && <Check size={12} strokeWidth={4} />}
                                            </div>
                                            {req}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    {/* Tab Navigation Hints */}
                    <div className="flex gap-2">
                        {activeTab !== 'basic' && (
                            <button 
                                type="button" 
                                onClick={() => setActiveTab(tabs[tabs.findIndex(t => t.id === activeTab) - 1].id as any)}
                                className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase"
                            >
                                ← Anterior
                            </button>
                        )}
                        {activeTab !== 'requirements' && (
                            <button 
                                type="button" 
                                onClick={() => setActiveTab(tabs[tabs.findIndex(t => t.id === activeTab) + 1].id as any)}
                                className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase"
                            >
                                Próximo →
                            </button>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSubmit}
                            className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all uppercase tracking-widest flex items-center gap-2"
                        >
                            <Plus size={16} strokeWidth={3} /> Salvar Carga
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
