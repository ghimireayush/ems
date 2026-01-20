"""
Nepal Elections 2026 - Backend API
Full PostgreSQL implementation
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from contextlib import contextmanager
import os
import math
import hashlib
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor

# ============================================================================
# CONFIGURATION
# ============================================================================

DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql://nepal:nepal2026@localhost:5436/nepal_elections"
)

# For Docker: use service name
if os.environ.get("DOCKER_ENV"):
    DATABASE_URL = "postgresql://nepal:nepal2026@db:5436/nepal_elections"

# ============================================================================
# DATABASE CONNECTION
# ============================================================================

def get_db_connection():
    """Create a new database connection."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

# ============================================================================
# IN-MEMORY STORES (ephemeral data only)
# ============================================================================

# Tokens are ephemeral - OK to keep in memory
TOKENS = {}  # token -> {user_id, expires_at, type}

# OTP is mock - stays in memory
OTP_STORAGE = {}  # phone -> {otp, expires_at}

# Test credentials
TEST_OTP = "123456"

security = HTTPBearer(auto_error=False)

# ============================================================================
# APP SETUP
# ============================================================================

app = FastAPI(
    title="Nepal Elections 2026 API",
    version="1.0.0",
    description="API for citizen event discovery platform - Full DB Mode"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class OtpRequest(BaseModel):
    phone: str

class OtpVerify(BaseModel):
    phone: str
    otp: str

class RsvpRequest(BaseModel):
    status: str = "going"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    constituency_id: Optional[str] = None

# ============================================================================
# AUTH HELPERS
# ============================================================================

def generate_token():
    return secrets.token_urlsafe(32)

def generate_user_id(phone: str):
    return hashlib.sha256(phone.encode()).hexdigest()[:16]

def get_or_create_user(phone: str) -> dict:
    """Get existing user or create new one in database."""
    user_id = generate_user_id(phone)
    
    with get_db() as conn:
        cur = conn.cursor()
        
        # Try to get existing user
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        
        if user:
            return dict(user)
        
        # Create new user
        cur.execute("""
            INSERT INTO users (id, phone, role, created_at, updated_at)
            VALUES (%s, %s, 'citizen', NOW(), NOW())
            RETURNING *
        """, (user_id, phone))
        
        user = cur.fetchone()
        return dict(user)

def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user from database by ID."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        return dict(user) if user else None

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """Dependency to get current user from token."""
    if not credentials:
        return None
    
    token = credentials.credentials
    if token not in TOKENS:
        return None
    
    token_data = TOKENS[token]
    if datetime.utcnow() > token_data["expires_at"]:
        del TOKENS[token]
        return None
    
    return get_user_by_id(token_data["user_id"])

async def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """Dependency that requires authentication."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = credentials.credentials
    if token not in TOKENS:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    token_data = TOKENS[token]
    if datetime.utcnow() > token_data["expires_at"]:
        del TOKENS[token]
        raise HTTPException(status_code=401, detail="Token expired")
    
    user = get_user_by_id(token_data["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# ============================================================================
# DATABASE QUERY HELPERS
# ============================================================================

def row_to_event(row: dict) -> dict:
    """Convert database row to API event format."""
    return {
        "id": row["id"],
        "title": row["title"],
        "title_nepali": row.get("title_nepali"),
        "party_id": row.get("party_id"),
        "constituency_id": row.get("constituency_id"),
        "type": row["event_type"],
        "status": row.get("status", "confirmed"),
        "description": row.get("description"),
        "datetime": row["datetime"].isoformat() if row.get("datetime") else None,
        "end_time": row["end_time"].isoformat() if row.get("end_time") else None,
        "speakers": row.get("speakers") or [],
        "expected_attendance": row.get("expected_attendance", 0),
        "rsvp_count": row.get("rsvp_count", 0),
        "venue": {
            "name": row.get("venue_name"),
            "address": row.get("venue_address"),
            "coordinates": [row["venue_lat"], row["venue_lng"]] if row.get("venue_lat") else None,
        } if row.get("venue_name") else None,
        "party": {
            "id": row["party_id"],
            "name": row.get("party_name"),
            "short_name": row.get("party_short_name"),
            "color": row.get("party_color"),
        } if row.get("party_name") else None,
        "constituency": {
            "id": row["constituency_id"],
            "name": row.get("constituency_name"),
            "province": row.get("province"),
            "district": row.get("district"),
            "registered_voters": row.get("registered_voters", 0),
        } if row.get("constituency_name") else None,
        "tags": row.get("tags") or [],
    }

def row_to_party(row: dict) -> dict:
    """Convert database row to API party format."""
    return {
        "id": row["id"],
        "name": row["name"],
        "name_nepali": row.get("name_nepali"),
        "short_name": row["short_name"],
        "color": row.get("color"),
        "ideology": row.get("ideology"),
        "leader": row.get("leader"),
        "founded": row.get("founded"),
        "symbol": row.get("symbol"),
        "website": row.get("website"),
        "logoUrl": row.get("logo_url"),
    }

def row_to_constituency(row: dict) -> dict:
    """Convert database row to API constituency format."""
    import json
    
    # Parse bounds from GeoJSON if available
    bounds = None
    if row.get("bounds_geojson"):
        try:
            geojson = json.loads(row["bounds_geojson"])
            if geojson.get("type") == "Polygon":
                coords = geojson.get("coordinates", [[]])[0]
                if coords:
                    bounds = [[coords[0][1], coords[0][0]], [coords[2][1], coords[2][0]]]
        except:
            pass
    
    return {
        "id": row["id"],
        "name": row["name"],
        "name_nepali": row.get("name_nepali"),
        "province": row["province"],
        "district": row["district"],
        "type": row.get("constituency_type", "FPTP"),
        "registered_voters": row.get("registered_voters", 0),
        "center": [
            float(row["center_lat"]), 
            float(row["center_lng"])
        ] if row.get("center_lat") else None,
        "bounds": bounds or [[27.0, 85.0], [28.0, 86.0]],
    }

# ============================================================================
# EVENTS ENDPOINTS
# ============================================================================

@app.get("/v1/events")
async def list_events(
    constituency_id: Optional[str] = Query(None),
    party_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    status: Optional[str] = Query("confirmed"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query("datetime"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: Optional[dict] = Depends(get_current_user),
):
    """List events with filtering and user RSVP status."""
    with get_db() as conn:
        cur = conn.cursor()
        
        # Build query
        query = "SELECT * FROM events_full WHERE 1=1"
        params = []
        
        if constituency_id:
            query += " AND constituency_id = %s"
            params.append(constituency_id)
        if party_id:
            query += " AND party_id = %s"
            params.append(party_id)
        if event_type:
            query += " AND event_type = %s"
            params.append(event_type)
        if status:
            query += " AND status = %s"
            params.append(status)
        if date_from:
            query += " AND datetime >= %s"
            params.append(date_from)
        if date_to:
            query += " AND datetime <= %s"
            params.append(date_to)
        if search:
            query += " AND (title ILIKE %s OR description ILIKE %s OR venue_name ILIKE %s)"
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern, search_pattern])
        
        # Count total
        count_query = query.replace("SELECT *", "SELECT COUNT(*)")
        cur.execute(count_query, params)
        total = cur.fetchone()["count"]
        
        # Sort
        if sort.startswith("-"):
            sort_col = sort[1:]
            sort_dir = "DESC"
        else:
            sort_col = sort
            sort_dir = "ASC"
        
        if sort_col == "datetime":
            query += f" ORDER BY datetime {sort_dir}"
        elif sort_col == "rsvp_count":
            query += f" ORDER BY rsvp_count {sort_dir}"
        else:
            query += " ORDER BY datetime ASC"
        
        # Paginate
        offset = (page - 1) * per_page
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cur.execute(query, params)
        rows = cur.fetchall()
        
        events = []
        for row in rows:
            event = row_to_event(row)
            # Always include user_rsvp (null for guests, status for authenticated users)
            if user:
                cur.execute(
                    "SELECT status FROM rsvps WHERE user_id = %s AND event_id = %s",
                    (user["id"], event["id"])
                )
                rsvp = cur.fetchone()
                event["user_rsvp"] = rsvp["status"] if rsvp else None
            else:
                event["user_rsvp"] = None
            events.append(event)
        
        return {
            "data": events,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": math.ceil(total / per_page) if total > 0 else 0
            }
        }

@app.get("/v1/events/nearby")
async def list_events_nearby(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(5000, ge=100, le=50000),
    per_page: int = Query(20, ge=1, le=100),
):
    """Find events near a location using PostGIS."""
    with get_db() as conn:
        cur = conn.cursor()
        
        # Use the events_near function we created in schema
        cur.execute("""
            SELECT e.*, 
                   ST_Distance(v.location, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) as distance_meters
            FROM events_full e
            JOIN venues v ON e.venue_id = v.id
            WHERE ST_DWithin(v.location, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
            ORDER BY distance_meters
            LIMIT %s
        """, (lng, lat, lng, lat, radius, per_page))
        
        rows = cur.fetchall()
        
        events = []
        for row in rows:
            event = row_to_event(row)
            event["distance_meters"] = round(row["distance_meters"], 2)
            events.append(event)
        
        return {
            "data": events,
            "center": {"lat": lat, "lng": lng},
            "radius_meters": radius
        }

@app.get("/v1/events/{event_id}")
async def get_event(event_id: str, user: Optional[dict] = Depends(get_current_user)):
    """Get single event details with user's RSVP status."""
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute("SELECT * FROM events_full WHERE id = %s", (event_id,))
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
        
        event = row_to_event(row)
        
        # Always include user_rsvp status (null for guests, status string for authenticated users)
        if user:
            cur.execute(
                "SELECT status FROM rsvps WHERE user_id = %s AND event_id = %s",
                (user["id"], event_id)
            )
            rsvp = cur.fetchone()
            event["user_rsvp"] = rsvp["status"] if rsvp else None
        else:
            event["user_rsvp"] = None
        
        return event

@app.post("/v1/events/{event_id}/rsvp")
async def rsvp_event(
    event_id: str, 
    body: RsvpRequest,
    user: dict = Depends(require_auth)
):
    """RSVP to an event - returns full updated event with user_rsvp status."""
    status = body.status
    
    try:
        with get_db() as conn:
            cur = conn.cursor()
            
            # Check event exists
            cur.execute("SELECT id FROM events WHERE id = %s", (event_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Event not found")
            
            # Upsert RSVP (insert or update)
            cur.execute("""
                INSERT INTO rsvps (user_id, event_id, status, created_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (user_id, event_id) 
                DO UPDATE SET status = EXCLUDED.status
                RETURNING *
            """, (user["id"], event_id, status))
            
            # Get full updated event with user's RSVP status
            cur.execute("SELECT * FROM events_full WHERE id = %s", (event_id,))
            event_row = cur.fetchone()
            
            if not event_row:
                raise HTTPException(status_code=404, detail="Event not found after RSVP")
            
            event = row_to_event(event_row)
            # Always set user_rsvp to the status we just set
            event["user_rsvp"] = status
            
            return event
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in RSVP endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"RSVP failed: {str(e)}")

@app.delete("/v1/events/{event_id}/rsvp")
async def cancel_rsvp(event_id: str, user: dict = Depends(require_auth)):
    """Cancel RSVP - removes from database."""
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute(
            "DELETE FROM rsvps WHERE user_id = %s AND event_id = %s",
            (user["id"], event_id)
        )
        
        return {"status": "cancelled"}

# ============================================================================
# PARTIES ENDPOINTS
# ============================================================================

@app.get("/v1/parties")
async def list_parties():
    """List all political parties."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM parties ORDER BY name")
        rows = cur.fetchall()
        
        return {"data": [row_to_party(row) for row in rows]}

@app.get("/v1/parties/{party_id}")
async def get_party(party_id: str):
    """Get single party details."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM parties WHERE id = %s", (party_id,))
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Party not found")
        
        return row_to_party(row)

@app.get("/v1/parties/{party_id}/events")
async def list_party_events(party_id: str, page: int = 1, per_page: int = 20):
    """List events for a specific party."""
    with get_db() as conn:
        cur = conn.cursor()
        
        # Count
        cur.execute(
            "SELECT COUNT(*) FROM events_full WHERE party_id = %s",
            (party_id,)
        )
        total = cur.fetchone()["count"]
        
        # Fetch
        offset = (page - 1) * per_page
        cur.execute("""
            SELECT * FROM events_full 
            WHERE party_id = %s 
            ORDER BY datetime
            LIMIT %s OFFSET %s
        """, (party_id, per_page, offset))
        
        rows = cur.fetchall()
        
        return {
            "data": [row_to_event(row) for row in rows],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": math.ceil(total / per_page) if total > 0 else 0
            }
        }

# ============================================================================
# CONSTITUENCIES ENDPOINTS
# ============================================================================

@app.get("/v1/constituencies")
async def list_constituencies(
    province: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
):
    """List all constituencies."""
    with get_db() as conn:
        cur = conn.cursor()
        
        query = """
            SELECT id, name, name_nepali, province, district, 
                   constituency_type, registered_voters,
                   ST_Y(center::geometry) as center_lat,
                   ST_X(center::geometry) as center_lng,
                   ST_AsGeoJSON(bounds) as bounds_geojson
            FROM constituencies WHERE 1=1
        """
        params = []
        
        if province:
            query += " AND province = %s"
            params.append(province)
        if district:
            query += " AND district = %s"
            params.append(district)
        
        query += " ORDER BY name"
        
        cur.execute(query, params)
        rows = cur.fetchall()
        
        return {"data": [row_to_constituency(row) for row in rows]}

@app.get("/v1/constituencies/detect")
async def detect_constituency(lat: float = Query(...), lng: float = Query(...)):
    """Detect constituency from coordinates using PostGIS."""
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT id, name, name_nepali, province, district,
                   constituency_type, registered_voters,
                   ST_Y(center::geometry) as center_lat,
                   ST_X(center::geometry) as center_lng,
                   ST_AsGeoJSON(bounds) as bounds_geojson
            FROM constituencies
            WHERE ST_Contains(bounds::geometry, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            LIMIT 1
        """, (lng, lat))
        
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="No constituency found")
        
        return row_to_constituency(row)

@app.get("/v1/constituencies/{constituency_id}")
async def get_constituency(constituency_id: str):
    """Get single constituency details."""
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT id, name, name_nepali, province, district,
                   constituency_type, registered_voters,
                   ST_Y(center::geometry) as center_lat,
                   ST_X(center::geometry) as center_lng,
                   ST_AsGeoJSON(bounds) as bounds_geojson
            FROM constituencies WHERE id = %s
        """, (constituency_id,))
        
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Constituency not found")
        
        return row_to_constituency(row)

@app.get("/v1/constituencies/{constituency_id}/events")
async def list_constituency_events(
    constituency_id: str, 
    page: int = 1, 
    per_page: int = 20
):
    """List events in a specific constituency."""
    with get_db() as conn:
        cur = conn.cursor()
        
        # Count
        cur.execute(
            "SELECT COUNT(*) FROM events_full WHERE constituency_id = %s",
            (constituency_id,)
        )
        total = cur.fetchone()["count"]
        
        # Fetch
        offset = (page - 1) * per_page
        cur.execute("""
            SELECT * FROM events_full 
            WHERE constituency_id = %s 
            ORDER BY datetime
            LIMIT %s OFFSET %s
        """, (constituency_id, per_page, offset))
        
        rows = cur.fetchall()
        
        return {
            "data": [row_to_event(row) for row in rows],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": math.ceil(total / per_page) if total > 0 else 0
            }
        }

