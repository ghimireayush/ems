# Nepal Elections 2026 - Use Cases & E2E Test Plans

## Document Purpose

This document defines the core use cases for the Nepal Elections 2026 citizen platform and provides end-to-end test plans that validate complete user journeys. Tests are designed for quality over quantity—each test validates a meaningful business flow, not isolated technical operations.

---

## System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ACTORS                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CITIZEN (Primary)                    SYSTEM                                 │
│  ─────────────────                    ──────                                 │
│  • Wants to discover events           • PostgreSQL + PostGIS                 │
│  • Wants to RSVP                       • FastAPI backend                     │
│  • Has a phone number                  • React frontend                      │
│  • May or may not be logged in         • Nginx reverse proxy                │
│  • Has GPS location (optional)                                               │
│                                                                              │
│  PARTY ADMIN (Future)                 EXTERNAL                               │
│  ────────────────────                 ────────                               │
│  • Creates events                      • SMS Gateway (mock)                  │
│  • Views analytics                     • Google Maps (directions)            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Use Case 1: Event Discovery

### UC-1.1: Citizen Discovers Events Near Their Location

**Actor:** Anonymous Citizen with GPS enabled

**Preconditions:**
- System has seeded events with venue coordinates
- Citizen's browser supports geolocation

**Flow:**
1. Citizen opens the application
2. Browser requests location permission
3. Citizen grants permission
4. System detects coordinates (e.g., 27.7172, 85.3240)
5. System queries events within default radius (5km)
6. System displays events sorted by distance
7. Map centers on citizen's location with event markers

**Postconditions:**
- Citizen sees events nearest to them first
- Each event shows distance (e.g., "1.2 km away")
- Map shows citizen's position and event markers

**Business Value:** Citizens find relevant local events without manual searching.

---

### UC-1.2: Citizen Filters Events by Party

**Actor:** Anonymous Citizen

**Preconditions:**
- System has events from multiple parties

**Flow:**
1. Citizen views event list (showing all parties)
2. Citizen selects "Nepali Congress" from party filter
3. System filters to show only NC events
4. Map updates to show only NC markers
5. Citizen clears filter
6. System shows all events again

**Postconditions:**
- Only events matching filter are displayed
- Count/UI reflects filtered state
- Filter state persists during session

**Business Value:** Citizens can focus on parties they're interested in.

---

### UC-1.3: Citizen Discovers Their Constituency

**Actor:** Anonymous Citizen with GPS enabled

**Preconditions:**
- System has constituency boundaries (PostGIS polygons)
- Citizen is within a defined constituency

**Flow:**
1. Citizen grants location permission
2. System detects coordinates
3. System performs point-in-polygon query against constituency bounds
4. System identifies constituency (e.g., "Kathmandu-1")
5. System displays constituency name in UI
6. System can auto-filter events to this constituency

**Postconditions:**
- Citizen knows their constituency
- Can filter events to their constituency

**Business Value:** Citizens understand their electoral context.

---

## Use Case 2: Authentication

### UC-2.1: New Citizen Registers via Phone OTP

**Actor:** Anonymous Citizen

**Preconditions:**
- Citizen has a valid Nepal phone number
- Citizen is not previously registered

**Flow:**
1. Citizen clicks "Login"
2. Citizen enters phone number (+9779812345678)
3. Citizen clicks "Send OTP"
4. System generates OTP (mock: always 123456)
5. System creates OTP record with 5-minute expiry
6. Citizen receives OTP (mock: shown in UI for dev)
7. Citizen enters OTP
8. System validates OTP
9. System creates new user record in database
10. System generates access token and refresh token
11. System stores tokens in localStorage
12. UI updates to show logged-in state

**Postconditions:**
- User record exists in `users` table
- Citizen is authenticated
- Token persists across page refresh

**Business Value:** Frictionless registration—no password, no email, just phone.

---

### UC-2.2: Returning Citizen Logs In

**Actor:** Previously registered Citizen

**Preconditions:**
- Citizen has existing record in `users` table

