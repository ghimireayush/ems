#!/usr/bin/env node

/**
 * Nepal Elections - Database Schema & Seed Generator
 * 
 * Reads JSON data files and generates:
 * 1. PostgreSQL schema with PostGIS extensions
 * 2. Seed data SQL statements
 * 
 * Usage:
 *   node scripts/generate-db.js                  # Output to stdout
 *   node scripts/generate-db.js --out=./sql      # Output to files
 *   node scripts/generate-db.js --seed-only      # Only seed data
 *   node scripts/generate-db.js --schema-only    # Only schema
 * 
 * Requires: Node.js 18+
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  dataDir: path.join(__dirname, '../src/data'),
  outputDir: null, // Set via --out flag
  schemaOnly: false,
  seedOnly: false,
};

// Parse CLI args
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--out=')) {
    CONFIG.outputDir = arg.split('=')[1];
  } else if (arg === '--schema-only') {
    CONFIG.schemaOnly = true;
  } else if (arg === '--seed-only') {
    CONFIG.seedOnly = true;
  }
});

// ============================================================================
// DATA LOADING
// ============================================================================

function loadJSON(filename) {
  const filepath = path.join(CONFIG.dataDir, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
}

const partiesData = loadJSON('parties.json');
const constituenciesData = loadJSON('constituencies.json');
const eventsData = loadJSON('events.json');

// ============================================================================
// SCHEMA GENERATION
// ============================================================================

function generateSchema() {
  return `-- ============================================================================
-- Nepal Elections 2026 - Database Schema
-- Generated: ${new Date().toISOString()}
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
`;
}

// ============================================================================
// SEED DATA GENERATION
// ============================================================================

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  if (typeof str === 'number') return str;
  if (typeof str === 'boolean') return str ? 'TRUE' : 'FALSE';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function arrayToSQL(arr) {
  if (!arr || arr.length === 0) return 'NULL';
  const escaped = arr.map(item => `"${String(item).replace(/"/g, '\\"')}"`);
  return `ARRAY[${arr.map(escapeSQL).join(', ')}]`;
}

function pointToSQL(coords) {
  if (!coords || coords.length !== 2) return 'NULL';
  const [lat, lng] = coords;
  return `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
}

function boundsToPolygonSQL(bounds) {
  if (!bounds || bounds.length < 3) return 'NULL';
  // Close the polygon by repeating first point
  const closed = [...bounds, bounds[0]];
  const points = closed.map(([lat, lng]) => `${lng} ${lat}`).join(', ');
  return `ST_SetSRID(ST_GeomFromText('POLYGON((${points}))'), 4326)::geography`;
}

function generateSeed() {
  const lines = [];
  
  lines.push(`-- ============================================================================`);
  lines.push(`-- Nepal Elections 2026 - Seed Data`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- ============================================================================`);
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  // ----------------------------------------------------------------------------
  // PARTIES
  // ----------------------------------------------------------------------------
  lines.push('-- Parties');
  for (const party of partiesData.parties) {
    lines.push(`INSERT INTO parties (id, name, name_nepali, short_name, color, ideology, leader, founded, symbol, website)`);
    lines.push(`VALUES (`);
    lines.push(`  ${escapeSQL(party.id)},`);
    lines.push(`  ${escapeSQL(party.name)},`);
    lines.push(`  ${escapeSQL(party.nameNepali)},`);
    lines.push(`  ${escapeSQL(party.shortName)},`);
    lines.push(`  ${escapeSQL(party.color)},`);
    lines.push(`  ${escapeSQL(party.ideology)},`);
    lines.push(`  ${escapeSQL(party.leader)},`);
    lines.push(`  ${escapeSQL(party.founded)},`);
    lines.push(`  ${escapeSQL(party.symbol)},`);
    lines.push(`  ${escapeSQL(party.website)}`);
    lines.push(`);`);
    lines.push('');
  }

  // ----------------------------------------------------------------------------
  // CONSTITUENCIES
  // ----------------------------------------------------------------------------
  lines.push('-- Constituencies');
  for (const c of constituenciesData.constituencies) {
    lines.push(`INSERT INTO constituencies (id, name, name_nepali, province, district, constituency_type, registered_voters, center, bounds)`);
    lines.push(`VALUES (`);
    lines.push(`  ${escapeSQL(c.id)},`);
    lines.push(`  ${escapeSQL(c.name)},`);
    lines.push(`  ${escapeSQL(c.nameNepali)},`);
    lines.push(`  ${escapeSQL(c.province)},`);
    lines.push(`  ${escapeSQL(c.district)},`);
    lines.push(`  ${escapeSQL(c.type)},`);
    lines.push(`  ${escapeSQL(c.registeredVoters)},`);
    lines.push(`  ${pointToSQL(c.center)},`);
    lines.push(`  ${boundsToPolygonSQL(c.bounds)}`);
    lines.push(`);`);
    lines.push('');
  }

  // ----------------------------------------------------------------------------
  // VENUES (extracted from events)
  // ----------------------------------------------------------------------------
  lines.push('-- Venues');
  const venueMap = new Map(); // venue name -> generated UUID
  let venueCounter = 1;
  
  for (const event of eventsData.events) {
    const venue = event.venue;
    const venueKey = `${venue.name}|${venue.coordinates.join(',')}`;
    
    if (!venueMap.has(venueKey)) {
      const venueId = `00000000-0000-0000-0000-${String(venueCounter).padStart(12, '0')}`;
      venueMap.set(venueKey, venueId);
      
      lines.push(`INSERT INTO venues (id, name, name_nepali, address, location, constituency_id)`);
      lines.push(`VALUES (`);
      lines.push(`  ${escapeSQL(venueId)},`);
      lines.push(`  ${escapeSQL(venue.name)},`);
      lines.push(`  ${escapeSQL(venue.nameNepali)},`);
      lines.push(`  ${escapeSQL(venue.address)},`);
      lines.push(`  ${pointToSQL(venue.coordinates)},`);
      lines.push(`  ${escapeSQL(event.constituencyId)}`);
      lines.push(`);`);
      lines.push('');
      
      venueCounter++;
    }
  }

  // ----------------------------------------------------------------------------
  // EVENTS
  // ----------------------------------------------------------------------------
  lines.push('-- Events');
  for (const event of eventsData.events) {
    const venueKey = `${event.venue.name}|${event.venue.coordinates.join(',')}`;
    const venueId = venueMap.get(venueKey);
    
    lines.push(`INSERT INTO events (id, title, title_nepali, party_id, constituency_id, venue_id, event_type, status, description, datetime, end_time, speakers, expected_attendance, rsvp_count)`);
    lines.push(`VALUES (`);
    lines.push(`  ${escapeSQL(event.id)},`);
    lines.push(`  ${escapeSQL(event.title)},`);
    lines.push(`  ${escapeSQL(event.titleNepali)},`);
    lines.push(`  ${escapeSQL(event.partyId)},`);
    lines.push(`  ${escapeSQL(event.constituencyId)},`);
    lines.push(`  ${escapeSQL(venueId)},`);
    lines.push(`  ${escapeSQL(event.type)},`);
    lines.push(`  ${escapeSQL(event.status)},`);
    lines.push(`  ${escapeSQL(event.description)},`);
    lines.push(`  ${escapeSQL(event.datetime)},`);
    lines.push(`  ${escapeSQL(event.endTime)},`);
    lines.push(`  ${arrayToSQL(event.speakers)},`);
    lines.push(`  ${escapeSQL(event.expectedAttendance)},`);
    lines.push(`  ${escapeSQL(event.rsvpCount)}`);
    lines.push(`);`);
    lines.push('');
  }

  // ----------------------------------------------------------------------------
  // EVENT TAGS
  // ----------------------------------------------------------------------------
  lines.push('-- Event Tags');
  for (const event of eventsData.events) {
    if (event.tags && event.tags.length > 0) {
      for (const tag of event.tags) {
        lines.push(`INSERT INTO event_tags (event_id, tag) VALUES (${escapeSQL(event.id)}, ${escapeSQL(tag)});`);
      }
    }
  }
  lines.push('');

  lines.push('COMMIT;');
  lines.push('');
  lines.push('-- ============================================================================');
  lines.push('-- SEED COMPLETE');
  lines.push('-- ============================================================================');

  return lines.join('\n');
}

// ============================================================================
// OUTPUT
// ============================================================================

function output(filename, content) {
  if (CONFIG.outputDir) {
    const dir = CONFIG.outputDir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, content);
    console.error(`✓ Written: ${filepath}`);
  } else {
    console.log(content);
  }
}

// Main
function main() {
  if (!CONFIG.seedOnly) {
    const schema = generateSchema();
    output('001_schema.sql', schema);
  }
  
  if (!CONFIG.schemaOnly) {
    const seed = generateSeed();
    output('002_seed.sql', seed);
  }
  
  if (CONFIG.outputDir) {
    console.error('\n✓ Database scripts generated successfully');
    console.error('\nTo apply:');
    console.error(`  psql -d your_database -f ${CONFIG.outputDir}/001_schema.sql`);
    console.error(`  psql -d your_database -f ${CONFIG.outputDir}/002_seed.sql`);
  }
}

main();
