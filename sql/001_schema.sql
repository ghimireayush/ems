-- ============================================================================
-- Nepal Elections 2026 - Database Schema
-- Generated: 2026-01-16T16:29:00.472Z
-- 
-- Prerequisites:
--   CREATE EXTENSION IF NOT EXISTS postgis;
--   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ============================================================================

-- Drop existing tables (for regeneration)
DROP TABLE IF EXISTS rsvps CASCADE;
DROP TABLE IF EXISTS event_tags CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS constituencies CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE event_type AS ENUM (
  'rally',
  'townhall', 
  'march',
  'meeting',
  'assembly',
  'canvassing',
  'conference',
  'debate'
);

CREATE TYPE event_status AS ENUM (
  'draft',
  'confirmed',
  'cancelled',
  'completed'
);

CREATE TYPE user_role AS ENUM (
  'citizen',
  'party_admin',
  'super_admin'
);

-- ============================================================================
-- PARTIES
-- ============================================================================

CREATE TABLE parties (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_nepali VARCHAR(255),
  short_name VARCHAR(20) NOT NULL,
  color VARCHAR(7), -- Hex color code
  ideology VARCHAR(255),
  leader VARCHAR(255),
  founded INTEGER,
  symbol VARCHAR(100),
  website VARCHAR(500),
  logo_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parties_short_name ON parties(short_name);

-- ============================================================================
-- CONSTITUENCIES
-- ============================================================================

CREATE TABLE constituencies (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_nepali VARCHAR(255),
  province VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  constituency_type VARCHAR(20) DEFAULT 'FPTP', -- FPTP or PR
  registered_voters INTEGER DEFAULT 0,
  center GEOGRAPHY(POINT, 4326), -- PostGIS point (lat/lng)
  bounds GEOGRAPHY(POLYGON, 4326), -- PostGIS polygon
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_constituencies_province ON constituencies(province);
CREATE INDEX idx_constituencies_district ON constituencies(district);
CREATE INDEX idx_constituencies_center ON constituencies USING GIST(center);
CREATE INDEX idx_constituencies_bounds ON constituencies USING GIST(bounds);

-- ============================================================================
-- VENUES
-- ============================================================================

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_nepali VARCHAR(255),
  address VARCHAR(500),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  constituency_id VARCHAR(50) REFERENCES constituencies(id),
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_location ON venues USING GIST(location);
CREATE INDEX idx_venues_constituency ON venues(constituency_id);

-- ============================================================================
-- EVENTS
-- ============================================================================

CREATE TABLE events (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  title_nepali VARCHAR(500),
  party_id VARCHAR(50) REFERENCES parties(id) ON DELETE SET NULL,
  constituency_id VARCHAR(50) REFERENCES constituencies(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  event_type event_type NOT NULL,
  status event_status DEFAULT 'confirmed',
  description TEXT,
  datetime TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  speakers TEXT[], -- PostgreSQL array
  expected_attendance INTEGER DEFAULT 0,
  rsvp_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_party ON events(party_id);
CREATE INDEX idx_events_constituency ON events(constituency_id);
CREATE INDEX idx_events_datetime ON events(datetime);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_status ON events(status);

-- ============================================================================
-- EVENT TAGS (Many-to-Many)
-- ============================================================================

CREATE TABLE event_tags (
  event_id VARCHAR(50) REFERENCES events(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  PRIMARY KEY (event_id, tag)
);

CREATE INDEX idx_event_tags_tag ON event_tags(tag);

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE, -- Primary identifier in Nepal
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  role user_role DEFAULT 'citizen',
  constituency_id VARCHAR(50) REFERENCES constituencies(id),
  location GEOGRAPHY(POINT, 4326),
  party_id VARCHAR(50) REFERENCES parties(id), -- For party admins
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_constituency ON users(constituency_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- RSVPs
-- ============================================================================

CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id VARCHAR(50) REFERENCES events(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'going', -- going, interested, not_going
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_rsvps_user ON rsvps(user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parties_updated_at BEFORE UPDATE ON parties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constituencies_updated_at BEFORE UPDATE ON constituencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update RSVP count on events
CREATE OR REPLACE FUNCTION update_event_rsvp_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET rsvp_count = rsvp_count - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rsvp_count AFTER INSERT OR DELETE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION update_event_rsvp_count();

-- ============================================================================
-- VIEWS (Convenience)
-- ============================================================================

-- Events with full details
CREATE OR REPLACE VIEW events_full AS
SELECT 
  e.*,
  p.name AS party_name,
  p.short_name AS party_short_name,
  p.color AS party_color,
  c.name AS constituency_name,
  c.province,
  c.district,
  v.name AS venue_name,
  v.address AS venue_address,
  ST_Y(v.location::geometry) AS venue_lat,
  ST_X(v.location::geometry) AS venue_lng,
  ARRAY(SELECT tag FROM event_tags WHERE event_id = e.id) AS tags
FROM events e
LEFT JOIN parties p ON e.party_id = p.id
LEFT JOIN constituencies c ON e.constituency_id = c.id
LEFT JOIN venues v ON e.venue_id = v.id;

-- Events near a point (usage: SELECT * FROM events_near(27.7172, 85.3240, 5000))
CREATE OR REPLACE FUNCTION events_near(lat FLOAT, lng FLOAT, radius_meters INT DEFAULT 5000)
RETURNS TABLE (
  id VARCHAR(50),
  title VARCHAR(500),
  party_id VARCHAR(50),
  venue_name VARCHAR(255),
  datetime TIMESTAMPTZ,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.party_id,
    v.name,
    e.datetime,
    ST_Distance(v.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance_meters
  FROM events e
  JOIN venues v ON e.venue_id = v.id
  WHERE ST_DWithin(v.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
