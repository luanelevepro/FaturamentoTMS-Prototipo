import React, { useState, useMemo } from 'react';
import { Trip, Leg, Delivery, Document, AvailableDocument } from '../types';
import { Eye, MapPin, MoreHorizontal, Plus, Search, Calendar, Filter, ChevronUp, ChevronDown, Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { TripDetails } from './TripDetails';

interface TripListProps {
  trips: Trip[];
  availableDocs: AvailableDocument[];
  onCreateNew: () => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
  // Handlers passed down to Details
  onAddLeg: (tripId: string, leg: Omit<Leg, 'id' | 'sequence' | 'deliveries'>) => void;
  onAddDelivery: (tripId: string, legId: string, selectedDocs: AvailableDocument[]) => void;
  onAddDocument: (tripId: string, legId: string, deliveryId: string, doc: Omit<Document, 'id'>) => void;
}

export const TripList: React.FC<TripListProps> = ({
  trips,
  availableDocs,
  onCreateNew,
  onEditTrip,
  onDeleteTrip,
  onAddLeg,
  onAddDelivery,
  onAddDocument
}) => {

  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const toggleExpand = (tripId: string) => {
    setExpandedTripId(prev => prev === tripId ? null : tripId);
  };

  const handleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => {
      // Try to parse IDs as numbers for correct sorting (so 10 comes after 2, not before)
      const numA = parseInt(a.id);
      const numB = parseInt(b.id);

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // Fallback for non-numeric IDs
      return sortDirection === 'asc'
        ? a.id.localeCompare(b.id, undefined, { numeric: true })
        : b.id.localeCompare(a.id, undefined, { numeric: true });
    });
  }, [trips, sortDirection]);

  const handleDeleteClick = (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta viagem?')) {
      onDeleteTrip(tripId);
    }
  };

  const handleEditClick = (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditTrip(trip);
  };

  // Helper to calculate total revenue (Sum of all CTes)
  const calculateTripRevenue = (trip: Trip) => {
    if (!trip.legs) return 0;
    return trip.legs.reduce((total, leg) => {
      return total + leg.deliveries.reduce((legTotal, delivery) => {
        return legTotal + delivery.documents
          .filter(doc => doc.type === 'CTe') // Only sum CTes
          .reduce((docTotal, doc) => docTotal + doc.value, 0);
      }, 0);
    }, 0);
  };

  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'In Transit': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Delayed': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen transition-all">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center text-xs text-gray-500 mb-2 gap-2">
          <span>Transporte</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-medium">Viagens Cargas</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Viagens e Cargas</h1>
        <p className="text-gray-500 text-sm">Registros de Viagens e Cargas</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-t-lg border border-b-0 border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por motorista, placa ou ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Calendar size={16} />
            Período
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter size={16} />
            Filtros
          </button>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            Cadastrar Viagem
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-b-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <th
                className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                onClick={handleSort}
                title="Clique para ordenar"
              >
                <div className="flex items-center gap-1">
                  ID Viagem
                  {sortDirection === 'asc' ? (
                    <ArrowUp size={14} className="text-gray-400 group-hover:text-blue-500" />
                  ) : (
                    <ArrowDown size={14} className="text-gray-400 group-hover:text-blue-500" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 font-medium">Cronograma</th>
              <th className="px-6 py-4 font-medium">Cavalo + Carretas</th>
              <th className="px-6 py-4 font-medium">Motorista</th>
              <th className="px-6 py-4 font-medium text-right">Receita Frete</th>
              <th className="px-6 py-4 font-medium text-right">Custo Viagem</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedTrips.map((trip) => {
              // Use scheduledDate if available, otherwise createdAt
              const dateToDisplay = trip.scheduledDate ? new Date(trip.scheduledDate + 'T00:00:00') : new Date(trip.createdAt);
              const isScheduled = !!trip.scheduledDate;
              const isExpanded = expandedTripId === trip.id;
              const isEditable = trip.status === 'Planned';
              const returnDate = trip.estimatedReturnDate ? new Date(trip.estimatedReturnDate + 'T00:00:00') : null;

              return (
                <React.Fragment key={trip.id}>
                  <tr
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`}
                    onClick={() => toggleExpand(trip.id)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      #{trip.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5" title="Data de Saída">
                          <span className={`w-1.5 h-1.5 rounded-full ${isScheduled ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                          <span className={isScheduled ? "font-semibold text-gray-700" : ""}>
                            {dateToDisplay.toLocaleDateString()}
                          </span>
                        </div>
                        {returnDate && (
                          <div className="flex items-center gap-1.5" title="Previsão de Retorno">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                            <span className="text-xs text-gray-500">
                              Até {returnDate.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {!returnDate && !isScheduled && (
                          <span className="text-xs text-gray-400 pl-3">
                            {dateToDisplay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span className="font-bold">{trip.truckPlate}</span>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {trip.trailer1Plate && <span className="text-gray-500 text-xs flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-gray-400"></span> {trip.trailer1Plate}</span>}
                          {trip.trailer2Plate && <span className="text-gray-500 text-xs flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-gray-400"></span> {trip.trailer2Plate}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {trip.driverName}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-700 text-right font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTripRevenue(trip))}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 text-right font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.freightValue)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {trip.status === 'In Transit' ? 'Em Trânsito' : trip.status === 'Completed' ? 'Entregue' : trip.status === 'Delayed' ? 'Atrasado' : 'Planejado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggleExpand(trip.id)}
                          className={`p-1.5 border rounded transition-colors ${isExpanded ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white border-gray-200 text-gray-400 hover:text-blue-600'}`}
                          title="Visualizar Detalhes"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                        </button>

                        <button
                          onClick={(e) => handleEditClick(trip, e)}
                          className={`p-1.5 border rounded transition-colors bg-white border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300`}
                          title="Editar Viagem (Datas e Recursos)"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={(e) => handleDeleteClick(trip.id, e)}
                          disabled={!isEditable}
                          className={`p-1.5 border rounded transition-colors ${isEditable ? 'bg-white border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300' : 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'}`}
                          title={isEditable ? "Excluir Viagem" : "Viagem já iniciada, não é possível excluir."}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Details Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} className="p-0 border-b border-gray-200">
                        <TripDetails
                          trip={trip}
                          availableDocs={availableDocs}
                          isInline={true}
                          onBack={() => toggleExpand(trip.id)}
                          onAddLeg={onAddLeg}
                          onAddDelivery={onAddDelivery}
                          onAddDocument={onAddDocument}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>

        {trips.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            Nenhuma viagem cadastrada. Clique em "Cadastrar Viagem" para começar.
          </div>
        )}
      </div>
    </div>
  );
};
