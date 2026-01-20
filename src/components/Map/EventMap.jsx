import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { useEvents } from '../../hooks/useEvents';
import { formatTime, getPartyColor, eventTypeIcons } from '../../utils/helpers';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon creator
function createEventIcon(party) {
  const color = party?.color || '#666666';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

// Map view controller component
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [map, center, zoom]);
  
  return null;
}

export function EventMap() {
  const { state, actions } = useApp();
  const { events } = useEvents();
  const { constituencies, mapCenter, mapZoom, userLocation } = state;

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Constituency boundaries */}
        {constituencies.map(constituency => {
          const bounds = constituency.bounds;
          if (!bounds || bounds.length < 2) return null;
          
          return (
            <Rectangle
              key={constituency.id}
              bounds={[
                [bounds[0][0], bounds[0][1]],
                [bounds[1][0], bounds[1][1]],
              ]}
              pathOptions={{
                color: state.filters.constituencyId === constituency.id ? '#1976d2' : '#666',
                weight: state.filters.constituencyId === constituency.id ? 3 : 1,
                fillOpacity: 0.05,
                dashArray: state.filters.constituencyId === constituency.id ? null : '5, 5',
              }}
              eventHandlers={{
                click: () => {
                  if (state.filters.constituencyId === constituency.id) {
                    actions.setFilter('constituencyId', null);
                  } else {
                    actions.setFilter('constituencyId', constituency.id);
                    actions.setMapView(constituency.center, 14);
                  }
                },
              }}
            >
              <Popup>
                <strong>{constituency.name}</strong>
                <br />
                {constituency.nameNepali}
                <br />
                <small>{constituency.registeredVoters?.toLocaleString()} voters</small>
              </Popup>
            </Rectangle>
          );
        })}

        {/* Event markers */}
        {events.map(event => (
          <Marker
            key={event.id}
            position={event.venue.coordinates}
            icon={createEventIcon(event.party)}
            eventHandlers={{
              click: () => actions.selectEvent(event),
            }}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  marginBottom: 8 
                }}>
                  <span style={{ fontSize: 20 }}>{eventTypeIcons[event.type]}</span>
                  <strong>{event.title}</strong>
                </div>
                
                {event.party && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    background: getPartyColor(event.party, 0.1),
                    color: event.party.color,
                    borderRadius: 4,
                    fontSize: 12,
                    marginBottom: 8,
                  }}>
                    {event.party.logoUrl && (
                      <img 
                        src={`/${event.party.logoUrl}`}
                        alt={event.party.shortName}
                        style={{
                          width: 16,
                          height: 16,
                          objectFit: 'contain',
                        }}
                      />
                    )}
                    <span>{event.party.shortName}</span>
                  </div>
                )}
                
                <div style={{ fontSize: 13, color: '#666' }}>
                  {event.venue.name}
                  <br />
                  {formatTime(event.datetime)}
                  <br />
                  {event.rsvpCount} RSVPs
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: 'user-marker',
              html: `
                <div style="
                  width: 16px;
                  height: 16px;
                  background: #4285f4;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 0 0 2px #4285f4, 0 2px 4px rgba(0,0,0,0.3);
                "></div>
              `,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>Your location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
