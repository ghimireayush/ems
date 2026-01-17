import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { EventMap } from './components/Map/EventMap';
import { EventList } from './components/Events/EventList';
import { EventDetail } from './components/Events/EventDetail';
import { FilterBar } from './components/Layout/FilterBar';
import { LoginModal, UserMenu } from './components/Auth/Login';
import { dataProvider } from './api/dataProvider';

function AppContent() {
  const { state, actions } = useApp();
  const [activePanel, setActivePanel] = useState('list'); // 'list' | 'detail'
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  // Check for existing auth on mount
  useEffect(() => {
    const storedUser = dataProvider.auth.getUser?.();
    if (storedUser && dataProvider.auth.isAuthenticated?.()) {
      setUser(storedUser);
    }
  }, []);

  // Auto-switch to detail when event selected
  const handleEventSelect = (event) => {
    actions.selectEvent(event);
    if (event) setActivePanel('detail');
  };

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setShowLogin(false);
  };

  const handleLogout = () => {
    dataProvider.auth.logout();
    setUser(null);
  };

  // Loading state
  if (state.loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗳️</div>
        <div style={{ fontSize: 18, color: '#666' }}>Loading Nepal Elections 2026...</div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 18, color: '#d32f2f' }}>Failed to load data</div>
        <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>{state.error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <header 
        data-testid="header"
        style={{
        padding: '12px 16px',
        background: '#1976d2',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            🗳️ Nepal Elections 2026
          </h1>
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            Find political events near you
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            March 5, 2026
          </div>
          
          {/* Auth Section */}
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <button
              data-testid="login-button"
              onClick={() => setShowLogin(true)}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Filter bar */}
      <FilterBar />

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Left panel - List/Detail */}
        <div 
          data-testid="left-panel"
          style={{
          width: 380,
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          background: 'white',
        }}>
          {/* Panel tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e0e0e0',
          }}>
            <button
              onClick={() => setActivePanel('list')}
              style={{
                flex: 1,
                padding: '10px',
                background: activePanel === 'list' ? 'white' : '#f5f5f5',
                border: 'none',
                borderBottom: activePanel === 'list' ? '2px solid #1976d2' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activePanel === 'list' ? 600 : 400,
              }}
            >
              Events
            </button>
            <button
              onClick={() => setActivePanel('detail')}
              style={{
                flex: 1,
                padding: '10px',
                background: activePanel === 'detail' ? 'white' : '#f5f5f5',
                border: 'none',
                borderBottom: activePanel === 'detail' ? '2px solid #1976d2' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activePanel === 'detail' ? 600 : 400,
              }}
            >
              Details
            </button>
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activePanel === 'list' ? (
              <EventList />
            ) : (
              <EventDetail 
                user={user} 
                onLoginRequired={() => setShowLogin(true)} 
              />
            )}
          </div>
        </div>

        {/* Right panel - Map */}
        <div style={{ flex: 1 }}>
          <EventMap />
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        padding: '8px 16px',
        background: '#f5f5f5',
        borderTop: '1px solid #e0e0e0',
        fontSize: 11,
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>
          {user ? `Logged in as ${user.phone}` : 'Login to RSVP to events'}
        </span>
        <span>Built for Nepal 🇳🇵</span>
      </footer>

      {/* Login Modal */}
      <div data-testid="login-modal-container">
        <LoginModal 
          isOpen={showLogin} 
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