# ============================================================================
# AUTH ENDPOINTS (OTP remains mock)
# ============================================================================

@app.post("/v1/auth/request-otp")
async def request_otp(body: OtpRequest):
    """Request OTP - MOCK: always sends 123456."""
    phone = body.phone
    
    otp = TEST_OTP  # Always 123456
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    OTP_STORAGE[phone] = {"otp": otp, "expires_at": expires_at}
    
    masked = phone[:4] + "****" + phone[-3:] if len(phone) > 7 else phone
    
    return {
        "message": f"OTP sent to {masked}",
        "expires_in": 300,
        "dev_otp": otp  # For testing
    }

@app.post("/v1/auth/verify-otp")
async def verify_otp(body: OtpVerify):
    """Verify OTP and create/get user from DATABASE."""
    phone = body.phone
    otp = body.otp
    
    # Check OTP (mock - always accept 123456)
    stored = OTP_STORAGE.get(phone)
    is_valid = (otp == TEST_OTP) or (stored and stored["otp"] == otp)
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid OTP")
    
    # Clear used OTP
    OTP_STORAGE.pop(phone, None)
    
    # Get or create user IN DATABASE
    user = get_or_create_user(phone)
    
    # Generate tokens (in-memory)
    access_token = generate_token()
    refresh_token = generate_token()
    
    TOKENS[access_token] = {
        "user_id": user["id"],
        "expires_at": datetime.utcnow() + timedelta(hours=24),
        "type": "access"
    }
    TOKENS[refresh_token] = {
        "user_id": user["id"],
        "expires_at": datetime.utcnow() + timedelta(days=30),
        "type": "refresh"
    }
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": 86400,
        "user": {
            "id": user["id"],
            "phone": user["phone"],
            "name": user.get("name"),
            "role": user.get("role", "citizen")
        }
    }

