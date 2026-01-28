import React, { useState, useRef, useEffect } from 'react';
import { Trip } from '../types';
import { ArrowLeft, Save, Truck, User, MapPin, Calendar, PlusCircle, Tag } from 'lucide-react';

// MOCK DATA FOR SELECTION
const MOCK_DRIVERS = [
  { id: '1', name: 'João Silva', cnh: '1234567890' },
  { id: '2', name: 'Carlos Pereira', cnh: '0987654321' },
  { id: '3', name: 'Marcos Santos', cnh: '1122334455' },
  { id: '4', name: 'Antônio Oliveira', cnh: '5566778899' },
  { id: '5', name: 'Paulo Rodrigues', cnh: '9988776655' },
  { id: '6', name: 'Roberto Xtutz', cnh: '1112223334' }
];

const MOCK_TRUCKS = [
  { id: 't1', plate: 'ABC-1234', model: 'Scania R450' },
  { id: 't2', plate: 'DEF-5678', model: 'Volvo FH540' },
  { id: 't3', plate: 'GHI-9012', model: 'Mercedes Actros' },
  { id: 't4', plate: 'JKL-3456', model: 'DAF XF' },
  { id: 't5', plate: 'MND-2025', model: 'Scania R500' }
];

const MOCK_TRAILERS = [
  { id: 'tr1', plate: 'XYZ-9001', type: 'Sider' },
  { id: 'tr2', plate: 'WUV-1234', type: 'Baú' },
  { id: 'tr3', plate: 'LMN-4567', type: 'Grade Baixa' },
  { id: 'tr4', plate: 'OPQ-7890', type: 'Sider 3 Eixos' },
  { id: 'tr5', plate: 'SC-9988', type: 'Sider' },
  { id: 'tr6', plate: 'XYZ-9002', type: 'Reboque' }
];

const SEGMENT_OPTIONS = [
  'Carga Graneleiro',
  'Carga Seca',
  'Carga Frigorífico',
  'Carga Viva',
  'Industrial', 
  'Agro', 
  'E-commerce', 
  'Cargas Gerais', 
  'Automotivo', 
  'Farmacêutico',
  'Outros'
];

interface TripFormProps {
  onCancel: () => void;
  onSave: (trip: Omit<Trip, 'id' | 'createdAt' | 'legs'>) => void;
  initialData?: Trip | null; // For editing
}

