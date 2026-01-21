import { useState, useEffect } from 'react';
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

export function EventDetail({ user, onLoginRequired, isMobile }) {
  const { state, actions } = useApp();
  const { location, getDistance } = useGeolocation();
  const event = state.selectedEvent;
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState(null);

  // Log when event changes
  useEffect(() => {
    if (event?.userRsvp) {
      setRsvpLoading(false);
    }
  }, [event?.userRsvp]);

  console.log('[EventDetail] Rendering - event.id:', event?.id, 'event.userRsvp:', event?.userRsvp, 'rsvpLoading:', rsvpLoading);

  if (!event) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#666',
        padding: isMobile ? 32 : 24,
        textAlign: 'center',
        flexDirection: 'column',
      }}>
        <div style={{ fontSize: isMobile ? 48 : 40, marginBottom: 16 }}>📅</div>
        <div style={{ fontSize: isMobile ? 16 : 14, fontWeight: 500 }}>
          Select an event to see details
        </div>
        <div style={{ fontSize: isMobile ? 14 : 12, marginTop: 8, color: '#999' }}>
          Tap any event from the list or map
        </div>
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
      setRsvpLoading(false);
    } catch (err) {
      setRsvpError(err.message || 'Failed to RSVP');
      setRsvpLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        WebkitOverflowScrolling: 'touch',
      }} 
      data-testid="event-detail"
    >
      {/* Header - Mobile optimized */}
      <div style={{ 
        padding: isMobile ? '20px 16px' : 16, 
        borderBottom: '1px solid #e0e0e0',
        background: event.party ? getPartyColor(event.party, 0.05) : '#f9f9f9',
        position: isMobile ? 'static' : 'sticky',
        top: isMobile ? 'auto' : 0,
        zIndex: 100,
        backdropFilter: isMobile ? 'none' : 'blur(10px)',
        WebkitBackdropFilter: isMobile ? 'none' : 'blur(10px)',
      }}>
        <button
          onClick={() => actions.selectEvent(null)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: isMobile ? 16 : 14,
            color: '#667eea',
            padding: isMobile ? '8px 0' : 0,
            marginBottom: isMobile ? 12 : 8,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minHeight: isMobile ? 44 : 'auto',
          }}
        >
          <span>←</span> Back to list
        </button>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 16 : 12 }}>
          <span style={{ fontSize: isMobile ? 40 : 32, flexShrink: 0 }}>{eventTypeIcons[event.type]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: isMobile ? 20 : 18,
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}>
              {event.title}
            </h2>
            {event.titleNepali && (
              <div style={{ 
                color: '#666', 
                fontSize: isMobile ? 14 : 13,
                marginTop: 4,
                lineHeight: 1.4,
              }}>
                {event.titleNepali}
              </div>
            )}
          </div>
        </div>
        
        {event.party && (
          <div style={{ 
            marginTop: isMobile ? 16 : 12,
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 12 : 8,
            padding: isMobile ? '12px 16px' : '8px 12px',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: isMobile ? 12 : 8,
            border: '1px solid rgba(0,0,0,0.1)',
          }}>
            {event.party.logoUrl && (
              <img 
                src={`/${event.party.logoUrl}`}
                alt={event.party.name}
                style={{
                  width: isMobile ? 40 : 32,
                  height: isMobile ? 40 : 32,
                  objectFit: 'contain',
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              />
            )}
            {!event.party.logoUrl && (
              <span style={{
                display: 'inline-block',
                width: isMobile ? 40 : 32,
                height: isMobile ? 40 : 32,
                background: event.party.color,
                borderRadius: '50%',
                flexShrink: 0,
              }}></span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ 
                fontWeight: 600, 
                fontSize: isMobile ? 16 : 14,
                display: 'block',
                lineHeight: 1.3,
              }}>
                {event.party.name}
              </span>
              <span style={{ 
                color: '#666', 
                fontSize: isMobile ? 13 : 12,
                display: 'block',
                marginTop: 2,
              }}>
                ({event.party.nameNepali})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content - Mobile optimized */}
      <div style={{ 
        padding: isMobile ? '20px 16px' : 16,
        paddingTop: isMobile ? '8px' : 16, // Reduced top padding since header is sticky
      }}>
        {/* Date & Time */}
        <Section title="When" isMobile={isMobile}>
          <div style={{ 
            fontSize: isMobile ? 16 : 15,
            fontWeight: 500,
            color: '#1a1a1a',
          }}>
            {formatDateRange(event.datetime, event.endTime)}
          </div>
        </Section>

        {/* Venue */}
        <Section title="Where" isMobile={isMobile}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: isMobile ? 16 : 15,
            marginBottom: 4,
          }}>
            {event.venue.name}
          </div>
          <div style={{ 
            color: '#666', 
            fontSize: isMobile ? 14 : 13,
            marginBottom: 4,
          }}>
            {event.venue.nameNepali}
          </div>
          <div style={{ 
            color: '#666', 
            fontSize: isMobile ? 14 : 13, 
            marginTop: 8,
            lineHeight: 1.4,
          }}>
            {event.venue.address}
          </div>
          
          {distance !== null && (
            <div style={{ 
              marginTop: isMobile ? 12 : 8, 
              padding: isMobile ? '10px 16px' : '6px 10px',
              background: '#e3f2fd',
              borderRadius: isMobile ? 8 : 4,
              fontSize: isMobile ? 14 : 13,
              display: 'inline-block',
              fontWeight: 500,
            }}>
              📍 {formatDistance(distance)} from your location
            </div>
          )}
          
          <div style={{ 
            marginTop: isMobile ? 16 : 12, 
            display: 'flex', 
            gap: isMobile ? 12 : 8,
            flexWrap: 'wrap',
          }}>
            <a
              href={getGoogleMapsUrl(event.venue.coordinates, event.venue.name)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: isMobile ? '12px 20px' : '8px 12px',
                background: '#1976d2',
                color: 'white',
                borderRadius: isMobile ? 8 : 4,
                textDecoration: 'none',
                fontSize: isMobile ? 15 : 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minHeight: isMobile ? 44 : 'auto',
              }}
            >
              🗺️ View on Map
            </a>
            {location && (
              <a
                href={getDirectionsUrl(location, event.venue.coordinates)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: isMobile ? '12px 20px' : '8px 12px',
                  background: '#43a047',
                  color: 'white',
                  borderRadius: isMobile ? 8 : 4,
                  textDecoration: 'none',
                  fontSize: isMobile ? 15 : 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: isMobile ? 44 : 'auto',
                }}
              >
                🧭 Directions
              </a>
            )}
          </div>
        </Section>

        {/* Description */}
        {event.description && (
          <Section title="About" isMobile={isMobile}>
            <p style={{ 
              margin: 0, 
              lineHeight: 1.6,
              fontSize: isMobile ? 15 : 14,
              color: '#333',
            }}>
              {event.description}
            </p>
          </Section>
        )}

        {/* Speakers */}
        {event.speakers?.length > 0 && (
          <Section title="Speakers" isMobile={isMobile}>
            <ul style={{ 
              margin: 0, 
              paddingLeft: isMobile ? 24 : 20,
              fontSize: isMobile ? 15 : 14,
              lineHeight: 1.6,
            }}>
              {event.speakers.map((speaker, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{speaker}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Tags */}
        {event.tags?.length > 0 && (
          <Section title="Topics" isMobile={isMobile}>
            <div style={{ display: 'flex', gap: isMobile ? 8 : 6, flexWrap: 'wrap' }}>
              {event.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    padding: isMobile ? '6px 12px' : '3px 8px',
                    background: '#f0f0f0',
                    borderRadius: isMobile ? 16 : 12,
                    fontSize: isMobile ? 13 : 12,
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Attendance */}
        <Section title="Attendance" isMobile={isMobile}>
          <div style={{ 
            display: 'flex', 
            gap: isMobile ? 32 : 24,
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ 
                fontSize: isMobile ? 28 : 24, 
                fontWeight: 600,
                color: '#667eea',
              }} data-testid="rsvp-count">
                {event.rsvpCount}
              </div>
              <div style={{ 
                fontSize: isMobile ? 13 : 12, 
                color: '#666',
                fontWeight: 500,
              }}>
                RSVPs
              </div>
            </div>
            <div>
              <div style={{ 
                fontSize: isMobile ? 28 : 24, 
                fontWeight: 600,
                color: '#43a047',
              }}>
                {event.expectedAttendance?.toLocaleString()}
              </div>
              <div style={{ 
                fontSize: isMobile ? 13 : 12, 
                color: '#666',
                fontWeight: 500,
              }}>
                Expected
              </div>
            </div>
          </div>
        </Section>

        {/* Constituency */}
        {event.constituency && (
          <Section title="Constituency" isMobile={isMobile}>
            <div style={{ 
              fontWeight: 600, 
              fontSize: isMobile ? 16 : 15,
              marginBottom: 4,
            }}>
              {event.constituency.name}
            </div>
            <div style={{ 
              color: '#666', 
              fontSize: isMobile ? 14 : 13,
              marginBottom: 4,
            }}>
              {event.constituency.district}, {event.constituency.province}
            </div>
            <div style={{ 
              color: '#666', 
              fontSize: isMobile ? 14 : 13,
            }}>
              {event.constituency.registeredVoters.toLocaleString()} registered voters
            </div>
          </Section>
        )}

        {/* RSVP Button - Mobile optimized */}
        <div style={{ 
          marginTop: isMobile ? 32 : 24,
          position: isMobile ? 'sticky' : 'static',
          bottom: isMobile ? 0 : 'auto',
          background: isMobile ? 'rgba(255,255,255,0.95)' : 'transparent',
          padding: isMobile ? '16px 0 16px 0' : 0,
          borderTop: isMobile ? '1px solid #e8e8e8' : 'none',
          zIndex: 50,
          backdropFilter: isMobile ? 'blur(10px)' : 'none',
          WebkitBackdropFilter: isMobile ? 'blur(10px)' : 'none',
        }}>
          {rsvpError && (
            <div style={{
              marginBottom: isMobile ? 16 : 12,
              padding: isMobile ? 16 : 12,
              background: '#ffebee',
              color: '#c62828',
              borderRadius: isMobile ? 8 : 6,
              fontSize: isMobile ? 14 : 13,
              lineHeight: 1.4,
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
              padding: isMobile ? '16px 24px' : '12px 24px',
              fontSize: isMobile ? 16 : 15,
              fontWeight: 600,
              background: event.userRsvp 
                ? '#e0e0e0' 
                : rsvpLoading 
                  ? '#90caf9'
                  : (event.party?.color || '#1976d2'),
              color: event.userRsvp ? '#666' : 'white',
              border: 'none',
              borderRadius: isMobile ? 12 : 6,
              cursor: (event.userRsvp || rsvpLoading) ? 'default' : 'pointer',
              minHeight: isMobile ? 56 : 'auto',
              transition: 'all 0.2s ease',
              boxShadow: !event.userRsvp && !rsvpLoading ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            {event.userRsvp 
              ? '✅ You\'re Going!' 
              : rsvpLoading 
                ? '⏳ Saving...'
                : user 
                  ? '🎫 RSVP to this Event'
                  : '🔐 Login to RSVP'
            }
          </button>
          
          {!user && (
            <div style={{
              marginTop: isMobile ? 12 : 8,
              fontSize: isMobile ? 13 : 12,
              color: '#666',
              textAlign: 'center',
              lineHeight: 1.4,
            }}>
              You need to be logged in to RSVP to events
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, isMobile }) {
  return (
    <div style={{ marginBottom: isMobile ? 28 : 20 }}>
      <h3 style={{ 
        margin: `0 0 ${isMobile ? 12 : 8}px 0`, 
        fontSize: isMobile ? 13 : 12, 
        fontWeight: 600,
        textTransform: 'uppercase',
        color: '#667eea',
        letterSpacing: '0.5px',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