**Flow:**
1. Citizen clicks "Login"
2. Citizen enters same phone number as before
3. System sends OTP
4. Citizen verifies OTP
5. System finds existing user record (by phone hash)
6. System generates new tokens
7. Citizen is logged in with existing profile

**Postconditions:**
- No duplicate user created
- Same user ID as previous sessions
- Previous RSVPs still associated with user

**Business Value:** Seamless return experience.

---

### UC-2.3: Session Persistence Across Refresh

**Actor:** Authenticated Citizen

**Preconditions:**
- Citizen is logged in
- Token stored in localStorage

**Flow:**
1. Citizen refreshes the page
2. App initializes
3. App checks localStorage for existing token
4. App validates token is not expired
5. App retrieves user info
6. UI shows logged-in state immediately

**Postconditions:**
- No re-login required
- User context preserved

**Business Value:** Friction-free return visits.

---

## Use Case 3: RSVP

### UC-3.1: Authenticated Citizen RSVPs to Event

**Actor:** Authenticated Citizen

**Preconditions:**
- Citizen is logged in
- Citizen has not RSVPed to this event
- Event exists with rsvp_count = N

**Flow:**
1. Citizen views event detail
2. Citizen clicks "RSVP to this Event"
3. Frontend sends POST /events/{id}/rsvp with Bearer token
4. Backend validates token
5. Backend inserts record into `rsvps` table
6. Database trigger fires, increments `events.rsvp_count`
7. Backend returns new rsvp_count
8. UI updates button to "✓ You're Going!"
9. UI updates displayed RSVP count

**Postconditions:**
- `rsvps` table has new record (user_id, event_id, status='going')
- `events.rsvp_count` = N + 1
- User sees confirmation

**Business Value:** Citizen commits to attending; party gets attendance signal.

---

### UC-3.2: Anonymous Citizen Attempts RSVP

**Actor:** Anonymous Citizen

**Preconditions:**
- Citizen is NOT logged in

**Flow:**
1. Citizen views event detail
2. Button shows "🔐 Login to RSVP"
3. Citizen clicks button
4. Login modal opens
5. Citizen completes login flow
6. Citizen is now authenticated
7. Citizen can now RSVP

**Postconditions:**
- No RSVP created while anonymous
- Smooth transition to authenticated state

**Business Value:** Gentle nudge to register without blocking discovery.

---

### UC-3.3: Citizen RSVPs to Multiple Events

**Actor:** Authenticated Citizen

**Preconditions:**
- Citizen is logged in
- Multiple events exist

**Flow:**
1. Citizen RSVPs to Event A
2. Citizen navigates to Event B
3. Citizen RSVPs to Event B
4. Citizen views "My RSVPs" (future feature) or checks both events

**Postconditions:**
- Two records in `rsvps` table for this user
- Each event's rsvp_count incremented independently
- No interference between RSVPs

**Business Value:** Citizens can plan to attend multiple events.

---

### UC-3.4: Citizen Cannot Double-RSVP

**Actor:** Authenticated Citizen

**Preconditions:**
- Citizen has already RSVPed to Event A

**Flow:**
1. Citizen views Event A detail
2. Button shows "✓ You're Going!" (disabled)
3. If citizen somehow sends another RSVP request:
   - Backend performs UPSERT (ON CONFLICT DO UPDATE)
   - Status updated but no new row created
   - Trigger does NOT fire (no INSERT)
   - rsvp_count unchanged

**Postconditions:**
- Still exactly one record in `rsvps` for this user+event
- rsvp_count not inflated

**Business Value:** Data integrity; accurate attendance counts.

---

## Use Case 4: Data Integrity

### UC-4.1: RSVP Count Matches Actual RSVPs

**Actor:** System

**Preconditions:**
- Fresh database with seeded events
- `003_reset_rsvp.sql` has run (all rsvp_count = 0)

**Invariant:**
At any point in time:
```sql
SELECT e.id, e.rsvp_count, COUNT(r.id) as actual
FROM events e
LEFT JOIN rsvps r ON r.event_id = e.id
GROUP BY e.id
HAVING e.rsvp_count != COUNT(r.id);
```
**Must return 0 rows.**

**Business Value:** Trust in displayed numbers.

