# Nepal Elections 2026 - Citizen Event Platform

A frontend prototype for discovering political events during Nepal's March 2026 elections.

## Architecture

```
src/
├── data/                    # Static JSON data (mock backend)
│   ├── parties.json         # Political parties with real data
│   ├── constituencies.json  # FPTP constituencies with geo bounds
│   └── events.json          # Campaign events with venues
│
├── context/
│   └── AppContext.jsx       # Global state management (useReducer)
│
├── hooks/                   # Custom hooks (data access layer)
│   ├── useEvents.js         # Filtered/enriched event access
│   └── useGeolocation.js    # Location + distance calculations
│
├── components/
│   ├── Map/
│   │   └── EventMap.jsx     # Leaflet map with markers & boundaries
│   ├── Events/
│   │   ├── EventList.jsx    # Searchable, sortable event list
│   │   └── EventDetail.jsx  # Full event details + RSVP
│   └── Layout/
│       └── FilterBar.jsx    # Filter controls
│
├── utils/
│   └── helpers.js           # Date formatting, distance, colors
│
└── App.jsx                  # Main layout composition
```

## Key Design Decisions

### 1. JSON-Driven (No Server)
All data lives in `/src/data/`. Swap these files to change content.
When ready for a backend, replace imports with API calls in `AppContext.jsx`.

### 2. Constituency-Aware
- Each constituency has `bounds` (lat/lng rectangle)
- User location auto-detects constituency
- Events filter by constituency
- Map shows constituency boundaries (click to filter)

### 3. Separation of Concerns
- **Context**: State + actions only
- **Hooks**: Data transformation + filtering logic  
- **Components**: Pure presentation
- **Utils**: Stateless helpers

### 4. Geo-First
- Haversine distance calculation
- Sort by proximity
- Google Maps integration (directions link)

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Data Structure

### parties.json
```json
{
  "id": "nc",
  "name": "Nepali Congress",
  "nameNepali": "नेपाली कांग्रेस",
  "shortName": "NC",
  "color": "#1e88e5",
  "leader": "Sher Bahadur Deuba"
}
```

### constituencies.json
```json
{
  "id": "ktm-1",
  "name": "Kathmandu-1",
  "center": [27.7172, 85.3240],
  "bounds": [[lat,lng], [lat,lng], [lat,lng], [lat,lng]],
  "registeredVoters": 89234
}
```

### events.json
```json
{
  "id": "evt-001",
  "title": "NC Rally: Vision for Kathmandu",
  "partyId": "nc",
  "constituencyId": "ktm-1",
  "type": "rally",
  "venue": {
    "name": "Basantapur Durbar Square",
    "coordinates": [27.7042, 85.3066]
  },
  "datetime": "2026-02-15T14:00:00+05:45",
  "rsvpCount": 1234
}
```

## Next Steps (Backend Integration)

1. Replace JSON imports with `fetch()` calls
2. Add authentication for RSVP
3. WebSocket for live RSVP counts
4. Real constituency GeoJSON (165 boundaries)
5. SMS notification service integration

## Tech Stack

- React 18 + Vite
- Leaflet + react-leaflet (maps)
- OpenStreetMap tiles
- No UI framework (inline styles for speed)

---

Built for Nepal
