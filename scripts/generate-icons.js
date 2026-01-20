#!/usr/bin/env node

/**
 * Icon Generation Script for Nepal Elections 2026 PWA
 * 
 * This script helps generate the required PWA icons from a source image.
 * 
 * Requirements:
 * - Source image should be at least 512x512 pixels
 * - Install sharp: npm install sharp --save-dev
 * 
 * Usage:
 * node scripts/generate-icons.js path/to/source-image.png
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 PWA Icon Generator for Nepal Elections 2026');
console.log('');

// Check if sharp is available
try {
  const sharp = require('sharp');
  console.log('✅ Sharp is available for image processing');
} catch (error) {
  console.log('❌ Sharp is not installed. Please run: npm install sharp --save-dev');
  process.exit(1);
}

const sharp = require('sharp');

// Icon sizes needed for PWA
const iconSizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 16, name: 'favicon-16x16.png' }
];

async function generateIcons(sourcePath) {
  if (!fs.existsSync(sourcePath)) {
    console.log(`❌ Source image not found: ${sourcePath}`);
    return;
  }

  console.log(`📁 Source image: ${sourcePath}`);
  console.log('');

  const publicDir = path.join(__dirname, '..', 'public');
  
  for (const icon of iconSizes) {
    try {
      const outputPath = path.join(publicDir, icon.name);
      
      await sharp(sourcePath)
        .resize(icon.size, icon.size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(outputPath);
        
      console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.log(`❌ Failed to generate ${icon.name}: ${error.message}`);
    }
  }

  // Generate favicon.ico
  try {
    const faviconPath = path.join(publicDir, 'favicon.ico');
    await sharp(sourcePath)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    
    console.log('✅ Generated favicon.png (convert to .ico manually if needed)');
  } catch (error) {
    console.log(`❌ Failed to generate favicon: ${error.message}`);
  }

  console.log('');
  console.log('🎉 Icon generation complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Update the manifest.json to reference the new icons');
  console.log('2. Test the PWA installation on mobile devices');
  console.log('3. Verify icons appear correctly in app stores');
}

// Get source image path from command line arguments
const sourcePath = process.argv[2];

if (!sourcePath) {
  console.log('Usage: node scripts/generate-icons.js path/to/source-image.png');
  console.log('');
  console.log('Example: node scripts/generate-icons.js public/app-logo.png');
  process.exit(1);
}

generateIcons(sourcePath).catch(console.error);