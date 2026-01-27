import React, { useEffect, useState } from 'react';
import type { AvailableDocument, Delivery, Leg, Load, Trip, Vehicle, ViewState, Document as TripDocument } from './types';
import { fetchTripsBootstrap, getMockTripsBootstrap, TripShell } from './modules/trips';

// Mocks moved to mocks.ts

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availableDocs, setAvailableDocs] = useState<AvailableDocument[]>([]);
  const [clients, setClients] = useState<{ name: string; address: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [view, setView] = useState<ViewState>('LIST_V2');

  const [bootstrapStatus, setBootstrapStatus] = useState<'loading' | 'loaded' | 'fallback'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const data = await fetchTripsBootstrap();
        if (cancelled) return;
        setTrips(data.trips);
        setLoads(data.loads);
        setVehicles(data.vehicles);
        setAvailableDocs(data.availableDocs);
        setClients(data.clients);
        setCities(data.cities);
        setBootstrapStatus('loaded');
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load bootstrap from API:", err);
        // Fallback to mocks if API fails (optional, helps if user forgot to start server)
        const mock = getMockTripsBootstrap();
        setTrips(mock.trips);
        setLoads(mock.loads);
        setVehicles(mock.vehicles);
        setAvailableDocs(mock.availableDocs);
        setClients(mock.clients);
        setCities(mock.cities);
        setBootstrapStatus('fallback');
      }
    }

    loadBootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateLoad = (loadData: Omit<Load, 'id' | 'status'>) => {
    const newLoad: Load = {
      ...loadData,
      id: `load-${Date.now()}`,
      status: 'Pending'
    };
    setLoads([...loads, newLoad]);
  };

  const handleScheduleLoad = (load: Load, vehicle: Vehicle, segment: string, customOrigin: string, controlNumber: string) => {
    const newTrip: Trip = {
      id: (trips.length + 1000).toString(),
      createdAt: new Date().toISOString(),
      status: 'Planned',
      driverName: vehicle.driverName || 'A definir',
      truckPlate: vehicle.plate,
      trailer1Plate: vehicle.type !== 'Truck' ? 'AUTO-TR1' : undefined,
      originCity: customOrigin || load.originCity,
      mainDestination: load.destinationCity || 'A definir',
      freightValue: 0,
      legs: [
        {
          id: `leg-${Date.now()}`,
          type: 'LOAD',
          sequence: 1,
          originCity: customOrigin || load.originCity,
          originAddress: 'Operacional',
          destinationCity: load.destinationCity || undefined,
          segment: segment,
          // Se ainda não temos Nº Controle/docs, a carga pode nascer sem entregas e ser montada depois no detalhe
          deliveries: controlNumber ? [
            {
              id: `del-${Date.now()}`,
              sequence: 1,
              destinationCity: load.destinationCity || 'Destino a definir',
              destinationAddress: 'Endereço Cliente',
              recipientName: load.clientName,
              status: 'Pending',
              documents: [
                { id: `doc-${Date.now()}`, number: 'NF-000000', type: 'NF', value: 0, weight: 0, controlNumber: controlNumber }
              ]
            }
          ] : []
        }
      ]
    };

    setTrips([...trips, newTrip]);
    setLoads(loads.filter(l => l.id !== load.id));
    setVehicles(vehicles.map(v => v.id === vehicle.id ? { ...v, status: 'In Use' } : v));
  };

  const handleUpdateTripDocuments = (tripId: string, legId: string, deliveryId: string, doc: Omit<TripDocument, 'id'>) => {
    setTrips(trips.map(t => {
      if (t.id === tripId) {
        return {
          ...t,
          legs: t.legs.map(l => {
            if (l.id === legId) {
              return {
                ...l,
                deliveries: l.deliveries.map(d => {
                  if (d.id === deliveryId) {
                    return {
                      ...d,
                      documents: [
                        ...d.documents,
                        { ...doc, id: `doc-${Date.now()}` }
                      ]
                    };
                  }
                  return d;
                })
              };
            }
            return l;
          })
        };
      }
      return t;
    }));
  };

  const handleUpdateTripStatus = (tripId: string, newStatus: Trip['status'], pod?: string) => {
    setTrips(trips.map(t => {
      if (t.id === tripId) {
        const updatedTrip = { ...t, status: newStatus };
        if (pod) updatedTrip.proofOfDelivery = pod;

        // If completing the trip, also mark all its deliveries as Delivered
        if (newStatus === 'Completed') {
          updatedTrip.legs = updatedTrip.legs.map(l => ({
            ...l,
            deliveries: l.deliveries.map(d => ({ ...d, status: 'Delivered' }))
          }));
        }
        return updatedTrip;
      }
      return t;
    }));

    if (newStatus === 'Completed') {
      const trip = trips.find(t => t.id === tripId);
      if (trip) {
        setVehicles(vehicles.map(v => v.plate === trip.truckPlate ? { ...v, status: 'Available' } : v));
      }
    }
  };

  const handleUpdateDeliveryStatus = (tripId: string, legId: string, deliveryId: string, status: Delivery['status'], pod?: string) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        legs: t.legs.map(l => {
          if (l.id !== legId) return l;
          return {
            ...l,
            deliveries: l.deliveries.map(d => {
              if (d.id !== deliveryId) return d;
              return { ...d, status, proofOfDelivery: pod || d.proofOfDelivery };
            })
          };
        })
      };
    }));
  };

  const handleReorderDeliveries = (tripId: string, legId: string, newOrder: Delivery[]) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        legs: t.legs.map(l => {
          if (l.id !== legId) return l;
          // Atualiza sequência baseada na nova ordem
          const reordered = newOrder.map((d, idx) => ({ ...d, sequence: idx + 1 }));
          return { ...l, deliveries: reordered };
        })
      };
    }));
  };

  const handleAddLeg = (tripId: string, legData: Omit<Leg, 'id' | 'sequence' | 'deliveries'>) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      const newLeg: Leg = {
        id: `leg-${Date.now()}`,
        sequence: t.legs.length + 1,
        deliveries: [],
        ...legData
      };
      return { ...t, legs: [...t.legs, newLeg] };
    }));
  };

  const handleAddDelivery = (tripId: string, legId: string, selectedDocs: AvailableDocument[]) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        legs: t.legs.map(l => {
          if (l.id !== legId) return l;

          // Determine common destination from docs (assume all selected docs go to same place for now, or take first)
          const firstDoc = selectedDocs[0];

          // Create documents list
          const docs: TripDocument[] = selectedDocs.map(d => ({
            id: `doc-${Date.now()}-${d.id}`,
            number: d.number,
            type: d.type,
            value: d.value,
            weight: d.weight,
            controlNumber: d.controlNumber,
            linkedCteNumber: d.type === 'NF' ? undefined : undefined // Only link if explicit logic exists, keeping simple for now
          }));

          const newDelivery: Delivery = {
            id: `del-${Date.now()}`,
            sequence: l.deliveries.length + 1,
            destinationCity: firstDoc?.destinationCity || 'Destino Indefinido',
            destinationAddress: firstDoc?.destinationAddress || 'Endereço Indefinido',
            recipientName: firstDoc?.recipientName || 'Destinatário',
            status: 'Pending',
            documents: docs
          };

          return { ...l, deliveries: [...l.deliveries, newDelivery] };
        })
      };
    }));
  };

  // Novo fluxo: criar uma nova carga dentro da viagem já com entregas/documentos (a partir de control groups)
  const handleAddLoadWithDeliveries = (tripId: string, payload: { originCity: string; originAddress: string; segment?: string; controlGroups: { controlNumber: string; docs: AvailableDocument[] }[] }) => {
    const now = Date.now();
    const newLegId = `leg-${now}`;

    const deliveries: Delivery[] = (payload.controlGroups || []).map((g, idx) => {
      const first = g.docs[0];
      const docs: TripDocument[] = g.docs.map(d => ({
        id: `doc-${now}-${d.id}`,
        number: d.number,
        type: d.type,
        value: d.value,
        weight: d.weight,
        controlNumber: g.controlNumber,
        linkedCteNumber: d.linkedCteNumber,
        dfeKey: (d as any).dfeKey,
        relatedDfeKeys: (d as any).relatedDfeKeys
      }));

      return {
        id: `del-${now}-${idx}`,
        sequence: idx + 1,
        destinationCity: first?.destinationCity || 'Destino Indefinido',
        destinationAddress: first?.destinationAddress || 'Endereço Indefinido',
        recipientName: first?.recipientName || 'Destinatário',
        status: 'Pending',
        documents: docs
      };
    });

    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      const sequence = t.legs.length + 1;
      const newLeg: Leg = {
        id: newLegId,
        type: 'LOAD',
        sequence,
        originCity: payload.originCity,
        originAddress: payload.originAddress,
        vehicleTypeReq: (payload as any).vehicleTypeReq,
        segment: (payload as any).segment,
        controlNumber: `${Math.floor(10000000 + Math.random() * 90000000)}`,
        deliveries
      };
      return { ...t, legs: [...t.legs, newLeg] };
    }));
  };

  const handleAttachLoadsToTrip = (tripId: string, payload: { loadIds: string[]; vehicleTypeReq: string }) => {
    const now = Date.now();
    const selected = loads.filter(l => payload.loadIds.includes(l.id));

    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      let nextSeq = t.legs.length + 1;

      const newLegs: Leg[] = selected.map((l, idx) => ({
        id: `leg-${now}-${l.id}`,
        type: 'LOAD',
        sequence: nextSeq++,
        originCity: l.originCity,
        originAddress: 'Embarcador',
        destinationCity: l.destinationCity || undefined,
        vehicleTypeReq: payload.vehicleTypeReq || l.vehicleTypeReq,
        deliveries: []
      }));

      return { ...t, legs: [...t.legs, ...newLegs] };
    }));

    // Remove da coluna "Cargas Disponíveis"
    setLoads(prev => prev.filter(l => !payload.loadIds.includes(l.id)));
  };

  /* New Trip Wizard Handler */
  const handleCreateTrip = (tripData: { loads: Load[], vehicle: Vehicle, driverName: string }) => {
    const { loads: selectedLoads, vehicle, driverName } = tripData;

    const newTrip: Trip = {
      id: (trips.length + 2000).toString(),
      createdAt: new Date().toISOString(),
      status: 'Planned',
      driverName: driverName,
      truckPlate: vehicle.plate,
      trailer1Plate: vehicle.type === 'Bitrem' ? 'REB-01' : undefined, // Mock logic
      originCity: selectedLoads[0]?.originCity || 'Origem Indefinida',
      mainDestination: selectedLoads[selectedLoads.length - 1]?.destinationCity || 'A definir',
      freightValue: selectedLoads.length * 1500, // Mock calculation
      legs: selectedLoads.map((load, index) => ({
        id: `leg-${Date.now()}-${index}`,
        type: 'LOAD',
        sequence: index + 1,
        originCity: load.originCity,
        originAddress: 'Endereço da Coleta',
        destinationCity: load.destinationCity || undefined,
        segment: 'Carga Geral', // Default
        controlNumber: `${Math.floor(10000000 + Math.random() * 90000000)}`, // 8 dígitos (XXXXXXXX)
        deliveries: [
          {
            id: `del-${Date.now()}-${index}`,
            sequence: 1,
            destinationCity: load.destinationCity || 'A definir',
            destinationAddress: 'Endereço do Cliente',
            recipientName: load.clientName,
            status: 'Pending',
            documents: []
          }
        ]
      }))
    };

    setTrips([...trips, newTrip]);

    // Update vehicle status
    setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, status: 'In Use' } : v));

    // Remove loads from pending list
    const loadIds = selectedLoads.map(l => l.id);
    setLoads(prev => prev.filter(l => !loadIds.includes(l.id)));
  };

  return (
    <>
      {bootstrapStatus === 'loading' && (
        <div className="p-4 text-xs font-bold text-gray-500">
          Carregando dados do banco (SQLite)…
        </div>
      )}
      {bootstrapStatus === 'fallback' && (
        <div className="p-4 text-xs font-bold text-amber-700 bg-amber-50 border-b border-amber-100">
          Backend/SQLite não está disponível — usando mocks locais por enquanto.
        </div>
      )}

      <TripShell
        view={view as any}
        onChangeView={setView as any}
        trips={trips}
        loads={loads}
        availableDocs={availableDocs}
        vehicles={vehicles}
        clients={clients}
        cities={cities}
        onCreateNew={() => { }}
        onAddLeg={handleAddLeg}
        onAddDelivery={handleAddDelivery}
        onAddDocument={handleUpdateTripDocuments}
        onAddLoadWithDeliveries={handleAddLoadWithDeliveries}
        onAttachLoadsToTrip={handleAttachLoadsToTrip}
        onCreateTrip={handleCreateTrip}
        onCreateLoad={handleCreateLoad}
        onScheduleLoad={handleScheduleLoad}
        onUpdateStatus={handleUpdateTripStatus}
        onUpdateDeliveryStatus={handleUpdateDeliveryStatus}
        onReorderDeliveries={handleReorderDeliveries}
      />
    </>
  );
}
