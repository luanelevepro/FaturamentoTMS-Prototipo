import type { TripsBootstrapPayload } from './bootstrap';
import {
  MOCK_AVAILABLE_DOCS,
  MOCK_CITIES,
  MOCK_CLIENTS,
  MOCK_LOADS,
  MOCK_TRIPS,
  MOCK_VEHICLES
} from '@/mocks';

export function getMockTripsBootstrap(): TripsBootstrapPayload {
  return {
    trips: MOCK_TRIPS,
    loads: MOCK_LOADS,
    vehicles: MOCK_VEHICLES,
    availableDocs: MOCK_AVAILABLE_DOCS,
    clients: MOCK_CLIENTS,
    cities: MOCK_CITIES
  };
}

