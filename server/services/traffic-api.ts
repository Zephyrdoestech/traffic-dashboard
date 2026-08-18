import axios from 'axios';
import dotenv from 'dotenv';
import { INTERSECTIONS } from '../../src/engine/data';

dotenv.config();

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY || '';

export interface TrafficApiData {
  intersectionId: string;
  currentSpeed: number;
  freeFlowSpeed: number;
  roadClosure: boolean;
}

/**
 * Fetch real-time traffic flow data for a single intersection using TomTom API.
 */
async function fetchIntersectionData(lat: number, lng: number, id: string): Promise<TrafficApiData | null> {
  if (!TOMTOM_API_KEY) {
    throw new Error("TOMTOM_API_KEY is missing from the environment variables.");
  }

  try {
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lng}&key=${TOMTOM_API_KEY}`;
    const response = await axios.get(url);
    const flow = response.data.flowSegmentData;

    return {
      intersectionId: id,
      currentSpeed: flow.currentSpeed,
      freeFlowSpeed: flow.freeFlowSpeed,
      roadClosure: flow.roadClosure,
    };
  } catch (error: any) {
    console.error(`Error fetching traffic for ${id}:`, error.message);
    return null;
  }
}

/**
 * Fetch real-time traffic data for all intersections.
 */
export async function fetchAllTrafficData(): Promise<TrafficApiData[]> {
  const promises = INTERSECTIONS.map((intersection) =>
    fetchIntersectionData(intersection.lat, intersection.lng, intersection.id)
  );

  const results = await Promise.all(promises);
  return results.filter((data): data is TrafficApiData => data !== null);
}
