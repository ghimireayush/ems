import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export function useEvents() {
  const context = useApp();
  const { state } = context || { state: {} };
  const { events = [], filters = {}, parties = [], constituencies = [] } = state;

  // Filtered events based on current filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Constituency filter
      if (filters.constituencyId && event.constituencyId !== filters.constituencyId) {
        return false;
      }
      
      // Party filter
      if (filters.partyId && event.partyId !== filters.partyId) {
        return false;
      }
      
      // Event type filter
      if (filters.eventType && event.type !== filters.eventType) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange) {
        const eventDate = new Date(event.datetime);
        if (filters.dateRange.start && eventDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && eventDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }
      
      return true;
    });
  }, [events, filters]);

  // Enriched events with party and constituency data
  const enrichedEvents = useMemo(() => {
    return filteredEvents.map(event => {
      // Safely handle venue and coordinates
      let venue = event.venue;
      if (venue && !venue.coordinates) {
        venue = { ...venue, coordinates: null };
      }
      
      return {
        ...event,
        venue: venue || { name: 'TBD', address: '', coordinates: null },
        party: parties.find(p => p.id === event.partyId) || null,
        constituency: constituencies.find(c => c.id === event.constituencyId) || null,
      };
    });
  }, [filteredEvents, parties, constituencies]);

  // Events grouped by date
  const eventsByDate = useMemo(() => {
    const grouped = {};
    enrichedEvents.forEach(event => {
      const dateKey = new Date(event.datetime).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    // Sort by date
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, events]) => ({
        date,
        events: events.sort((a, b) => 
          new Date(a.datetime) - new Date(b.datetime)
        ),
      }));
  }, [enrichedEvents]);

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return enrichedEvents
      .filter(event => {
        const eventDate = new Date(event.datetime);
        return eventDate >= now && eventDate <= weekLater;
      })
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }, [enrichedEvents]);

  // Get single event by ID
  const getEventById = (id) => {
    const event = events.find(e => e.id === id);
    if (!event) return null;
    
    let venue = event.venue;
    if (venue && !venue.coordinates) {
      venue = { ...venue, coordinates: null };
    }
    
    return {
      ...event,
      venue: venue || { name: 'TBD', address: '', coordinates: null },
      party: parties.find(p => p.id === event.partyId) || null,
      constituency: constituencies.find(c => c.id === event.constituencyId) || null,
    };
  };

  return {
    events: enrichedEvents,
    eventsByDate,
    upcomingEvents,
    getEventById,
    totalCount: events.length,
    filteredCount: filteredEvents.length,
  };
}
