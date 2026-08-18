import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { trafficRouter } from './routes/traffic';
import { TrafficSimulator } from './simulator';

const PORT = process.env.PORT || 4000;

const app = express();
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

// REST API routes
app.use('/api/traffic', trafficRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Traffic simulator (runs the engine server-side, broadcasts via Socket.IO)
const simulator = new TrafficSimulator(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send current state to newly connected client
  socket.emit('state:full', simulator.getState());

  // Client dispatches an action
  socket.on('action:dispatch', (action) => {
    simulator.dispatch(action);
  });

  // Client requests full state sync
  socket.on('state:request', () => {
    socket.emit('state:full', simulator.getState());
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Traffic Dashboard server running on http://localhost:${PORT}`);
  console.log(`WebSocket accepting connections`);
  simulator.start();
});

export { app, io };
