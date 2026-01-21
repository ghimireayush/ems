import { useApp } from '../../context/AppContext';
import { useGeolocation } from '../../hooks/useGeolocation';

export function FilterBar({ isMobile }) {
  const { state, actions } = useApp();
  const { requestLocation, loading: locationLoading, location, constituency } = useGeolocation();
  const { parties, constituencies, eventTypes, filters } = state;

  const mobileStyles = {
    padding: isMobile ? '12px 16px' : '12px 16px',
    background: 'white',
    borderBottom: '1px solid #e8e8e8',
    display: 'flex',
    flexDirection: 'row', // Always horizontal
    gap: isMobile ? 6 : 10,
    alignItems: 'center',
    flexWrap: 'nowrap',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
    position: 'relative',
    zIndex: 'var(--z-content)',
    overflowX: isMobile ? 'auto' : 'visible',
  };

  return (
    <>
    <div style={mobileStyles}>
      {/* Location button - Compact for mobile */}
      <button
        onClick={requestLocation}
        disabled={locationLoading}
        style={{
          padding: isMobile ? '10px 12px' : '8px 12px',
          background: location ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05))' : 'white',
          border: `1px solid ${location ? '#667eea' : '#e0e0e0'}`,
          borderRadius: 8,
          cursor: locationLoading ? 'wait' : 'pointer',
          fontSize: isMobile ? 13 : 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          color: location ? '#667eea' : '#666',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          minHeight: isMobile ? 40 : 'auto',
          minWidth: isMobile ? 90 : 'auto',
          maxWidth: isMobile ? 120 : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <span style={{ fontSize: isMobile ? 14 : 14 }}>📍</span>
        {locationLoading 
          ? 'Finding...' 
          : location && constituency 
            ? (isMobile ? constituency.name.split(' ')[0] : 'Located')
            : location 
              ? (isMobile ? 'Located' : 'Located')
              : (isMobile ? 'Find' : 'Find me')
        }
      </button>

      {/* Desktop: Show detected constituency right after Find me button */}
      {constituency && !isMobile && (
        <span style={{ 
          fontSize: 12, 
          color: '#667eea',
          background: 'rgba(102, 126, 234, 0.1)',
          padding: '6px 10px',
          borderRadius: 6,
          fontWeight: 500,
          border: '1px solid rgba(102, 126, 234, 0.2)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {constituency.name}
        </span>
      )}

      {/* Constituency filter - Larger for mobile */}
      <select
        value={filters.constituencyId || ''}
        onChange={(e) => actions.setFilter('constituencyId', e.target.value || null)}
        style={{
          padding: isMobile ? '10px 12px' : '8px 10px',
          borderRadius: 8,
          border: `1px solid ${filters.constituencyId ? '#667eea' : '#e0e0e0'}`,
          fontSize: isMobile ? 13 : 13,
          fontWeight: 500,
          background: filters.constituencyId ? 'rgba(102, 126, 234, 0.08)' : 'white',
          color: '#1a1a1a',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flex: '1',
          minWidth: isMobile ? 95 : 'auto',
          maxWidth: isMobile ? 110 : 'none',
          minHeight: isMobile ? 40 : 'auto',
        }}
      >
        <option value="">{isMobile ? 'Areas' : 'All Constituencies'}</option>
        {constituencies.map(c => (
          <option key={c.id} value={c.id}>
            {isMobile ? c.name.split(' ')[0] : c.name}
          </option>
        ))}
      </select>

      {/* Party filter - Larger for mobile */}
      <select
        value={filters.partyId || ''}
        onChange={(e) => actions.setFilter('partyId', e.target.value || null)}
        style={{
          padding: isMobile ? '10px 14px' : '8px 10px',
          borderRadius: 8,
          border: `1px solid ${filters.partyId ? '#667eea' : '#e0e0e0'}`,
          fontSize: isMobile ? 13 : 13,
          fontWeight: 500,
          background: filters.partyId ? 'rgba(102, 126, 234, 0.08)' : 'white',
          color: '#1a1a1a',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flex: isMobile ? '1.2' : '1', // Slightly larger flex ratio on mobile
          minWidth: isMobile ? 99 : 'auto',
          maxWidth: isMobile ? 130 : 'none',
          minHeight: isMobile ? 42 : 'auto',
        }}
      >
        <option value="">{isMobile ? 'Parties' : 'All Parties'}</option>
        {parties.map(p => (
          <option key={p.id} value={p.id}>
            {isMobile ? p.shortName : `${p.shortName} - ${p.name}`}
          </option>
        ))}
      </select>

      {/* Event type filter - Larger for mobile */}
      <select
        value={filters.eventType || ''}
        onChange={(e) => actions.setFilter('eventType', e.target.value || null)}
        style={{
          padding: isMobile ? '10px 12px' : '8px 10px',
          borderRadius: 8,
          border: `1px solid ${filters.eventType ? '#667eea' : '#e0e0e0'}`,
          fontSize: isMobile ? 13 : 13,
          fontWeight: 500,
          background: filters.eventType ? 'rgba(102, 126, 234, 0.08)' : 'white',
          color: '#1a1a1a',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flex: '1',
          minWidth: isMobile ? 87.5 : 'auto',
          maxWidth: isMobile ? 110 : 'none',
          minHeight: isMobile ? 40 : 'auto',
        }}
      >
        <option value="">{isMobile ? 'Types' : 'All Types'}</option>
        {Object.entries(eventTypes).map(([key, val]) => (
          <option key={key} value={key}>{val.label}</option>
        ))}
      </select>

      {/* Active party indicators - Desktop only */}
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

    {/* Mobile party indicators - Below filter bar */}
    {isMobile && (
      <div style={{
        padding: '12px 16px',
        background: 'white',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        <style>{`
          .mobile-party-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {parties.map(party => (
          <button
            key={party.id}
            onClick={() => actions.setFilter('partyId', 
              filters.partyId === party.id ? null : party.id
            )}
            title={party.name}
            style={{
              minWidth: 48,
              height: 48,
              borderRadius: 8,
              background: party.logoUrl ? 'white' : party.color,
              border: filters.partyId === party.id 
                ? '2px solid #667eea' 
                : '1px solid #e0e0e0',
              cursor: 'pointer',
              opacity: filters.partyId && filters.partyId !== party.id ? 0.4 : 1,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: filters.partyId === party.id ? '0 2px 8px rgba(102, 126, 234, 0.2)' : 'none',
              flexShrink: 0,
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
                  display: 'block',
                  margin: 'auto',
                }}
              />
            ) : (
              <span style={{ 
                fontSize: 14, 
                fontWeight: 700, 
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
              }}>
                {party.shortName.substring(0, 2)}
              </span>
            )}
          </button>
        ))}
      </div>
    )}
    </>
  );
}
