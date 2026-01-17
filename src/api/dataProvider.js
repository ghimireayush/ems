/**
 * Data Provider - Abstraction layer between UI and data source
 * 
 * Supports two modes:
 * - 'json': Uses static JSON files (current prototype mode)
 * - 'api': Uses live API calls
 * 
 * Configuration:
 *   Set VITE_DATA_MODE=api in .env to switch to API mode
 *   Set VITE_API_URL=https://api.example.com/v1 for API endpoint
 */

import { api } from './client.js';

// Static JSON imports (for JSON mode)
import partiesJson from '../data/parties.json';
import constituenciesJson from '../data/constituencies.json';
import eventsJson from '../data/events.json';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'json';

console.log(`[DataProvider] Running in ${DATA_MODE.toUpperCase()} mode`);

// ============================================================================
// JSON MODE HELPERS
// ============================================================================

// Convert JSON data to match API response format
function enrichEvent(event, parties, constituencies) {
  return {
    ...event,
    party: parties.find(p => p.id === event.partyId) || null,
    constituency: constituencies.find(c => c.id === event.constituencyId) || null,
  };
}

function filterEvents(events, filters) {
  return events.filter(event => {
    if (filters.constituencyId && event.constituencyId !== filters.constituencyId) return false;
    if (filters.partyId && event.partyId !== filters.partyId) return false;
    if (filters.eventType && event.type !== filters.eventType) return false;
    if (filters.status && event.status !== filters.status) return false;
    
    if (filters.dateFrom) {
      const eventDate = new Date(event.datetime);
      const fromDate = new Date(filters.dateFrom);
      if (eventDate < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const eventDate = new Date(event.datetime);
      const toDate = new Date(filters.dateTo);
      if (eventDate > toDate) return false;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = filters.tags.some(tag => event.tags?.includes(tag));
      if (!hasTag) return false;
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchable = [
        event.title,
        event.titleNepali,
        event.description,
        event.venue?.name,
        event.venue?.address,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(searchLower)) return false;
    }
    
    return true;
  });
}

function sortEvents(events, sort) {
  const sorted = [...events];
  
  switch (sort) {
    case 'datetime':
      return sorted.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    case '-datetime':
      return sorted.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
    case 'rsvp_count':
      return sorted.sort((a, b) => a.rsvpCount - b.rsvpCount);
    case '-rsvp_count':
      return sorted.sort((a, b) => b.rsvpCount - a.rsvpCount);
    default:
      return sorted.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }
}

function paginateEvents(events, page = 1, perPage = 20) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  
  return {
    data: events.slice(start, end),
    pagination: {
      page,
      perPage,
      total: events.length,
      totalPages: Math.ceil(events.length / perPage),
    },
  };
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function pointInBounds(lat, lng, bounds) {
  const minLat = Math.min(bounds[0][0], bounds[2][0]);
  const maxLat = Math.max(bounds[0][0], bounds[2][0]);
  const minLng = Math.min(bounds[0][1], bounds[2][1]);
  const maxLng = Math.max(bounds[0][1], bounds[2][1]);
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

// ============================================================================
// DATA PROVIDER
// ============================================================================

export const dataProvider = {
  // --------------------------------------------------------------------------
  // Events
  // --------------------------------------------------------------------------
  events: {
    async list(filters = {}) {
      if (DATA_MODE === 'api') {
        return api.events.list(filters);
      }
      
      // JSON mode
      const parties = partiesJson.parties;
      const constituencies = constituenciesJson.constituencies;
      const allEvents = eventsJson.events.map(e => enrichEvent(e, parties, constituencies));
      
      let filtered = filterEvents(allEvents, filters);
      filtered = sortEvents(filtered, filters.sort);
      
      return paginateEvents(filtered, filters.page, filters.perPage);
    },

    async nearby(params) {
      if (DATA_MODE === 'api') {
        return api.events.nearby(params);
      }
      
      // JSON mode
      const parties = partiesJson.parties;
      const constituencies = constituenciesJson.constituencies;
      const allEvents = eventsJson.events.map(e => enrichEvent(e, parties, constituencies));
      
      const radius = params.radius || 5000;
      
      const withDistance = allEvents
        .map(event => ({
          ...event,
          distanceMeters: event.venue?.coordinates
            ? haversineDistance(params.lat, params.lng, event.venue.coordinates[0], event.venue.coordinates[1])
            : Infinity,
        }))
        .filter(e => e.distanceMeters <= radius)
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, params.perPage || 20);
      
      return {
        data: withDistance,
        center: { lat: params.lat, lng: params.lng },
        radiusMeters: radius,
      };
    },

    async get(id) {
      if (DATA_MODE === 'api') {
        return api.events.get(id);
      }
      
      // JSON mode
      const parties = partiesJson.parties;
      const constituencies = constituenciesJson.constituencies;
      const event = eventsJson.events.find(e => e.id === id);
      
      if (!event) throw new Error(`Event not found: ${id}`);
      
      return enrichEvent(event, parties, constituencies);
    },

    async rsvp(id, status = 'going') {
      if (DATA_MODE === 'api') {
        return api.events.rsvp(id, status);
      }
      
      // JSON mode - simulate (no persistence)
      console.log(`[JSON Mode] RSVP simulated: ${id} -> ${status}`);
      const event = eventsJson.events.find(e => e.id === id);
      return { rsvpCount: (event?.rsvpCount || 0) + 1 };
    },
  },

  // --------------------------------------------------------------------------
  // Parties
  // --------------------------------------------------------------------------
  parties: {
    async list() {
      if (DATA_MODE === 'api') {
        return api.parties.list();
      }
      return partiesJson.parties;
    },

    async get(id) {
      if (DATA_MODE === 'api') {
        return api.parties.get(id);
      }
      
      const party = partiesJson.parties.find(p => p.id === id);
      if (!party) throw new Error(`Party not found: ${id}`);
      return party;
    },
  },

  // --------------------------------------------------------------------------
  // Constituencies
  // --------------------------------------------------------------------------
  constituencies: {
    async list(filters = {}) {
      if (DATA_MODE === 'api') {
        return api.constituencies.list(filters);
      }
      
      let result = constituenciesJson.constituencies;
      if (filters.province) {
        result = result.filter(c => c.province === filters.province);
      }
      if (filters.district) {
        result = result.filter(c => c.district === filters.district);
      }
      return result;
    },

    async get(id) {
      if (DATA_MODE === 'api') {
        return api.constituencies.get(id);
      }
      
      const constituency = constituenciesJson.constituencies.find(c => c.id === id);
      if (!constituency) throw new Error(`Constituency not found: ${id}`);
      return constituency;
    },

    async detect(lat, lng) {
      if (DATA_MODE === 'api') {
        return api.constituencies.detect(lat, lng);
      }
      
      // JSON mode - simple point-in-box check
      const constituency = constituenciesJson.constituencies.find(c => 
        pointInBounds(lat, lng, c.bounds)
      );
      
      return constituency || null;
    },
  },

  // --------------------------------------------------------------------------
  // Meta
  // --------------------------------------------------------------------------
  meta: {
    async eventTypes() {
      if (DATA_MODE === 'api') {
        return api.meta.eventTypes();
      }
      return eventsJson.eventTypes;
    },
  },

  // --------------------------------------------------------------------------
  // Auth (API only - passthrough)
  // --------------------------------------------------------------------------
  auth: api.auth,

  // --------------------------------------------------------------------------
  // User (API only - passthrough)
  // --------------------------------------------------------------------------
  user: api.user,
};

export { DATA_MODE };
export default dataProvider;
