import { Server } from 'socket.io';
import type { TrafficState, TrafficAction, IntersectionStatus } from '../src/engine/types';
import { createInitialState, reduce } from '../src/engine/traffic-engine';
import { fetchAllTrafficData } from './services/traffic-api';

/**
 * Server-side traffic simulator.
 * Runs TIME_TICK on an interval and broadcasts state to all connected clients.
 * Also accepts actions dispatched from clients.
 */
export class TrafficSimulator {
  private state: TrafficState;
  private io: Server;
  private interval: ReturnType<typeof setInterval> | null = null;
  private apiInterval: ReturnType<typeof setInterval> | null = null;
  private tickIntervalMs: number;
  private apiIntervalMs: number = 30000; // Poll API every 30 seconds

  constructor(io: Server, tickIntervalMs = 5000) {
    this.io = io;
    this.state = createInitialState();
    this.tickIntervalMs = tickIntervalMs;
  }

  /** Start the automatic time tick simulation */
  start() {
    if (this.interval) return;
    console.log(`Simulator started — auto-tick every ${this.tickIntervalMs}ms`);
    this.interval = setInterval(() => {
      this.dispatch({ type: 'TIME_TICK' });
    }, this.tickIntervalMs);

    console.log(`Starting real-world traffic sync every ${this.apiIntervalMs}ms`);
    this.apiInterval = setInterval(async () => {
      await this.syncRealTraffic();
    }, this.apiIntervalMs);

    // Perform an initial sync immediately
    this.syncRealTraffic();
  }

  /** Stop the automatic simulation */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('Simulator stopped');
    }
    if (this.apiInterval) {
      clearInterval(this.apiInterval);
      this.apiInterval = null;
    }
  }

  /** Fetch real API data and dispatch SYNC_REAL_TRAFFIC */
  private async syncRealTraffic() {
    try {
      const data = await fetchAllTrafficData();
      const payload = data.map((d) => {
        const intersection = this.state.intersections[d.intersectionId];
        const capacity = intersection?.capacity || 100;
        
        let ratio = 0;
        if (d.freeFlowSpeed > 0) {
           ratio = Math.max(0, (d.freeFlowSpeed - d.currentSpeed) / d.freeFlowSpeed);
        }
        
        // Base traffic is 20% of capacity, scaled up to 100% based on speed reduction
        const vehicles = Math.floor(capacity * (0.2 + ratio * 0.8));
        const status: IntersectionStatus | undefined = d.roadClosure ? 'Closed' : undefined;

        return {
          intersectionId: d.intersectionId,
          vehicles,
          status
        };
      });
      
      this.dispatch({ type: 'SYNC_REAL_TRAFFIC', payload });
    } catch (e: any) {
      console.error('Failed to sync real traffic', e.message);
    }
  }

  /** Get current state snapshot */
  getState(): TrafficState {
    return this.state;
  }

  /** Dispatch an action, update state, and broadcast to all clients */
  dispatch(action: TrafficAction) {
    this.state = reduce(this.state, action);
    this.io.emit('state:update', {
      state: this.state,
      action,
      timestamp: Date.now(),
    });
  }

  /** Update the tick interval */
  setTickInterval(ms: number) {
    this.tickIntervalMs = ms;
    if (this.interval) {
      this.stop();
      this.start();
    }
  }
}
