import React, { useState, useMemo } from 'react';
import { Trip, Leg, Delivery, Document, AvailableDocument, Load } from '../types';
import { tripStatusLabelPt } from '@/modules/trips/ui/statusLabels';
import {
  ArrowLeft, MapPin, Plus, FileText,
  Trash2, Box, Truck, Calendar, Map as MapIcon, MoreVertical, X, Check, ChevronDown, ChevronUp, ChevronRight, ArrowRight, Info, Search, Route, Tag, Link as LinkIcon, GripVertical, AlertCircle, CheckCircle
} from 'lucide-react';
import { LoadCardInTrip } from './LoadCardInTrip';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TripDetailsProps {
  trip: Trip;
  loads?: Load[]; // cargas agendadas (sem docs/controle) disponíveis para anexar à viagem
  availableDocs: AvailableDocument[];
  isInline?: boolean; // New prop for table expansion mode
  onBack: () => void;
  onAddLeg: (tripId: string, leg: Omit<Leg, 'id' | 'sequence' | 'deliveries'>) => void;
  onAddDelivery: (tripId: string, legId: string, selectedDocs: AvailableDocument[]) => void;
  onAddDocument: (tripId: string, legId: string, deliveryId: string, doc: Omit<Document, 'id'>) => void;
  onUpdateStatus: (tripId: string, status: Trip['status'], pod?: string) => void;
  onUpdateDeliveryStatus: (tripId: string, legId: string, deliveryId: string, status: Delivery['status'], pod?: string) => void;
  // Opcional: cria uma nova carga já com entregas/documentos (fluxo "plug-and-play" para backend oficial)
  onAddLoadWithDeliveries?: (tripId: string, payload: NewLoadPayload) => void;
  // Opcional: anexar cargas agendadas à viagem
  onAttachLoadsToTrip?: (tripId: string, payload: { loadIds: string[]; vehicleTypeReq: string }) => void;
  onReorderDeliveries?: (tripId: string, legId: string, newOrder: Delivery[]) => void;
  onEmitFiscal?: (loadId: string) => void;
}

type NewLoadPayload = {
  originCity: string;
  originAddress: string;
  vehicleTypeReq: string;
  controlGroups: { controlNumber: string; docs: AvailableDocument[] }[];
};

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

