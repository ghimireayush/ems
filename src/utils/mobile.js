/**
 * Mobile detection and optimization utilities
 */

export const isMobileDevice = () => {
  return window.innerWidth <= 768
}

export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export const isStandalonePWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true
}

export const getViewportHeight = () => {
  // Use visual viewport if available (better for mobile)
  if (window.visualViewport) {
    return window.visualViewport.height
  }
  return window.innerHeight
}

export const optimizeForMobile = () => {
  // Prevent zoom on input focus
  const inputs = document.querySelectorAll('input, select, textarea')
  inputs.forEach(input => {
    if (input.style.fontSize !== '16px') {
      input.style.fontSize = '16px'
    }
  })
  
  // Add touch-friendly classes
  document.body.classList.add('touch-optimized')
}

export const addMobileEventListeners = () => {
  // Prevent double-tap zoom
  let lastTouchEnd = 0
  document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }, false)
  
  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    // Force a reflow to handle viewport changes
    setTimeout(() => {
      window.scrollTo(0, 0)
    }, 100)
  })
}

export const getMobileBreakpoint = () => {
  return 768 // pixels
}

export const isMobileLandscape = () => {
  return window.innerWidth > window.innerHeight && window.innerHeight < 500
}