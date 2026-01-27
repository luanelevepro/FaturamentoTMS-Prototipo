import React, { useState, useMemo } from 'react';
import { TripBoardV2 } from '@/components/TripBoardV2';
import { LoadBoard } from '@/components/LoadBoard';
import { NewTripWizard } from '@/components/NewTripWizard';
import { CreateLoadModal } from '@/components/CreateLoadModal';
import { ScheduleLoadModal } from '@/components/ScheduleLoadModal';
import { LoadDetailsModal } from '@/components/LoadDetailsModal';
import { LayoutGrid, Map, Search, SlidersHorizontal, Plus } from 'lucide-react';
import type { AvailableDocument, Delivery, Leg, Load, Trip, Vehicle } from '@/types';
import type { Client } from '../bootstrap';

export interface TripsAndLoadsScreenProps {
  // Dados
  trips: Trip[];
  loads: Load[];
  vehicles: Vehicle[];
  availableDocs: AvailableDocument[];
  clients: Client[];
  cities: string[];

  // Eventos/handlers
  onCreateNew: () => void;
  onCreateLoad: (loadData: Omit<Load, 'id' | 'status'>) => void;
  onScheduleLoad: (
    load: Load,
    vehicle: Vehicle,
    segment: string,
    customOrigin: string,
    controlNumber: string
  ) => void;
  onUpdateStatus: (tripId: string, status: Trip['status'], pod?: string) => void;
  onUpdateDeliveryStatus: (
    tripId: string,
    legId: string,
    deliveryId: string,
    status: Delivery['status'],
    pod?: string
  ) => void;
  onAddLeg: (tripId: string, leg: Omit<Leg, 'id' | 'sequence' | 'deliveries'>) => void;
  onAddDelivery: (tripId: string, legId: string, selectedDocs: AvailableDocument[]) => void;
  onAddDocument: (tripId: string, legId: string, deliveryId: string, doc: any) => void;
  onCreateTrip: (tripData: any) => void;
  onAddLoadWithDeliveries?: (tripId: string, payload: any) => void;
  onAttachLoadsToTrip?: (tripId: string, payload: { loadIds: string[]; vehicleTypeReq: string }) => void;
  onReorderDeliveries?: (tripId: string, legId: string, newOrder: Delivery[]) => void;
}