---

## E2E Test Plans

### Test Environment

```yaml
Prerequisites:
  - Docker and Docker Compose installed
  - Ports 3000, 8000, 5432 available
  - No pre-existing nepal-elections containers

Setup:
  1. docker compose down -v  # Clean slate
  2. docker compose up -d    # Fresh start
  3. Wait for all services healthy
  4. Verify: make verify-data shows expected counts

Teardown:
  - docker compose down -v
```

---

### E2E-01: Complete New User Journey

**Objective:** Validate that a brand new user can discover events, register, and RSVP—the entire happy path.

**Priority:** Critical

**Duration:** ~2 minutes manual, ~30 seconds automated

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEST FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DISCOVER (Anonymous)                                                     │
│     ├── Open http://localhost:3000                                           │
│     ├── Verify: Events load (list not empty)                                │
│     ├── Verify: Map displays with markers                                   │
│     ├── Click on any event                                                  │
│     └── Verify: Event detail shows, RSVP button says "Login to RSVP"        │
│                                                                              │
│  2. REGISTER                                                                 │
│     ├── Click "Login" button in header                                      │
│     ├── Enter phone: +9779811111111 (new number)                            │
│     ├── Click "Send OTP"                                                    │
│     ├── Verify: OTP screen appears, dev_otp shown                           │
│     ├── Enter OTP: 123456                                                   │
│     ├── Click "Verify & Login"                                              │
│     └── Verify: Modal closes, header shows user menu                        │
│                                                                              │
│  3. RSVP                                                                     │
│     ├── Navigate to event detail (if not already there)                     │
│     ├── Verify: RSVP button now says "RSVP to this Event"                   │
│     ├── Click RSVP button                                                   │
│     ├── Verify: Button changes to "✓ You're Going!"                         │
│     └── Verify: RSVP count incremented by 1                                 │
│                                                                              │
│  4. VALIDATE DATABASE                                                        │
│     ├── docker compose exec db psql -U nepal -d nepal_elections             │
│     ├── SELECT * FROM users WHERE phone = '+9779811111111';                 │
│     │   └── Verify: 1 row returned                                          │
│     ├── SELECT * FROM rsvps WHERE user_id = '<id from above>';              │
│     │   └── Verify: 1 row with correct event_id                             │
│     └── SELECT rsvp_count FROM events WHERE id = '<event_id>';              │
│         └── Verify: Count is 1 (was 0 after reset)                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

PASS CRITERIA:
  ✓ User record created in database
  ✓ RSVP record created in database  
  ✓ Event rsvp_count accurately reflects 1 RSVP
  ✓ UI shows consistent state throughout
```

---

### E2E-02: RSVP Count Integrity Under Multiple Users

**Objective:** Validate that RSVP counts remain accurate when multiple users RSVP to the same event.

**Priority:** Critical

**Duration:** ~3 minutes manual, ~45 seconds automated

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEST FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SETUP                                                                       │
│     ├── Fresh database (docker compose down -v && up -d)                    │
│     ├── Verify: Event 'evt-001' has rsvp_count = 0                          │
│     └── Verify: rsvps table is empty                                        │
│                                                                              │
│  USER A                                                                      │
│     ├── Login with phone +9779800000001                                     │
│     ├── RSVP to evt-001                                                     │
│     └── Logout (or use incognito for User B)                                │
│                                                                              │
│  USER B                                                                      │
│     ├── Login with phone +9779800000002                                     │
│     ├── RSVP to evt-001                                                     │
│     └── Logout                                                              │
│                                                                              │
│  USER C                                                                      │
│     ├── Login with phone +9779800000003                                     │
│     ├── RSVP to evt-001                                                     │
│     └── Remain logged in                                                    │
│                                                                              │
│  VALIDATE                                                                    │
│     ├── UI shows rsvp_count = 3 for evt-001                                 │
│     ├── SQL: SELECT COUNT(*) FROM rsvps WHERE event_id = 'evt-001';         │
│     │   └── Returns: 3                                                      │
│     ├── SQL: SELECT rsvp_count FROM events WHERE id = 'evt-001';            │
│     │   └── Returns: 3                                                      │
│     └── SQL: (Integrity check from UC-4.1)                                  │
│         └── Returns: 0 rows (no mismatches)                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

PASS CRITERIA:
  ✓ 3 distinct users in users table
  ✓ 3 RSVP records in rsvps table
  ✓ events.rsvp_count = 3
  ✓ COUNT(rsvps) = events.rsvp_count (integrity holds)
```

