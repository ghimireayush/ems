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

export function EventList({ onSelectEvent, isMobile }) {
  const { state, actions } = useApp();
  const { events, eventsByDate, filteredCount, totalCount } = useEvents();
  const { sortByDistance, location } = useGeolocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');

  let displayEvents = searchQuery ? searchEvents(events, searchQuery) : events;
  
  if (sortBy === 'distance' && location) {
    displayEvents = sortByDistance(displayEvents);
  }

  const groupedEvents = sortBy === 'date' 
    ? groupEventsByDate(displayEvents)
    : null;

  const handleSelectEvent = (event) => {
    if (onSelectEvent) {
      onSelectEvent(event);
    } else {
      actions.selectEvent(event);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }} data-testid="event-list">
      {/* Search and filters */}
      <div style={{ 
        padding: isMobile ? '12px 12px' : '14px 16px', 
        borderBottom: '1px solid #e8e8e8',
        background: '#fafafa',
      }}>
        <input
          type="text"
          placeholder="🔍 Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: isMobile ? '12px 16px' : '10px 14px',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            fontSize: isMobile ? 16 : 14,
            marginBottom: isMobile ? 12 : 10,
            background: 'white',
            transition: 'all 0.2s ease',
            minHeight: isMobile ? 48 : 'auto',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e0e0e0';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        
        <div style={{ display: 'flex', gap: isMobile ? 6 : 8, alignItems: 'center', flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ 
              padding: isMobile ? '10px 12px' : '8px 10px', 
              borderRadius: 6, 
              border: '1px solid #e0e0e0',
              fontSize: isMobile ? 14 : 13,
              fontWeight: 500,
              background: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: isMobile ? 40 : 'auto',
              flexShrink: 0,
            }}
          >
            <option value="date">📅 Sort by Date</option>
            <option value="distance" disabled={!location}>📍 Sort by Distance</option>
          </select>
          
          <span style={{ 
            fontSize: isMobile ? 13 : 12, 
            color: '#999',
            fontWeight: 500,
            marginLeft: 'auto',
            whiteSpace: 'nowrap',
          }}>
            {displayEvents.length} of {totalCount}
          </span>
          
          {Object.values(state.filters).some(v => v !== null) && (
            <button
              onClick={() => actions.clearFilters()}
              style={{
                padding: isMobile ? '8px 12px' : '6px 12px',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                fontSize: isMobile ? 14 : 12,
                cursor: 'pointer',
                fontWeight: 500,
                color: '#666',
                transition: 'all 0.2s ease',
                minHeight: isMobile ? 36 : 'auto',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
                e.currentTarget.style.borderColor = '#d0d0d0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Event list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sortBy === 'date' && groupedEvents ? (
          groupedEvents.map(group => (
            <div key={group.date}>
              <div style={{
                padding: '10px 16px',
                background: '#f8f9fa',
                fontWeight: 600,
                fontSize: 12,
                position: 'sticky',
                top: 0,
                borderBottom: '1px solid #e8e8e8',
                color: '#667eea',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                zIndex: 5,
              }}>
                {getRelativeDate(group.date)} — {formatDate(group.date, { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
              {group.events.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  isSelected={state.selectedEvent?.id === event.id}
                  onSelect={() => handleSelectEvent(event)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          ))
        ) : (
          displayEvents.map(event => (
            <EventCard 
              key={event.id} 
              event={event}
              showDistance={sortBy === 'distance'}
              isSelected={state.selectedEvent?.id === event.id}
              onSelect={() => handleSelectEvent(event)}
              isMobile={isMobile}
            />
          ))
        )}

        {displayEvents.length === 0 && (
          <div style={{ 
            padding: 32, 
            textAlign: 'center', 
            color: '#999',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 500 }}>No events found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your filters</div>
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, isSelected, onSelect, showDistance, isMobile }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      data-testid={`event-item-${event.id}`}
      onClick={onSelect}
      style={{
        padding: isMobile ? '16px 12px' : '14px 16px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        background: isSelected 
          ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.04) 100%)'
          : isHovered 
            ? '#f8f9fa'
            : 'white',
        transition: 'all 0.2s ease',
        borderLeft: isSelected ? '3px solid #667eea' : '3px solid transparent',
        paddingLeft: isSelected ? (isMobile ? 9 : 13) : (isMobile ? 12 : 16),
        minHeight: isMobile ? 80 : 'auto',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Type icon */}
        <div style={{ 
          fontSize: isMobile ? 32 : 28, 
          width: isMobile ? 44 : 40, 
          textAlign: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}>
          {eventTypeIcons[event.type]}
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ 
            fontWeight: 600, 
            marginBottom: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: isMobile ? 15 : 14,
            color: '#1a1a1a',
            lineHeight: isMobile ? 1.3 : 1.4,
          }}>
            {event.title}
          </div>
          
          {/* Party badge */}
          {event.party && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: isMobile ? '5px 10px' : '4px 8px',
              background: getPartyColor(event.party, 0.12),
              color: event.party.color,
              borderRadius: 5,
              fontSize: isMobile ? 12 : 11,
              fontWeight: 600,
              marginBottom: 6,
              border: `1px solid ${getPartyColor(event.party, 0.3)}`,
            }}>
              {event.party.logoUrl && (
                <img 
                  src={`/${event.party.logoUrl}`}
                  alt={event.party.shortName}
                  style={{
                    width: isMobile ? 16 : 14,
                    height: isMobile ? 16 : 14,
                    objectFit: 'contain',
                  }}
                />
              )}
              <span>{event.party.shortName}</span>
            </div>
          )}
          
          {/* Details */}
          <div style={{ fontSize: isMobile ? 13 : 12, color: '#666', lineHeight: 1.6 }}>
            <div>📍 {event.venue?.name || 'TBD'}</div>
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
          fontSize: isMobile ? 13 : 12,
          color: '#666',
          background: isSelected ? 'rgba(102, 126, 234, 0.1)' : '#f8f9fa',
          padding: isMobile ? '10px 12px' : '8px 10px',
          borderRadius: 6,
          minWidth: isMobile ? 60 : 50,
          minHeight: isMobile ? 48 : 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{ fontWeight: 700, color: '#667eea', fontSize: isMobile ? 18 : 16 }}>{event.rsvpCount}</div>
          <div style={{ fontSize: isMobile ? 11 : 10, color: '#999', marginTop: 2 }}>RSVPs</div>
        </div>
      </div>
    </div>
  );
}

function groupEventsByDate(events) {
  const grouped = {};
  events.forEach(event => {
    if (!event.datetime) return;
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
