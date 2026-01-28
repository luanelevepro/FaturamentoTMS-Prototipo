import React, { useState, useMemo } from 'react';
import { Trip, Leg, Delivery, Document, AvailableDocument } from '../types';
import { Eye, Plus, Search, Calendar, Filter, ChevronUp, ChevronDown, ArrowRight, Map, Route, X, Check, Info, Package, Edit2, Tag } from 'lucide-react';

interface TripListV3Props {
  trips: Trip[];
  availableDocs: AvailableDocument[];
  onCreateNew: () => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
  onAddLeg: (tripId: string, leg: Omit<Leg, 'id' | 'sequence' | 'deliveries'>) => void;
  onAddDelivery: (tripId: string, legId: string, selectedDocs: AvailableDocument[]) => void;
  onAddDocument: (tripId: string, legId: string, deliveryId: string, doc: Omit<Document, 'id'>) => void;
}

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

export const TripListV3: React.FC<TripListV3Props> = ({ 
  trips, 
  availableDocs, 
  onCreateNew,
  onEditTrip, 
  onAddLeg,
  onAddDelivery
}) => {
  
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  // --- FORM STATES ---
  const [activeLegForm, setActiveLegForm] = useState<{ tripId: string, type: 'LOAD' | 'EMPTY' } | null>(null);
  const [activeDeliveryForm, setActiveDeliveryForm] = useState<{ tripId: string, legId: string } | null>(null);
  
  // Data States
  const [newLeg, setNewLeg] = useState({ originCity: '', originAddress: '', hubName: '', destinationCity: '', segment: '' });
  const [filterText, setFilterText] = useState('');
  // Changing from selecting CT-e IDs to Control Numbers
  const [selectedControlNumber, setSelectedControlNumber] = useState<string | null>(null);

  const toggleExpand = (tripId: string) => {
    setExpandedTripId(prev => prev === tripId ? null : tripId);
    setActiveLegForm(null);
    setActiveDeliveryForm(null);
  };

  const calculateTripRevenue = (trip: Trip) => {
    if (!trip.legs) return 0;
    return trip.legs.reduce((total, leg) => {
      return total + leg.deliveries.reduce((legTotal, delivery) => {
          return legTotal + delivery.documents
            .reduce((docTotal, doc) => docTotal + doc.value, 0);
      }, 0);
    }, 0);
  };

  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'In Transit': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Delayed': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSuggestedOrigin = (trip: Trip) => {
      let defaultOriginCity = trip.originCity;
      let defaultOriginAddress = 'Matriz / Pátio';

      if (trip.legs.length > 0) {
        const lastLeg = trip.legs[trip.legs.length - 1];
        if (lastLeg.type === 'EMPTY') {
            defaultOriginCity = lastLeg.destinationCity || '';
            defaultOriginAddress = 'Ponto de Parada';
        } else {
            if (lastLeg.deliveries.length > 0) {
                const lastDelivery = lastLeg.deliveries[lastLeg.deliveries.length - 1];
                defaultOriginCity = lastDelivery.destinationCity;
                defaultOriginAddress = lastDelivery.destinationAddress;
            } else {
                defaultOriginCity = lastLeg.originCity;
                defaultOriginAddress = lastLeg.originAddress;
            }
        }
      }
      return { city: defaultOriginCity, address: defaultOriginAddress };
  };

  const handleOpenLegForm = (trip: Trip, type: 'LOAD' | 'EMPTY') => {
      const suggestion = getSuggestedOrigin(trip);
      setNewLeg({
          originCity: suggestion.city,
          originAddress: suggestion.address,
          hubName: '',
          destinationCity: '',
          segment: ''
      });
      setActiveLegForm({ tripId: trip.id, type });
  };

  const handleSaveLeg = () => {
      if (!activeLegForm) return;
      onAddLeg(activeLegForm.tripId, {
          originCity: newLeg.originCity,
          originAddress: newLeg.originAddress,
          hubName: newLeg.hubName,
          destinationCity: activeLegForm.type === 'EMPTY' ? newLeg.destinationCity : undefined,
          segment: activeLegForm.type === 'LOAD' ? newLeg.segment : undefined,
          type: activeLegForm.type
      });
      setActiveLegForm(null);
  };

  // --- Grouping Logic for V3 ---
  const groupedAvailableDocs = useMemo(() => {
    const groups: Record<string, AvailableDocument[]> = {};
    availableDocs.forEach(doc => {
        const key =
          doc.type === 'CTe'
            ? `CTE:${doc.number}`
            : (doc.linkedCteNumber ? `CTE:${doc.linkedCteNumber}` : `NFE:${doc.number}`);
        if (!groups[key]) groups[key] = [];
        groups[key].push(doc);
    });
    return groups;
  }, [availableDocs]);

  const filteredGroups = useMemo(() => {
    const keys = Object.keys(groupedAvailableDocs);
    if (!filterText) return keys;
    return keys.filter(key => {
        const docs = groupedAvailableDocs[key];
        const lowerFilter = filterText.toLowerCase();
        if (key.toLowerCase().includes(lowerFilter)) return true;
        return docs.some(d => d.recipientName.toLowerCase().includes(lowerFilter) || d.destinationCity.toLowerCase().includes(lowerFilter));
    });
  }, [groupedAvailableDocs, filterText]);

  const handleSaveDelivery = () => {
    if (!activeDeliveryForm || !selectedControlNumber) return;
    const selected = groupedAvailableDocs[selectedControlNumber];
    if (selected) {
        onAddDelivery(activeDeliveryForm.tripId, activeDeliveryForm.legId, selected);
    }
    setActiveDeliveryForm(null);
    setSelectedControlNumber(null);
    setFilterText('');
  };


  return (
    <div className="p-6 bg-gray-100 min-h-screen transition-all font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
         <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span>TRANSPORTES TOMAZI</span>
                <span>/</span>
                <span>EMPRESA</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Monitor de Viagens (Modo Impressão)</h1>
         </div>
         <button 
            onClick={onCreateNew}
            className="bg-black text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:bg-gray-800"
          >
            <Plus size={16}/> Cadastrar Viagem
          </button>
      </div>

       {/* Toolbar */}
       <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex gap-4 mb-4 items-center">
            <Search size={18} className="text-gray-400 ml-2" />
            <input placeholder="Pesquisar" className="flex-1 text-sm outline-none text-gray-600"/>
       </div>

      {/* Main Table Container */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">ID Viagem</th>
              <th className="px-6 py-4">Datas</th>
              <th className="px-6 py-4">Veículo</th>
              <th className="px-6 py-4">Motorista</th>
              <th className="px-6 py-4">Valor Total</th>
              <th className="px-6 py-4">Frete</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Ações</th>
              <th className="px-4 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trips.map((trip) => {
               const revenue = calculateTripRevenue(trip);
               const isExpanded = expandedTripId === trip.id;
               const returnDate = trip.estimatedReturnDate ? new Date(trip.estimatedReturnDate + 'T00:00:00') : null;

               return (
              <React.Fragment key={trip.id}>
                <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}>
                  <td className="px-6 py-4 text-gray-900 font-medium">{trip.id}</td>
                  <td className="px-6 py-4 text-gray-500">
                      <div>{new Date(trip.scheduledDate || trip.createdAt).toLocaleDateString()}</div>
                      {returnDate && <div className="text-xs text-orange-600 mt-1">Até {returnDate.toLocaleDateString()}</div>}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                      <div className="font-bold">{trip.truckPlate}</div>
                      <div className="text-gray-400 text-xs">
                          {trip.trailer1Plate ? `+ ${trip.trailer1Plate}` : ''}
                          {trip.trailer2Plate ? ` + ${trip.trailer2Plate}` : ''}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{trip.driverName}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenue)}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.freightValue)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(trip.status)}`}>
                        {trip.status === 'In Transit' ? 'Em Trânsito' : trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEditTrip(trip); }} 
                            className="text-gray-400 hover:text-blue-600 border border-gray-200 rounded p-1" 
                        >
                            <Edit2 size={14}/>
                        </button>
                     </div>
                  </td>
                  <td className="px-4 py-4 text-center cursor-pointer" onClick={() => toggleExpand(trip.id)}>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
                  </td>
                </tr>
                
                {/* Expanded Area */}
                {isExpanded && (
                  <tr>
                    <td colSpan={9} className="bg-gray-100 p-6 border-b border-gray-200">
                       <div className="space-y-4">
                          
                          {trip.legs.length === 0 && !activeLegForm && (
                              <div className="bg-white rounded-lg p-8 text-center text-gray-400 border border-dashed border-gray-300">
                                  Nenhuma carga cadastrada.
                              </div>
                          )}

                          {trip.legs.map((leg, idx) => {
                             let cargaNumber = 0;
                             for(let i=0; i<=idx; i++) { if (trip.legs[i].type === 'LOAD') cargaNumber++; }

                             return (
                              <div key={leg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                  {/* HEADER DA CARGA */}
                                  <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                      <div className="flex items-center gap-3">
                                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${leg.type === 'EMPTY' ? 'bg-gray-200 text-gray-600' : 'bg-gray-900 text-white'}`}>
                                              {leg.type === 'EMPTY' ? `Deslocamento Vazio` : `Carga #${cargaNumber}`}
                                          </span>
                                          {leg.segment && (
                                            <span className="text-xs font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                                                <Tag size={12}/> {leg.segment}
                                            </span>
                                          )}
                                      </div>
                                  </div>

                                  <div className="p-6">
                                      <div className="flex gap-8 relative">
                                          <div className="absolute left-[0.9rem] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                                          <div className="flex-1 space-y-6">
                                              {/* 1. ORIGEM */}
                                              <div className="flex items-start gap-4 relative">
                                                  <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                                                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                                                  </div>
                                                  <div className="flex-1 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                                      <span className="text-xs font-bold text-blue-600 uppercase mb-1 block">Origem</span>
                                                      <div className="font-bold text-gray-800 text-lg">{leg.originCity}</div>
                                                      <div className="text-sm text-gray-500">{leg.originAddress}</div>
                                                  </div>
                                              </div>

                                              {/* 2. DESTINO (SE FOR VAZIO) */}
                                              {leg.type === 'EMPTY' && (
                                                  <div className="flex items-start gap-4 relative">
                                                      <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                                                          <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                                                      </div>
                                                      <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                                                          <span className="text-xs font-bold text-gray-500 uppercase mb-1 block">Destino (Deslocamento)</span>
                                                          <div className="font-bold text-gray-800">{leg.destinationCity}</div>
                                                      </div>
                                                  </div>
                                              )}

                                              {/* 3. ENTREGAS */}
                                              {leg.deliveries.map((del, dIdx) => (
                                                  <div key={del.id} className="flex items-start gap-4 relative">
                                                      <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                                                          <span className="text-[10px] font-bold text-purple-700">{dIdx + 1}</span>
                                                      </div>
                                                      <div className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-purple-200 transition-colors">
                                                          <div className="flex justify-between items-center">
                                                              <div>
                                                                  <span className="text-xs font-bold text-purple-600 uppercase mb-1 block">Destino</span>
                                                                  <div className="font-bold text-gray-900">{del.destinationCity}</div>
                                                                  <div className="text-sm text-gray-500">{del.recipientName}</div>
                                                              </div>
                                                              <div className="text-right">
                                                                  <span className="text-xs font-bold text-gray-400 uppercase mb-1 block">Documentos</span>
                                                                  <div className="flex gap-1 flex-wrap justify-end">
                                                                       {del.documents.map(doc => (
                                                                           <span key={doc.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                                                               {doc.type === 'CTe' ? `CT-e ${doc.number}` : `NF-e ${doc.number}`}
                                                                           </span>
                                                                       ))}
                                                                  </div>
                                                              </div>
                                                          </div>
                                                      </div>
                                                  </div>
                                              ))}

                                              {/* ADD DELIVERY BUTTON (CT-e / NF-e) */}
                                              {leg.type === 'LOAD' && !activeDeliveryForm && (
                                                <div className="pl-12">
                                                    <button 
                                                        onClick={() => setActiveDeliveryForm({ tripId: trip.id, legId: leg.id })}
                                                        className="flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-2 rounded-lg border border-dashed border-purple-200 transition-colors w-full"
                                                    >
                                                        <Plus size={14}/> Adicionar Entrega (CT-e / NF-e)
                                                    </button>
                                                </div>
                                              )}

                                              {/* INLINE ADD DELIVERY FORM (CT-e / NF-e) */}
                                              {activeDeliveryForm?.legId === leg.id && (
                                                  <div className="pl-12 animate-in fade-in slide-in-from-top-2">
                                                      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                                                          <div className="flex justify-between items-center mb-3">
                                                              <h4 className="text-xs font-bold uppercase text-purple-700">Selecione grupo (CT-e / NF-e)</h4>
                                                              <button onClick={() => { setActiveDeliveryForm(null); setSelectedControlNumber(null); }} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                                                          </div>

                                                          <div className="mb-3 relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                            <input 
                                                              autoFocus
                                                              type="text"
                                                              placeholder="Filtrar por CT-e, NF-e, Destinatário..."
                                                              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                                              value={filterText}
                                                              onChange={(e) => setFilterText(e.target.value)}
                                                            />
                                                          </div>

                                                          <div className="bg-white rounded border border-gray-200 overflow-hidden mb-4 max-h-48 overflow-y-auto">
                                                              {filteredGroups.length === 0 ? (
                                                                <div className="p-4 text-center text-sm text-gray-500">Nenhum grupo encontrado.</div>
                                                              ) : (
                                                                <table className="w-full text-left">
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {filteredGroups.map(key => {
                                                                            const docs = groupedAvailableDocs[key];
                                                                            const first = docs[0];
                                                                            const isSelected = selectedControlNumber === key;
                                                                            const label = key.startsWith('CTE:') ? key.replace('CTE:', 'CT-e ') : key.replace('NFE:', 'NF-e ');
                                                                            return (
                                                                                <tr 
                                                                                  key={key} 
                                                                                  className={`text-sm hover:bg-purple-50/50 cursor-pointer ${isSelected ? 'bg-purple-50' : ''}`}
                                                                                  onClick={() => setSelectedControlNumber(key)}
                                                                                >
                                                                                    <td className="px-3 py-2 w-8">
                                                                                        <input type="checkbox" checked={isSelected} readOnly className="rounded text-purple-600"/>
                                                                                    </td>
                                                                                    <td className="px-3 py-2 font-medium text-gray-900 tabular-nums">{label}</td>
                                                                                    <td className="px-3 py-2 text-gray-600 text-xs">{first.recipientName} - {first.destinationCity}</td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                              )}
                                                          </div>

                                                          <div className="flex justify-end gap-2">
                                                              <button onClick={() => { setActiveDeliveryForm(null); setSelectedControlNumber(null); }} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-white rounded border border-transparent hover:border-gray-200">Cancelar</button>
                                                              <button 
                                                                onClick={handleSaveDelivery}
                                                                disabled={!selectedControlNumber}
                                                                className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-bold"
                                                              >
                                                                Confirmar
                                                              </button>
                                                          </div>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                             );
                          })}

                          {/* ACTION BUTTONS: NEW LEG */}
                          {!activeLegForm ? (
                              <div className="flex gap-4 pt-2">
                                  <button 
                                    onClick={() => handleOpenLegForm(trip, 'LOAD')}
                                    className="flex-1 py-3 bg-white border border-dashed border-gray-300 rounded-xl text-gray-600 font-bold text-sm hover:border-gray-400 hover:text-gray-800 hover:shadow-sm transition-all flex items-center justify-center gap-2"
                                  >
                                      <Package size={18}/> Nova Carga
                                  </button>
                                  <button 
                                    onClick={() => handleOpenLegForm(trip, 'EMPTY')}
                                    className="flex-1 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500 font-bold text-sm hover:border-gray-400 hover:text-gray-700 hover:shadow-sm transition-all flex items-center justify-center gap-2"
                                  >
                                      <Route size={18}/> Novo Deslocamento
                                  </button>
                              </div>
                          ) : (
                              activeLegForm.tripId === trip.id && (
                                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-4">
                                      <div className="flex justify-between items-center mb-4">
                                          <h3 className="font-bold text-lg text-gray-900">
                                            {activeLegForm.type === 'LOAD' ? 'Adicionar Nova Carga' : 'Adicionar Deslocamento Vazio'}
                                          </h3>
                                          <button onClick={() => setActiveLegForm(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                          <div>
                                              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Origem (Automático)</label>
                                              <input disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-gray-600 font-medium text-sm" value={newLeg.originCity} />
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Endereço</label>
                                              <input disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-gray-600 font-medium text-sm" value={newLeg.originAddress} />
                                          </div>
                                          
                                          {activeLegForm.type === 'LOAD' && (
                                             <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Segmento</label>
                                                <div className="relative">
                                                  <select
                                                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-white"
                                                    value={newLeg.segment}
                                                    onChange={e => setNewLeg({...newLeg, segment: e.target.value})}
                                                  >
                                                    <option value="">Selecione...</option>
                                                    {SEGMENT_OPTIONS.map(opt => (
                                                      <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                  </select>
                                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                      <ChevronDown size={14}/>
                                                  </div>
                                                </div>
                                             </div>
                                          )}

                                          {activeLegForm.type === 'EMPTY' && (
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Destino (Obrigatório para Vazio)</label>
                                                <input 
                                                  autoFocus
                                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-400 outline-none text-sm" 
                                                  placeholder="Ex: Curitiba/PR"
                                                  value={newLeg.destinationCity}
                                                  onChange={e => setNewLeg({...newLeg, destinationCity: e.target.value})}
                                                />
                                            </div>
                                          )}
                                      </div>
                                      
                                      <div className="flex justify-end pt-2 border-t border-gray-100">
                                          <button onClick={handleSaveLeg} className="bg-gray-900 text-white px-6 py-2 rounded font-bold text-sm hover:bg-gray-800">
                                              Salvar {activeLegForm.type === 'LOAD' ? 'Carga' : 'Deslocamento'}
                                          </button>
                                      </div>
                                  </div>
                              )
                          )}
                       </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};