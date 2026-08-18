import { create } from 'zustand';
import type { TrafficState, TrafficAction, IntersectionState } from '@/engine/types';
import { createInitialState, reduce, getCongestionInfo } from '@/engine/traffic-engine';
import { ADJACENCY } from '@/engine/data';

export interface LogEntry {
  tick: number;
  message: string;
  timestamp: Date;
}

interface TrafficStore {
  /** Core traffic state */
  state: TrafficState;
  /** Action log */
  log: LogEntry[];
  /** Selected intersection id */
  selectedIntersectionId: string | null;
  /** Whether we're connected to the backend server */
  connected: boolean;

  /** Dispatch an action through the engine reducer */
  dispatch: (action: TrafficAction) => void;
  /** Replace state from server (used by WebSocket sync) */
  setStateFromServer: (state: TrafficState) => void;
  /** Set connection status */
  setConnected: (connected: boolean) => void;
  /** Select an intersection for detail view */
  selectIntersection: (id: string | null) => void;
  /** Get computed congestion info for an intersection */
  getCongestion: (id: string) => ReturnType<typeof getCongestionInfo>;
  /** Get neighbors of an intersection */
  getNeighbors: (id: string) => IntersectionState[];
  /** Get summary stats */
  getStats: () => {
    totalVehicles: number;
    avgCongestion: number;
    activeIncidents: number;
    flowRate: number;
  };
}

function describeAction(action: TrafficAction, state: TrafficState): string {
  const getName = (id: string) => state.intersections[id]?.name ?? id;

  switch (action.type) {
    case 'ADD_VEHICLES':
      return `Added ${action.count} vehicles to ${getName(action.intersectionId)}`;
    case 'REMOVE_VEHICLES':
      return `Removed ${action.count} vehicles from ${getName(action.intersectionId)}`;
    case 'CLOSE_INTERSECTION':
      return `Closed ${getName(action.intersectionId)} — vehicles redistributed`;
    case 'REPORT_ACCIDENT':
      return `Accident reported at ${getName(action.intersectionId)} — capacity reduced to 40%`;
    case 'OPEN_INTERSECTION':
      return `Reopened / cleared ${getName(action.intersectionId)}`;
    case 'REPORT_CONGESTION':
      return `Congestion reported at ${getName(action.intersectionId)} (${action.severity})`;
    case 'CLEAR_CONGESTION_REPORT':
      return `Congestion report cleared`;
    case 'TIME_TICK':
      return `Time advanced — natural flow cycle`;
    case 'RESET':
      return `State reset to initial conditions`;
  }
}

export const useTrafficStore = create<TrafficStore>((set, get) => ({
  state: createInitialState(),
  log: [],
  selectedIntersectionId: null,
  connected: false,

  dispatch: (action) => {
    const currentState = get().state;
    const newState = reduce(currentState, action);
    const entry: LogEntry = {
      tick: newState.tick,
      message: describeAction(action, currentState),
      timestamp: new Date(),
    };
    set({
      state: newState,
      log: [...get().log.slice(-49), entry], // keep last 50 entries
    });
  },

  selectIntersection: (id) => {
    set({ selectedIntersectionId: id });
  },

  setStateFromServer: (serverState) => {
    set({ state: serverState });
  },

  setConnected: (connected) => {
    set({ connected });
  },

  getCongestion: (id) => {
    const inter = get().state.intersections[id];
    if (!inter) return { level: 'Free Flow' as const, ratio: 0, color: '#22c55e' };
    return getCongestionInfo(inter.vehicles, inter.capacity);
  },

  getNeighbors: (id) => {
    const neighborIds = ADJACENCY[id] || [];
    const intersections = get().state.intersections;
    return neighborIds.map((nId) => intersections[nId]).filter(Boolean);
  },

  getStats: () => {
    const intersections = Object.values(get().state.intersections);
    const totalVehicles = intersections.reduce((sum, i) => sum + i.vehicles, 0);
    const avgCongestion = Math.round(
      intersections.reduce((sum, i) => sum + (i.vehicles / i.capacity) * 100, 0) /
        intersections.length
    );
    const activeIncidents = intersections.filter((i) => i.status !== 'Open').length;
    const flowRate = Math.max(0, 100 - avgCongestion);
    return { totalVehicles, avgCongestion, activeIncidents, flowRate };
  },
}));
