import React, { useEffect, useState } from 'react';
import type { AvailableDocument, Delivery, Leg, Load, Trip, Vehicle, ViewState, Document as TripDocument } from './types';
import { fetchTripsBootstrap, getMockTripsBootstrap, TripShell } from './modules/trips';
import { validateSegmentCompatibility, validateAddLoadToTrip, validateEmitCTe } from './lib/validations';

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
    // Validação de compatibilidade de segmento (Hard Block)
    const segmentValidation = validateSegmentCompatibility(vehicle, load);
    
    if (!segmentValidation.valid) {
      alert(`❌ BLOQUEIO: ${segmentValidation.error}`);
      return;
    }

    // Atualiza a carga para status 'Scheduled' quando vinculada à viagem
    setLoads(loads.map(l => 
      l.id === load.id ? { ...l, status: 'Scheduled' as const } : l
    ));

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
      segment: segment || load.segment, // Define segmento da viagem
      legs: [
        {
          id: `leg-${Date.now()}`,
          type: 'LOAD',
          sequence: 1,
          direction: 'Ida',
          originCity: customOrigin || load.originCity,
          originAddress: 'Operacional',
          destinationCity: load.destinationCity || undefined,
          segment: segment,
          loadId: load.id, // Vincula a carga à leg
          // Se ainda não temos Nº Controle/docs, a carga pode nascer sem entregas e ser montada depois no detalhe
          deliveries: controlNumber ? [
            {
              id: `del-${Date.now()}`,
              sequence: 1,
              destinationCity: load.destinationCity || 'Destino a definir',
              destinationAddress: 'Endereço Cliente',
              recipientName: load.clientName,
              status: 'Pending',
              loadId: load.id, // Vincula a entrega à carga
              attemptNumber: 1,
              documents: [
                // placeholder (numeração sem prefixo)
                { id: `doc-${Date.now()}`, number: '000000', type: 'NF', value: 0, weight: 0, controlNumber: undefined }
              ]
            }
          ] : []
        }
      ],
      loads: [load] // Adiciona a carga à viagem para facilitar acesso
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

  // Handler para "emitir" CT-e (apenas visual/gerencial, sem integração real)
  const handleEmitCTe = (loadId: string) => {
    const load = loads.find(l => l.id === loadId);
    if (!load) return;

    // Encontra a viagem que contém esta carga
    const trip = trips.find(t => 
      t.loads?.some(l => l.id === loadId) || 
      t.legs.some(leg => leg.loadId === loadId)
    );

    // Validação antes de emitir
    const validation = validateEmitCTe(load, trip || null);
    
    if (!validation.valid) {
      alert(`❌ BLOQUEIO: ${validation.error}`);
      return;
    }

    // Atualiza o estado da carga para "Emitted" e cria um CT-e mock
    setLoads(loads.map(l => {
      if (l.id === loadId && l.status === 'Scheduled') {
        const mockCTe = {
          id: `cte-${Date.now()}`,
          loadId: l.id,
          number: `CTE${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
          accessKey: `352${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000000000000000000000000000000000000000)).padStart(44, '0')}`,
          freightValue: l.weight ? l.weight * 2.5 : 1500, // Mock: R$ 2,50/kg ou R$ 1500 fixo
          status: 'Authorized' as const,
          emissionDate: new Date().toISOString(),
          authorizationDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        return {
          ...l,
          status: 'Emitted' as const,
          cte: mockCTe
        };
      }
      return l;
    }));

    // Também atualiza a carga dentro da viagem se existir
    setTrips(trips.map(t => {
      if (t.loads?.some(l => l.id === loadId)) {
        return {
          ...t,
          loads: t.loads.map(l => 
            l.id === loadId 
              ? { ...l, status: 'Emitted' as const, cte: {
                  id: `cte-${Date.now()}`,
                  loadId: l.id,
                  number: `CTE${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
                  accessKey: `352${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000000000000000000000000000000000000000)).padStart(44, '0')}`,
                  freightValue: l.weight ? l.weight * 2.5 : 1500,
                  status: 'Authorized' as const,
                  emissionDate: new Date().toISOString(),
                  authorizationDate: new Date().toISOString(),
                  createdAt: new Date().toISOString()
                } }
              : l
          )
        };
      }
      return t;
    }));
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
      const inferDirection = (trip: Trip, leg: any): Leg['direction'] => {
        if (leg.type !== 'LOAD') return undefined;
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
      const newLeg: Leg = {
        id: `leg-${Date.now()}`,
        sequence: t.legs.length + 1,
        deliveries: [],
        direction: inferDirection(t, legData as any),
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
            controlNumber: undefined, // será definido pelo sistema depois (OP/controle operacional)
            linkedCteNumber: d.linkedCteNumber,
            dfeKey: (d as any).dfeKey,
            relatedDfeKeys: (d as any).relatedDfeKeys,
            isSubcontracted: (d as any).isSubcontracted
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
    // Regra fiscal/operacional: 1 Carga (Leg) = 1 destino (1 Delivery principal) = 1 CT-e
    // Portanto, cada grupo selecionado vira UMA nova Leg (e não múltiplas deliveries dentro da mesma Leg).
    const groups = payload.controlGroups || [];

    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      let nextSeq = t.legs.length + 1;

      const newLegs: Leg[] = groups.flatMap((g, gIdx) => {
        // Segurança: se um grupo vier misturado (múltiplos destinos), split por destino
        const byDest = new Map<string, AvailableDocument[]>();
        for (const d of (g.docs || [])) {
          const k = `${d.destinationCity}|${d.recipientName}`;
          if (!byDest.has(k)) byDest.set(k, []);
          byDest.get(k)!.push(d);
        }

        return Array.from(byDest.entries()).map(([destKey, docsForDest], idx) => {
          const first = docsForDest[0];
          const docs: TripDocument[] = docsForDest.map(d => ({
            id: `doc-${now}-${gIdx}-${idx}-${d.id}`,
            number: d.number,
            type: d.type,
            value: d.value,
            weight: d.weight,
            controlNumber: undefined, // OP/controle será gerado depois pelo sistema
            linkedCteNumber: d.linkedCteNumber,
            dfeKey: (d as any).dfeKey,
            relatedDfeKeys: (d as any).relatedDfeKeys,
            isSubcontracted: (d as any).isSubcontracted
          }));

          const delivery: Delivery = {
            id: `del-${now}-${gIdx}-${idx}`,
            sequence: 1,
            destinationCity: first?.destinationCity || 'Destino Indefinido',
            destinationAddress: first?.destinationAddress || 'Endereço Indefinido',
            recipientName: first?.recipientName || 'Destinatário',
            status: 'Pending',
            documents: docs
          };

          const leg: Leg = {
            id: `leg-${now}-${gIdx}-${idx}`,
            type: 'LOAD',
            sequence: nextSeq++,
            originCity: payload.originCity,
            originAddress: payload.originAddress,
            destinationCity: first?.destinationCity || undefined,
            vehicleTypeReq: (payload as any).vehicleTypeReq,
            segment: (payload as any).segment,
            deliveries: [delivery]
          };

          return leg;
        });
      });

      return { ...t, legs: [...t.legs, ...newLegs] };
    }));
  };

  const handleAttachLoadsToTrip = (tripId: string, payload: { loadIds: string[]; vehicleTypeReq: string }) => {
    const now = Date.now();
    const selected = loads.filter(l => payload.loadIds.includes(l.id));
    const trip = trips.find(t => t.id === tripId);
    const vehicle = vehicles.find(v => v.plate === trip?.truckPlate);

    if (!trip || !vehicle) {
      alert('Erro: Viagem ou veículo não encontrado.');
      return;
    }

    // Validação completa para cada carga
    for (const load of selected) {
      const validation = validateAddLoadToTrip(trip, load, vehicle, 'COMPLEMENTO');
      
      if (!validation.valid) {
        alert(`❌ BLOQUEIO ao adicionar carga "${load.clientName}":\n\n${validation.errors.join('\n')}`);
        return;
      }
      
      if (validation.warnings.length > 0) {
        const confirmed = window.confirm(
          `⚠️ AVISO ao adicionar carga "${load.clientName}":\n\n${validation.warnings.join('\n\n')}\n\nDeseja continuar mesmo assim?`
        );
        if (!confirmed) {
          return;
        }
      }
    }

    // Se passou todas as validações, adiciona as cargas
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
        loadId: l.id,
        direction: (l.originCity === t.originCity ? 'Ida' : (l.destinationCity === t.originCity ? 'Retorno' : undefined)),
        deliveries: []
      }));

      return { 
        ...t, 
        legs: [...t.legs, ...newLegs],
        loads: [...(t.loads || []), ...selected]
      };
    }));

    // Atualiza status das cargas para 'Scheduled'
    setLoads(prev => prev.map(l => 
      payload.loadIds.includes(l.id) ? { ...l, status: 'Scheduled' as const } : l
    ).filter(l => !payload.loadIds.includes(l.id))); // Remove da coluna "Cargas Disponíveis"
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
        onEmitCTe={handleEmitCTe}
      />
    </>
  );
}
