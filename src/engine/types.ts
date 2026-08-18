/** Congestion level classification */
export type CongestionLevel = 'Free Flow' | 'Moderate' | 'Heavy' | 'Gridlock';

/** Intersection operational status */
export type IntersectionStatus = 'Open' | 'Closed' | 'Accident';

/** Congestion report severity */
export type CongestionSeverity = 'minor' | 'moderate' | 'severe';

/** A manually reported congestion event */
export interface CongestionReport {
  id: string;
  intersectionId: string;
  severity: CongestionSeverity;
  description: string;
  reportedAt: number; // timestamp
  expiresAt: number; // auto-expire timestamp
}

/** Single intersection definition (static config) */
export interface IntersectionDef {
  id: string;
  name: string;
  capacity: number;
  lat: number;
  lng: number;
}

/** Runtime state for a single intersection */
export interface IntersectionState {
  id: string;
  name: string;
  capacity: number;
  vehicles: number;
  status: IntersectionStatus;
  lat: number;
  lng: number;
}

/** Adjacency map: intersection id → list of neighbor ids */
export type AdjacencyMap = Record<string, string[]>;

/** Full traffic network state */
export interface TrafficState {
  intersections: Record<string, IntersectionState>;
  congestionReports: CongestionReport[];
  tick: number;
}

/** All possible action types */
export type TrafficAction =
  | { type: 'ADD_VEHICLES'; intersectionId: string; count: number }
  | { type: 'REMOVE_VEHICLES'; intersectionId: string; count: number }
  | { type: 'CLOSE_INTERSECTION'; intersectionId: string }
  | { type: 'REPORT_ACCIDENT'; intersectionId: string }
  | { type: 'OPEN_INTERSECTION'; intersectionId: string }
  | { type: 'REPORT_CONGESTION'; intersectionId: string; severity: CongestionSeverity; description: string }
  | { type: 'CLEAR_CONGESTION_REPORT'; reportId: string }
  | { type: 'TIME_TICK' }
  | { type: 'SYNC_REAL_TRAFFIC'; payload: { intersectionId: string; vehicles: number; status?: IntersectionStatus }[] }
  | { type: 'RESET' };

/** Congestion info with computed color for rendering */
export interface CongestionInfo {
  level: CongestionLevel;
  ratio: number;
  color: string;
}

/** Result from the route optimizer */
export interface OptimizedRoute {
  path: string[]; // ordered intersection IDs from origin to destination
  totalCost: number; // sum of edge weights (lower = better)
  segmentCosts: number[]; // cost of each segment
  congestionAvoidance: string[]; // IDs of heavily congested nodes avoided
}
