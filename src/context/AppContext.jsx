import { createContext, useContext, useReducer, useEffect } from 'react';
import { dataProvider } from '../api/dataProvider';

// Initial state - empty until data loads
const initialState = {
  // Data (loaded async)
  parties: [],
  constituencies: [],
  events: [],
  eventTypes: {},
  
  // Loading states
  loading: true,
  error: null,
  
  // User state
  userLocation: null,
  userConstituency: null,
  
  // Filters
  filters: {
    constituencyId: null,
    partyId: null,
    eventType: null,
    dateRange: null,
  },
  
  // UI state
  selectedEvent: null,
  mapCenter: [27.7172, 85.3240], // Kathmandu default
  mapZoom: 12,
};

// Action types
const ACTIONS = {
  SET_DATA: 'SET_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USER_LOCATION: 'SET_USER_LOCATION',
  SET_USER_CONSTITUENCY: 'SET_USER_CONSTITUENCY',
  SET_FILTER: 'SET_FILTER',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  SELECT_EVENT: 'SELECT_EVENT',
  SET_MAP_VIEW: 'SET_MAP_VIEW',
  RSVP_EVENT: 'RSVP_EVENT',
  UPDATE_EVENT: 'UPDATE_EVENT',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DATA:
      return { 
        ...state, 
        ...action.payload,
        loading: false,
        error: null,
      };
    
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTIONS.SET_USER_LOCATION:
      return { ...state, userLocation: action.payload };
    
    case ACTIONS.SET_USER_CONSTITUENCY:
      return { ...state, userConstituency: action.payload };
    
    case ACTIONS.SET_FILTER:
      return {
        ...state,
        filters: { ...state.filters, [action.payload.key]: action.payload.value }
      };
    
    case ACTIONS.CLEAR_FILTERS:
      return {
        ...state,
        filters: { constituencyId: null, partyId: null, eventType: null, dateRange: null }
      };
    
    case ACTIONS.SELECT_EVENT:
      return { ...state, selectedEvent: action.payload };
    
    case ACTIONS.SET_MAP_VIEW:
      return {
        ...state,
        mapCenter: action.payload.center || state.mapCenter,
        mapZoom: action.payload.zoom || state.mapZoom,
      };
    
    case ACTIONS.RSVP_EVENT:
      return {
        ...state,
        events: state.events.map(evt =>
          evt.id === action.payload.eventId
            ? { ...evt, rsvpCount: action.payload.rsvpCount, userRsvp: true }
            : evt
        ),
        selectedEvent: state.selectedEvent?.id === action.payload.eventId
          ? { ...state.selectedEvent, rsvpCount: action.payload.rsvpCount, userRsvp: true }
          : state.selectedEvent,
      };

    case ACTIONS.UPDATE_EVENT:
      return {
        ...state,
        events: state.events.map(evt =>
          evt.id === action.payload.id ? { ...evt, ...action.payload } : evt
        ),
        selectedEvent: state.selectedEvent?.id === action.payload.id
          ? { ...state.selectedEvent, ...action.payload }
          : state.selectedEvent,
      };
    
    default:
      return state;
  }
}

// Context
const AppContext = createContext(null);

// Provider
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial data from API/JSON
  useEffect(() => {
    async function loadData() {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        
        // Fetch all data in parallel
        const [partiesResult, constituenciesResult, eventsResult, eventTypes] = await Promise.all([
          dataProvider.parties.list(),
          dataProvider.constituencies.list(),
          dataProvider.events.list({ perPage: 100 }), // Get all events
          dataProvider.meta.eventTypes(),
        ]);

        // Handle both direct array and paginated response
        const eventsData = Array.isArray(eventsResult) ? eventsResult : (eventsResult?.data || []);
        
        dispatch({
          type: ACTIONS.SET_DATA,
          payload: {
            parties: partiesResult,
            constituencies: constituenciesResult,
            events: eventsData,
            eventTypes: eventTypes,
          },
        });
      } catch (error) {
        console.error('Failed to load data:', error);
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      }
    }

    loadData();
  }, []);

  // Actions
  const actions = {
    setUserLocation: async (coords) => {
      dispatch({ type: ACTIONS.SET_USER_LOCATION, payload: coords });
      
      // Auto-detect constituency via API
      try {
        const constituency = await dataProvider.constituencies.detect(coords[0], coords[1]);
        if (constituency) {
          dispatch({ type: ACTIONS.SET_USER_CONSTITUENCY, payload: constituency });
        }
      } catch (error) {
        console.warn('Could not detect constituency:', error);
      }
    },
    
    setFilter: (key, value) => {
      dispatch({ type: ACTIONS.SET_FILTER, payload: { key, value } });
    },
    
    clearFilters: () => {
      dispatch({ type: ACTIONS.CLEAR_FILTERS });
    },
    
    selectEvent: async (event, skipRefetch = false) => {
      if (event && !event.party && !skipRefetch) {
        // Fetch full event details if not enriched
        try {
          const fullEvent = await dataProvider.events.get(event.id);
          dispatch({ type: ACTIONS.SELECT_EVENT, payload: fullEvent });
        } catch (error) {
          dispatch({ type: ACTIONS.SELECT_EVENT, payload: event });
        }
      } else {
        dispatch({ type: ACTIONS.SELECT_EVENT, payload: event });
      }
      
      if (event?.venue?.coordinates) {
        dispatch({
          type: ACTIONS.SET_MAP_VIEW,
          payload: { center: event.venue.coordinates, zoom: 15 }
        });
      }
    },
    
    setMapView: (center, zoom) => {
      dispatch({ type: ACTIONS.SET_MAP_VIEW, payload: { center, zoom } });
    },
    
    rsvpEvent: async (eventId) => {
      try {
        // Call RSVP endpoint - returns full event with user_rsvp already set
        const updatedEvent = await dataProvider.events.rsvp(eventId, 'going');
        
        // Update the events list
        dispatch({ 
          type: ACTIONS.UPDATE_EVENT, 
          payload: updatedEvent
        });
        
        // Update selected event directly
        dispatch({
          type: ACTIONS.SELECT_EVENT,
          payload: updatedEvent
        });
      } catch (error) {
        console.error('RSVP failed:', error);
        throw error;
      }
    },

    // Refresh events (e.g., after filter change)
    refreshEvents: async (filters = {}) => {
      try {
        const result = await dataProvider.events.list({ ...filters, perPage: 100 });
        dispatch({
          type: ACTIONS.SET_DATA,
          payload: { events: result.data },
        });
      } catch (error) {
        console.error('Failed to refresh events:', error);
      }
    },

    // Get events near location
    getEventsNearby: async (lat, lng, radius = 5000) => {
      try {
        const result = await dataProvider.events.nearby({ lat, lng, radius });
        return result.data;
      } catch (error) {
        console.error('Failed to get nearby events:', error);
        return [];
      }
    },
  };

  return (
    <AppContext.Provider value={{ state, actions, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export { ACTIONS };
