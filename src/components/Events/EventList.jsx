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
    <div style={{ display: 'flex', flexDirection: 'column' }} data-testid="event-list">
      {/* Search and filters - Compact layout */}
      <div style={{ 
        padding: isMobile ? '8px 16px' : '14px 16px', 
        borderBottom: '1px solid #e8e8e8',
        background: '#fafafa',
        position: 'static',
        zIndex: 'auto',
      }}>
        {/* Search bar and sort dropdown on same row for mobile */}
        <div style={{
          display: 'flex',
          gap: isMobile ? 8 : 0,
          alignItems: 'center',
          marginBottom: isMobile ? 6 : 10,
        }}>
          <input
            type="text"
            placeholder={isMobile ? "Search events..." : "Search events..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: isMobile ? '10px 12px' : '10px 14px',
              border: '1px solid #e0e0e0',
              borderRadius: isMobile ? 8 : 8,
              fontSize: 16, // Always 16px to prevent zoom on iOS
              background: 'white',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
              minHeight: isMobile ? 40 : 'auto',
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
          
          {/* Sort dropdown - next to search on mobile */}
          {isMobile && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ 
                padding: '6px 8px', 
                borderRadius: 8, 
                border: '1px solid #e0e0e0',
                fontSize: 13,
                fontWeight: 500,
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                minHeight: 40,
                minWidth: 85,
              }}
            >
              <option value="date">📅 By Date</option>
              <option value="distance" disabled={!location}>📍 By Distance</option>
            </select>
          )}
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? 12 : 8, 
          alignItems: 'center', 
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          justifyContent: 'space-between',
        }}>
          {/* Sort dropdown for desktop only */}
          {!isMobile && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ 
                padding: '8px 10px', 
                borderRadius: 6, 
                border: '1px solid #e0e0e0',
                fontSize: 13,
                fontWeight: 500,
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              <option value="date">Sort by Date</option>
              <option value="distance" disabled={!location}>Sort by Distance</option>
            </select>
          )}
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 12 : 8,
            flexWrap: 'wrap',
          }}>
            <span style={{ 
              fontSize: isMobile ? 14 : 12, 
              color: '#999',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              display: isMobile ? 'none' : 'inline',
            }}>
              {displayEvents.length} of {totalCount}
            </span>
            
            {!isMobile && Object.values(state.filters).some(v => v !== null) && (
              <button
                onClick={() => actions.clearFilters()}
                style={{
                  padding: '6px 12px',
                  background: '#ff5722',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: 'white',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Event list - Scrollable */}
      <div 
        style={{ 
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {sortBy === 'date' && groupedEvents ? (
          groupedEvents.map(group => (
            <div key={group.date}>
              <div style={{
                padding: isMobile ? '12px 16px' : '10px 16px',
                background: '#f8f9fa',
                fontWeight: 600,
                fontSize: isMobile ? 13 : 12,
                position: isMobile ? 'sticky' : 'static',
                top: isMobile ? 0 : 'auto',
                borderBottom: '1px solid #e8e8e8',
                color: '#667eea',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                zIndex: isMobile ? 5 : 'auto',
              }}>
                {getRelativeDate(group.date)} — {formatDate(group.date, { 
                  weekday: isMobile ? 'short' : 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
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
            padding: isMobile ? 48 : 32, 
            textAlign: 'center', 
            color: '#999',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: isMobile ? 200 : 'auto',
          }}>
            <div style={{ fontSize: isMobile ? 48 : 40, marginBottom: 16 }}>🔍</div>
            <div style={{ fontWeight: 600, fontSize: isMobile ? 18 : 16, marginBottom: 8 }}>No events found</div>
            <div style={{ fontSize: isMobile ? 14 : 12, color: '#666' }}>Try adjusting your filters or search terms</div>
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
        padding: isMobile ? '20px 16px' : '14px 16px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        background: isSelected 
          ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.04) 100%)'
          : isHovered 
            ? '#f8f9fa'
            : 'white',
        transition: 'all 0.2s ease',
        borderLeft: isSelected ? '4px solid #667eea' : '4px solid transparent',
        paddingLeft: isSelected ? (isMobile ? 12 : 12) : (isMobile ? 16 : 16),
        minHeight: isMobile ? 100 : 'auto',
        position: 'relative',
        // Optimize for touch
        WebkitTapHighlightColor: 'rgba(102, 126, 234, 0.1)',
      }}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onTouchStart={() => isMobile && setIsHovered(true)}
      onTouchEnd={() => isMobile && setIsHovered(false)}
    >
      <div style={{ display: 'flex', gap: isMobile ? 16 : 12, alignItems: 'flex-start' }}>
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ 
            fontWeight: 600, 
            marginBottom: isMobile ? 8 : 6,
            fontSize: isMobile ? 16 : 14,
            color: '#1a1a1a',
            lineHeight: 1.3,
            // Better text handling for mobile
            wordBreak: 'break-word',
            hyphens: 'auto',
          }}>
            {event.title}
          </div>
          
          {/* Party badge */}
          {event.party && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMobile ? 6 : 5,
              padding: isMobile ? '6px 12px' : '4px 8px',
              background: getPartyColor(event.party, 0.12),
              color: event.party.color,
              borderRadius: isMobile ? 8 : 5,
              fontSize: isMobile ? 13 : 11,
              fontWeight: 600,
              marginBottom: isMobile ? 10 : 6,
              border: `1px solid ${getPartyColor(event.party, 0.3)}`,
            }}>
              {event.party.logoUrl && (
                <img 
                  src={`/${event.party.logoUrl}`}
                  alt={event.party.shortName}
                  style={{
                    width: isMobile ? 18 : 14,
                    height: isMobile ? 18 : 14,
                    objectFit: 'contain',
                  }}
                />
              )}
              <span>{event.party.shortName}</span>
            </div>
          )}
          
          {/* Details */}
          <div style={{ 
            fontSize: isMobile ? 14 : 12, 
            color: '#666', 
            lineHeight: isMobile ? 1.5 : 1.6,
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 4 : 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📍</span>
              <span style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}>
                {event.venue?.name || 'TBD'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🕐</span>
              <span>{formatTime(event.datetime)}</span>
              <span style={{ marginLeft: 4 }}>{eventTypeIcons[event.type]}</span>
            </div>
            {showDistance && event.distance !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📏</span>
                <span>{formatDistance(event.distance)} away</span>
              </div>
            )}
          </div>
        </div>
        
        {/* RSVP count - Mobile optimized */}
        <div style={{ 
          textAlign: 'center',
          flexShrink: 0,
          fontSize: isMobile ? 14 : 12,
          color: '#666',
          background: isSelected ? 'rgba(102, 126, 234, 0.1)' : '#f8f9fa',
          padding: isMobile ? '12px 16px' : '8px 10px',
          borderRadius: isMobile ? 12 : 6,
          minWidth: isMobile ? 70 : 50,
          minHeight: isMobile ? 60 : 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          border: isSelected ? '1px solid rgba(102, 126, 234, 0.2)' : '1px solid #f0f0f0',
        }}>
          <div style={{ 
            fontWeight: 700, 
            color: '#667eea', 
            fontSize: isMobile ? 20 : 16,
            lineHeight: 1,
          }}>
            {event.rsvpCount}
          </div>
          <div style={{ 
            fontSize: isMobile ? 12 : 10, 
            color: '#999', 
            marginTop: isMobile ? 4 : 2,
            fontWeight: 500,
          }}>
            RSVPs
          </div>
        </div>
      </div>
      
      {/* Mobile selection indicator */}
      {isMobile && isSelected && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#667eea',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
        }}>
          ✓
        </div>
      )}
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
