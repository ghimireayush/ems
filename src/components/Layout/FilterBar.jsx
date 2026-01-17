import { useApp } from '../../context/AppContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { getPartyColor } from '../../utils/helpers';

export function FilterBar() {
  const { state, actions } = useApp();
  const { requestLocation, loading: locationLoading, location, constituency } = useGeolocation();
  const { parties, constituencies, eventTypes, filters } = state;

  return (
    <div style={{
      padding: '8px 12px',
      background: '#f5f5f5',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      {/* Location button */}
      <button
        onClick={requestLocation}
        disabled={locationLoading}
        style={{
          padding: '6px 10px',
          background: location ? '#e3f2fd' : 'white',
          border: '1px solid #ddd',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        📍 {locationLoading ? 'Finding...' : location ? 'Located' : 'Find me'}
      </button>

      {/* Show detected constituency */}
      {constituency && (
        <span style={{ 
          fontSize: 12, 
          color: '#1976d2',
          background: '#e3f2fd',
          padding: '4px 8px',
          borderRadius: 4,
        }}>
          {constituency.name}
        </span>
      )}

      <div style={{ width: 1, height: 20, background: '#ddd' }} />

      {/* Constituency filter */}
      <select
        value={filters.constituencyId || ''}
        onChange={(e) => actions.setFilter('constituencyId', e.target.value || null)}
        style={{
          padding: '6px 8px',
          borderRadius: 4,
          border: '1px solid #ddd',
          fontSize: 13,
          background: filters.constituencyId ? '#fff3e0' : 'white',
        }}
      >
        <option value="">All Constituencies</option>
        {constituencies.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Party filter */}
      <select
        value={filters.partyId || ''}
        onChange={(e) => actions.setFilter('partyId', e.target.value || null)}
        style={{
          padding: '6px 8px',
          borderRadius: 4,
          border: '1px solid #ddd',
          fontSize: 13,
          background: filters.partyId ? '#fff3e0' : 'white',
        }}
      >
        <option value="">All Parties</option>
        {parties.map(p => (
          <option key={p.id} value={p.id}>{p.shortName} - {p.name}</option>
        ))}
      </select>

      {/* Event type filter */}
      <select
        value={filters.eventType || ''}
        onChange={(e) => actions.setFilter('eventType', e.target.value || null)}
        style={{
          padding: '6px 8px',
          borderRadius: 4,
          border: '1px solid #ddd',
          fontSize: 13,
          background: filters.eventType ? '#fff3e0' : 'white',
        }}
      >
        <option value="">All Types</option>
        {Object.entries(eventTypes).map(([key, val]) => (
          <option key={key} value={key}>{val.label}</option>
        ))}
      </select>

      {/* Active party indicators */}
      <div style={{ 
        marginLeft: 'auto', 
        display: 'flex', 
        gap: 4,
        alignItems: 'center',
      }}>
        {parties.map(party => (
          <button
            key={party.id}
            onClick={() => actions.setFilter('partyId', 
              filters.partyId === party.id ? null : party.id
            )}
            title={party.name}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: party.color,
              border: filters.partyId === party.id ? '2px solid #333' : '2px solid transparent',
              cursor: 'pointer',
              opacity: filters.partyId && filters.partyId !== party.id ? 0.3 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
