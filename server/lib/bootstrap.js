function groupBy(rows, key) {
  const map = new Map();
  for (const r of rows) {
    const k = r[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return map;
}

export function buildBootstrapPayload(db) {
  const clients = db.prepare(`
    SELECT
      id,
      name,
      address
    FROM clients
    ORDER BY name
  `).all();

  const cities = db.prepare(`
    SELECT full_name
    FROM cities
    ORDER BY full_name
  `).all().map(r => r.full_name);

  const vehicles = db.prepare(`
    SELECT
      id,
      plate,
      type,
      model,
      driver_name AS driverName,
      status
    FROM vehicles
    ORDER BY plate
  `).all();

  const loads = db.prepare(`
    SELECT
      l.id,
      c.name AS clientName,
      l.origin_city AS originCity,
      l.destination_city AS destinationCity,
      l.collection_date AS collectionDate,
      l.status,
      l.vehicle_type_req AS vehicleTypeReq,
      l.observations
    FROM loads l
    JOIN clients c ON c.id = l.client_id
    ORDER BY l.collection_date DESC, l.id
  `).all();

  const availableDocs = db.prepare(`
    SELECT
      id,
      number,
      type,
      control_number AS controlNumber,
      linked_cte_number AS linkedCteNumber,
      dfe_key AS dfeKey,
      related_dfe_keys AS relatedDfeKeys,
      value,
      weight,
      recipient_name AS recipientName,
      destination_city AS destinationCity,
      destination_address AS destinationAddress,
      emission_date AS emissionDate
    FROM available_documents
    ORDER BY emission_date DESC, id
  `).all().map(r => ({
    ...r,
    relatedDfeKeys: r.relatedDfeKeys ? JSON.parse(r.relatedDfeKeys) : undefined
  }));

  const tripRows = db.prepare(`
    SELECT
      id,
      created_at AS createdAt,
      scheduled_date AS scheduledDate,
      estimated_return_date AS estimatedReturnDate,
      status,
      driver_name AS driverName,
      truck_plate AS truckPlate,
      trailer1_plate AS trailer1Plate,
      trailer2_plate AS trailer2Plate,
      trailer3_plate AS trailer3Plate,
      main_destination AS mainDestination,
      origin_city AS originCity,
      freight_value AS freightValue,
      proof_of_delivery AS proofOfDelivery
    FROM trips
    ORDER BY datetime(created_at) DESC
  `).all();

  const legRows = db.prepare(`
    SELECT
      id,
      trip_id AS tripId,
      type,
      sequence,
      origin_city AS originCity,
      origin_address AS originAddress,
      destination_city AS destinationCity,
      hub_name AS hubName,
      control_number AS controlNumber,
      vehicle_type_req AS vehicleTypeReq,
      segment
    FROM legs
    ORDER BY trip_id, sequence
  `).all();

  const deliveryRows = db.prepare(`
    SELECT
      id,
      leg_id AS legId,
      sequence,
      destination_city AS destinationCity,
      destination_address AS destinationAddress,
      recipient_name AS recipientName,
      status,
      proof_of_delivery AS proofOfDelivery
    FROM deliveries
    ORDER BY leg_id, sequence
  `).all();

  const docRows = db.prepare(`
    SELECT
      id,
      delivery_id AS deliveryId,
      number,
      type,
      control_number AS controlNumber,
      linked_cte_number AS linkedCteNumber,
      dfe_key AS dfeKey,
      related_dfe_keys AS relatedDfeKeys,
      value,
      weight
    FROM documents
    ORDER BY delivery_id, id
  `).all().map(r => ({
    ...r,
    relatedDfeKeys: r.relatedDfeKeys ? JSON.parse(r.relatedDfeKeys) : undefined
  }));

  const docsByDelivery = groupBy(docRows, 'deliveryId');
  const deliveriesByLeg = groupBy(deliveryRows, 'legId');
  const legsByTrip = groupBy(legRows, 'tripId');

  const trips = tripRows.map(t => {
    const legs = (legsByTrip.get(t.id) || []).map(l => {
      const deliveries = (deliveriesByLeg.get(l.id) || []).map(d => {
        const documents = (docsByDelivery.get(d.id) || []).map(doc => ({
          id: doc.id,
          number: doc.number,
          type: doc.type,
          controlNumber: doc.controlNumber ?? undefined,
          linkedCteNumber: doc.linkedCteNumber ?? undefined,
          dfeKey: doc.dfeKey ?? undefined,
          relatedDfeKeys: doc.relatedDfeKeys ?? undefined,
          value: doc.value,
          weight: doc.weight ?? undefined
        }));

        return {
          id: d.id,
          sequence: d.sequence,
          destinationCity: d.destinationCity,
          destinationAddress: d.destinationAddress,
          recipientName: d.recipientName,
          status: d.status,
          proofOfDelivery: d.proofOfDelivery ?? undefined,
          documents
        };
      });

      return {
        id: l.id,
        type: l.type,
        sequence: l.sequence,
        originCity: l.originCity,
        originAddress: l.originAddress,
        destinationCity: l.destinationCity ?? undefined,
        hubName: l.hubName ?? undefined,
        controlNumber: l.controlNumber ?? undefined,
        vehicleTypeReq: l.vehicleTypeReq ?? undefined,
        segment: l.segment ?? undefined,
        deliveries
      };
    });

    return { ...t, legs };
  });

  return {
    clients,
    cities,
    vehicles,
    loads,
    availableDocs,
    trips
  };
}
