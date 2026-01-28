// Plugin entrypoint (plug-and-play)
//
// A ideia é o projeto oficial importar **somente** deste arquivo.
// No protótipo, este arquivo reexporta do código existente.
//
// No projeto oficial, você pode copiar `modules/trips`, `components`, `types.ts`
// (ou adaptar para seu domínio) e manter a mesma superfície pública.

export * from '../../types';

// Contrato de bootstrap (opcional no projeto oficial)
export * from '../../modules/trips/bootstrap';
export * from '../../modules/trips/mockBootstrap';

// UI (Shell + screens)
export * from '../../modules/trips/TripShell';
export * from '../../modules/trips/screens/TripsAndLoadsScreen';
export * from '../../modules/trips/screens/TripTimelineScreen';

// Componentes principais (úteis para customização no host)
export * from '../../components/TripBoardV2';
export * from '../../components/TripDetails';
export * from '../../components/TripTimeline';

