import { create } from 'zustand';
import type { OptimizedRoute } from '@/engine/types';

interface RouteStore {
  /** Currently computed optimized route (null = none) */
  route: OptimizedRoute | null;
  /** Origin intersection ID */
  originId: string | null;
  /** Destination intersection ID */
  destinationId: string | null;

  setRoute: (route: OptimizedRoute | null) => void;
  setOrigin: (id: string | null) => void;
  setDestination: (id: string | null) => void;
  clear: () => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
  route: null,
  originId: null,
  destinationId: null,

  setRoute: (route) => set({ route }),
  setOrigin: (id) => set({ originId: id }),
  setDestination: (id) => set({ destinationId: id }),
  clear: () => set({ route: null, originId: null, destinationId: null }),
}));
