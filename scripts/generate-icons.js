#!/usr/bin/env node
/**
 * generate-icons.js
 *
 * Generates two PWA icon PNGs into public/icons/:
 *   - icon-512x512.png  (required by manifest.json)
 *   - icon-192x192.png  (required by manifest.json + apple-touch-icon)
 *
 * Usage:
 *   npm run generate-icons
 *
 * Requires:
 *   npm install --save-dev sharp
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

// ---------------------------------------------------------------------------
// Ensure output directory exists
// ---------------------------------------------------------------------------

const outputDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// ---------------------------------------------------------------------------
// Paper-plane SVG (centred on a 512x512 canvas)
// Background: indigo #4f46e5, icon: white
// ---------------------------------------------------------------------------

const SIZE = 512
const ICON_SIZE = 280 // white plane within the square

// The plane path is from Heroicons v2 (MIT licence) — "paper-airplane" solid.
// Original viewBox: 0 0 24 24. We scale it to ICON_SIZE and centre it.
const offset = (SIZE - ICON_SIZE) / 2

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" rx="96" fill="#000000"/>

  <!-- AirplaneTilt icon (Phosphor fill, scaled to ${ICON_SIZE}x${ICON_SIZE}) -->
  <g transform="translate(${offset}, ${offset}) scale(${ICON_SIZE / 256})">
    <path
      fill="white"
      d="M215.52,197.26a8,8,0,0,1-1.86,8.39l-24,24A8,8,0,0,1,184,232a7.09,7.09,0,0,1-.79,0,8,8,0,0,1-5.87-3.52l-44.07-66.12L112,183.59V208a8,8,0,0,1-2.34,5.65s-14,14.06-15.88,15.88A7.91,7.91,0,0,1,91,231.41a8,8,0,0,1-10.41-4.35l-.06-.15-14.7-36.76L29,175.42a8,8,0,0,1-2.69-13.08l16-16A8,8,0,0,1,48,144H72.4l21.27-21.27L27.56,78.65a8,8,0,0,1-1.22-12.32l24-24a8,8,0,0,1,8.39-1.86l85.94,31.25L176.2,40.19a28,28,0,0,1,39.6,39.6l-31.53,31.53Z"
    />
  </g>
</svg>
`.trim()

const svgBuffer = Buffer.from(svg)

// ---------------------------------------------------------------------------
// Generate icons
// ---------------------------------------------------------------------------

async function generateIcons() {
  console.log('Generating PWA icons…')

  // 512x512
  const out512 = path.join(outputDir, 'icon-512x512.png')
  await sharp(svgBuffer).resize(SIZE, SIZE).png().toFile(out512)
  console.log(`  ✓ ${out512}`)

  // 192x192 — resize the 512 version down for clean pixel rendering
  const out192 = path.join(outputDir, 'icon-192x192.png')
  await sharp(svgBuffer).resize(192, 192).png().toFile(out192)
  console.log(`  ✓ ${out192}`)

  console.log('Done.')
}

generateIcons().catch((err) => {
  console.error('Icon generation failed:', err)
  process.exit(1)
})
