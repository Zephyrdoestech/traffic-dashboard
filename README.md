# Real-Time Traffic Dashboard

A full-stack traffic visualization dashboard that displays live real-world traffic data for Cebu City intersections. The application uses a Node.js/Express backend to poll real-world traffic data and broadcasts it in real-time to a React frontend dashboard via WebSockets.

## Features

- **Live Traffic Visualization**: Displays TomTom Raster Traffic Flow map tiles overlaid on dark mode base maps.
- **Real-Time Data Sync**: Backend engine periodically fetches current vehicle speeds and free-flow speeds from the TomTom API to accurately model traffic congestion.
- **WebSocket Streaming**: Uses Socket.io to push real-time traffic state updates to connected clients simultaneously.
- **Traffic Simulation & Controls**: Ability to manually control intersection capacities, report accidents, and run pathfinding routing optimizations.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Zustand (state management), React-Leaflet
- **Backend**: Node.js, Express, Socket.io, TypeScript
- **APIs**: TomTom Traffic Flow API, CARTO Basemaps

## Setup and Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Zephyrdoestech/traffic-dashboard.git
   cd traffic-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   To enable real-world traffic flows, you need a TomTom Developer API key. 
   Create a `.env` file in the root of the project:
   ```env
   TOMTOM_API_KEY=your_tomtom_api_key_here
   VITE_TOMTOM_API_KEY=your_tomtom_api_key_here
   ```

4. **Run the Application**

   You will need two terminal windows to run both the frontend and backend development servers.

   **Terminal 1 (Backend API Server & Simulator):**
   ```bash
   npm run server:dev
   ```

   **Terminal 2 (Frontend React App):**
   ```bash
   npm run dev
   ```

5. **Open the Dashboard**
   Navigate to `http://localhost:5173` in your browser.

## Architecture

- `src/engine/`: Core logic for managing traffic intersections, congestion logic, and calculating shortest/optimal paths between nodes.
- `server/services/traffic-api.ts`: Integration layer connecting to the external TomTom API for live congestion injection.
- `src/components/TrafficMap.tsx`: The primary Leaflet map component rendering the live data overlays.