// --- Componente de Entrega Sortable ---
const SortableDeliveryItem = ({
  delivery: del,
  index,
  tripId,
  legId,
  expandedDeliveryId,
  toggleDelivery,
  onUpdateDeliveryStatus,
  setShowDocForm,
  showDocForm,
  newDoc,
  setNewDoc,
  handleSaveDoc,
  tripStatus
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: del.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  const buildCteHierarchy = (docs: any[]) => {
    const normalizeNum = (type: Document['type'], n: string) => {
      const s = String(n || '').trim();
      if (!s) return s;
      // limpeza visual (não altera dados persistidos)
      if (type === 'CTe') return s.replace(/^CTe[-\s]*/i, '').replace(/^CT-?e[-\s]*/i, '');
      return s.replace(/^NF[-\s]*/i, '');
    };

    const safeDocs: Document[] = Array.isArray(docs)
      ? docs.filter(Boolean).filter((d: any) => d && typeof d === 'object' && typeof d.type === 'string' && typeof d.number === 'string')
      : [];

    const toStringArray = (v: any): string[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v.map(String).filter(Boolean);
      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return [];
        // tenta JSON array primeiro
        if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
          try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
          } catch {
            // ignore
          }
        }
        return [];
      }
      return [];
    };

    const cteDocs = safeDocs.filter(d => d.type === 'CTe');
    const nfDocs = safeDocs.filter(d => d.type !== 'CTe');

    // Mapa CT-e -> referências (chaves) e NF-e vinculadas
    const groups = cteDocs
      .map(cte => ({
        cteNumber: normalizeNum('CTe', cte.number),
        cteDoc: cte,
        referencedKeys: new Set<string>(toStringArray((cte as any).relatedDfeKeys).filter(Boolean)),
        dfes: [] as Document[],
        missingReferencedKeys: [] as string[]
      }))
      .sort((a, b) => a.cteNumber.localeCompare(b.cteNumber));

    const groupsByNumber = new Map(groups.map(g => [g.cteNumber, g]));

    // Index rápido: chave -> CT-e (se referenciado)
    const keyToCte = new Map<string, string[]>();
    for (const g of groups) {
      for (const k of g.referencedKeys) {
        if (!keyToCte.has(k)) keyToCte.set(k, []);
        keyToCte.get(k)!.push(g.cteNumber);
      }
    }

    const unlinkedNfs: Document[] = [];

    for (const nf of nfDocs) {
      // 1) vínculo explícito via linkedCteNumber (preferencial)
      const linked = nf.linkedCteNumber ? normalizeNum('CTe', nf.linkedCteNumber) : null;
      if (linked && groupsByNumber.has(linked)) {
        groupsByNumber.get(linked)!.dfes.push(nf);
        continue;
      }

      // 2) vínculo via referência (dfeKey ∈ relatedDfeKeys do CT-e)
      const key = nf.dfeKey ? String(nf.dfeKey) : null;
      if (key && keyToCte.has(key)) {
        const ctes = keyToCte.get(key)!;
        const first = ctes[0];
        if (groupsByNumber.has(first)) {
          groupsByNumber.get(first)!.dfes.push(nf);
          continue;
        }
      }

      // 3) sem vínculo fiscal claro
      unlinkedNfs.push(nf);
    }

    // Ordenações e “missing refs”
    for (const g of groups) {
      g.dfes.sort((a, b) => String(a.number).localeCompare(String(b.number)));
      const presentKeys = new Set(g.dfes.map(d => d.dfeKey).filter(Boolean) as string[]);
      g.missingReferencedKeys = Array.from(g.referencedKeys).filter(k => !presentKeys.has(k));
    }

    const nfTotal = nfDocs.length;
    const nfLinked = groups.reduce((acc, g) => acc + g.dfes.length, 0);
    const nfUnlinked = unlinkedNfs.length;

    return {
      groups,
      unlinkedNfs: unlinkedNfs.sort((a, b) => String(a.number).localeCompare(String(b.number))),
      counts: { cte: groups.length, nfTotal, nfLinked, nfUnlinked }
    };
  };

  const deliveryDocs: Document[] = Array.isArray(del.documents) ? del.documents : [];
  const { groups, unlinkedNfs, counts } = buildCteHierarchy(deliveryDocs);
  const cteCount = counts.cte;

  return (
    <div ref={setNodeRef} style={style} className="relative flex flex-col md:flex-row items-start gap-4 group mb-4">
      {/* Number & Handle */}
      <div className="flex flex-col items-center gap-2 mt-1">
        <div {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-600 touch-none">
          <GripVertical size={16} />
        </div>
        <div className="relative z-10 w-6 h-6 rounded-full bg-purple-100 border-2 border-white shadow-sm ring-1 ring-purple-200 flex items-center justify-center font-black text-[10px] text-purple-700">
          {index + 1}
        </div>
        <div className="w-0.5 bg-gray-100 h-full min-h-[40px] rounded-full"></div>
      </div>

      {/* Card */}
      <div className="flex-1 w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
        {/* Header */}
        <div
          className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer"
          onClick={(e) => toggleDelivery(del.id, e)}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Entrega {index + 1}</span>
              {del.status === 'Delivered' && (
                <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase flex items-center gap-1">
                  <Check size={10} strokeWidth={4} /> Entregue
                </span>
              )}
            </div>
            <div className="text-lg font-black text-gray-900 leading-tight">{del.destinationCity}</div>
            <div className="text-sm font-medium text-gray-500 mt-0.5">{del.recipientName}</div>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Documentos</div>
              <div className="text-xs font-black text-gray-800 flex items-center justify-end gap-2">
                {cteCount > 0 && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">CT-e: {counts.cte}</span>}
                <span>DF-e: {counts.nfTotal}</span>
                {counts.nfUnlinked > 0 && <span className="bg-orange-50 text-orange-800 px-1.5 py-0.5 rounded border border-orange-100">Pendentes: {counts.nfUnlinked}</span>}
              </div>
            </div>
            <div className={`p-1 rounded-full transition-transform duration-300 ${expandedDeliveryId === del.id ? 'rotate-180 bg-gray-100' : ''}`}>
              <ChevronDown size={20} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {expandedDeliveryId === del.id && (
          <div className="animate-in slide-in-from-top-2 border-t border-gray-100 bg-gray-50/30">
            <div className="p-5 space-y-3">
              {groups.length === 0 && unlinkedNfs.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-xs italic">Nenhum documento vinculado.</div>
              ) : (
                <>
                  {groups.map(g => (
                    <div key={g.cteNumber} className="bg-white border border-blue-100 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-2 border-b border-gray-50 pb-2">
                        <LinkIcon size={12} className="text-blue-500" />
                        <span className="text-xs font-black text-blue-700">
                          CT-e {g.cteNumber}
                        </span>
                        {(g.cteDoc as any)?.isSubcontracted && (
                          <span className="text-[9px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded uppercase ml-2">
                            Subcontratado
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {g.dfes.map(d => (
                          <div key={d.id} className="px-2 py-1 bg-gray-50 rounded border border-gray-100 text-[10px] font-bold text-gray-600 flex items-center gap-1">
                            <FileText size={10} className="text-gray-400" /> {String(d.number).replace(/^NF[-\s]*/i, '')}
                          </div>
                        ))}
                        {g.dfes.length === 0 && (
                          <span className="text-[10px] text-gray-400 italic">
                            Sem DF-es vinculadas nesta entrega.
                          </span>
                        )}
                      </div>
                      {g.missingReferencedKeys.length > 0 && (
                        <div className="mt-2 text-[10px] text-gray-500">
                          Referenciadas no CT-e e não encontradas aqui: <span className="font-bold">{g.missingReferencedKeys.length}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {unlinkedNfs.length > 0 && (
                    <div className="bg-white border border-orange-100 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-2 border-b border-gray-50 pb-2">
                        <AlertCircle size={12} className="text-orange-500" />
                        <span className="text-xs font-black text-orange-700">DF-es sem vínculo fiscal com CT-e</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {unlinkedNfs.map(d => (
                          <div key={d.id} className="px-2 py-1 bg-orange-50 rounded border border-orange-100 text-[10px] font-bold text-orange-800 flex items-center gap-1">
                            <FileText size={10} /> {String(d.number).replace(/^NF[-\s]*/i, '')}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-[10px] text-orange-700">
                        Isto significa: existe CT-e na carga, mas estas DF-es não estão referenciadas (via chave/`linkedCteNumber`) — precisam de vínculo claro.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-5 py-3 bg-white border-t border-gray-100 flex justify-between items-center">
              <div className="font-bold text-xs text-gray-900">
                Total: {deliveryDocs.reduce((acc: number, d: any) => acc + (Number(d.value) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="flex gap-2">
                {del.status !== 'Delivered' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const pod = prompt("Upload de Canhoto (Simulação):", `pod_${del.id}.pdf`);
                      if (pod) onUpdateDeliveryStatus(tripId, legId, del.id, 'Delivered', pod);
                    }}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <Check size={12} strokeWidth={3} /> Finalizar
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDocForm(del.id); }}
                  className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Plus size={12} /> Gerenciar
                </button>
              </div>
            </div>

            {showDocForm === del.id && (
              <div className="p-4 bg-blue-50 border-t border-blue-100">
                <div className="flex gap-2">
                  <input autoFocus className="text-xs border p-1 rounded w-32" placeholder="Número Documento" value={newDoc.number} onChange={e => setNewDoc({ ...newDoc, number: e.target.value })} />
                  <input className="text-xs border p-1 rounded w-24" placeholder="Valor" type="number" value={newDoc.value} onChange={e => setNewDoc({ ...newDoc, value: e.target.value })} />
                  <button onClick={e => handleSaveDoc(e, legId, del.id)} className="text-xs bg-blue-600 text-white px-2 rounded font-bold">Salvar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const TripDetails: React.FC<TripDetailsProps> = ({
  trip,
  loads = [],
  availableDocs,
  isInline = false,
  onBack,
  onAddLeg,
  onAddDelivery,
  onAddDocument,
  onUpdateStatus,
  onUpdateDeliveryStatus,
  onAddLoadWithDeliveries,
  onAttachLoadsToTrip,
  onReorderDeliveries,
  onEmitFiscal
}) => {
  // Defensive: API/mock pode vir com campos incompletos; nunca derrubar a UI
  const safeLegs: Leg[] = Array.isArray((trip as any)?.legs) ? ((trip as any).legs as Leg[]) : [];
  const safeDeliveries = (leg: any): Delivery[] => Array.isArray(leg?.deliveries) ? leg.deliveries : [];

  // UI State for Forms
  const [activeLegForm, setActiveLegForm] = useState<'LOAD' | 'EMPTY' | null>(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState<string | null>(null); // Stores the Leg ID
  const [showDocForm, setShowDocForm] = useState<string | null>(null); // Delivery ID
  const [filterText, setFilterText] = useState('');

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent, legId: string, deliveries: Delivery[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = deliveries.findIndex((d) => d.id === active.id);
    const newIndex = deliveries.findIndex((d) => d.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(deliveries, oldIndex, newIndex);
      if (onReorderDeliveries) {
        onReorderDeliveries(trip.id, legId, newOrder);
      }
    }
  };

  // State for collapsible sections
  const [collapsedLegs, setCollapsedLegs] = useState<Record<string, boolean>>({});
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  // Form Data State
  const [newLeg, setNewLeg] = useState({ originCity: '', originAddress: '', hubName: '', destinationCity: '', vehicleTypeReq: '' });
  const [newDoc, setNewDoc] = useState({ number: '', type: 'NF' as const, value: '' });

  // Selection State - NOW BASED ON CONTROL NUMBERS (strings)
  const [selectedControlNumber, setSelectedControlNumber] = useState<string | null>(null);

  // Wizard: Nova Carga (dentro da viagem) com seleção de documentos
  const [showNewLoadWizard, setShowNewLoadWizard] = useState(false);
  const [newLoadTab, setNewLoadTab] = useState<'CARGAS' | 'DOCUMENTOS'>('CARGAS');
  const [loadSearch, setLoadSearch] = useState('');
  const [selectedLoadIds, setSelectedLoadIds] = useState<Record<string, boolean>>({});
  const [newLoadSelectedControls, setNewLoadSelectedControls] = useState<Record<string, boolean>>({});
  const [newLoadVehicleType, setNewLoadVehicleType] = useState('');
  const [newLoadLinkDocsNow, setNewLoadLinkDocsNow] = useState(true);

  // --- Logic for Control Number Selection ---

  // Group Available Docs by Control Number
  const groupedAvailableDocs = useMemo(() => {
    const groups: Record<string, AvailableDocument[]> = {};

    const toKey = (doc: AvailableDocument) => {
      if (doc.type === 'CTe') return `CTE:${doc.number}`;
      if (doc.linkedCteNumber) return `CTE:${doc.linkedCteNumber}`;
      // Sem control_number nesta fase: backlog agrupa por DESTINO (regra fiscal: CT-e por destinatário/destino)
      // Obs.: ainda não temos CNPJ/CPF no modelo, então usamos destinatário + cidade como chave operacional.
      return `DEST:${doc.destinationCity}|${doc.recipientName}`;
    };

    availableDocs.forEach(doc => {
      const k = toKey(doc);
      if (!groups[k]) groups[k] = [];
      groups[k].push(doc);
    });

    Object.keys(groups).forEach(k => {
      groups[k] = groups[k].sort((a, b) => {
        if (a.type === b.type) return a.number.localeCompare(b.number);
        return a.type === 'CTe' ? -1 : 1;
      });
    });

    return groups;
  }, [availableDocs]);

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    const keys = Object.keys(groupedAvailableDocs);
    if (!filterText) return keys;

    return keys.filter(key => {
      const docs = groupedAvailableDocs[key];
      const lowerFilter = filterText.toLowerCase();

      if (key.toLowerCase().includes(lowerFilter)) return true;

      return docs.some(d =>
        d.recipientName.toLowerCase().includes(lowerFilter) ||
        d.destinationCity.toLowerCase().includes(lowerFilter) ||
        d.number.toLowerCase().includes(lowerFilter)
      );
    });
  }, [groupedAvailableDocs, filterText]);

  const handleConfirmControlNumber = (legId: string) => {
    if (!selectedControlNumber) return;
    const selectedDocs = groupedAvailableDocs[selectedControlNumber];
    if (selectedDocs) {
      onAddDelivery(trip.id, legId, selectedDocs);
    }
    setShowDeliveryForm(null);
    setSelectedControlNumber(null);
    setFilterText('');
  };

  const getDefaultOriginForNextLeg = () => {
    let defaultOriginCity = '';
    let defaultOriginAddress = '';

    if (safeLegs.length === 0) {
      defaultOriginCity = trip.originCity || '';
      defaultOriginAddress = 'Pátio da Empresa / Matriz';
    } else {
      const lastLeg = safeLegs[safeLegs.length - 1];

      if (lastLeg.type === 'EMPTY') {
        defaultOriginCity = lastLeg.destinationCity || '';
        defaultOriginAddress = 'Ponto de Parada (Fim do Vazio)';
      } else {
        const lastDeliveries = safeDeliveries(lastLeg);
        if (lastDeliveries.length > 0) {
          const lastDelivery = lastDeliveries[lastDeliveries.length - 1];
          defaultOriginCity = lastDelivery.destinationCity;
          defaultOriginAddress = lastDelivery.destinationAddress;
        } else {
          defaultOriginCity = lastLeg.originCity;
          defaultOriginAddress = lastLeg.originAddress;
        }
      }
    }

    return { originCity: defaultOriginCity, originAddress: defaultOriginAddress };
  };

  const openNewLoadWizard = () => {
    setShowNewLoadWizard(true);
    setNewLoadTab('CARGAS');
    setLoadSearch('');
    setSelectedLoadIds({});
    setNewLoadSelectedControls({});
    setNewLoadVehicleType('');
    setFilterText('');
    setNewLoadLinkDocsNow(true);
  };

  const isContraNeeded = (doc: AvailableDocument) => {
    if (doc.type === 'NF') return !doc.linkedCteNumber;
    if (doc.type === 'CTe') return !!doc.isSubcontracted;
    return false;
  };

  const handleConfirmNewLoad = () => {
    if (newLoadTab === 'DOCUMENTOS') {
      if (!newLoadVehicleType) {
        alert('Selecione o tipo de carroceria para a carga.');
        return;
      }
    } else {
      const loadIds = Object.keys(selectedLoadIds).filter(id => selectedLoadIds[id]);
      if (loadIds.length === 0) {
        alert('Selecione ao menos uma carga para anexar.');
        return;
      }
    }

    let controlGroups: any[] = [];
    if (newLoadTab === 'DOCUMENTOS') {
      const keys = Object.keys(newLoadSelectedControls).filter(k => newLoadSelectedControls[k]);
      if (keys.length === 0 && newLoadLinkDocsNow) {
        alert('Selecione ao menos um grupo de documentos ou desmarque "Vincular documentos agora".');
        return;
      }
      controlGroups = keys.map(key => ({
        controlNumber: key.startsWith('CTE:') ? key.split(':')[1] : (key.startsWith('DEST:') ? key.split(':')[1] : key),
        docs: groupedAvailableDocs[key] || []
      }));
    }

    const { originCity, originAddress } = getDefaultOriginForNextLeg();

    if (newLoadTab === 'CARGAS' && onAttachLoadsToTrip) {
      const loadIds = Object.keys(selectedLoadIds).filter(id => selectedLoadIds[id]);
      onAttachLoadsToTrip(trip.id, {
        loadIds,
        vehicleTypeReq: newLoadVehicleType || ''
      });
    } else if (onAddLoadWithDeliveries && controlGroups.length > 0) {
      onAddLoadWithDeliveries(trip.id, {
        originCity,
        originAddress,
        vehicleTypeReq: newLoadVehicleType,
        controlGroups
      });
    } else {
      onAddLeg(trip.id, {
        originCity,
        originAddress,
        type: 'LOAD',
        vehicleTypeReq: newLoadVehicleType
      });
    }

    setShowNewLoadWizard(false);
    setNewLoadSelectedControls({});
    setNewLoadVehicleType('');
    setNewLoadLinkDocsNow(true);
    setSelectedLoadIds({});
  };

  const toggleLeg = (legId: string) => {
    setCollapsedLegs(prev => ({ ...prev, [legId]: !prev[legId] }));
  };

  const toggleDelivery = (deliveryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDeliveryId(prev => prev === deliveryId ? null : deliveryId);
  };

  const handleOpenLegForm = (type: 'LOAD' | 'EMPTY') => {
    let defaultOriginCity = '';
    let defaultOriginAddress = '';

    if (safeLegs.length === 0) {
      defaultOriginCity = trip.originCity || '';
      defaultOriginAddress = 'Pátio da Empresa / Matriz';
    } else {
      const lastLeg = safeLegs[safeLegs.length - 1];

      if (lastLeg.type === 'EMPTY') {
        defaultOriginCity = lastLeg.destinationCity || '';
        defaultOriginAddress = 'Ponto de Parada (Fim do Vazio)';
      } else {
        const lastDeliveries = safeDeliveries(lastLeg);
        if (lastDeliveries.length > 0) {
          const lastDelivery = lastDeliveries[lastDeliveries.length - 1];
          defaultOriginCity = lastDelivery.destinationCity;
          defaultOriginAddress = lastDelivery.destinationAddress;
        } else {
          defaultOriginCity = lastLeg.originCity;
          defaultOriginAddress = lastLeg.originAddress;
        }
      }
    }

    setNewLeg({
      originCity: defaultOriginCity,
      originAddress: defaultOriginAddress,
      hubName: '',
      destinationCity: '',
      vehicleTypeReq: ''
    });
    setActiveLegForm(type);
  };

  const handleSaveLeg = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLeg.originCity) {
      alert("A cidade de origem é obrigatória. Por favor, preencha.");
      return;
    }

    const legType = activeLegForm || 'LOAD';

    if (legType === 'EMPTY' && !newLeg.destinationCity) {
      alert("Para deslocamentos vazios, a cidade destino é obrigatória.");
      return;
    }

    onAddLeg(trip.id, {
      originCity: newLeg.originCity,
      originAddress: newLeg.originAddress,
      hubName: newLeg.hubName,
      destinationCity: legType === 'EMPTY' ? newLeg.destinationCity : undefined,
      type: legType,
      vehicleTypeReq: legType === 'LOAD' ? newLeg.vehicleTypeReq : undefined
    });

    setActiveLegForm(null);
    setNewLeg({ originCity: '', originAddress: '', hubName: '', destinationCity: '', vehicleTypeReq: '' });
  };

  const handleSaveDoc = (e: React.FormEvent, legId: string, deliveryId: string) => {
    e.preventDefault();
    if (!newDoc.number) return;
    onAddDocument(trip.id, legId, deliveryId, {
      number: newDoc.number,
      type: 'NF',
      controlNumber: undefined,
      value: Number(newDoc.value) || 0
    });
    setShowDocForm(null);
    setNewDoc({ number: '', type: 'NF', value: '' });
  };

  const totalRevenue = safeLegs.reduce((acc, leg) => {
    const deliveries = safeDeliveries(leg);
    return acc + deliveries.reduce((dAcc, del) => {
      const docs = Array.isArray((del as any)?.documents) ? (del as any).documents : [];
      return dAcc + docs.reduce((docAcc: number, doc: any) => docAcc + (Number(doc?.value) || 0), 0);
    }, 0);
  }, 0);

  // Helpers for numbering
  let loadCount = 0;

  // Determine wrapper classes based on isInline
  const wrapperClasses = isInline
    ? "p-6 bg-gray-50 border-t border-gray-200 shadow-inner"
    : "p-6 bg-gray-50 min-h-screen ml-0 md:ml-64";

  return (
    <div className={wrapperClasses}>
      <div className={isInline ? "" : "max-w-7xl mx-auto space-y-8"}>

        {!isInline && (
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="flex items-center text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar para listagem
            </button>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${trip.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                {tripStatusLabelPt(trip.status)}
              </span>
            </div>
          </div>
        )}

        {/* Trip Overview Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-wrap justify-between items-center gap-6">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Data do Viagem</div>
            <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="text-orange-600">{new Date(trip.createdAt).toLocaleDateString()}</span>
              {trip.estimatedReturnDate && <span className="text-gray-400">Até {new Date(trip.estimatedReturnDate).toLocaleDateString()}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Protocolo</div>
            <div className="text-sm font-bold text-gray-900 uppercase">MND-{trip.id}</div>
            <div className="text-[10px] text-gray-500 font-medium">+ {trip.trailer1Plate || '---'}</div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Motorista</div>
            <div className="text-sm font-bold text-gray-900">{trip.driverName}</div>
          </div>

          <div className="flex flex-col gap-1 text-right">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Frete Total</div>
            <div className="text-sm font-bold text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.freightValue)}</div>
          </div>

          <div className="flex flex-col gap-1 text-right">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Lucro Estimado</div>
            <div className="text-sm font-bold text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue * 0.3)}</div>
          </div>

          <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-blue-200 transition-colors">
            {tripStatusLabelPt(trip.status)}
          </button>
        </div>

        {/* Fiscal Summary (MDF-es da Viagem) */}
        {trip.mdfes && trip.mdfes.length > 0 && (
          <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-6 mb-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                <FileText size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 opacity-80 mb-1">Manifestos Autorizados (MDF-e)</div>
                <div className="flex flex-wrap gap-2">
                  {trip.mdfes.map(m => (
                    <span key={m.id} className="text-xs font-black uppercase bg-white text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm flex items-center gap-1.5">
                      <CheckCircle size={10} /> Nº {m.number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button className="bg-white border-2 border-emerald-200 text-emerald-700 px-6 py-3 rounded-xl text-xs font-black shadow-sm transition-all uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 hover:border-emerald-300">
              <Check size={16} strokeWidth={3} /> Imprimir DAMDFEs
            </button>
          </div>
        )}

        {/* --- CARGAS & DESLOCAMENTOS (Visual Timeline) --- */}
        <div className="space-y-6">
          {safeLegs.length === 0 && !activeLegForm && (
            <div className="p-16 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <p className="text-gray-400 font-medium mb-3">O roteiro desta viagem está vazio.</p>
              <button onClick={() => handleOpenLegForm('LOAD')} className="text-blue-600 font-bold hover:underline">Adicione a primeira carga</button>
            </div>
          )}

          {safeLegs.map((leg, legIndex) => {
            const isLoad = leg.type === 'LOAD';
            const cardBorderClass = isLoad ? 'border-gray-200' : 'border-gray-200 bg-gray-50/50';

            if (!isLoad) loadCount; // Don't increment for empty
            else loadCount++;

            const currentLoadNum = loadCount;

            return (
              <div key={leg.id} className={`bg-white rounded-2xl shadow-sm border ${cardBorderClass} overflow-hidden p-6 relative`}>

                {/* Header Badge */}
                <div className="flex items-center gap-3 mb-8">
                  {isLoad ? (
                    <>
                      <span className="bg-black text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-lg">
                        Carga #{currentLoadNum}
                      </span>
                      {leg.direction && (
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${leg.direction === 'Ida'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>
                          {leg.direction}
                        </span>
                      )}
                      {leg.segment && (
                        <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-gray-200 flex items-center gap-1.5">
                          <Tag size={10} /> {leg.segment}
                        </span>
                      )}
                      {leg.controlNumber && (
                        <span className="bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-gray-800 flex items-center gap-1.5 shadow-md">
                          <FileText size={10} /> OP: {leg.controlNumber}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="bg-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider">
                      Deslocamento Vazio
                    </span>
                  )}

                  <div className="ml-auto">
                    <button
                      onClick={() => toggleLeg(leg.id)}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {isLoad && (
                  <div className="mb-6">
                    {(() => {
                      const associatedLoad = loads.find(l => l.id === leg.loadId);
                      if (!associatedLoad) return null;
                      return (
                        <LoadCardInTrip
                          load={associatedLoad}
                          tripId={trip.id}
                          trip={trip}
                          onEmitFiscal={onEmitFiscal}
                        />
                      );
                    })()}
                  </div>
                )}

                {/* TIMELINE CONTAINER */}
                <div className="relative pl-4 md:pl-8 space-y-10">

                  {/* Vertical Line */}
                  <div className="absolute left-[27px] md:left-[43px] top-3 bottom-10 w-0.5 bg-gray-100"></div>

                  {/* --- ORIGIN NODE --- */}
                  <div className="relative flex items-start gap-6">
                    {/* Dot */}
                    <div className="relative z-10 w-6 h-6 rounded-full bg-blue-100 border-4 border-white shadow-sm ring-1 ring-blue-500 flex items-center justify-center shrink-0 mt-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>

                    <div className="flex-1 p-4 rounded-xl border border-blue-50 bg-blue-50/20 hover:border-blue-100 transition-colors">
                      <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Origem</div>
                      <div className="text-lg font-black text-gray-900 leading-tight">{leg.originCity}</div>
                      <div className="text-sm font-medium text-gray-500 mt-0.5">{leg.originAddress}</div>
                    </div>
                  </div>

                  {/* --- DESTINATION / DELIVERIES NODES --- */}
                  {isLoad ? (
                    <>
                      {safeDeliveries(leg).length === 0 ? (
                        <div className="relative flex items-start gap-6 opacity-50">
                          <div className="relative z-10 w-6 h-6 rounded-full bg-gray-100 border-4 border-white shadow-sm ring-1 ring-gray-300 flex items-center justify-center shrink-0 mt-1"></div>
                          <div className="flex-1 italic text-gray-400 text-sm pt-1">Nenhuma entrega definida...</div>
                        </div>
                      ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, leg.id, safeDeliveries(leg))}>
                          <SortableContext items={safeDeliveries(leg).map(d => d.id)} strategy={verticalListSortingStrategy}>
                            {safeDeliveries(leg).map((del, dIdx) => (
                              <SortableDeliveryItem
                                key={del.id}
                                delivery={del}
                                index={dIdx}
                                tripId={trip.id}
                                legId={leg.id}
                                expandedDeliveryId={expandedDeliveryId}
                                toggleDelivery={toggleDelivery}
                                onUpdateDeliveryStatus={onUpdateDeliveryStatus}
                                setShowDocForm={setShowDocForm}
                                showDocForm={showDocForm}
                                newDoc={newDoc}
                                setNewDoc={setNewDoc}
                                handleSaveDoc={handleSaveDoc}
                                tripStatus={trip.status}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      )}

                      {/* Add Load (Leg) Button (Dashed) */}
                      <div className="relative pl-0">
                        {safeDeliveries(leg).length > 0 ? (
                          <button
                            disabled={trip.status === 'Completed'}
                            onClick={() => openNewLoadWizard()}
                            className="w-full py-3 border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-500 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all group"
                            title="Regra fiscal: múltiplos destinos exigem CT-es distintos. Crie uma nova Carga (Leg) para outro destino."
                          >
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Plus size={12} className="text-gray-700" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">Adicionar nova Carga (outro destino)</span>
                          </button>
                        ) : (
                          <button
                            disabled={trip.status === 'Completed'}
                            onClick={() => setShowDeliveryForm(leg.id)}
                            className="w-full py-3 border-2 border-dashed border-purple-200/60 bg-purple-50/30 text-purple-400 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all group"
                          >
                            <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Plus size={12} className="text-purple-600" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">Vincular documentos (CT-e / destino)</span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    /* EMPTY LEG DESTINATION */
                    <div className="relative flex items-start gap-6">
                      <div className="relative z-10 w-6 h-6 rounded-full bg-gray-100 border-4 border-white shadow-sm ring-1 ring-gray-300 flex items-center justify-center shrink-0 mt-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                      <div className="flex-1 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destino (Deslocamento)</div>
                        <div className="text-lg font-black text-gray-700 leading-tight">{leg.destinationCity}</div>
                        <div className="text-xs italic text-gray-400 mt-1">Trajeto sem carga comercial</div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>

        {/* --- ACTION BUTTONS FOR NEW LEG --- */}
        {
          !activeLegForm ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <button
                disabled={trip.status === 'Completed'}
                onClick={openNewLoadWizard}
                className="py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 hover:shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
              >
                <Plus size={16} /> Nova Carga
              </button>
              <button
                onClick={() => handleOpenLegForm('EMPTY')}
                disabled={trip.status === 'Completed'}
                className="py-4 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold hover:border-gray-300 hover:text-gray-700 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
              >
                <Route size={16} /> Deslocamento Vazio
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in fade-in slide-in-from-bottom-4 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-900">
                  {activeLegForm === 'LOAD' ? 'Nova Carga' : 'Novo Deslocamento Vazio'}
                </h3>
                <button onClick={() => setActiveLegForm(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Origin Fields (Common) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cidade Origem</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={newLeg.originCity}
                    onChange={e => setNewLeg({ ...newLeg, originCity: e.target.value })}
                    placeholder="Digite a cidade de origem..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Endereço Origem</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={newLeg.originAddress}
                    onChange={e => setNewLeg({ ...newLeg, originAddress: e.target.value })}
                    placeholder="Endereço ou referência..."
                  />
                </div>

                {/* Tipo de carroceria (Only for Load) */}
                {activeLegForm === 'LOAD' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Carroceria</label>
                    <div className="relative">
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white appearance-none"
                        value={newLeg.vehicleTypeReq}
                        onChange={e => setNewLeg({ ...newLeg, vehicleTypeReq: e.target.value })}
                      >
                        <option value="">Selecione o Tipo...</option>
                        {BODY_TYPE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty Leg Specific (Destination Required) */}
                {activeLegForm === 'EMPTY' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Cidade Destino (Vazio)</label>
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Ex: Curitiba/PR"
                        value={newLeg.destinationCity}
                        onChange={e => setNewLeg({ ...newLeg, destinationCity: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Para trajetos vazios, o destino deve ser informado manualmente.</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={handleSaveLeg}
                  className="px-6 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 font-medium text-sm"
                >
                  {activeLegForm === 'LOAD' ? 'Criar Carga' : 'Criar Deslocamento'}
                </button>
              </div>
            </div>
          )
        }

        {/* NEW LOAD WIZARD (seleção de docs para montar carga dentro da viagem) */}
        {
          showNewLoadWizard && (
            <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Nova Carga (dentro da viagem)</h3>
                    <p className="text-xs text-gray-500 mt-1">Selecione como deseja adicionar: por cargas agendadas ou por documentos.</p>
                  </div>
                  <button
                    onClick={() => setShowNewLoadWizard(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
                  {/* Tabs */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewLoadTab('CARGAS')}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border ${newLoadTab === 'CARGAS' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'
                        }`}
                    >
                      Cargas
                    </button>
                    <button
                      onClick={() => setNewLoadTab('DOCUMENTOS')}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border ${newLoadTab === 'DOCUMENTOS' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'
                        }`}
                    >
                      Documentos
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {newLoadTab === 'CARGAS' ? (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Buscar carga por cliente/origem/data..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                          value={loadSearch}
                          onChange={e => setLoadSearch(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Filtrar por CT-e / NF-e / Destinatário..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                          value={filterText}
                          onChange={e => setFilterText(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="relative">
                      <select
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm font-bold"
                        value={newLoadVehicleType}
                        onChange={e => setNewLoadVehicleType(e.target.value)}
                      >
                        <option value="">Selecione o tipo de carroceria...</option>
                        {BODY_TYPE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>

                  {newLoadTab === 'DOCUMENTOS' && (
                    <>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-600 select-none">
                        <input
                          type="checkbox"
                          checked={newLoadLinkDocsNow}
                          onChange={e => setNewLoadLinkDocsNow(e.target.checked)}
                        />
                        Vincular documentos agora (CT-e/NF-e)
                      </label>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            const next: Record<string, boolean> = {};
                            filteredGroups.forEach(k => { next[k] = true; });
                            setNewLoadSelectedControls(next);
                          }}
                          disabled={!newLoadLinkDocsNow}
                          className="text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Selecionar todos (filtrados)
                        </button>
                        <button
                          onClick={() => setNewLoadSelectedControls({})}
                          disabled={!newLoadLinkDocsNow}
                          className="text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Limpar seleção
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {newLoadTab === 'CARGAS' ? (
                    (() => {
                      const q = loadSearch.toLowerCase().trim();
                      const filtered = loads
                        .filter(l => l.status !== 'Scheduled' || true)
                        .filter(l => {
                          if (!q) return true;
                          return (
                            l.clientName.toLowerCase().includes(q) ||
                            l.originCity.toLowerCase().includes(q) ||
                            (l.collectionDate || '').toLowerCase().includes(q)
                          );
                        })
                        .sort((a, b) => new Date(a.collectionDate).getTime() - new Date(b.collectionDate).getTime());

                      if (filtered.length === 0) {
                        return <div className="p-8 text-center text-gray-400 italic">Nenhuma carga encontrada.</div>;
                      }

                      return filtered.map(l => {
                        const isSelected = !!selectedLoadIds[l.id];
                        return (
                          <div
                            key={l.id}
                            onClick={() => setSelectedLoadIds(prev => ({ ...prev, [l.id]: !prev[l.id] }))}
                            className={`p-4 rounded-lg mb-2 border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-gray-400'
                              }`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                    }`}>
                                    {isSelected && <Check size={10} className="text-white" />}
                                  </span>
                                  <span className="font-black text-gray-900 text-sm uppercase tracking-widest">
                                    {l.clientName}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 ml-6 flex items-center gap-1">
                                  <MapPin size={10} /> {l.originCity}
                                </div>
                                <div className="text-xs text-gray-400 ml-6 mt-1">
                                  {new Date(l.collectionDate).toLocaleString('pt-BR')}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-black text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200 uppercase">
                                  {l.status === 'Scheduled' ? 'Agendada' : 'Pendente'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    filteredGroups.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 italic">Nenhum grupo encontrado.</div>
                    ) : (
                      filteredGroups.map(key => {
                        const docs = groupedAvailableDocs[key] || [];
                        const first = docs[0];
                        const isSelected = !!newLoadSelectedControls[key];

                        const totalWeight = docs.reduce((a, b) => a + (b.weight || 0), 0);
                        const totalValue = docs.reduce((a, b) => a + (b.value || 0), 0);
                        const nfCount = docs.filter(d => d.type === 'NF').length;
                        const cteCount = docs.filter(d => d.type === 'CTe').length;
                        const contraCount = docs.filter(isContraNeeded).length;

                        return (
                          <div
                            key={key}
                            onClick={() => {
                              if (!newLoadLinkDocsNow) return;
                              setNewLoadSelectedControls(prev => ({ ...prev, [key]: !prev[key] }));
                            }}
                            className={`p-4 rounded-lg mb-2 border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-gray-400'
                              }`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                    }`}>
                                    {isSelected && <Check size={10} className="text-white" />}
                                  </span>
                                  <span className="font-black text-gray-900 text-lg tabular-nums">
                                    {key.startsWith('CTE:')
                                      ? key.replace('CTE:', 'CT-e ')
                                      : key.startsWith('DEST:')
                                        ? key.replace('DEST:', '').split('|')[0]
                                        : key}
                                  </span>
                                  {contraCount > 0 && (
                                    <span className="text-[10px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded uppercase">
                                      Contra: {contraCount}
                                    </span>
                                  )}
                                </div>
                                {first && (
                                  <>
                                    <div className="text-sm text-gray-700 mt-1 ml-6 font-bold">{first.recipientName}</div>
                                    <div className="text-xs text-gray-500 ml-6 flex items-center gap-1 mt-0.5">
                                      <MapPin size={10} /> {first.destinationCity}
                                    </div>
                                  </>
                                )}
                                <div className="ml-6 mt-2 flex flex-wrap gap-2">
                                  <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-[10px] font-bold text-gray-700 uppercase">
                                    CT-e: {cteCount}
                                  </span>
                                  <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-[10px] font-bold text-gray-700 uppercase">
                                    NF-e: {nfCount}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-800">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                                </div>
                                <div className="text-xs text-gray-500">{totalWeight} kg • {docs.length} doc(s)</div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={() => setShowNewLoadWizard(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmNewLoad}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800"
                  >
                    Adicionar à viagem
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* DELIVERY SELECTION MODAL (CONTROL NUMBER) - REUSED FROM PREVIOUS */}
        {
          showDeliveryForm && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-800">Selecionar grupo (CT-e / NF-e)</h3>
                  <button onClick={() => { setShowDeliveryForm(null); setSelectedControlNumber(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>

                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Filtrar por CT-e, NF-e, Destinatário..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                      value={filterText}
                      onChange={e => setFilterText(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 px-1">
                    Regra fiscal: selecione o grupo abaixo por **CT-e** (quando existir) ou por **Destino** (para montar a Carga/Leg).
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {filteredGroups.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 italic">
                      Nenhum Nº Controle encontrado.
                    </div>
                  ) : (
                    filteredGroups.map(key => {
                      const docs = groupedAvailableDocs[key];
                      const count = docs.length;
                      const totalWeight = docs.reduce((a, b) => a + b.weight, 0);
                      const totalValue = docs.reduce((a, b) => a + b.value, 0);
                      const first = docs[0];

                      const isSelected = selectedControlNumber === key;

                      return (
                        <div
                          key={key}
                          onClick={() => setSelectedControlNumber(key)}
                          className={`p-4 rounded-lg mb-2 border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                  {isSelected && <Check size={10} className="text-white" />}
                                </span>
                                <span className="font-bold text-gray-900 text-lg tabular-nums">
                                  {key.startsWith('CTE:')
                                    ? key.replace('CTE:', 'CT-e ')
                                    : key.startsWith('DEST:')
                                      ? key.replace('DEST:', '').split('|')[0]
                                      : key}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1 ml-6">{first.recipientName}</div>
                              <div className="text-xs text-gray-400 ml-6 flex items-center gap-1 mt-0.5">
                                <MapPin size={10} /> {first.destinationCity}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-800">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                              </div>
                              <div className="text-xs text-gray-500">{totalWeight} kg • {count} NF(s)</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={() => { setShowDeliveryForm(null); setSelectedControlNumber(null); }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={!selectedControlNumber}
                    onClick={() => handleConfirmControlNumber(showDeliveryForm!)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar Vínculo
                  </button>
                </div>
              </div>
            </div>
          )
        }

      </div>
    </div>
  );
};
