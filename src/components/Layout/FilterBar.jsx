import { useApp } from '../../context/AppContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { getPartyColor } from '../../utils/helpers';

export function FilterBar({ isMobile }) {
  const { state, actions } = useApp();
  const { requestLocation, loading: locationLoading, location, constituency } = useGeolocation();
  const { parties, constituencies, eventTypes, filters } = state;

  const mobileStyles = {
    padding: isMobile ? '8px 12px' : '12px 16px',
    background: 'white',
    borderBottom: '1px solid #e8e8e8',
    display: 'flex',
    gap: isMobile ? 6 : 10,
    alignItems: 'center',
    flexWrap: isMobile ? 'nowrap' : 'wrap',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
    overflowX: isMobile ? 'auto' : 'visible',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitScrollbar: 'none',
  };

  // Hide scrollbar for mobile
  if (isMobile) {
    mobileStyles['&::-webkit-scrollbar'] = { display: 'none' };
  }

  return (
    <div className={isMobile ? 'horizontal-scroll-container' : ''} style={mobileStyles}>
      {/* Location button */}
      <button
        onClick={requestLocation}
        disabled={locationLoading}
        style={{
          padding: isMobile ? '10px 12px' : '8px 12px',
          background: location ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))' : 'white',
          border: `1px solid ${location ? '#667eea' : '#e0e0e0'}`,
          borderRadius: 6,
          cursor: locationLoading ? 'wait' : 'pointer',
          fontSize: isMobile ? 14 : 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: location ? '#667eea' : '#666',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!locationLoading) {
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = location ? '#667eea' : '#e0e0e0';
          e.currentTarget.style.background = location ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))' : 'white';
        }}
      >
        {isMobile ? '📍' : '📍 '}{locationLoading ? 'Finding...' : location ? 'Located' : 'Find me'}
      </button>

      {/* Show detected constituency - hide on mobile if too long */}
      {constituency && !isMobile && (
        <span style={{ 
          fontSize: 12, 
          color: '#667eea',
          background: 'rgba(102, 126, 234, 0.1)',
          padding: '6px 10px',
          borderRadius: 6,
          fontWeight: 500,
          border: '1px solid rgba(102, 126, 234, 0.2)',
        }}>
          ✓ {constituency.name}
        </span>
      )}

      {!isMobile && <div style={{ width: 1, height: 24, background: '#e8e8e8' }} />}

      {/* Constituency filter */}
      <select
        value={filters.constituencyId || ''}
        onChange={(e) => actions.setFilter('constituencyId', e.target.value || null)}
        style={{
          padding: isMobile ? '10px 12px' : '8px 10px',
          borderRadius: 6,
          border: `1px solid ${filters.constituencyId ? '#667eea' : '#e0e0e0'}`,
          fontSize: isMobile ? 14 : 13,
          fontWeight: 500,
          background: filters.constituencyId ? 'rgba(102, 126, 234, 0.08)' : 'white',
          color: '#1a1a1a',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minWidth: isMobile ? 120 : 'auto',
          flexShrink: 0,
        }}
      >
        <option value="">📍 All Constituencies</option>
        {constituencies.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Party filter */}
      <select
        value={filters.partyId || ''}
        onChange={(e) => actions.setFilter('partyId', e.target.value || null)}
        style={{
          padding: isMobile ? '10px 12px' : '8px 10px',
          borderRadius: 6,
          border: `1px solid ${filters.partyId ? '#667eea' : '#e0e0e0'}`,
          fontSize: isMobile ? 14 : 13,
          fontWeight: 500,
          background: filters.partyId ? 'rgba(102, 126, 234, 0.08)' : 'white',
          color: '#1a1a1a',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minWidth: isMobile ? 100 : 'auto',
          flexShrink: 0,
        }}
      >
        <option value="">🎭 All Parties</option>
        {parties.map(p => (
          <option key={p.id} value={p.id}>{p.shortName} - {p.name}</option>
        ))}
      </select>

      {/* Event type filter */}
      <select
        value={filters.eventType || ''}
        onChange={(e) => actions.setFilter('eventType', e.target.value || null)}
        style={{
          padding: isMobile ? '10px 12px' : '8px 10px',
          borderRadius: 6,
          border: `1px solid ${filters.eventType ? '#667eea' : '#e0e0e0'}`,
          fontSize: isMobile ? 14 : 13,
          fontWeight: 500,
          background: filters.eventType ? 'rgba(102, 126, 234, 0.08)' : 'white',
          color: '#1a1a1a',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minWidth: isMobile ? 100 : 'auto',
          flexShrink: 0,
        }}
      >
        <option value="">📋 All Types</option>
        {Object.entries(eventTypes).map(([key, val]) => (
          <option key={key} value={key}>{val.label}</option>
        ))}
      </select>

      {/* Active party indicators - hide on small mobile */}
      {!isMobile && (
        <div style={{ 
          marginLeft: 'auto', 
          display: 'flex', 
          gap: 6,
          alignItems: 'center',
          paddingLeft: 10,
          borderLeft: '1px solid #e8e8e8',
        }}>
        {parties.map(party => (
          <button
            key={party.id}
            onClick={() => actions.setFilter('partyId', 
              filters.partyId === party.id ? null : party.id
            )}
            title={party.name}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: party.logoUrl ? 'white' : party.color,
              border: filters.partyId === party.id 
                ? '2px solid #667eea' 
                : '1px solid #e0e0e0',
              cursor: 'pointer',
              opacity: filters.partyId && filters.partyId !== party.id ? 0.4 : 1,
              padding: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: filters.partyId === party.id ? '0 2px 8px rgba(102, 126, 234, 0.2)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (filters.partyId !== party.id) {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = filters.partyId === party.id ? '#667eea' : '#e0e0e0';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {party.logoUrl ? (
              <img 
                src={`/${party.logoUrl}`}
                alt={party.shortName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <span style={{ 
                fontSize: 11, 
                fontWeight: 700, 
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}>
                {party.shortName.substring(0, 2)}
              </span>
            )}
          </button>
        ))}
      </div>
      )}
    </div>
  );
}
