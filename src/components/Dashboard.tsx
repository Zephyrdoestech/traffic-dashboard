import { TrafficMap } from './TrafficMap';
import { AlertFeed } from './AlertFeed';
import { CongestionBars } from './CongestionBars';
import { StatsBar } from './StatsBar';
import { Controls } from './Controls';
import { TopBar } from './TopBar';
import { RouteOptimizer } from './RouteOptimizer';
import { CongestionReportPanel } from './CongestionReportPanel';
import { useSocket } from '@/hooks/useSocket';

export function Dashboard() {
  // Connect to backend WebSocket (falls back to local mode if unavailable)
  useSocket();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Full-screen map background */}
      <div className="absolute inset-0 z-0">
        <TrafficMap />
      </div>

      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <TopBar />
      </div>

      {/* Left: Alert Feed */}
      <div className="absolute top-24 left-4 bottom-20 w-80 z-20">
        <AlertFeed />
      </div>

      {/* Right: Widgets */}
      <div className="absolute top-24 right-4 bottom-20 w-72 z-20 space-y-3 overflow-y-auto">
        <RouteOptimizer />
        <CongestionReportPanel />
        <Controls />
        <CongestionBars />
      </div>

      {/* Bottom Stats Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <StatsBar />
      </div>
    </div>
  );
}
