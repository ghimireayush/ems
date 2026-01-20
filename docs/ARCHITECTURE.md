# Nepal Elections 2026 - System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CITIZENS                                        │
│                        (Mobile / Web PWA)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React PWA)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   EventMap  │  │  EventList  │  │ EventDetail │  │  FilterBar  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────┐    │
│  │                        DATA PROVIDER                                 │    │
│  │   ┌─────────────┐         ┌─────────────┐                           │    │
│  │   │  JSON Mode  │   OR    │  API Mode   │  ← VITE_DATA_MODE env    │    │
│  │   │  (Static)   │         │  (Live)     │                           │    │
│  │   └─────────────┘         └─────────────┘                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ VITE_DATA_MODE=api
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│                          (OpenAPI 3.0 Spec)                                  │
│                                                                              │
│   GET /events              GET /events/nearby         GET /parties           │
│   GET /events/:id          POST /events/:id/rsvp      GET /constituencies    │
│   GET /constituencies/detect                           POST /auth/request-otp│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (Future)                                  │
│                       Node/Express or FastAPI                                │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                     PostgreSQL + PostGIS                              │  │
│   │                                                                       │  │
│   │   parties ─────┐                                                      │  │
│   │                │                                                      │  │
│   │   constituencies ─────┬───── events ─────┬───── event_tags           │  │
│   │                       │                  │                            │  │
│   │   venues ─────────────┘                  └───── rsvps ───── users    │  │
│   │                                                                       │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
nepal-elections/
├── src/
│   ├── data/                    # Static JSON (prototype data)
│   │   ├── parties.json
│   │   ├── constituencies.json
│   │   └── events.json
│   │
│   ├── api/                     # API integration layer
│   │   ├── client.ts            # TypeScript API client
│   │   └── dataProvider.ts      # JSON/API abstraction
│   │
│   ├── context/
│   │   └── AppContext.jsx       # Global state (useReducer)
│   │
│   ├── hooks/
│   │   ├── useEvents.js         # Event filtering/enrichment
│   │   └── useGeolocation.js    # Location services
│   │
│   ├── components/
│   │   ├── Map/EventMap.jsx
│   │   ├── Events/EventList.jsx
│   │   ├── Events/EventDetail.jsx
│   │   └── Layout/FilterBar.jsx
│   │
│   ├── utils/helpers.js
│   └── App.jsx
│
├── api/
│   └── openapi.yaml             # OpenAPI 3.0 specification
│
├── scripts/
│   └── generate-db.cjs          # DB schema & seed generator
│
├── sql/                         # Generated SQL files
│   ├── 001_schema.sql
│   └── 002_seed.sql
│
└── README.md
```

---

## Data Flow

### Read Flow (Citizen viewing events)
```
User Opens App
     │
     ▼
┌─────────────────┐
│ AppContext init │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  dataProvider   │────▶│  JSON / API     │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   useEvents()   │ ← Filtering, enrichment
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Components    │ ← EventList, EventMap
└─────────────────┘
```

### Write Flow (RSVP)
```
User Clicks RSVP
     │
     ▼
┌─────────────────┐
│ actions.rsvpEvent(id)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  dataProvider   │
│  .events.rsvp() │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────┐
│ JSON  │  │  API  │
│ Mode  │  │ Mode  │
│(local)│  │(POST) │
└───────┘  └───────┘
```

---

## Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `parties` | Political parties | id, name, color, leader |
| `constituencies` | Electoral boundaries | id, bounds (PostGIS), voters |
| `venues` | Event locations | id, location (PostGIS) |
| `events` | Campaign events | id, party_id, venue_id, datetime |
| `event_tags` | Many-to-many tags | event_id, tag |
| `users` | Citizens & admins | id, phone, role |
| `rsvps` | Event attendance | user_id, event_id, status |

### PostGIS Features

```sql
-- Find events within 5km
SELECT * FROM events_near(27.7172, 85.3240, 5000);

-- Detect constituency from coordinates
SELECT * FROM constituencies 
WHERE ST_Contains(bounds::geometry, ST_SetSRID(ST_MakePoint(lng, lat), 4326));
```

---

## API Endpoints Summary

### Public (No Auth)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/events` | List events with filters |
| GET | `/events/nearby` | Geo-proximity search |
| GET | `/events/:id` | Event details |
| GET | `/parties` | List parties |
| GET | `/constituencies` | List constituencies |
| GET | `/constituencies/detect` | Detect from lat/lng |

### Authenticated
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/events/:id/rsvp` | RSVP to event |
| DELETE | `/events/:id/rsvp` | Cancel RSVP |
| GET | `/users/me` | User profile |
| GET | `/users/me/rsvps` | User's RSVPs |

### Auth
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/request-otp` | Send OTP to phone |
| POST | `/auth/verify-otp` | Verify & get token |
| POST | `/auth/refresh` | Refresh JWT |

---

## Switching from JSON to API Mode

### Step 1: Set Environment
```bash
# .env
VITE_DATA_MODE=api
VITE_API_URL=https://api.nepalelections2026.np/v1
```

### Step 2: No Code Changes Required
The `dataProvider` automatically switches based on `VITE_DATA_MODE`.

### Step 3: Implement Backend
Use `api/openapi.yaml` to generate server stubs:
```bash
# Example with OpenAPI Generator
openapi-generator generate -i api/openapi.yaml -g nodejs-express-server -o backend/
```

---

## Regenerating Database

```bash
# Edit JSON files in src/data/

# Regenerate SQL
node scripts/generate-db.cjs --out=./sql

# Apply to database
psql -d nepal_elections -f sql/001_schema.sql
psql -d nepal_elections -f sql/002_seed.sql
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Management | useReducer + Context | Simple, no external deps |
| Data Layer | Switchable JSON/API | Prototype → Production path |
| Geo Queries | PostGIS | Native support, indexes |
| Auth | Phone OTP | Most accessible in Nepal |
| Schema Generator | Script from JSON | Single source of truth |
| API Spec | OpenAPI 3.0 | Code generation, documentation |

---

## Next Steps

1. **Phase 1 (Now):** Frontend prototype with JSON data
2. **Phase 2:** Implement backend from OpenAPI spec
3. **Phase 3:** Real constituency GeoJSON (165 boundaries)
4. **Phase 4:** SMS integration (Sparrow SMS)
5. **Phase 5:** Party admin portal

---

*Architecture documented by the Paladin. May the cathedral rise.*
