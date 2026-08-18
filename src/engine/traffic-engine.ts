import type {
  TrafficState,
  TrafficAction,
  IntersectionState,
  CongestionLevel,
  CongestionInfo,
  CongestionReport,
  CongestionSeverity,
} from './types';
import { INTERSECTIONS, ADJACENCY } from './data';

/**
 * Determine congestion level from vehicle count and capacity.
 */
export function getCongestionLevel(vehicles: number, capacity: number): CongestionLevel {
  const ratio = vehicles / capacity;
  if (ratio < 0.4) return 'Free Flow';
  if (ratio < 0.7) return 'Moderate';
  if (ratio < 0.95) return 'Heavy';
  return 'Gridlock';
}

/**
 * Get full congestion info including color for rendering.
 */
export function getCongestionInfo(vehicles: number, capacity: number): CongestionInfo {
  const ratio = vehicles / capacity;
  const level = getCongestionLevel(vehicles, capacity);
  const colorMap: Record<CongestionLevel, string> = {
    'Free Flow': '#22c55e',
    'Moderate': '#eab308',
    'Heavy': '#f97316',
    'Gridlock': '#ef4444',
  };
  return { level, ratio, color: colorMap[level] };
}

/**
 * Get the effective capacity considering status and active congestion reports.
 * Closed = 0, Accident = 40% of normal.
 * Congestion reports further reduce effective capacity.
 */
export function getEffectiveCapacity(
  intersection: IntersectionState,
  reports?: CongestionReport[]
): number {
  if (intersection.status === 'Closed') return 0;

  let cap = intersection.capacity;
  if (intersection.status === 'Accident') {
    cap = Math.floor(cap * 0.4);
  }

  // Apply congestion report penalties
  if (reports && reports.length > 0) {
    const activeReports = reports.filter((r) => r.intersectionId === intersection.id);
    for (const report of activeReports) {
      const penalty = severityPenalty(report.severity);
      cap = Math.floor(cap * (1 - penalty));
    }
  }

  return Math.max(1, cap); // never fully zero from reports alone
}

/**
 * How much capacity is reduced per congestion report severity.
 */
function severityPenalty(severity: CongestionSeverity): number {
  switch (severity) {
    case 'minor': return 0.1;
    case 'moderate': return 0.25;
    case 'severe': return 0.5;
  }
}

/**
 * Generate a unique report ID.
 */
