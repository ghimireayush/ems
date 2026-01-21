# Nepal Elections 2026 - Deployment Guide

## Netlify Deployment

This project is configured for deployment on Netlify with all necessary configuration files.

### Quick Deploy

1. **Connect Repository**: Connect your GitHub repository to Netlify
2. **Build Settings**: Netlify will automatically detect the settings from `netlify.toml`
3. **Deploy**: Click deploy - no additional configuration needed!

### Configuration Files

- `netlify.toml` - Main Netlify configuration
- `public/_redirects` - SPA routing redirects
- `public/_headers` - Security and caching headers
- `.nvmrc` - Node.js version specification
- `public/robots.txt` - SEO robots file
- `public/sitemap.xml` - SEO sitemap

### Build Settings (Auto-detected)

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18

### Environment Variables

The following environment variables are set in `netlify.toml`:

- `VITE_DATA_MODE=api`
- `VITE_API_URL=https://dev.kaha.com.np/election/v1`

### PWA Features

The app includes full PWA support:

- Service Worker for offline functionality
- Web App Manifest for installation
- Optimized caching strategies
- Mobile-first responsive design

### Performance Optimizations

- Code splitting (vendor and leaflet chunks)
- Image optimization and caching
- API response caching
- Static asset caching with long expiry
- Minified and optimized builds

### Security Headers

Configured security headers include:

- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Manual Deployment

If you prefer manual deployment:

```bash
# Build the project
npm run build

# The dist/ folder contains all deployment files
# Upload the contents of dist/ to your hosting provider
```

### Local Testing

Test the production build locally:

```bash
npm run preview
```

### Troubleshooting

1. **Build Fails**: Check Node.js version (should be 18+)
2. **API Issues**: Verify API URL is accessible
3. **PWA Issues**: Check manifest.json and service worker files
4. **Routing Issues**: Ensure _redirects file is in place

### Post-Deployment

After deployment:

1. Test PWA installation on mobile devices
2. Verify all routes work correctly
3. Check API connectivity
4. Test offline functionality
5. Validate SEO meta tags and sitemap