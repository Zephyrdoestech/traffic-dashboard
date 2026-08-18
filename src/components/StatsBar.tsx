import { useTrafficStore } from '@/store';

export function StatsBar() {
  const { totalVehicles, avgCongestion, activeIncidents, flowRate } =
    useTrafficStore((s) => s.getStats());

  return (
    <div className="glass px-6 py-3 flex items-center justify-between">
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{totalVehicles}</div>
        <div className="text-xs text-slate-400">Total Vehicles</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-amber-400">{avgCongestion}%</div>
        <div className="text-xs text-slate-400">Avg Congestion</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-400">{activeIncidents}</div>
        <div className="text-xs text-slate-400">Active Incidents</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-400">{flowRate}%</div>
        <div className="text-xs text-slate-400">Flow Rate</div>
      </div>
    </div>
  );
}
