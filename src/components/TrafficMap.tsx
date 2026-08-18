import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import { useTrafficStore } from '@/store';
import { useRouteStore } from '@/store/route-store';
import { ADJACENCY } from '@/engine/data';
import { getCongestionInfo } from '@/engine/traffic-engine';
import type { LatLngExpression } from 'leaflet';

/** Cebu City center coordinates */
const CEBU_CENTER: LatLngExpression = [10.3103, 123.8950];

function congestionColor(vehicles: number, capacity: number, status: string): string {
  if (status === 'Closed') return '#64748b';
  return getCongestionInfo(vehicles, capacity).color;
}

/**
 * Inner component that subscribes to store changes.
 * Must be a child of MapContainer so it re-renders when state changes.
 */
function MapContent() {
  const intersections = useTrafficStore((s) => s.state.intersections);
  const congestionReports = useTrafficStore((s) => s.state.congestionReports);
  const selectIntersection = useTrafficStore((s) => s.selectIntersection);
  const route = useRouteStore((s) => s.route);

  // Force Leaflet to invalidate size on mount (fixes gray tiles)
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [map]);

  const interList = Object.values(intersections);

  // Build road edges (deduplicated)
  const drawnEdges = new Set<string>();
  const edges: { from: string; to: string; color: string; opacity: number }[] = [];

  for (const [fromId, neighbors] of Object.entries(ADJACENCY)) {
    for (const toId of neighbors) {
      const key = [fromId, toId].sort().join('--');
      if (drawnEdges.has(key)) continue;
      drawnEdges.add(key);

      const from = intersections[fromId];
      const to = intersections[toId];
      if (!from || !to) continue;

      const isClosed = from.status === 'Closed' || to.status === 'Closed';
      const color = isClosed
        ? '#475569'
        : getCongestionInfo(
            Math.max(from.vehicles, to.vehicles),
            Math.min(from.capacity, to.capacity)
          ).color;

      edges.push({ from: fromId, to: toId, color, opacity: isClosed ? 0.3 : 0.7 });
    }
  }

  // Build optimized route path segments for highlighting
  const routeSegments: LatLngExpression[][] = [];
  if (route && route.path.length > 1) {
    for (let i = 0; i < route.path.length - 1; i++) {
      const fromInter = intersections[route.path[i]];
      const toInter = intersections[route.path[i + 1]];
      if (fromInter && toInter) {
        routeSegments.push([
          [fromInter.lat, fromInter.lng],
          [toInter.lat, toInter.lng],
        ]);
      }
    }
  }

  // Set of intersection IDs with active congestion reports
  const reportedIds = new Set(congestionReports.map((r) => r.intersectionId));

  return (
    <>
      {/* Road connections (removed for realistic view) */}

      {/* Optimized route highlight (drawn on top) */}
      {routeSegments.map((positions, i) => (
        <Polyline
          key={`route-seg-${i}`}
          positions={positions}
          pathOptions={{
            color: '#06b6d4',
            weight: 6,
            opacity: 0.9,
            dashArray: '12, 8',
          }}
        />
      ))}

      {/* Route glow effect (wider, translucent underlay) */}
      {routeSegments.map((positions, i) => (
        <Polyline
          key={`route-glow-${i}`}
          positions={positions}
          pathOptions={{
            color: '#06b6d4',
            weight: 14,
            opacity: 0.2,
          }}
        />
      ))}

      {/* Intersection nodes (removed for realistic view) */}
    </>
  );
}

export function TrafficMap() {
  return (
    <div className="w-full h-full">
      <MapContainer
        center={CEBU_CENTER}
        zoom={14}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#0f172a' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {import.meta.env.VITE_TOMTOM_API_KEY && (
          <TileLayer
            attribution='&copy; <a href="https://tomtom.com/">TomTom</a>'
            url={`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${import.meta.env.VITE_TOMTOM_API_KEY}`}
            opacity={0.8}
            zIndex={10}
          />
        )}
        <MapContent />
      </MapContainer>
    </div>
  );
}