---

### E2E-03: Idempotent RSVP (No Double-Count)

**Objective:** Validate that a user cannot inflate RSVP count by RSVPing multiple times.

**Priority:** High

**Duration:** ~2 minutes manual, ~20 seconds automated

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEST FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SETUP                                                                       │
│     ├── Fresh database                                                      │
│     ├── Login as User A                                                     │
│     └── Note: evt-002 has rsvp_count = 0                                    │
│                                                                              │
│  FIRST RSVP                                                                  │
│     ├── RSVP to evt-002                                                     │
│     ├── Verify: Button shows "✓ You're Going!"                              │
│     └── Verify: rsvp_count = 1                                              │
│                                                                              │
│  ATTEMPT DUPLICATE (via API)                                                 │
│     ├── curl -X POST http://localhost:8000/v1/events/evt-002/rsvp \         │
│     │        -H "Authorization: Bearer <token>"                             │
│     ├── Response should succeed (UPSERT)                                    │
│     └── Verify: rsvp_count still = 1 (not 2)                                │
│                                                                              │
│  ATTEMPT DUPLICATE (via UI refresh)                                          │
│     ├── Refresh page                                                        │
│     ├── Navigate to evt-002                                                 │
│     ├── Verify: Button still shows "✓ You're Going!"                        │
│     └── Verify: rsvp_count still = 1                                        │
│                                                                              │
│  VALIDATE                                                                    │
│     ├── SQL: SELECT COUNT(*) FROM rsvps                                     │
│     │        WHERE user_id = '<A>' AND event_id = 'evt-002';                │
│     │   └── Returns: 1 (not 2 or more)                                      │
│     └── SQL: SELECT rsvp_count FROM events WHERE id = 'evt-002';            │
│         └── Returns: 1                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

PASS CRITERIA:
  ✓ Only 1 RSVP record exists regardless of attempts
  ✓ rsvp_count = 1 (no inflation)
  ✓ UPSERT handles duplicate gracefully
```

---

### E2E-04: Session Persistence and Token Validity

**Objective:** Validate that authentication persists across page refresh and that expired tokens are handled gracefully.

**Priority:** High

**Duration:** ~2 minutes manual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEST FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PART A: Session Persists                                                    │
│     ├── Login as User A                                                     │
│     ├── Verify: Header shows user menu                                      │
│     ├── Hard refresh (Ctrl+Shift+R)                                         │
│     ├── Verify: Still logged in (no login prompt)                           │
│     ├── Close browser tab completely                                        │
│     ├── Open new tab, navigate to app                                       │
│     └── Verify: Still logged in (token in localStorage)                     │
│                                                                              │
│  PART B: Logout Clears Session                                               │
│     ├── Click user menu → Logout                                            │
│     ├── Verify: Header shows "Login" button                                 │
│     ├── Check localStorage: token should be cleared                         │
│     ├── Refresh page                                                        │
│     └── Verify: Still logged out                                            │
│                                                                              │
│  PART C: Invalid Token Handling                                              │
│     ├── Login as User A                                                     │
│     ├── Manually corrupt token in localStorage                              │
│     │   (DevTools → Application → localStorage → edit value)                │
│     ├── Attempt to RSVP                                                     │
│     ├── Verify: API returns 401                                             │
│     └── Verify: UI handles gracefully (shows login prompt or error)         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

PASS CRITERIA:
  ✓ Valid token survives refresh
  ✓ Logout clears all auth state
  ✓ Invalid token doesn't crash app
  ✓ API rejects invalid token with 401
```

---

### E2E-05: Geo-Based Event Discovery

**Objective:** Validate that location-based features work correctly with real PostGIS queries.

**Priority:** Medium

