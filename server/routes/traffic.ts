import { Router } from 'express';
import { INTERSECTIONS, ADJACENCY } from '../../src/engine/data';

export const trafficRouter = Router();

/**
 * GET /api/traffic/intersections
 * Returns the static intersection definitions (capacity, coordinates, etc.)
 */
trafficRouter.get('/intersections', (_req, res) => {
  res.json({ intersections: INTERSECTIONS });
});

/**
 * GET /api/traffic/adjacency
 * Returns the adjacency graph
 */
trafficRouter.get('/adjacency', (_req, res) => {
  res.json({ adjacency: ADJACENCY });
});

/**
 * GET /api/traffic/config
 * Returns full network configuration (intersections + adjacency)
 */
trafficRouter.get('/config', (_req, res) => {
  res.json({
    intersections: INTERSECTIONS,
    adjacency: ADJACENCY,
    meta: {
      city: 'Cebu City',
      country: 'Philippines',
      nodeCount: INTERSECTIONS.length,
      edgeCount: Object.values(ADJACENCY).reduce((sum, neighbors) => sum + neighbors.length, 0) / 2,
    },
  });
});
