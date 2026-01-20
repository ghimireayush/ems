import { useState, useEffect } from 'react'
import { isMobileDevice, isTouchDevice, isStandalonePWA, getViewportHeight } from '../utils/mobile'

const MobileDebug = ({ show = false }) => {
  const [debugInfo, setDebugInfo] = useState({})

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        isMobile: isMobileDevice(),
        isTouch: isTouchDevice(),
        isPWA: isStandalonePWA(),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        visualViewportHeight: getViewportHeight(),
        userAgent: navigator.userAgent,
        orientation: screen.orientation?.type || 'unknown'
      })
    }

    updateDebugInfo()
    window.addEventListener('resize', updateDebugInfo)
    window.addEventListener('orientationchange', updateDebugInfo)

    return () => {
      window.removeEventListener('resize', updateDebugInfo)
      window.removeEventListener('orientationchange', updateDebugInfo)
    }
  }, [])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      fontFamily: 'monospace'
    }}>
      <div><strong>Mobile Debug Info:</strong></div>
      <div>Mobile: {debugInfo.isMobile ? 'Yes' : 'No'}</div>
      <div>Touch: {debugInfo.isTouch ? 'Yes' : 'No'}</div>
      <div>PWA: {debugInfo.isPWA ? 'Yes' : 'No'}</div>
      <div>Viewport: {debugInfo.viewportWidth}x{debugInfo.viewportHeight}</div>
      <div>Visual: {debugInfo.visualViewportHeight}</div>
      <div>Orientation: {debugInfo.orientation}</div>
      <div>UA: {debugInfo.userAgent?.substring(0, 50)}...</div>
    </div>
  )
}

export default MobileDebug