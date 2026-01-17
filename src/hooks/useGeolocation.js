import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

export function useGeolocation() {
  const { state, actions } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        actions.setUserLocation(coords);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, [actions]);

  // Calculate distance between two coordinates (Haversine formula)
  const getDistance = useCallback((coords1, coords2) => {
    if (!coords1 || !coords2) return null;

    const R = 6371; // Earth's radius in km
    const dLat = toRad(coords2[0] - coords1[0]);
    const dLng = toRad(coords2[1] - coords1[1]);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coords1[0])) * Math.cos(toRad(coords2[0])) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Get events sorted by distance from user
  const sortByDistance = useCallback((events) => {
    if (!state.userLocation) return events;

    return [...events]
      .map(event => ({
        ...event,
        distance: event.venue?.coordinates 
          ? getDistance(state.userLocation, event.venue.coordinates)
          : null,
      }))
      .sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [state.userLocation, getDistance]);

  return {
    location: state.userLocation,
    constituency: state.userConstituency,
    loading,
    error,
    requestLocation,
    getDistance,
    sortByDistance,
  };
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
