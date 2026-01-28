import React, { useMemo, useState } from 'react';
// import { Sidebar } from '@/components/Sidebar';
import { TripList } from '@/components/TripList';
import type { ViewState } from '@/types';
import type { TripsAndLoadsScreenProps } from './screens/TripsAndLoadsScreen';
import { TripsAndLoadsScreen } from './screens/TripsAndLoadsScreen';
import { TripTimelineScreen } from './screens/TripTimelineScreen';

export type TripsModuleView = Extract<ViewState, 'LIST' | 'LIST_V2' | 'TIMELINE'>;

export interface TripShellProps extends TripsAndLoadsScreenProps {
  initialView?: TripsModuleView;
  // Permite o host controlar o view (ou deixar interno)
  view?: TripsModuleView;
  onChangeView?: (view: TripsModuleView) => void;
  showSidebar?: boolean;
  /**
   * Por padrão, ocupa a altura da viewport (host demo).
   * No projeto oficial, use `container` para respeitar o layout pai.
   */
  heightMode?: 'screen' | 'container';
  /**
   * Permite o host controlar classes do container raiz.
   */
  className?: string;
  onEmitFiscal?: (loadId: string) => void;
}

export function TripShell({
  initialView = 'LIST_V2',
  view,
  onChangeView,
  // showSidebar = true, // Deprecated
  heightMode = 'screen',
  className = '',
  ...screenProps
}: TripShellProps) {
  const [internalView, setInternalView] = useState<TripsModuleView>(initialView);
  const currentView = view ?? internalView;
  const setView = onChangeView ?? setInternalView;

  // Handlers para V1 (TripList)
  const handleEditTrip = (trip: any) => {
    console.log('Edit trip:', trip.id);
  };
  const handleDeleteTrip = (tripId: string) => {
    console.log('Delete trip:', tripId);
  };

  const rootHeightClass = heightMode === 'screen' ? 'h-screen' : 'h-full min-h-0';

  return (
    <div className={`flex ${rootHeightClass} bg-gray-100 ${className}`}>
      {/* Sidebar removed - handled by SystemLayout */}
      <main className={`flex-1 overflow-auto`}>
        {currentView === 'LIST' ? (
          <TripList
            trips={screenProps.trips}
            availableDocs={screenProps.availableDocs}
            onCreateNew={screenProps.onCreateNew}
            onEditTrip={handleEditTrip}
            onDeleteTrip={handleDeleteTrip}
            onAddLeg={screenProps.onAddLeg}
            onAddDelivery={screenProps.onAddDelivery}
            onAddDocument={screenProps.onAddDocument}
          />
        ) : currentView === 'LIST_V2' ? (
          <TripsAndLoadsScreen {...screenProps} />
        ) : (
          <TripTimelineScreen trips={screenProps.trips} />
        )}
      </main>
    </div>
  );
}

