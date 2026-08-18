import { useTrafficStore } from '@/store';
import { INTERSECTIONS } from '@/engine/data';
import { getCongestionInfo } from '@/engine/traffic-engine';

export function CongestionBars() {
  const intersections = useTrafficStore((s) => s.state.intersections);

  return (
    <div className="glass-strong p-4">
      <h3 className="text-white font-semibold text-sm mb-3">Congestion Breakdown</h3>
      <div className="space-y-2">
        {INTERSECTIONS.map((def) => {
          const inter = intersections[def.id];
          if (!inter) return null;

          const info = getCongestionInfo(inter.vehicles, inter.capacity);
          const pct = Math.min(100, Math.round(info.ratio * 100));

          return (
            <div key={def.id}>
              <div className="flex justify-between text-[10px] text-slate-300 mb-1">
                <span className="truncate mr-2">
                  {inter.name.split('×')[0].trim()}
                </span>
                <span style={{ color: info.color }} className="font-semibold">
                  {pct}%
                  {inter.status !== 'Open' && (
                    <span className="ml-1 text-[9px] opacity-75">
                      ({inter.status})
                    </span>
                  )}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: info.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
