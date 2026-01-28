import React, { useMemo } from 'react';
import { Trip, ScheduleItem } from '../types';
import {
   Calendar,
   CheckCircle,
   Truck,
   Settings,
} from 'lucide-react';

// --- CONFIGURATION ---
const DAYS_IN_MONTH = 30;
// Using a fixed "Simulated Today" to match the mock data (September 2025)
const SIMULATED_TODAY_DAY = 21;
const SIMULATED_TODAY_DATE = new Date('2025-09-21T12:00:00');
const MONTH_LABEL = "Setembro/2025";
const TARGET_MONTH_INDEX = 8; // September is 8 (0-indexed)

// Matches the fleet available in TripForm (Mock Trucks)
const FLEET_VEHICLES = [
   'ABC-1234',
   'DEF-5678',
   'GHI-9012',
   'JKL-3456',
   'MND-2025'
];

type EventType = 'completed' | 'transit' | 'planned' | 'maint_corrective' | 'maint_preventive';

interface TimelineEvent {
   id: string;
   type: EventType;
   startDay: number; // 1 to 30
   duration: number; // days
   tripRef?: Trip;
   scheduleRef?: ScheduleItem;
   customColor?: string; // Allow direct color override
   label?: string; // Visual label
}

interface TripTimelineProps {
   trips?: Trip[];
   scheduleItems?: ScheduleItem[];
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ trips = [], scheduleItems = [] }) => {

   const vehicleRows = useMemo(() => {
      // Strategy: If scheduleItems are present, derive everything from them (dynamic fleet)
      // Otherwise fallback to legacy trips + static fleet
      const useSchedule = scheduleItems.length > 0;

      let vehicles = FLEET_VEHICLES;
      if (useSchedule) {
         const uniquePlates = Array.from(new Set(scheduleItems.map(i => i.veiculo_placa)));
         vehicles = uniquePlates.sort();
      }

      return vehicles.map(plate => {
         let events: (TimelineEvent | null)[] = [];

         if (useSchedule) {
            // --- NEW LOGIC (SQLite / Schedule API) ---
            const items = scheduleItems.filter(i => i.veiculo_placa === plate);

            events = items.map(item => {
               const startDate = new Date(item.data_inicio);
               const endDate = new Date(item.data_fim);

               // Normalize to current month view
               let startDay = startDate.getDate();
               let endDay = endDate.getDate();

               // Basic month boundary check (simplified for prototype)
               // If it's completely outside target month, filter out
               if (startDate.getMonth() > TARGET_MONTH_INDEX && startDate.getFullYear() === 2025) return null;
               if (endDate.getMonth() < TARGET_MONTH_INDEX && endDate.getFullYear() === 2025) return null;

               // Clip to month
               if (startDate.getMonth() < TARGET_MONTH_INDEX) startDay = 1;
               if (endDate.getMonth() > TARGET_MONTH_INDEX) endDay = 30;

               const duration = Math.max(1, (endDay - startDay) + 1);

               return {
                  id: item.id,
                  type: 'planned', // default, overridden by customColor/Label
                  startDay,
                  duration,
                  scheduleRef: item,
                  customColor: item.cor,
                  label: item.status
               };
            });

         } else {
            // --- LEGACY LOGIC (Trips Array) ---

            // Filter based on Truck Plate now
            const relevantTrips = trips.filter(t => t.truckPlate === plate);

            events = relevantTrips.map((trip): TimelineEvent | null => {

               // --- ROBUST DATE PARSING ---
               // 1. Determine Start Date
               let startDate: Date;
               if (trip.scheduledDate) {
                  // Parse YYYY-MM-DD manually
                  const [y, m, d] = trip.scheduledDate.split('-').map(Number);
                  startDate = new Date(y, m - 1, d, 12, 0, 0);
               } else {
                  // Fallback to createdAt 
                  startDate = new Date(trip.createdAt);
               }

               // 2. Determine End Date
               let endDate: Date;
               if (trip.estimatedReturnDate) {
                  const [y, m, d] = trip.estimatedReturnDate.split('-').map(Number);
                  endDate = new Date(y, m - 1, d, 12, 0, 0);
               } else {
                  // Default duration: 3 days if not specified (Standard trip duration default)
                  endDate = new Date(startDate);
                  endDate.setDate(startDate.getDate() + 3);
               }

               // --- GRID CALCULATION ---
               let startDay = startDate.getDate();
               let endDay = endDate.getDate();

               // Month Boundaries logic
               if (startDate.getMonth() !== TARGET_MONTH_INDEX) {
                  if (startDate < new Date(2025, TARGET_MONTH_INDEX, 1)) startDay = 1;
                  else startDay = 31;
               }
               if (endDate.getMonth() !== TARGET_MONTH_INDEX) {
                  if (endDate > new Date(2025, TARGET_MONTH_INDEX, 30)) endDay = 30;
               }

               // Filter out of view
               if (startDate.getMonth() > TARGET_MONTH_INDEX || (endDate.getMonth() < TARGET_MONTH_INDEX && endDate.getFullYear() === 2025)) {
                  return null;
               }

               const duration = Math.max(1, (endDay - startDay) + 1);

               // --- STATUS LOGIC ---
               let type: EventType = 'planned';
               const sDate = new Date(startDate); sDate.setHours(0, 0, 0, 0);
               const eDate = new Date(endDate); eDate.setHours(23, 59, 59, 999);
               const today = new Date(SIMULATED_TODAY_DATE); today.setHours(12, 0, 0, 0);

               if (sDate > today) {
                  type = 'planned';
               } else if (eDate < today) {
                  type = 'completed';
               } else {
                  type = 'transit';
               }

               return {
                  id: trip.id,
                  type,
                  startDay,
                  duration,
                  tripRef: trip
               };
            });
         }

         return { plate, events: events.filter((e): e is TimelineEvent => e !== null) };
      });
   }, [trips, scheduleItems]);


   // 2. Calculate KPIs dynamically
   const kpiData = useMemo(() => {
      let completed = 0;
      let transit = 0;
      let planned = 0;

      vehicleRows.forEach(row => {
         row.events.forEach(ev => {
            // Support legacy types AND new custom Label/Color inference if needed
            if (ev.type === 'completed' || ev.label === 'Concluído') completed++;
            if (ev.type === 'transit' || ev.label === 'Em Trânsito') transit++;
            if (ev.type === 'planned' || ev.label === 'Planejado') planned++;
         });
      });

      return { completed, transit, planned };
   }, [vehicleRows]);


   const getEventStyle = (type: EventType) => {
      switch (type) {
         case 'completed': return 'bg-[#43a047] hover:bg-[#2e7d32] border-[#2e7d32] text-white';
         case 'transit': return 'bg-[#fdd835] hover:bg-[#fbc02d] border-[#fbc02d] text-gray-900';
         case 'planned': return 'bg-[#0277bd] hover:bg-[#01579b] border-[#01579b] text-white';
         default: return 'bg-gray-400 text-white';
      }
   };

   return (
      <div className="min-h-0 bg-gray-50 p-3 sm:p-4 lg:p-6 font-sans">

         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
               <h1 className="text-2xl font-bold text-gray-900">Cronograma</h1>
               <p className="text-gray-500 text-sm mt-1">Visão temporal da frota e viagens.</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                  Hoje (Simulado): {SIMULATED_TODAY_DATE.toLocaleDateString()}
               </div>
               <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm text-gray-700 text-sm font-medium">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{MONTH_LABEL}</span>
               </div>
            </div>
         </div>

         {/* KPI Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
               label="Viagens concluídas"
               value={kpiData.completed.toString().padStart(2, '0')}
               colorClass="text-green-600"
               barClass="bg-green-500"
               icon={<CheckCircle size={24} className="text-green-500" />}
            />
            <KPICard
               label="Viagens em trânsito"
               value={kpiData.transit.toString().padStart(2, '0')}
               colorClass="text-yellow-600"
               barClass="bg-yellow-500"
               icon={<Truck size={24} className="text-yellow-500" />}
            />
            <KPICard
               label="Viagens programadas"
               value={kpiData.planned.toString().padStart(2, '0')}
               colorClass="text-blue-600"
               barClass="bg-blue-500"
               icon={<Calendar size={24} className="text-blue-500" />}
            />
            <KPICard
               label="Manutenção"
               value="00"
               colorClass="text-purple-600"
               barClass="bg-purple-500"
               icon={<Settings size={24} className="text-purple-500" />}
            />
         </div>

         {/* Legend */}
         <div className="flex flex-wrap items-center justify-end gap-6 mb-4 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#43a047]"></div> Viagens concluídas</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#fdd835]"></div> Viagens em trânsito</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#0277bd]"></div> Viagens programadas</div>
         </div>

         {/* THE GRID */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 font-bold text-gray-800">
               Timeline do mês
            </div>

            <div className="overflow-x-auto">
               <div className="min-w-[1000px] relative">

                  {/* GRID HEADER (DAYS) */}
                  <div className="grid grid-cols-[150px_repeat(30,1fr)] border-b border-gray-100">
                     <div className="p-3 text-xs font-bold text-gray-500 bg-gray-50 border-r border-gray-100 sticky left-0 z-10">
                        Veículo
                     </div>
                     {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map(day => (
                        <div key={day} className={`p-2 text-center text-xs font-medium border-r border-gray-50 last:border-r-0 ${day === SIMULATED_TODAY_DAY ? 'bg-gray-100 text-black font-bold' : 'text-gray-400'}`}>
                           {day.toString().padStart(2, '0')}
                        </div>
                     ))}
                  </div>

                  {/* CURRENT DAY INDICATOR (Line) */}
                  <div
                     className="absolute top-9 bottom-0 w-0.5 bg-black/50 z-20 pointer-events-none border-l border-dashed border-black"
                     style={{ left: `calc(150px + ((100% - 150px) / 30) * ${SIMULATED_TODAY_DAY} - ((100% - 150px) / 60))` }}
                  >
                  </div>

                  {/* VEHICLE ROWS */}
                  {vehicleRows.map((vehicle, vIdx) => (
                     <div key={vIdx} className="grid grid-cols-[150px_repeat(30,1fr)] hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 h-14 items-center relative group">

                        {/* Column 1: Vehicle Name */}
                        <div className="px-4 py-2 text-xs font-bold text-gray-700 bg-white group-hover:bg-gray-50 border-r border-gray-100 sticky left-0 z-10 h-full flex items-center">
                           {vehicle.plate}
                        </div>

                        {/* Grid Cells (Background) */}
                        {Array.from({ length: DAYS_IN_MONTH }, (_, i) => (
                           <div key={i} className={`h-full border-r border-gray-50 last:border-r-0 ${i + 1 === SIMULATED_TODAY_DAY ? 'bg-gray-100/50' : ''}`}></div>
                        ))}

                        {/* Events (Overlaid) */}
                        {vehicle.events.map(event => {
                           const gridStart = 2 + (event.startDay - 1);
                           const gridEnd = gridStart + event.duration;

                           return (
                              <div
                                 key={event.id}
                                 className={`absolute h-8 rounded shadow-sm border ${getEventStyle(event.type)} mx-1 z-0 flex items-center justify-center cursor-pointer transition-all hover:scale-[1.02]`}
                                 style={{
                                    gridColumnStart: gridStart,
                                    gridColumnEnd: gridEnd,
                                 }}
                                 title={`Viagem #${event.id}`}
                              >
                                 <span className="text-[10px] font-bold drop-shadow-sm truncate px-1">
                                    #{event.id}
                                 </span>
                              </div>
                           );
                        })}

                     </div>
                  ))}

                  {vehicleRows.length === 0 && (
                     <div className="p-8 text-center text-gray-500 italic">
                        Nenhum veículo configurado na frota.
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

const KPICard: React.FC<{ label: string; value: string; colorClass: string; barClass: string; icon: React.ReactNode }> = ({ label, value, colorClass, barClass, icon }) => (
   <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between relative overflow-hidden">
      <div className={`absolute top-4 left-4 w-8 h-1 rounded-full ${barClass}`}></div>
      <div className="mt-4">
         <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
         <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 bg-gray-50 rounded-lg border border-gray-100`}>
         {icon}
      </div>
   </div>
);
