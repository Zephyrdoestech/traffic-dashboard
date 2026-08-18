import type { TrafficState, OptimizedRoute, CongestionReport } from './types';
import { ADJACENCY } from './data';
import { getEffectiveCapacity, getCongestionLevel } from './traffic-engine';

/**
 * Compute the traversal cost (weight) for entering a given intersection.
 * Higher cost = more congested = less desirable.
 *
 * Factors:
 * - Vehicle/capacity ratio (primary weight)
 * - Status penalties (Accident = 3x, Closed = Infinity)
 * - Active congestion reports add extra penalty
 */
function getNodeCost(
  intersectionId: string,
  state: TrafficState,
  reports: CongestionReport[]
): number {
  const inter = state.intersections[intersectionId];
  if (!inter) return Infinity;

  // Closed intersections are impassable
  if (inter.status === 'Closed') return Infinity;

  const effCap = getEffectiveCapacity(inter, reports);
  const ratio = effCap > 0 ? inter.vehicles / effCap : 10;

  // Base cost: exponential curve so gridlock is very expensive
  let cost = 1 + Math.pow(ratio, 2);

  // Accident penalty: 3x multiplier
  if (inter.status === 'Accident') {
    cost *= 3;
  }

  // Additional penalty from active congestion reports
  const activeReports = reports.filter((r) => r.intersectionId === intersectionId);
  for (const report of activeReports) {
    switch (report.severity) {
      case 'minor': cost *= 1.3; break;
      case 'moderate': cost *= 1.8; break;
      case 'severe': cost *= 3.0; break;
    }
  }

  return cost;
}

/**
 * Simple priority queue for Dijkstra's algorithm.
 */
class MinHeap {
  private items: { id: string; cost: number }[] = [];

  push(id: string, cost: number) {
    this.items.push({ id, cost });
    this.items.sort((a, b) => a.cost - b.cost);
  }

  pop(): { id: string; cost: number } | undefined {
    return this.items.shift();
  }

  get size() {
    return this.items.length;
  }
}

/**
 * Find the optimal (least-congested) route between two intersections
 * using Dijkstra's algorithm with congestion-weighted edges.
 *
 * Returns null if no path exists (e.g., all routes blocked by closures).
 */
export function findOptimalRoute(
  originId: string,
  destinationId: string,
  state: TrafficState
): OptimizedRoute | null {
  if (originId === destinationId) {
    return { path: [originId], totalCost: 0, segmentCosts: [], congestionAvoidance: [] };
  }

  const reports = state.congestionReports;
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();
  const heap = new MinHeap();

  // Initialize distances
  for (const id of Object.keys(state.intersections)) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[originId] = 0;
  heap.push(originId, 0);

  while (heap.size > 0) {
    const current = heap.pop()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === destinationId) break;

    const neighbors = ADJACENCY[current.id] || [];
    for (const neighborId of neighbors) {
      if (visited.has(neighborId)) continue;

      const edgeCost = getNodeCost(neighborId, state, reports);
      if (edgeCost === Infinity) continue; // skip impassable nodes

      const newDist = dist[current.id] + edgeCost;
      if (newDist < dist[neighborId]) {
        dist[neighborId] = newDist;
        prev[neighborId] = current.id;
        heap.push(neighborId, newDist);
      }
    }
  }

  // Reconstruct path
  if (dist[destinationId] === Infinity) return null;

  const path: string[] = [];
  let current: string | null = destinationId;
  while (current !== null) {
    path.unshift(current);
    current = prev[current];
  }

  // Compute per-segment costs
  const segmentCosts: number[] = [];
  for (let i = 1; i < path.length; i++) {
    segmentCosts.push(getNodeCost(path[i], state, reports));
  }

  // Identify heavily congested nodes that were avoided
  const pathSet = new Set(path);
  const congestionAvoidance: string[] = [];
  for (const [id, inter] of Object.entries(state.intersections)) {
    if (pathSet.has(id)) continue;
    const level = getCongestionLevel(inter.vehicles, inter.capacity);
    if (level === 'Heavy' || level === 'Gridlock' || inter.status !== 'Open') {
      congestionAvoidance.push(id);
    }
  }

  return {
    path,
    totalCost: dist[destinationId],
    segmentCosts,
    congestionAvoidance,
  };
}

/**
 * Get the cost of a specific edge for display purposes.
 */
export function getEdgeCost(_fromId: string, toId: string, state: TrafficState): number {
  return getNodeCost(toId, state, state.congestionReports);
}
