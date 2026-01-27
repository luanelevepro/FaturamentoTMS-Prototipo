import React from 'react';
import { TripTimeline } from '@/components/TripTimeline';
import type { Trip } from '@/types';

export function TripTimelineScreen({ trips }: { trips: Trip[] }) {
  return <TripTimeline trips={trips} />;
}

