import React, { useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import type { ViewState } from '@/types';
import type { TripsAndLoadsScreenProps } from './screens/TripsAndLoadsScreen';
import { TripsAndLoadsScreen } from './screens/TripsAndLoadsScreen';
import { TripTimelineScreen } from './screens/TripTimelineScreen';

export type TripsModuleView = Extract<ViewState, 'LIST_V2' | 'TIMELINE'>;

export interface TripShellProps extends TripsAndLoadsScreenProps {
  initialView?: TripsModuleView;
  // Permite o host controlar o view (ou deixar interno)
  view?: TripsModuleView;
  onChangeView?: (view: TripsModuleView) => void;
  showSidebar?: boolean;
}

export function TripShell({
  initialView = 'LIST_V2',
  view,
  onChangeView,
  showSidebar = true,
  ...screenProps
}: TripShellProps) {
  const [internalView, setInternalView] = useState<TripsModuleView>(initialView);
  const currentView = view ?? internalView;
  const setView = onChangeView ?? setInternalView;

  const sidebarView = useMemo(() => currentView as ViewState, [currentView]);

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <Sidebar currentView={sidebarView} onChangeView={setView as any} />}
      <main className="flex-1 overflow-auto">
        {currentView === 'LIST_V2' ? (
          <TripsAndLoadsScreen {...screenProps} />
        ) : (
          <TripTimelineScreen trips={screenProps.trips} />
        )}
      </main>
    </div>
  );
}

