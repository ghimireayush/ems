import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { EventMap } from './components/Map/EventMap';
import { EventList } from './components/Events/EventList';
import { EventDetail } from './components/Events/EventDetail';
import { FilterBar } from './components/Layout/FilterBar';
import { LoginModal, UserMenu } from './components/Auth/Login';
import { dataProvider } from './api/dataProvider';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';

function AppContent() {
  const { state, actions } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map'

  useEffect(() => {
    const storedUser = dataProvider.auth.getUser?.();
    if (storedUser && dataProvider.auth.isAuthenticated?.()) {
      setUser(storedUser);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
      
      // Force re-render of mobile-specific styles
      if (newIsMobile !== isMobile) {
        // Trigger a small delay to ensure proper re-rendering
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const handleEventSelect = (event) => {
    actions.selectEvent(event);
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'inherit',
      }}>
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          .loader-icon {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
        <div className="loader-icon" style={{ 
          fontSize: 80, 
          marginBottom: 32,
        }}>Loading</div>
        <div style={{ 
          fontSize: 24, 
          color: 'white',
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: 12,
          letterSpacing: '-0.5px',
        }}>Loading Nepal Elections 2026</div>
        <div style={{
          width: 200,
          height: 3,
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
            animation: 'shimmer 2s infinite',
            backgroundSize: '200% 100%',
          }}></div>
        </div>
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
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        fontFamily: 'inherit',
      }}>
        <div style={{
          background: 'white',
          padding: 48,
          borderRadius: 20,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          maxWidth: 420,
          animation: 'slideInUp 0.4s ease-out',
        }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}>!</div>
          <h2 style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            color: '#1a1a1a', 
            marginBottom: 12,
            letterSpacing: '-0.5px',
          }}>Failed to Load</h2>
          <p style={{ 
            fontSize: 15, 
            color: '#666', 
            marginBottom: 32,
            lineHeight: 1.6,
          }}>{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 15,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'inherit',
      background: '#fafafa',
    }}>
      {/* Header */}
      <header 
        data-testid="header"
        style={{
          padding: isMobile ? '12px 16px' : '16px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 'var(--z-header)',
        }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 
            onClick={() => actions.clearFilters()}
            style={{ 
              margin: 0, 
              fontSize: isMobile ? 16 : 22, 
              fontWeight: 700, 
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 6 : 10,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            title="Click to clear all filters"
          >
            <span style={{ fontSize: isMobile ? 20 : 28 }}>🗳️</span>
            Nepal Elections 2026
          </h1>
          {!isMobile && (
            <p style={{ 
              fontSize: 13, 
              opacity: 0.95, 
              marginTop: 4,
              margin: '4px 0 0 0',
              fontWeight: 400,
            }}>
              Discover political events near you
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 20 }}>
          {!isMobile && (
            <div style={{ 
              fontSize: 13, 
              opacity: 0.9, 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span></span>
              March 5, 2026
            </div>
          )}
          
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} isMobile={isMobile} />
          ) : (
            <button
              data-testid="login-button"
              onClick={() => setShowLogin(true)}
              style={{
                padding: isMobile ? '8px 12px' : '10px 20px',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
                fontSize: isMobile ? 13 : 14,
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isMobile ? 'Login' : 'Login'}
            </button>
          )}
        </div>
      </header>

      {/* Filter bar - Sticky on web */}
      <div style={{
        position: isMobile ? 'static' : 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        background: 'white',
        borderBottom: '1px solid #e8e8e8',
        boxShadow: isMobile ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.04)',
        backdropFilter: isMobile ? 'none' : 'blur(10px)',
        WebkitBackdropFilter: isMobile ? 'none' : 'blur(10px)',
      }}>
        <FilterBar isMobile={isMobile} />
      </div>

      {/* Main content */}
      <div style={{
        flex: isMobile ? 'none' : 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: isMobile ? 'visible' : 'hidden',
        gap: isMobile ? 0 : 0,
        minHeight: isMobile ? 'auto' : 0,
      }}>
      {isMobile ? (
        /* Mobile Layout - Natural scrolling */
        <>
          {/* Mobile view toggle - Non-sticky for better scrolling */}
          <div style={{
            display: 'flex',
            background: 'white',
            borderBottom: '1px solid #e8e8e8',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}>
            <button
              onClick={() => setMobileView('list')}
              style={{
                flex: 1,
                padding: '16px 12px',
                background: mobileView === 'list' ? '#667eea' : 'white',
                color: mobileView === 'list' ? 'white' : '#666',
                border: 'none',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                minHeight: 56,
              }}
            >
              📋 Events
              {mobileView === 'list' && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 40,
                  height: 3,
                  background: 'white',
                  borderRadius: '3px 3px 0 0',
                }}></div>
              )}
            </button>
            <button
              onClick={() => setMobileView('map')}
              style={{
                flex: 1,
                padding: '16px 12px',
                background: mobileView === 'map' ? '#667eea' : 'white',
                color: mobileView === 'map' ? 'white' : '#666',
                border: 'none',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                minHeight: 56,
              }}
            >
              🗺️ Map
              {mobileView === 'map' && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 40,
                  height: 3,
                  background: 'white',
                  borderRadius: '3px 3px 0 0',
                }}></div>
              )}
            </button>
          </div>

          {/* Mobile content with natural scrolling */}
          <div>
            {mobileView === 'list' ? (
              <div style={{ 
                background: 'white',
              }}>
                {state.selectedEvent ? (
                  <EventDetail 
                    user={user} 
                    onLoginRequired={() => setShowLogin(true)}
                    isMobile={isMobile}
                  />
                ) : (
                  <EventList onSelectEvent={handleEventSelect} isMobile={isMobile} />
                )}
              </div>
            ) : (
              <div style={{ 
                height: '70vh', // Use viewport height that works better with natural scrolling
                minHeight: '400px', // Ensure minimum usable height
                position: 'relative',
                background: '#f5f5f5',
              }}>
                <EventMap />
                
                {/* Floating action button for mobile map */}
                <button
                  onClick={() => setMobileView('list')}
                  style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                    cursor: 'pointer',
                    fontSize: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 'var(--z-content)',
                    transition: 'all 0.2s ease',
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  📋
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Desktop Layout - Side by side */
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          gap: 0,
          height: isMobile ? 'auto' : 'calc(100vh - 120px)', // More accurate calculation for header + filter bar
        }}>
          {/* Left panel - List/Detail */}
          <div 
            data-testid="left-panel"
            style={{
              width: 380,
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              boxShadow: '2px 0 12px rgba(0, 0, 0, 0.08)',
              zIndex: 'var(--z-content)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            
            {/* Panel content - Show list or detail based on selection */}
            <div style={{ 
              flex: 1, 
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}>
              {state.selectedEvent ? (
                <EventDetail 
                  user={user} 
                  onLoginRequired={() => setShowLogin(true)} 
                />
              ) : (
                <EventList onSelectEvent={handleEventSelect} />
              )}
            </div>
          </div>

          {/* Right panel - Map (Sticky container) */}
          <div style={{ 
            flex: 1, 
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'sticky',
              top: 0,
              height: 'calc(100vh - 120px)', // Match the container height
              overflow: 'hidden',
            }}>
              <EventMap />
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Login Modal */}
      <div data-testid="login-modal-container">
        <LoginModal 
          isOpen={showLogin} 
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
        />
      </div>

      {/* PWA Components */}
      <OfflineIndicator />
      <PWAUpdatePrompt />
      <PWAInstallPrompt />
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
