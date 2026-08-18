import { useTrafficStore } from '@/store';

export function TopBar() {
  const tick = useTrafficStore((s) => s.state.tick);
  const connected = useTrafficStore((s) => s.connected);

  return (
    <div className="glass px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
        <h1 className="text-white font-bold text-lg">
          Cebu City Traffic Command Center
        </h1>
      </div>
      <div className="flex items-center gap-4 text-slate-300 text-sm">
        <span>Tick: {tick}</span>
        {connected ? (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
            LIVE
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-400 text-xs font-semibold">
            LOCAL
          </span>
        )}
      </div>
    </div>
  );
}
