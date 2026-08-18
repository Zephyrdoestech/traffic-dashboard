import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useTrafficStore } from '@/store';
import type { TrafficState, TrafficAction } from '@/engine/types';

/** Singleton socket instance shared across the app */
let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
      timeout: 5000,
    });
  }
  return socketInstance;
}

/**
 * Hook that connects to the backend WebSocket server.
 * When connected, the dashboard receives real-time state updates
 * from the server-side simulator.
 *
 * Falls back gracefully to local-only mode if the server is unavailable.
 */
export function useSocket() {
  const mountedRef = useRef(false);

  useEffect(() => {
    // Prevent double-mount in StrictMode from creating duplicate listeners
    if (mountedRef.current) return;
    mountedRef.current = true;

    const socket = getSocket();

    socket.on('connect', () => {
      console.log('[Socket] Connected to traffic server');
      useTrafficStore.getState().setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from traffic server');
      useTrafficStore.getState().setConnected(false);
    });

    // Full state sync (on initial connect)
    socket.on('state:full', (state: TrafficState) => {
      useTrafficStore.getState().setStateFromServer(state);
    });

    // Incremental state update (on each tick or action)
    socket.on('state:update', (payload: { state: TrafficState; action: TrafficAction; timestamp: number }) => {
      useTrafficStore.getState().setStateFromServer(payload.state);
    });

    socket.on('connect_error', () => {
      // Server not available — continue in local mode silently
      useTrafficStore.getState().setConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('state:full');
      socket.off('state:update');
      socket.off('connect_error');
      mountedRef.current = false;
    };
  }, []);
}

/**
 * Returns a dispatch function that sends actions to the server when connected,
 * or falls back to local dispatch when offline.
 */
export function useRemoteDispatch() {
  const localDispatch = useTrafficStore((s) => s.dispatch);
  const connected = useTrafficStore((s) => s.connected);

  const dispatch = useCallback(
    (action: TrafficAction) => {
      if (connected && socketInstance?.connected) {
        socketInstance.emit('action:dispatch', action);
      } else {
        localDispatch(action);
      }
    },
    [connected, localDispatch]
  );

  return dispatch;
}
