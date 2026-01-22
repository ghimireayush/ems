import { useState, useEffect } from 'react'
import { usePWAInstall } from '../hooks/usePWAInstall'

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false)
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall()

  useEffect(() => {
    // Show the install prompt after a delay if installable
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        // Only show if not dismissed this session
        if (!sessionStorage.getItem('pwa-install-dismissed')) {
          setShowPrompt(true)
        }
      }, 5000) // Show after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled])

  const handleInstallClick = async () => {
    const { outcome } = await promptInstall()
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if already dismissed this session or not installable
  if (sessionStorage.getItem('pwa-install-dismissed') || !isInstallable || isInstalled) {
    return null
  }

  if (!showPrompt) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      backgroundColor: 'white',
      border: '2px solid #667eea',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      zIndex: 1001,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      
      <div style={{ fontSize: '24px' }}>📱</div>
      
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '16px', 
          color: '#333',
          marginBottom: '4px'
        }}>
          Install Nepal Elections 2026
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: '#666',
          lineHeight: '1.4'
        }}>
          Get quick access and offline features by installing our app
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: '1px solid #ddd',
            color: '#666',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Not now
        </button>
        <button 
          onClick={handleInstallClick}
          style={{
            background: '#667eea',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          Install
        </button>
      </div>
    </div>
  )
}

export default PWAInstallPrompt