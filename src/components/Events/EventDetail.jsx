import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { 
  formatDateTime,
  formatDateRange,
  formatDistance,
  eventTypeIcons,
  getPartyColor,
  getGoogleMapsUrl,
  getDirectionsUrl,
} from '../../utils/helpers';

export function EventDetail({ user, onLoginRequired }) {
  const { state, actions } = useApp();
  const { location, getDistance } = useGeolocation();
  const event = state.selectedEvent;
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState(null);

  if (!event) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#666',
        padding: 24,
        textAlign: 'center',
      }}>
        Select an event from the list or map to see details
      </div>
    );
  }

  const distance = location && event.venue?.coordinates
    ? getDistance(location, event.venue.coordinates)
    : null;

  const handleRsvp = async () => {
    // Check if logged in
    if (!user) {
      onLoginRequired?.();
      return;
    }

    setRsvpLoading(true);
    setRsvpError(null);

    try {
      await actions.rsvpEvent(event.id);
    } catch (err) {
      setRsvpError(err.message || 'Failed to RSVP');
    } finally {
      setRsvpLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto' }} data-testid="event-detail">
      {/* Header */}
      <div style={{ 
        padding: 16, 
        borderBottom: '1px solid #e0e0e0',
        background: event.party ? getPartyColor(event.party, 0.05) : '#f9f9f9',
      }}>
        <button
          onClick={() => actions.selectEvent(null)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            color: '#666',
            padding: 0,
            marginBottom: 8,
          }}
        >
          ← Back to list
        </button>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 32 }}>{eventTypeIcons[event.type]}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>{event.title}</h2>
            <div style={{ color: '#666', fontSize: 13 }}>{event.titleNepali}</div>
          </div>
        </div>
        
        {event.party && (
          <div style={{ 
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              background: event.party.color,
              borderRadius: '50%',
            }}></span>
            <span style={{ fontWeight: 500 }}>{event.party.name}</span>
            <span style={{ color: '#666', fontSize: 13 }}>({event.party.nameNepali})</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Date & Time */}
        <Section title="When">
          <div style={{ fontSize: 15 }}>
            {formatDateRange(event.datetime, event.endTime)}
          </div>
        </Section>

        {/* Venue */}
        <Section title="Where">
          <div style={{ fontWeight: 500 }}>{event.venue.name}</div>
          <div style={{ color: '#666', fontSize: 13 }}>{event.venue.nameNepali}</div>
          <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
            {event.venue.address}
          </div>
          
          {distance !== null && (
            <div style={{ 
              marginTop: 8, 
              padding: '6px 10px',
              background: '#e3f2fd',
              borderRadius: 4,
              fontSize: 13,
              display: 'inline-block',
            }}>
              📍 {formatDistance(distance)} from your location
            </div>
          )}
          
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <a
              href={getGoogleMapsUrl(event.venue.coordinates, event.venue.name)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 12px',
                background: '#1976d2',
                color: 'white',
                borderRadius: 4,
                textDecoration: 'none',
                fontSize: 13,
              }}
            >
              View on Map
            </a>
            {location && (
              <a
                href={getDirectionsUrl(location, event.venue.coordinates)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 12px',
                  background: '#43a047',
                  color: 'white',
                  borderRadius: 4,
                  textDecoration: 'none',
                  fontSize: 13,
                }}
              >
                Get Directions
              </a>
            )}
          </div>
        </Section>

        {/* Description */}
        {event.description && (
          <Section title="About">
            <p style={{ margin: 0, lineHeight: 1.5 }}>{event.description}</p>
          </Section>
        )}

        {/* Speakers */}
        {event.speakers?.length > 0 && (
          <Section title="Speakers">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {event.speakers.map((speaker, i) => (
                <li key={i}>{speaker}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Tags */}
        {event.tags?.length > 0 && (
          <Section title="Topics">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {event.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    padding: '3px 8px',
                    background: '#f0f0f0',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Attendance */}
        <Section title="Attendance">
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600 }} data-testid="rsvp-count">{event.rsvpCount}</div>
              <div style={{ fontSize: 12, color: '#666' }}>RSVPs</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{event.expectedAttendance?.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Expected</div>
            </div>
          </div>
        </Section>

        {/* Constituency */}
        {event.constituency && (
          <Section title="Constituency">
            <div style={{ fontWeight: 500 }}>{event.constituency.name}</div>
            <div style={{ color: '#666', fontSize: 13 }}>
              {event.constituency.district}, {event.constituency.province}
            </div>
            <div style={{ color: '#666', fontSize: 13 }}>
              {event.constituency.registeredVoters.toLocaleString()} registered voters
            </div>
          </Section>
        )}

        {/* RSVP Button */}
        <div style={{ marginTop: 24 }}>
          {rsvpError && (
            <div style={{
              marginBottom: 12,
              padding: 12,
              background: '#ffebee',
              color: '#c62828',
              borderRadius: 6,
              fontSize: 13,
            }}>
              {rsvpError}
            </div>
          )}
          
          <button
            onClick={handleRsvp}
            disabled={event.userRsvp || rsvpLoading}
            data-testid="rsvp-button"
            style={{
              width: '100%',
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              background: event.userRsvp 
                ? '#e0e0e0' 
                : rsvpLoading 
                  ? '#90caf9'
                  : (event.party?.color || '#1976d2'),
              color: event.userRsvp ? '#666' : 'white',
              border: 'none',
              borderRadius: 6,
              cursor: (event.userRsvp || rsvpLoading) ? 'default' : 'pointer',
            }}
          >
            {event.userRsvp 
              ? '✓ You\'re Going!' 
              : rsvpLoading 
                ? 'Saving...'
                : user 
                  ? 'RSVP to this Event'
                  : '🔐 Login to RSVP'
            }
          </button>
          
          {!user && (
            <div style={{
              marginTop: 8,
              fontSize: 12,
              color: '#666',
              textAlign: 'center',
            }}>
              You need to be logged in to RSVP
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ 
        margin: '0 0 8px 0', 
        fontSize: 12, 
        fontWeight: 600,
        textTransform: 'uppercase',
        color: '#999',
        letterSpacing: '0.5px',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
