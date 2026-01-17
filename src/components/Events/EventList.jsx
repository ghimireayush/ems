import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useEvents } from '../../hooks/useEvents';
import { useGeolocation } from '../../hooks/useGeolocation';
import { 
  formatDate, 
  formatTime, 
  formatDistance,
  getRelativeDate,
  eventTypeIcons,
  getPartyColor,
  searchEvents 
} from '../../utils/helpers';

export function EventList() {
  const { state, actions } = useApp();
  const { events, eventsByDate, filteredCount, totalCount } = useEvents();
  const { sortByDistance, location } = useGeolocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'distance'

  // Apply search
  let displayEvents = searchQuery ? searchEvents(events, searchQuery) : events;
  
  // Apply sort
  if (sortBy === 'distance' && location) {
    displayEvents = sortByDistance(displayEvents);
  }

  // Group by date if sorting by date
  const groupedEvents = sortBy === 'date' 
    ? groupEventsByDate(displayEvents)
    : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }} data-testid="event-list">
      {/* Search and filters */}
      <div style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 14,
            marginBottom: 8,
          }}
        />
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
          >
            <option value="date">Sort by Date</option>
            <option value="distance" disabled={!location}>Sort by Distance</option>
          </select>
          
          <span style={{ fontSize: 12, color: '#666' }}>
            {displayEvents.length} of {totalCount} events
          </span>
          
          {Object.values(state.filters).some(v => v !== null) && (
            <button
              onClick={() => actions.clearFilters()}
              style={{
                padding: '4px 8px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Event list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sortBy === 'date' && groupedEvents ? (
          // Grouped by date view
          groupedEvents.map(group => (
            <div key={group.date}>
              <div style={{
                padding: '8px 12px',
                background: '#f5f5f5',
                fontWeight: 600,
                fontSize: 13,
                position: 'sticky',
                top: 0,
                borderBottom: '1px solid #e0e0e0',
              }}>
                {getRelativeDate(group.date)} — {formatDate(group.date, { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              {group.events.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  isSelected={state.selectedEvent?.id === event.id}
                  onSelect={() => actions.selectEvent(event)}
                />
              ))}
            </div>
          ))
        ) : (
          // Flat list (for distance sort)
          displayEvents.map(event => (
            <EventCard 
              key={event.id} 
              event={event}
              showDistance={sortBy === 'distance'}
              isSelected={state.selectedEvent?.id === event.id}
              onSelect={() => actions.selectEvent(event)}
            />
          ))
        )}

        {displayEvents.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>
            No events found
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, isSelected, onSelect, showDistance }) {
  return (
    <div
      data-testid={`event-item-${event.id}`}
      onClick={onSelect}
      style={{
        padding: 12,
        borderBottom: '1px solid #eee',
        cursor: 'pointer',
        background: isSelected ? '#e3f2fd' : 'white',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = '#f5f5f5')}
      onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'white')}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Type icon */}
        <div style={{ 
          fontSize: 24, 
          width: 40, 
          textAlign: 'center',
          flexShrink: 0,
        }}>
          {eventTypeIcons[event.type]}
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ 
            fontWeight: 600, 
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {event.title}
          </div>
          
          {/* Party badge */}
          {event.party && (
            <span style={{
              display: 'inline-block',
              padding: '1px 6px',
              background: getPartyColor(event.party, 0.1),
              color: event.party.color,
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 500,
              marginBottom: 4,
            }}>
              {event.party.shortName}
            </span>
          )}
          
          {/* Details */}
          <div style={{ fontSize: 12, color: '#666' }}>
            <div>📍 {event.venue.name}</div>
            <div>🕐 {formatTime(event.datetime)}</div>
            {showDistance && event.distance !== null && (
              <div>📏 {formatDistance(event.distance)} away</div>
            )}
          </div>
        </div>
        
        {/* RSVP count */}
        <div style={{ 
          textAlign: 'right',
          flexShrink: 0,
          fontSize: 12,
          color: '#666',
        }}>
          <div style={{ fontWeight: 600, color: '#333' }}>{event.rsvpCount}</div>
          <div>RSVPs</div>
        </div>
      </div>
    </div>
  );
}

// Helper to group events by date
function groupEventsByDate(events) {
  const grouped = {};
  events.forEach(event => {
    const dateKey = new Date(event.datetime).toISOString().split('T')[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(event);
  });
  
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, events]) => ({
      date,
      events: events.sort((a, b) => new Date(a.datetime) - new Date(b.datetime)),
    }));
}
