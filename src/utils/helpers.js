// Date formatting utilities
export function formatDate(dateString, options = {}) {
  if (!dateString) return 'Date TBD';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Date TBD';
  
  const defaultOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

export function formatTime(dateString) {
  if (!dateString) return 'Time TBD';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Time TBD';
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return 'Date & Time TBD';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Date & Time TBD';
  
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

export function formatDateRange(start, end) {
  if (!start && !end) return 'Date & Time TBD';
  if (!start) return formatDateTime(end);
  if (!end) return formatDateTime(start);
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (isNaN(startDate.getTime()) && isNaN(endDate.getTime())) return 'Date & Time TBD';
  if (isNaN(startDate.getTime())) return formatDateTime(end);
  if (isNaN(endDate.getTime())) return formatDateTime(start);
  
  if (startDate.toDateString() === endDate.toDateString()) {
    return `${formatDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
  }
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}

export function getRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  return formatDate(dateString);
}

// Distance formatting
export function formatDistance(km) {
  if (km === null || km === undefined) return null;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

// Event type icons (using simple unicode for now)
export const eventTypeIcons = {
  rally: '',
  townhall: '',
  march: '',
  meeting: '',
  assembly: '',
  canvassing: '',
  conference: '',
  debate: '',
};

// Party color utilities
export function getPartyColor(party, opacity = 1) {
  if (!party?.color) return `rgba(128, 128, 128, ${opacity})`;
  
  // Convert hex to rgba
  const hex = party.color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Search/filter utilities
export function searchEvents(events, query) {
  if (!query || query.trim() === '') return events;
  
  const lowerQuery = query.toLowerCase().trim();
  
  return events.filter(event => {
    return (
      event.title.toLowerCase().includes(lowerQuery) ||
      event.titleNepali?.includes(lowerQuery) ||
      event.venue?.name.toLowerCase().includes(lowerQuery) ||
      event.venue?.address.toLowerCase().includes(lowerQuery) ||
      event.description?.toLowerCase().includes(lowerQuery) ||
      event.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      event.party?.name.toLowerCase().includes(lowerQuery) ||
      event.party?.shortName.toLowerCase().includes(lowerQuery)
    );
  });
}

// URL utilities
export function getGoogleMapsUrl(coordinates, label) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return '#';
  }
  const [lat, lng] = coordinates;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function getDirectionsUrl(from, to) {
  if (!from || !Array.isArray(from) || from.length < 2 || 
      !to || !Array.isArray(to) || to.length < 2) {
    return '#';
  }
  const [fromLat, fromLng] = from;
  const [toLat, toLng] = to;
  return `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;
}
