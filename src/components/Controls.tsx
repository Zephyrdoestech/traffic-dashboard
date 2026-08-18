import { useState } from 'react';
import { INTERSECTIONS } from '@/engine/data';
import { useRemoteDispatch } from '@/hooks/useSocket';

export function Controls() {
  const dispatch = useRemoteDispatch();
  const [selectedId, setSelectedId] = useState(INTERSECTIONS[0].id);
  const [vehicleCount, setVehicleCount] = useState(20);

  return (
    <div className="glass-strong p-4">
      <h3 className="text-white font-semibold text-sm mb-3">Traffic Controls</h3>

      {/* Intersection selector */}
      <div className="mb-3">
        <label className="text-[10px] text-slate-400 font-medium block mb-1">
          Target Intersection
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full bg-white/10 text-white text-xs border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400/50"
        >
          {INTERSECTIONS.map((def) => (
            <option key={def.id} value={def.id} className="bg-slate-800">
              {def.name}
            </option>
          ))}
        </select>
      </div>

      {/* Vehicle count */}
      <div className="mb-3">
        <label className="text-[10px] text-slate-400 font-medium block mb-1">
          Vehicle Count
        </label>
        <input
          type="number"
          min={1}
          max={200}
          value={vehicleCount}
          onChange={(e) => setVehicleCount(parseInt(e.target.value) || 20)}
          className="w-full bg-white/10 text-white text-xs border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400/50"
        />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() =>
            dispatch({ type: 'ADD_VEHICLES', intersectionId: selectedId, count: vehicleCount })
          }
          className="py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-200 text-[10px] font-semibold transition"
        >
          Add Vehicles
        </button>
        <button
          onClick={() =>
            dispatch({ type: 'REMOVE_VEHICLES', intersectionId: selectedId, count: vehicleCount })
          }
          className="py-2 rounded-lg bg-slate-500/20 hover:bg-slate-500/30 border border-slate-400/30 text-slate-200 text-[10px] font-semibold transition"
        >
          Remove Vehicles
        </button>
      </div>

      {/* Status actions */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() =>
            dispatch({ type: 'CLOSE_INTERSECTION', intersectionId: selectedId })
          }
          className="py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-200 text-[10px] font-semibold transition"
        >
          Close
        </button>
        <button
          onClick={() =>
            dispatch({ type: 'REPORT_ACCIDENT', intersectionId: selectedId })
          }
          className="py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 text-[10px] font-semibold transition"
        >
          Accident
        </button>
        <button
          onClick={() =>
            dispatch({ type: 'OPEN_INTERSECTION', intersectionId: selectedId })
          }
          className="py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-200 text-[10px] font-semibold transition"
        >
          Reopen
        </button>
      </div>

      {/* Simulation */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => dispatch({ type: 'TIME_TICK' })}
          className="py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-200 text-[10px] font-semibold transition"
        >
          Advance Time
        </button>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/30 text-violet-200 text-[10px] font-semibold transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
