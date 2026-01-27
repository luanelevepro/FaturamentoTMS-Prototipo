import type { AvailableDocument, Load, Trip, Vehicle } from '@/types';

export type Client = { name: string; address: string };

export interface TripsBootstrapPayload {
  trips: Trip[];
  loads: Load[];
  vehicles: Vehicle[];
  availableDocs: AvailableDocument[];
  clients: Client[];
  cities: string[];
}

export async function fetchTripsBootstrap(baseUrl = ''): Promise<TripsBootstrapPayload> {
  const res = await fetch(`${baseUrl}/api/bootstrap`);
  if (!res.ok) throw new Error(`Falha ao carregar bootstrap: HTTP ${res.status}`);
  return await res.json();
}

