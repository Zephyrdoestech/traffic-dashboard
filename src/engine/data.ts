import type { IntersectionDef, AdjacencyMap } from './types';

/**
 * Cebu City intersection definitions with real-world coordinates.
 * These form the nodes of the traffic network graph.
 */
export const INTERSECTIONS: IntersectionDef[] = [
  {
    id: 'colon-osmena',
    name: 'Colon × Osmeña Blvd',
    capacity: 120,
    lat: 10.2969,
    lng: 123.8972,
  },
  {
    id: 'fuente-osmena',
    name: 'Fuente Osmeña Circle',
    capacity: 150,
    lat: 10.3103,
    lng: 123.8916,
  },
  {
    id: 'mango-jones',
    name: 'Mango Ave × Gen. Maxilom',
    capacity: 100,
    lat: 10.3118,
    lng: 123.8977,
  },
  {
    id: 'srp-mambaling',
    name: 'SRP × Mambaling',
    capacity: 180,
    lat: 10.2862,
    lng: 123.8841,
  },
  {
    id: 'banilad-talamban',
    name: 'Banilad × Talamban Rd',
    capacity: 130,
    lat: 10.3350,
    lng: 123.9060,
  },
  {
    id: 'capitol-escario',
    name: 'Capitol × Escario',
    capacity: 110,
    lat: 10.3155,
    lng: 123.8920,
  },
];

/**
 * Adjacency graph: which intersections overflow into which
 * when closed or overloaded.
 */
export const ADJACENCY: AdjacencyMap = {
  'colon-osmena': ['fuente-osmena', 'mango-jones'],
  'fuente-osmena': ['colon-osmena', 'capitol-escario', 'mango-jones'],
  'mango-jones': ['fuente-osmena', 'colon-osmena', 'capitol-escario'],
  'srp-mambaling': ['colon-osmena', 'banilad-talamban'],
  'banilad-talamban': ['srp-mambaling', 'capitol-escario'],
  'capitol-escario': ['fuente-osmena', 'mango-jones', 'banilad-talamban'],
};