**Duration:** ~3 minutes manual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEST FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SETUP                                                                       │
│     ├── Know the seeded event locations (from events.json)                  │
│     │   Example: evt-001 is at [27.7041, 85.3143] (Basantapur)              │
│     └── Know constituency bounds (from constituencies.json)                 │
│                                                                              │
│  TEST NEARBY EVENTS (API)                                                    │
│     ├── curl "http://localhost:8000/v1/events/nearby?lat=27.7041&lng=85.3143&radius=1000"
│     ├── Verify: evt-001 is in results (it's at this exact location)         │
│     ├── Verify: distance_meters ≈ 0 for evt-001                             │
│     ├── Verify: Events beyond 1km are NOT in results                        │
│     └── Verify: Results sorted by distance ascending                        │
│                                                                              │
│  TEST CONSTITUENCY DETECTION (API)                                           │
│     ├── curl "http://localhost:8000/v1/constituencies/detect?lat=27.7172&lng=85.3240"
│     ├── Verify: Returns a constituency (likely ktm-1 or ktm-2)              │
│     ├── Test with point outside all boundaries:                             │
│     │   curl "...?lat=26.0&lng=84.0"                                        │
│     └── Verify: Returns 404 (no constituency found)                         │
│                                                                              │
│  TEST VIA UI                                                                 │
│     ├── Mock geolocation to Basantapur coordinates                          │
│     │   (Chrome DevTools → Sensors → Location → Custom)                     │
│     ├── Refresh app                                                         │
│     ├── Verify: Map centers on mocked location                              │
│     ├── Verify: Nearby events show distance                                 │
│     └── Verify: Events sorted by proximity                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

PASS CRITERIA:
  ✓ PostGIS ST_DWithin query returns correct events
  ✓ Distance calculations are accurate (within 10m tolerance)
  ✓ Constituency detection works for points inside bounds
  ✓ Constituency detection returns 404 for points outside all bounds
```

---

### E2E-06: Filter Combinations

**Objective:** Validate that multiple filters work correctly together.

**Priority:** Medium

**Duration:** ~2 minutes manual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEST FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SINGLE FILTERS                                                              │
│     ├── Filter by party = "nc"                                              │
│     │   └── Verify: Only NC events shown                                    │
│     ├── Clear, filter by constituency = "ktm-1"                             │
│     │   └── Verify: Only Kathmandu-1 events shown                           │
│     └── Clear, filter by event_type = "rally"                               │
│         └── Verify: Only rallies shown                                      │
│                                                                              │
│  COMBINED FILTERS                                                            │
│     ├── Filter: party = "nc" AND constituency = "ktm-1"                     │
│     │   └── Verify: Only NC events in Kathmandu-1                           │
│     ├── Add: event_type = "rally"                                           │
│     │   └── Verify: Only NC rallies in Kathmandu-1                          │
│     └── If no events match all criteria:                                    │
│         └── Verify: Empty state shown gracefully                            │
│                                                                              │
│  FILTER + SEARCH                                                             │
│     ├── Filter: party = "nc"                                                │
│     ├── Search: "vision"                                                    │
│     └── Verify: Only NC events containing "vision" in title/description     │
│                                                                              │
│  CLEAR ALL                                                                   │
│     ├── Click "Clear Filters" (if exists) or clear each                     │
│     └── Verify: All events shown again                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

PASS CRITERIA:
  ✓ Each filter works independently
  ✓ Filters combine with AND logic
  ✓ Empty results handled gracefully
  ✓ Clear restores full list
```

---

### E2E-07: Data Survives Backend Restart

**Objective:** Validate that user data and RSVPs persist in PostgreSQL across backend restarts.

**Priority:** High

**Duration:** ~3 minutes manual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEST FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SETUP STATE                                                                 │
│     ├── Login as User A (+9779800000099)                                    │
│     ├── RSVP to evt-001                                                     │
│     ├── RSVP to evt-002                                                     │
│     ├── Verify: 2 RSVPs in database                                         │
│     └── Note the user ID from database                                      │
│                                                                              │
│  RESTART BACKEND                                                             │
│     ├── docker compose restart backend                                      │
│     ├── Wait for healthy                                                    │
│     └── Note: Tokens are in-memory, will be lost (expected)                 │
│                                                                              │
│  VERIFY PERSISTENCE                                                          │
│     ├── SQL: SELECT * FROM users WHERE phone = '+9779800000099';            │
│     │   └── User still exists ✓                                             │
│     ├── SQL: SELECT * FROM rsvps WHERE user_id = '<id>';                    │
│     │   └── Both RSVPs still exist ✓                                        │
│     └── SQL: SELECT rsvp_count FROM events WHERE id IN ('evt-001','evt-002');
│         └── Counts still correct ✓                                          │
│                                                                              │
│  VERIFY RE-LOGIN                                                             │
│     ├── UI will show logged out (token invalid after restart)               │
│     ├── Login again with same phone                                         │
│     ├── Verify: Same user ID (not new user)                                 │
│     ├── Navigate to evt-001                                                 │
│     └── Verify: Button shows "✓ You're Going!" (RSVP recognized)            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

PASS CRITERIA:
  ✓ User record survives restart
  ✓ RSVP records survive restart
  ✓ RSVP counts accurate after restart
  ✓ Re-login reconnects to same user (no duplicate)
  ✓ Previous RSVPs recognized after re-login
```

---

## Test Matrix Summary

| Test ID | Use Cases Covered | Priority | Automation Candidate |
|---------|-------------------|----------|----------------------|
| E2E-01 | UC-1.1, UC-2.1, UC-3.1 | Critical | Yes (Playwright/Cypress) |
| E2E-02 | UC-3.1, UC-4.1 | Critical | Yes |
| E2E-03 | UC-3.4, UC-4.1 | High | Yes |
| E2E-04 | UC-2.2, UC-2.3 | High | Yes |
| E2E-05 | UC-1.1, UC-1.3 | Medium | Partial (API only) |
| E2E-06 | UC-1.2 | Medium | Yes |
| E2E-07 | UC-4.1 | High | Yes |

---

## Automation Notes

### Recommended Stack
- **Frontend E2E:** Playwright (better for geo mocking)
- **API E2E:** pytest + httpx
- **Database assertions:** Direct psycopg2 in tests

### Key Test Utilities Needed
```python
# test_helpers.py

def create_test_user(phone: str) -> tuple[str, str]:
    """Login and return (user_id, access_token)"""
    
def get_event_rsvp_count(event_id: str) -> int:
    """Direct DB query for rsvp_count"""
    
def get_actual_rsvp_count(event_id: str) -> int:
    """COUNT(*) from rsvps table"""
    
def assert_rsvp_integrity():
    """Run UC-4.1 invariant check, fail if any mismatch"""
```

### CI Pipeline Suggestion
```yaml
test-e2e:
  steps:
    - docker compose up -d
    - wait-for-healthy
    - pytest tests/e2e/ -v
    - docker compose down -v
```

---

## Appendix: SQL Verification Queries

```sql
-- A. Count all seeded entities
SELECT 'parties' as entity, COUNT(*) as count FROM parties
UNION ALL SELECT 'constituencies', COUNT(*) FROM constituencies  
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'venues', COUNT(*) FROM venues
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'rsvps', COUNT(*) FROM rsvps;

-- B. RSVP integrity check (should return 0 rows)
SELECT e.id, e.rsvp_count as stored, COUNT(r.id) as actual
FROM events e
LEFT JOIN rsvps r ON r.event_id = e.id
GROUP BY e.id, e.rsvp_count
HAVING e.rsvp_count != COUNT(r.id);

-- C. User's RSVPs
SELECT u.phone, e.title, r.status, r.created_at
FROM rsvps r
JOIN users u ON u.id = r.user_id
JOIN events e ON e.id = r.event_id
ORDER BY r.created_at DESC;

-- D. Events with most RSVPs
SELECT e.id, e.title, e.rsvp_count
FROM events e
ORDER BY e.rsvp_count DESC
LIMIT 5;
```

---

*Document Version: 1.0*
*Prepared by: The Paladin*
*Date: January 2026*
