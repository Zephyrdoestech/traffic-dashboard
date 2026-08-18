import { useState } from 'react';
import { useTrafficStore } from '@/store';
import { useRemoteDispatch } from '@/hooks/useSocket';
import { INTERSECTIONS } from '@/engine/data';
import type { CongestionSeverity } from '@/engine/types';

const SEVERITY_OPTIONS: { value: CongestionSeverity; label: string; color: string }[] = [
  { value: 'minor', label: 'Minor', color: 'text-yellow-300' },
  { value: 'moderate', label: 'Moderate', color: 'text-orange-300' },
  { value: 'severe', label: 'Severe', color: 'text-red-300' },
];

export function CongestionReportPanel() {
  const dispatch = useRemoteDispatch();
  const congestionReports = useTrafficStore((s) => s.state.congestionReports);
  const intersections = useTrafficStore((s) => s.state.intersections);

  const [selectedId, setSelectedId] = useState(INTERSECTIONS[0].id);
  const [severity, setSeverity] = useState<CongestionSeverity>('moderate');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedId) return;
    dispatch({
      type: 'REPORT_CONGESTION',
      intersectionId: selectedId,
      severity,
      description: description || `${severity} congestion reported`,
    });
    setDescription('');
  };

  const handleClear = (reportId: string) => {
    dispatch({ type: 'CLEAR_CONGESTION_REPORT', reportId });
  };

  return (
    <div className="glass-strong p-4">
      <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
        <span className="text-amber-400">🚧</span>
        Report Congestion
      </h3>

      {/* Intersection selector */}
      <div className="mb-2">
        <label className="text-[10px] text-slate-400 font-medium block mb-1">
          Intersection
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

      {/* Severity */}
      <div className="mb-2">
        <label className="text-[10px] text-slate-400 font-medium block mb-1">
          Severity
        </label>
        <div className="flex gap-2">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSeverity(opt.value)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition ${
                severity === opt.value
                  ? `bg-white/15 border-white/30 ${opt.color}`
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="text-[10px] text-slate-400 font-medium block mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Road construction, event traffic..."
          className="w-full bg-white/10 text-white text-xs border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400/50 placeholder:text-slate-500"
        />
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 text-[10px] font-semibold transition"
      >
        Submit Report
      </button>

      {/* Active reports */}
      {congestionReports.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <h4 className="text-[10px] text-slate-400 font-semibold mb-2 uppercase">
            Active Reports ({congestionReports.length})
          </h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {congestionReports.map((report) => {
              const inter = intersections[report.intersectionId];
              const severityColor =
                report.severity === 'severe'
                  ? 'text-red-300'
                  : report.severity === 'moderate'
                  ? 'text-orange-300'
                  : 'text-yellow-300';

              return (
                <div
                  key={report.id}
                  className="flex items-center gap-2 p-1.5 rounded-md bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-white truncate">
                      {inter?.name ?? report.intersectionId}
                    </div>
                    <div className={`text-[9px] ${severityColor}`}>
                      {report.severity} · {report.description}
                    </div>
                  </div>
                  <button
                    onClick={() => handleClear(report.id)}
                    className="shrink-0 text-[9px] text-slate-400 hover:text-red-300 transition px-1"
                    title="Clear report"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