export const TripForm: React.FC<TripFormProps> = ({ onCancel, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    driverId: '',
    driverName: '',
    
    // New Split Vehicle State
    truckPlate: '',
    trailer1Plate: '',
    trailer2Plate: '',

    originCity: 'São Paulo - SP (Matriz)', // Default Origin
    segment: '', // Main Trip Segment
    startDate: '', // Scheduled date
    returnDate: '', // Estimated return date
    status: 'Planned' as Trip['status']
  });

  const dateInputRef = useRef<HTMLInputElement>(null);
  const returnDateInputRef = useRef<HTMLInputElement>(null);

  // Initialize form if editing
  useEffect(() => {
    if (initialData) {
      // Reverse lookup for Driver ID based on Name
      const foundDriver = MOCK_DRIVERS.find(d => d.name === initialData.driverName);
      
      setFormData({
        driverId: foundDriver ? foundDriver.id : '',
        driverName: initialData.driverName,
        truckPlate: initialData.truckPlate,
        trailer1Plate: initialData.trailer1Plate || '',
        trailer2Plate: initialData.trailer2Plate || '',
        originCity: initialData.originCity,
        segment: initialData.segment || '',
        startDate: initialData.scheduledDate || '',
        returnDate: initialData.estimatedReturnDate || '',
        status: initialData.status
      });
    }
  }, [initialData]);

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const driver = MOCK_DRIVERS.find(d => d.id === selectedId);
    
    if (driver) {
      setFormData({
        ...formData,
        driverId: selectedId,
        driverName: driver.name
      });
    } else {
      setFormData({
        ...formData,
        driverId: '',
        driverName: ''
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      driverName: formData.driverName,
      truckPlate: formData.truckPlate,
      trailer1Plate: formData.trailer1Plate || undefined,
      trailer2Plate: formData.trailer2Plate || undefined,
      originCity: formData.originCity,
      mainDestination: '', 
      segment: formData.segment,
      freightValue: initialData ? initialData.freightValue : 0, // Preserve value if editing, else 0
      scheduledDate: formData.startDate,
      estimatedReturnDate: formData.returnDate,
      status: formData.status
    });
  };

  const triggerDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      ref.current.showPicker();
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen ml-0 md:ml-64">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onCancel}
          className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para listagem
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{initialData ? 'Editar Viagem' : 'Nova Viagem'}</h2>
              <p className="text-sm text-gray-500">Defina os recursos e a previsão de saída/retorno</p>
            </div>
            <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
              Status: {formData.status === 'Planned' ? 'Planejado' : formData.status}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* Section 1: Resources (Selects) */}
            <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Truck size={16} className="text-blue-600" />
                Composição do Conjunto & Motorista
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                   {/* Driver Selection */}
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Motorista Responsável</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <User size={16} />
                        </div>
                        <select
                          required
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                          value={formData.driverId}
                          onChange={handleDriverChange}
                        >
                          <option value="">Selecione o Motorista...</option>
                          {MOCK_DRIVERS.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name} (CNH: {d.cnh})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Truck Selection (Required) */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Cavalo (Obrigatório)</label>
                  <div className="relative">
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm"
                      value={formData.truckPlate}
                      onChange={e => setFormData({...formData, truckPlate: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {MOCK_TRUCKS.map(t => (
                        <option key={t.id} value={t.plate}>
                          {t.plate} - {t.model}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Trailer 1 Selection (Optional) */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Carreta 1 (Opcional)</label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm"
                      value={formData.trailer1Plate}
                      onChange={e => setFormData({...formData, trailer1Plate: e.target.value})}
                    >
                      <option value="">Nenhuma</option>
                      {MOCK_TRAILERS.map(t => (
                        <option key={t.id} value={t.plate}>
                          {t.plate} - {t.type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Trailer 2 Selection (Optional) */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Carreta 2 (Opcional)</label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm"
                      value={formData.trailer2Plate}
                      onChange={e => setFormData({...formData, trailer2Plate: e.target.value})}
                    >
                      <option value="">Nenhuma</option>
                      {MOCK_TRAILERS.map(t => (
                        <option key={t.id} value={t.plate}>
                          {t.plate} - {t.type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
              
              {(formData.truckPlate) && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800 flex items-center gap-2">
                   <CheckIcon /> 
                   <span>Conjunto: <b>{formData.truckPlate}</b> {formData.trailer1Plate ? `+ ${formData.trailer1Plate}` : ''} {formData.trailer2Plate ? `+ ${formData.trailer2Plate}` : ''}</span>
                </div>
              )}

            </div>

            <div className="border-t border-gray-100"></div>

            {/* Section 2: Trip Definition */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                Definição da Viagem
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 
                 {/* Origin (Fixed) */}
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origem da Viagem</label>
                  <div className="relative">
                     <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                     <input 
                      type="text" 
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed font-medium"
                      value={formData.originCity}
                      disabled
                    />
                  </div>
                </div>

                {/* Segment Selection */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Segmento Principal</label>
                   <div className="relative">
                      <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <select
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                        value={formData.segment}
                        onChange={e => setFormData({...formData, segment: e.target.value})}
                      >
                        <option value="">Selecione o Segmento...</option>
                        {SEGMENT_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </div>
                   </div>
                </div>

                {/* Dates Container */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Saída Prevista</label>
                      <div className="relative cursor-pointer" onClick={() => triggerDatePicker(dateInputRef)}>
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          ref={dateInputRef}
                          required
                          type="date" 
                          style={{ colorScheme: 'light' }}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-sm"
                          value={formData.startDate}
                          onChange={e => setFormData({...formData, startDate: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Return Date (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Retorno Previsto (Opcional)</label>
                      <div className="relative cursor-pointer" onClick={() => triggerDatePicker(returnDateInputRef)}>
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          ref={returnDateInputRef}
                          type="date" 
                          style={{ colorScheme: 'light' }}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-sm"
                          value={formData.returnDate}
                          onChange={e => setFormData({...formData, returnDate: e.target.value})}
                        />
                      </div>
                    </div>
                </div>

              </div>
            </div>

            <div className="flex justify-end pt-4 gap-3 border-t border-gray-100">
              <button 
                type="button" 
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 shadow-sm transition-colors"
              >
                <Save size={16} />
                {initialData ? 'Salvar Alterações' : 'Cadastrar Viagem'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);