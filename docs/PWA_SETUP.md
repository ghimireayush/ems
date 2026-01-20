# PWA Setup Guide - Nepal Elections 2026

This document explains the Progressive Web App (PWA) implementation for the Nepal Elections 2026 application.

## 🚀 Features Implemented

### Core PWA Features
- ✅ **Service Worker** - Automatic caching and offline support
- ✅ **Web App Manifest** - App metadata and installation prompts
- ✅ **Responsive Design** - Works on all device sizes
- ✅ **Offline Functionality** - Basic offline support with cached resources
- ✅ **Install Prompts** - Custom install prompts for better UX
- ✅ **Update Notifications** - Automatic app updates with user prompts

### Mobile Optimizations
- ✅ **Touch-friendly UI** - Optimized touch targets (44px minimum)
- ✅ **Safe Area Support** - Handles device notches and safe areas
- ✅ **Viewport Configuration** - Proper mobile viewport settings
- ✅ **iOS Safari Support** - Apple-specific meta tags and icons
- ✅ **Android Chrome Support** - Material Design integration

### Performance Features
- ✅ **Resource Caching** - Images, CSS, and JS files cached
- ✅ **API Caching** - Network-first strategy for API calls
- ✅ **Lazy Loading** - Components load on demand
- ✅ **Optimized Animations** - Reduced motion support

## 📱 Installation

### For Users

#### Android (Chrome/Edge)
1. Open the app in Chrome or Edge
2. Look for the "Install" prompt at the bottom
3. Tap "Install" or use the browser menu → "Add to Home Screen"
4. The app will appear on your home screen like a native app

#### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if desired and tap "Add"

#### Desktop (Chrome/Edge/Firefox)
1. Look for the install icon in the address bar
2. Click it and confirm installation
3. The app will open in its own window

### For Developers

```bash
# Install dependencies
npm install

# Development with PWA features
npm run dev

# Build for production (generates PWA files)
npm run build

# Preview production build
npm run preview
```

## 🛠️ Technical Implementation

### Files Structure
```
public/
├── manifest.json           # PWA manifest
├── app-icon.svg           # Main app icon (SVG)
├── apple-touch-icon.png   # iOS home screen icon
├── favicon.ico            # Browser favicon
└── browserconfig.xml      # Windows tile configuration

src/
├── components/
│   ├── PWAInstallPrompt.jsx    # Custom install prompt
│   ├── PWAUpdatePrompt.jsx     # Update notification
│   └── OfflineIndicator.jsx    # Offline status
└── main.jsx               # Service worker registration
```

### Service Worker Configuration
The service worker is configured in `vite.config.js` using the VitePWA plugin:

```javascript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 }
        }
      }
    ]
  }
})
```

### Manifest Configuration
Key manifest settings in `public/manifest.json`:

```json
{
  "name": "Nepal Elections 2026",
  "short_name": "Nepal Elections",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#667eea",
  "background_color": "#ffffff"
}
```

## 🎨 Icons and Assets

### Current Icons
- **app-icon.svg** - Scalable vector icon (recommended)
- **apple-touch-icon.png** - 180x180 PNG for iOS
- **favicon.ico** - Browser favicon

### Generating Custom Icons
Use the provided script to generate all required icon sizes:

```bash
# Install sharp for image processing
npm install sharp --save-dev

# Generate icons from source image
node scripts/generate-icons.js path/to/your-logo.png
```

### Required Icon Sizes
- 16x16 (favicon)
- 32x32 (favicon)
- 180x180 (Apple touch icon)
- 192x192 (Android)
- 512x512 (Android, splash screen)

## 🔧 Configuration

### Environment Variables
No special environment variables required for PWA functionality.

### Build Configuration
PWA files are automatically generated during build:
- `dist/sw.js` - Service worker
- `dist/manifest.webmanifest` - Web app manifest
- `dist/registerSW.js` - Service worker registration

### Browser Support
- ✅ Chrome 67+ (Android/Desktop)
- ✅ Firefox 79+ (Android/Desktop)
- ✅ Safari 11.1+ (iOS/macOS)
- ✅ Edge 79+ (Windows/Android)
- ✅ Samsung Internet 8.2+

## 📊 Testing PWA Features

### Lighthouse Audit
Run Lighthouse to check PWA compliance:
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App" category
4. Run audit

### Manual Testing Checklist
- [ ] App installs on mobile devices
- [ ] Works offline (basic functionality)
- [ ] Update prompts appear when new version available
- [ ] Icons display correctly on home screen
- [ ] Splash screen shows during launch
- [ ] App runs in standalone mode (no browser UI)

### Testing Tools
```bash
# Serve production build locally
npm run preview

# Test on mobile devices using ngrok
npx ngrok http 4173
```

## 🚀 Deployment

### Production Checklist
- [ ] Icons are properly sized and optimized
- [ ] Manifest contains correct URLs and metadata
- [ ] HTTPS is enabled (required for PWA)
- [ ] Service worker caching strategy is appropriate
- [ ] App works offline for core functionality

### CDN Considerations
- Ensure all PWA assets are served with proper cache headers
- Service worker should be served from same origin
- Manifest file should be accessible at root level

## 🐛 Troubleshooting

### Common Issues

#### Install Prompt Not Showing
- Check if app meets PWA criteria (HTTPS, manifest, service worker)
- Verify manifest is valid JSON
- Ensure service worker is registered successfully

#### Icons Not Displaying
- Verify icon files exist in public folder
- Check manifest.json references correct icon paths
- Ensure icons meet size requirements

#### Offline Functionality Issues
- Check service worker is active in DevTools
- Verify caching strategy in network tab
- Test with DevTools offline mode

#### iOS Safari Issues
- Ensure apple-touch-icon.png is 180x180
- Check apple-mobile-web-app meta tags
- Test add to home screen functionality

### Debug Commands
```bash
# Check service worker status
console.log(navigator.serviceWorker.controller)

# Check if app is installed
console.log(window.matchMedia('(display-mode: standalone)').matches)

# Check manifest
console.log(document.querySelector('link[rel="manifest"]'))
```

## 📈 Performance Optimization

### Caching Strategy
- **App Shell**: Cache First (HTML, CSS, JS)
- **API Data**: Network First with fallback
- **Images**: Cache First with expiration
- **Static Assets**: Cache First, long expiration

### Bundle Optimization
- Code splitting implemented
- Tree shaking enabled
- Asset optimization in build process
- Lazy loading for non-critical components

## 🔄 Updates and Maintenance

### Updating the PWA
1. Make changes to the app
2. Run `npm run build`
3. Deploy new version
4. Service worker will detect changes
5. Users will see update prompt

### Version Management
- Service worker automatically detects file changes
- Users can update immediately or on next visit
- Old versions cached until update

## 📚 Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 🤝 Contributing

When adding new features:
1. Test PWA functionality after changes
2. Update manifest if adding new routes
3. Consider offline experience
4. Test on multiple devices and browsers
5. Update this documentation if needed