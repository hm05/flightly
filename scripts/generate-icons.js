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
  <rect width="${SIZE}" height="${SIZE}" rx="96" fill="#4f46e5"/>

  <!-- Paper-plane icon (Heroicons paper-airplane solid, scaled to ${ICON_SIZE}x${ICON_SIZE}) -->
  <g transform="translate(${offset}, ${offset}) scale(${ICON_SIZE / 24})">
    <path
      fill="white"
      d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z"
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