function generateReportId(): string {
  return `cr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create the initial traffic state with ~30% load at each intersection.
 */
export function createInitialState(): TrafficState {
  const intersections: Record<string, IntersectionState> = {};
  for (const def of INTERSECTIONS) {
    intersections[def.id] = {
      id: def.id,
      name: def.name,
      capacity: def.capacity,
      vehicles: Math.floor(def.capacity * 0.3),
      status: 'Open',
      lat: def.lat,
      lng: def.lng,
    };
  }
  return { intersections, congestionReports: [], tick: 0 };
}

/**
 * Distribute overflow vehicles to adjacent open intersections.
 */
function redistributeOverflow(
  state: TrafficState,
  sourceId: string,
  overflowAmount: number
): TrafficState {
  const neighbors = ADJACENCY[sourceId] || [];
  const openNeighbors = neighbors.filter(
    (nId) => state.intersections[nId].status !== 'Closed'
  );

  if (openNeighbors.length === 0) return state; // vehicles stuck

  const perNeighbor = Math.ceil(overflowAmount / openNeighbors.length);
  const newState = structuredClone(state);

  for (const nId of openNeighbors) {
    newState.intersections[nId].vehicles += perNeighbor;
  }

  return newState;
}

/**
 * Remove expired congestion reports.
 */
function pruneExpiredReports(reports: CongestionReport[], now: number): CongestionReport[] {
  return reports.filter((r) => r.expiresAt > now);
}

/**
 * Pure reducer: takes current state + action, returns new state.
 * This is the core logic of the traffic simulation.
 */
export function reduce(state: TrafficState, action: TrafficAction): TrafficState {
  let newState = structuredClone(state);

  switch (action.type) {
    case 'ADD_VEHICLES': {
      const inter = newState.intersections[action.intersectionId];
      if (!inter) return state;
      inter.vehicles += action.count;
      return newState;
    }

    case 'REMOVE_VEHICLES': {
      const inter = newState.intersections[action.intersectionId];
      if (!inter) return state;
      inter.vehicles = Math.max(0, inter.vehicles - action.count);
      return newState;
    }

    case 'CLOSE_INTERSECTION': {
      const inter = newState.intersections[action.intersectionId];
      if (!inter || inter.status === 'Closed') return state;
      const strandedVehicles = inter.vehicles;
      inter.status = 'Closed';
      inter.vehicles = 0;
      newState = redistributeOverflow(newState, action.intersectionId, strandedVehicles);
      return newState;
    }

    case 'REPORT_ACCIDENT': {
      const inter = newState.intersections[action.intersectionId];
      if (!inter || inter.status === 'Closed') return state;
      inter.status = 'Accident';
      const effectiveCap = getEffectiveCapacity(inter, newState.congestionReports);
      if (inter.vehicles > effectiveCap) {
        const overflow = inter.vehicles - effectiveCap;
        inter.vehicles = effectiveCap;
        newState = redistributeOverflow(newState, action.intersectionId, overflow);
      }
      return newState;
    }

    case 'OPEN_INTERSECTION': {
      const inter = newState.intersections[action.intersectionId];
      if (!inter || inter.status === 'Open') return state;
      inter.status = 'Open';
      return newState;
    }

    case 'REPORT_CONGESTION': {
      const inter = newState.intersections[action.intersectionId];
      if (!inter) return state;

      const report: CongestionReport = {
        id: generateReportId(),
        intersectionId: action.intersectionId,
        severity: action.severity,
        description: action.description,
        reportedAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000, // expires after 30 minutes
      };
      newState.congestionReports.push(report);

      // Immediately add vehicles to simulate the reported congestion
      const vehicleBoost = Math.floor(
        inter.capacity * severityPenalty(action.severity) * 0.5
      );
      inter.vehicles += vehicleBoost;

      // If over effective capacity, overflow to neighbors
      const effCap = getEffectiveCapacity(inter, newState.congestionReports);
      if (inter.vehicles > effCap) {
        const overflow = Math.floor((inter.vehicles - effCap) * 0.3);
        inter.vehicles -= overflow;
        newState = redistributeOverflow(newState, action.intersectionId, overflow);
      }

      return newState;
    }

    case 'CLEAR_CONGESTION_REPORT': {
      newState.congestionReports = newState.congestionReports.filter(
        (r) => r.id !== action.reportId
      );
      return newState;
    }

    case 'SYNC_REAL_TRAFFIC': {
      for (const data of action.payload) {
        const inter = newState.intersections[data.intersectionId];
        if (inter) {
          inter.vehicles = data.vehicles;
          if (data.status) {
            inter.status = data.status;
          }
        }
      }
      
      // Cascade: overflow 30% of excess to neighbors based on the new real data
      for (const inter of Object.values(newState.intersections)) {
        const effCap = getEffectiveCapacity(inter, newState.congestionReports);
        if (effCap > 0 && inter.vehicles > effCap) {
          const overflow = Math.floor((inter.vehicles - effCap) * 0.3);
          inter.vehicles -= overflow;
          newState = redistributeOverflow(newState, inter.id, overflow);
        }
      }
      return newState;
    }

    case 'TIME_TICK': {
      newState.tick += 1;

      // Prune expired congestion reports
      newState.congestionReports = pruneExpiredReports(
        newState.congestionReports,
        Date.now()
      );

      // Natural flow: outflow (vehicles leave) + inflow (new vehicles enter)
      for (const inter of Object.values(newState.intersections)) {
        if (inter.status === 'Closed') continue;
        const outflow = Math.floor(inter.vehicles * (0.1 + Math.random() * 0.05));
        const inflow = Math.floor(inter.capacity * (0.05 + Math.random() * 0.08));
        inter.vehicles = Math.max(0, inter.vehicles - outflow + inflow);
      }

      // Cascade: overflow 30% of excess to neighbors
      for (const inter of Object.values(newState.intersections)) {
        const effCap = getEffectiveCapacity(inter, newState.congestionReports);
        if (effCap > 0 && inter.vehicles > effCap) {
          const overflow = Math.floor((inter.vehicles - effCap) * 0.3);
          inter.vehicles -= overflow;
          newState = redistributeOverflow(newState, inter.id, overflow);
        }
      }

      return newState;
    }

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}

/** Re-export data for convenience */
export { INTERSECTIONS, ADJACENCY } from './data';
