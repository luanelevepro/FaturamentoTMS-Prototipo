import React from 'react';
import { TripTimeline } from '@/components/TripTimeline';
import type { ScheduleItem, Trip } from '@/types';

export interface TripTimelineScreenProps {
  trips: Trip[];
  /**
   * Quando fornecido, a tela não faz fetch e apenas renderiza.
   * Útil no projeto oficial onde o backend já injeta o cronograma.
   */
  scheduleItems?: ScheduleItem[];
  /**
   * Alternativa ao `scheduleItems`: injete um loader (ex.: fetch via Next/Prisma).
   * Se não for fornecido, a tela tenta `GET /api/cronograma` (relativo ao host).
   */
  loadScheduleItems?: () => Promise<ScheduleItem[]>;
}

export function TripTimelineScreen({ trips, scheduleItems, loadScheduleItems }: TripTimelineScreenProps) {
  const [internalScheduleItems, setInternalScheduleItems] = React.useState<ScheduleItem[]>([]);
  const effectiveScheduleItems = scheduleItems ?? internalScheduleItems;

  React.useEffect(() => {
    // Se o host já forneceu scheduleItems, não buscar.
    if (scheduleItems) return;

    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      try {
        const items = loadScheduleItems
          ? await loadScheduleItems()
          : await fetch('/api/cronograma', { signal: controller.signal }).then(async (r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return (await r.json()) as ScheduleItem[];
            });

        if (!cancelled) setInternalScheduleItems(Array.isArray(items) ? items : []);
      } catch (err: any) {
        if (cancelled) return;
        // Abort não deve poluir o console
        if (err?.name === 'AbortError') return;
        console.error('Failed to load schedule items:', err);
        setInternalScheduleItems([]);
      }
    }

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [scheduleItems, loadScheduleItems]);

  return <TripTimeline trips={trips} scheduleItems={effectiveScheduleItems} />;
}