export function TripsAndLoadsScreen(props: TripsAndLoadsScreenProps) {
  const [viewMode, setViewMode] = useState<'TRIPS' | 'LOADS'>('TRIPS');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCreateLoadOpen, setIsCreateLoadOpen] = useState(false);
  const [schedulingLoad, setSchedulingLoad] = useState<Load | null>(null);
  const [viewingLoad, setViewingLoad] = useState<Load | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Derived state to identify active trips for context logic (wizard/blockers)
  const activeTrips = useMemo(() =>
    props.trips.filter(t => t.status === 'In Transit' || t.status === 'Picking Up'),
    [props.trips]);

  // Filter Data Logic
  const filteredLoads = useMemo(() => {
    if (!searchTerm) return props.loads;
    const lower = searchTerm.toLowerCase();
    return props.loads.filter(l =>
      l.clientName.toLowerCase().includes(lower) ||
      l.id.toLowerCase().includes(lower) ||
      l.originCity.toLowerCase().includes(lower) ||
      (l.destinationCity || '').toLowerCase().includes(lower)
    );
  }, [props.loads, searchTerm]);

  const filteredTrips = useMemo(() => {
    if (!searchTerm) return props.trips;
    const lower = searchTerm.toLowerCase();
    return props.trips.filter(t =>
      t.truckPlate.toLowerCase().includes(lower) ||
      t.driverName?.toLowerCase().includes(lower) ||
      t.id.toLowerCase().includes(lower)
    );
  }, [props.trips, searchTerm]);

  const handleCreateLoadWrapper = (loadData: any, vehicle: Vehicle | null) => {
    props.onCreateLoad(loadData);
    // Hack: If vehicle selected, try to schedule it. 
    // Since we don't have the new Load ID, we rely on the user to find it or we'd need backend refactor.
    // For this prototype, we'll just create the load.
    if (vehicle) {
      // We can't schedule without ID. In a real app we'd await the ID.
      alert(`Carga criada! Como este é um protótipo, por favor, localize a carga "${loadData.clientName}" e agende-a manualmente para o veículo ${vehicle.plate}.`);
    }
  };

  return (
    <div className="flex flex-col h-screen md:ml-64 transition-all bg-gray-50">

      {/* GLOBAL HEADER: Controls View Mode, Filters & Main Actions */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-20 relative shadow-sm">

        {/* Left: View Toggle */}
        <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 shadow-inner">
          <button
            onClick={() => setViewMode('TRIPS')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all
                  ${viewMode === 'TRIPS' ? 'bg-white text-black shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}
                `}
          >
            <Map size={14} /> Viagens
          </button>
          <button
            onClick={() => setViewMode('LOADS')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all
                  ${viewMode === 'LOADS' ? 'bg-white text-black shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}
                `}
          >
            <LayoutGrid size={14} /> Cargas
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-black transition-colors" size={18} />
          <input
            type="text"
            placeholder={viewMode === 'TRIPS' ? "Buscar viagem, placa, motorista..." : "Buscar carga, cliente, cidade..."}
            className="w-full bg-gray-50 border-2 border-transparent focus:border-gray-200 focus:bg-white rounded-2xl pl-12 pr-4 py-3 text-sm font-bold outline-none transition-all placeholder:font-medium placeholder:text-gray-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl transition-all border-2 ${showFilters ? 'bg-black text-white border-black' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900 border-transparent hover:border-gray-100'}`}
          >
            <SlidersHorizontal size={20} />
          </button>
          <div className="w-px h-8 bg-gray-200 mx-2"></div>

          {viewMode === 'TRIPS' ? (
            <>
              <button
                onClick={() => setIsCreateLoadOpen(true)}
                className="bg-white border-2 border-gray-100 hover:border-black text-gray-900 px-5 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest flex items-center gap-2"
              >
                <Plus size={16} strokeWidth={3} /> Nova Carga
              </button>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="bg-black text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all uppercase tracking-widest flex items-center gap-2"
              >
                <Plus size={16} strokeWidth={3} /> Nova Viagem
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCreateLoadOpen(true)}
              className="bg-black text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all uppercase tracking-widest flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={3} /> Nova Carga
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'TRIPS' ? (
          <div className="absolute inset-0">
            <TripBoardV2
              {...props}
              trips={filteredTrips}
              onCreateNew={() => setIsWizardOpen(true)}
              showFilters={showFilters}
              onCloseFilters={() => setShowFilters(false)}
            />
          </div>
        ) : (
          <div className="absolute inset-0">
            <LoadBoard
              loads={filteredLoads}
              trips={props.trips}
              vehicles={props.vehicles}
              availableDocs={props.availableDocs}
              cities={props.cities}
              onViewDetails={(load) => setViewingLoad(load)}
              onScheduleLoad={(load) => {
                setSchedulingLoad(load);
              }}
              onUpdateStatus={props.onUpdateStatus}
            />
          </div>
        )}
      </div>

      {/* Global Wizard */}
      <NewTripWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        loads={props.loads}
        vehicles={props.vehicles}
        activeTrips={activeTrips}
        onCreateTrip={props.onCreateTrip}
      />

      <CreateLoadModal
        isOpen={isCreateLoadOpen}
        onClose={() => setIsCreateLoadOpen(false)}
        clients={props.clients}
        cities={props.cities}
        vehicles={props.vehicles}
        activeTrips={activeTrips}
        onCreateLoad={handleCreateLoadWrapper}
      />

      <ScheduleLoadModal
        isOpen={!!schedulingLoad}
        onClose={() => setSchedulingLoad(null)}
        load={schedulingLoad}
        vehicles={props.vehicles}
        activeTrips={activeTrips}
        onConfirm={(load, vehicle, date) => {
          // Mapping back to the onScheduleLoad prop layout
          // Note: The prop expects (load, vehicle, segment, customOrigin, controlNumber)
          // But our new modal simplifies this. We might need to adjust or pass defaults.
          // For now, passing defaults for segment/controlNumber as they are not in the simplified PDF design.
          props.onScheduleLoad(load, vehicle, load.vehicleTypeReq || 'Carreta', load.originCity, 'AUTO');
          setSchedulingLoad(null);
        }}
      />

      <LoadDetailsModal
        load={viewingLoad}
        onClose={() => setViewingLoad(null)}
        onSchedule={(load) => {
          setViewingLoad(null);
          setSchedulingLoad(load);
        }}
      />

    </div>
  );
}
