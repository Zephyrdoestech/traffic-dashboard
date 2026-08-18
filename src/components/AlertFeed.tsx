import { useTrafficStore } from '@/store';
import type { LogEntry } from '@/store';

function severityFromMessage(message: string): 'critical' | 'warning' | 'info' {
  if (message.includes('Closed') || message.includes('Accident')) return 'critical';
  if (message.includes('Added') || message.includes('Removed')) return 'warning';
  return 'info';
}

function severityStyles(severity: 'critical' | 'warning' | 'info') {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'warning':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    default:
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  }
}

function severityDot(severity: 'critical' | 'warning' | 'info') {
  switch (severity) {
    case 'critical':
      return 'bg-red-400';
    case 'warning':
      return 'bg-amber-400';
    default:
      return 'bg-blue-400';
  }
}

export function AlertFeed() {
  const log = useTrafficStore((s) => s.log);
  const reversedLog = [...log].reverse();

  return (
    <div className="glass-strong h-full p-4 flex flex-col">
      <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        Live Activity Feed
      </h2>

      {reversedLog.length === 0 ? (
        <p className="text-slate-400 text-xs">
          No actions yet. Use the controls to interact with the traffic network.
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {reversedLog.map((entry: LogEntry, i: number) => {
            const severity = severityFromMessage(entry.message);
            return (
              <div
                key={i}
                className={`p-2 rounded-lg border ${severityStyles(severity)} transition-all`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${severityDot(severity)} mt-1.5 shrink-0`}
                  />
                  <div>
                    <div className="text-[10px] font-medium">{entry.message}</div>
                    <div className="text-[9px] opacity-60 mt-0.5">
                      Tick {entry.tick} ·{' '}
                      {entry.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