@app.post("/v1/auth/refresh")
async def refresh_token(refresh_token: str = Query(...)):
    """Refresh access token."""
    if refresh_token not in TOKENS:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    token_data = TOKENS[refresh_token]
    if token_data["type"] != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    if datetime.utcnow() > token_data["expires_at"]:
        del TOKENS[refresh_token]
        raise HTTPException(status_code=401, detail="Refresh token expired")
    
    user = get_user_by_id(token_data["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    new_access = generate_token()
    TOKENS[new_access] = {
        "user_id": user["id"],
        "expires_at": datetime.utcnow() + timedelta(hours=24),
        "type": "access"
    }
    
    return {
        "access_token": new_access,
        "refresh_token": refresh_token,
        "expires_in": 86400
    }

# ============================================================================
# USER ENDPOINTS
# ============================================================================

@app.get("/v1/users/me")
async def get_me(user: dict = Depends(require_auth)):
    """Get current user profile from database."""
    return {
        "id": user["id"],
        "phone": user["phone"],
        "name": user.get("name"),
        "role": user.get("role", "citizen"),
        "constituency_id": user.get("constituency_id"),
        "created_at": user["created_at"].isoformat() if user.get("created_at") else None
    }

@app.patch("/v1/users/me")
async def update_me(body: UserUpdate, user: dict = Depends(require_auth)):
    """Update current user profile in database."""
    with get_db() as conn:
        cur = conn.cursor()
        
        updates = []
        params = []
        
        if body.name is not None:
            updates.append("name = %s")
            params.append(body.name)
        if body.constituency_id is not None:
            updates.append("constituency_id = %s")
            params.append(body.constituency_id)
        
        if updates:
            updates.append("updated_at = NOW()")
            params.append(user["id"])
            
            cur.execute(f"""
                UPDATE users SET {', '.join(updates)}
                WHERE id = %s
                RETURNING *
            """, params)
            
            updated = cur.fetchone()
            return {
                "id": updated["id"],
                "phone": updated["phone"],
                "name": updated.get("name"),
                "role": updated.get("role", "citizen")
            }
        
        return {
            "id": user["id"],
            "phone": user["phone"],
            "name": user.get("name"),
            "role": user.get("role", "citizen")
        }

@app.get("/v1/users/me/rsvps")
async def get_my_rsvps(user: dict = Depends(require_auth)):
    """Get current user's RSVPs from database."""
    with get_db() as conn:
        cur = conn.cursor()
        
        cur.execute("""
            SELECT e.*, r.status as user_rsvp
            FROM events_full e
            JOIN rsvps r ON r.event_id = e.id
            WHERE r.user_id = %s
            ORDER BY e.datetime
        """, (user["id"],))
        
        rows = cur.fetchall()
        
        events = []
        for row in rows:
            event = row_to_event(row)
            event["user_rsvp"] = row["user_rsvp"]
            events.append(event)
        
        return {"data": events}

# ============================================================================
# META ENDPOINTS
# ============================================================================

@app.get("/v1/meta/event-types")
async def get_event_types():
    """Get event type definitions."""
    return {
        "rally": {"label": "Rally", "label_nepali": "र्‍याली", "icon": ""},
        "townhall": {"label": "Town Hall", "label_nepali": "टाउन हल", "icon": ""},
        "march": {"label": "March", "label_nepali": "मार्च", "icon": ""},
        "meeting": {"label": "Meeting", "label_nepali": "बैठक", "icon": ""},
        "assembly": {"label": "Assembly", "label_nepali": "सभा", "icon": ""},
        "canvassing": {"label": "Canvassing", "label_nepali": "घरदैलो", "icon": ""},
        "conference": {"label": "Conference", "label_nepali": "सम्मेलन", "icon": ""},
        "debate": {"label": "Debate", "label_nepali": "बहस", "icon": ""},
    }

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check with DB connectivity test."""
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "nepal-elections-api",
        "database": db_status,
        "mode": "full-db"
    }

# ============================================================================
# STARTUP
# ============================================================================

@app.on_event("startup")
async def startup():
    """Verify database connection on startup."""
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM parties")
            count = cur.fetchone()["count"]
            print(f"Database connected. {count} parties loaded.")
    except Exception as e:
        print(f"Database connection failed: {e}")
        print("  API will return errors until database is available.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5012)
