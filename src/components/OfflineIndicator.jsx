import { useState, useEffect } from 'react'

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Show offline message if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showOfflineMessage) return null

  return (
    <div 
      className={`offline-indicator ${showOfflineMessage ? 'show' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#fb8c00',
        color: 'white',
        textAlign: 'center',
        padding: '8px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 10000,
        transform: showOfflineMessage ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
    >
      <span>📡</span>
      <span>You're offline. Some features may not be available.</span>
    </div>
  )
}

export default OfflineIndicator