import { useCallback } from 'react';
import { useTrafficStore } from '@/store';
import { useRouteStore } from '@/store/route-store';
import { INTERSECTIONS } from '@/engine/data';
import { findOptimalRoute } from '@/engine/router';
import { getCongestionInfo } from '@/engine/traffic-engine';

export function RouteOptimizer() {
  const state = useTrafficStore((s) => s.state);
  const { route, originId, destinationId, setRoute, setOrigin, setDestination, clear } =
    useRouteStore();

  const computeRoute = useCallback(() => {
    if (!originId || !destinationId) return;
    if (originId === destinationId) {
      setRoute(null);
      return;
    }
    const result = findOptimalRoute(originId, destinationId, state);
    setRoute(result);
  }, [originId, destinationId, state, setRoute]);

  return (
    <div className="glass-strong p-4">
      <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
        <span className="text-cyan-400">⚡</span>
        Route Optimizer
      </h3>

      {/* Origin selector */}
      <div className="mb-2">
        <label className="text-[10px] text-slate-400 font-medium block mb-1">
          Origin
        </label>
        <select
          value={originId ?? ''}
          onChange={(e) => setOrigin(e.target.value || null)}
          className="w-full bg-white/10 text-white text-xs border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400/50"
        >
          <option value="" className="bg-slate-800">Select origin...</option>
          {INTERSECTIONS.map((def) => (
            <option key={def.id} value={def.id} className="bg-slate-800">
              {def.name}
            </option>
          ))}
        </select>
      </div>

      {/* Destination selector */}
      <div className="mb-3">
        <label className="text-[10px] text-slate-400 font-medium block mb-1">
          Destination
        </label>
        <select
          value={destinationId ?? ''}
          onChange={(e) => setDestination(e.target.value || null)}
          className="w-full bg-white/10 text-white text-xs border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400/50"
        >
          <option value="" className="bg-slate-800">Select destination...</option>
          {INTERSECTIONS.map((def) => (
            <option key={def.id} value={def.id} className="bg-slate-800">
              {def.name}
            </option>
          ))}
        </select>
      </div>

      {/* Compute button */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={computeRoute}
          disabled={!originId || !destinationId || originId === destinationId}
          className="flex-1 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-200 text-[10px] font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Find Optimal Route
        </button>
        <button
          onClick={clear}
          className="py-2 px-3 rounded-lg bg-slate-500/20 hover:bg-slate-500/30 border border-slate-400/30 text-slate-300 text-[10px] font-semibold transition"
        >
          Clear
        </button>
      </div>

      {/* Route result */}
      {route && (
        <div className="border border-white/10 rounded-lg p-3 bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-emerald-300 font-semibold uppercase">
              Optimal Path Found
            </span>
            <span className="text-[10px] text-slate-400">
              Cost: {route.totalCost.toFixed(1)}
            </span>
          </div>

          {/* Path visualization */}
          <div className="space-y-1">
            {route.path.map((nodeId, i) => {
              const inter = state.intersections[nodeId];
              if (!inter) return null;
              const info = getCongestionInfo(inter.vehicles, inter.capacity);
              const isLast = i === route.path.length - 1;

              return (
                <div key={nodeId} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: info.color }}
                  />
                  <span className="text-[10px] text-white flex-1 truncate">
                    {inter.name}
                  </span>
                  {!isLast && route.segmentCosts[i] !== undefined && (
                    <span className="text-[9px] text-slate-500">
                      +{route.segmentCosts[i].toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Avoided nodes */}
          {route.congestionAvoidance.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <span className="text-[9px] text-slate-400">
                Avoided ({route.congestionAvoidance.length} congested):{' '}
                {route.congestionAvoidance
                  .map((id) => state.intersections[id]?.name.split('×')[0].trim())
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* No route found */}
      {route === null && originId && destinationId && originId !== destinationId && (
        <div className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          No viable route found. All paths may be blocked by closures.
        </div>
      )}
    </div>
  );
}
