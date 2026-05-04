/**
 * Generates favicon files for pro-schools.ru from an SVG icon.
 * Produces: favicon.ico (16+32+48), icon-192.png, icon-512.png, apple-touch-icon.png
 */

import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// ─── SVG icon: school building matching the logo style ────────────────────────
// Colors from logo: #2563EB (blue building), #15803D (tree), #F59E0B (flag/accents)
// Background: warm white #FFF8F0 matching site palette, then solid #2563EB for dark bg

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <!-- Background circle -->
  <rect width="64" height="64" rx="12" fill="#2563EB"/>

  <!-- Book / base -->
  <ellipse cx="32" cy="52" rx="20" ry="4" fill="#FCD34D" opacity="0.9"/>

  <!-- Main building body -->
  <rect x="14" y="28" width="36" height="24" rx="2" fill="#FFFFFF" opacity="0.95"/>

  <!-- Roof / triangle -->
  <polygon points="32,8 10,28 54,28" fill="#F8FAFC"/>
  <polygon points="32,10 12,28 52,28" fill="#DBEAFE"/>

  <!-- Flag pole -->
  <line x1="32" y1="8" x2="32" y2="18" stroke="#FCD34D" stroke-width="2" stroke-linecap="round"/>
  <!-- Flag -->
  <polygon points="32,8 42,11.5 32,15" fill="#EF4444"/>

  <!-- Door -->
  <rect x="27" y="38" width="10" height="14" rx="1" fill="#2563EB" opacity="0.8"/>
  <!-- Door knob -->
  <circle cx="35" cy="45" r="1" fill="#FCD34D"/>

  <!-- Left window -->
  <rect x="16" y="32" width="8" height="7" rx="1" fill="#BAE6FD"/>
  <line x1="20" y1="32" x2="20" y2="39" stroke="#2563EB" stroke-width="0.8" opacity="0.5"/>
  <line x1="16" y1="35.5" x2="24" y2="35.5" stroke="#2563EB" stroke-width="0.8" opacity="0.5"/>

  <!-- Right window -->
  <rect x="40" y="32" width="8" height="7" rx="1" fill="#BAE6FD"/>
  <line x1="44" y1="32" x2="44" y2="39" stroke="#2563EB" stroke-width="0.8" opacity="0.5"/>
  <line x1="40" y1="35.5" x2="48" y2="35.5" stroke="#2563EB" stroke-width="0.8" opacity="0.5"/>

  <!-- Clock circle on roof -->
  <circle cx="32" cy="22" r="5" fill="#2563EB"/>
  <circle cx="32" cy="22" r="4" fill="#F8FAFC"/>
  <line x1="32" y1="22" x2="32" y2="19" stroke="#1E40AF" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="32" y1="22" x2="34.5" y2="23" stroke="#1E40AF" stroke-width="1.2" stroke-linecap="round"/>
</svg>`

const SVG_LIGHT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <!-- Transparent background version for apple-touch (will be put on white) -->
  <rect width="64" height="64" rx="14" fill="#EFF6FF"/>

  <!-- Book / base -->
  <ellipse cx="32" cy="54" rx="18" ry="3.5" fill="#FCD34D" opacity="0.85"/>

  <!-- Main building body -->
  <rect x="14" y="28" width="36" height="24" rx="2" fill="#2563EB"/>
  <!-- Building highlight -->
  <rect x="14" y="28" width="36" height="3" rx="1" fill="#3B82F6"/>

  <!-- Roof -->
  <polygon points="32,8 10,28 54,28" fill="#1D4ED8"/>

  <!-- Flag pole -->
  <line x1="32" y1="8" x2="32" y2="17" stroke="#BFDBFE" stroke-width="1.8" stroke-linecap="round"/>
  <!-- Flag -->
  <polygon points="32,8 43,11.5 32,15" fill="#EF4444"/>

  <!-- Door -->
  <rect x="27" y="38" width="10" height="14" rx="1" fill="#DBEAFE" opacity="0.9"/>
  <circle cx="35.5" cy="45" r="1" fill="#FCD34D"/>

  <!-- Left window -->
  <rect x="16" y="31" width="8" height="7" rx="1" fill="#BFDBFE" opacity="0.9"/>
  <line x1="20" y1="31" x2="20" y2="38" stroke="#93C5FD" stroke-width="0.8"/>
  <line x1="16" y1="34.5" x2="24" y2="34.5" stroke="#93C5FD" stroke-width="0.8"/>

  <!-- Right window -->
  <rect x="40" y="31" width="8" height="7" rx="1" fill="#BFDBFE" opacity="0.9"/>
  <line x1="44" y1="31" x2="44" y2="38" stroke="#93C5FD" stroke-width="0.8"/>
  <line x1="40" y1="34.5" x2="48" y2="34.5" stroke="#93C5FD" stroke-width="0.8"/>

  <!-- Clock -->
  <circle cx="32" cy="22" r="5.5" fill="#EFF6FF"/>
  <circle cx="32" cy="22" r="4.5" fill="white"/>
  <line x1="32" y1="22" x2="32" y2="19" stroke="#1E40AF" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="32" y1="22" x2="34.5" y2="22.8" stroke="#1E40AF" stroke-width="1.2" stroke-linecap="round"/>
</svg>`

async function svgToPng(svgString, size) {
  return sharp(Buffer.from(svgString))
    .resize(size, size)
    .png()
    .toBuffer()
}

// Minimal ICO writer: takes array of {size, buffer (RGBA 32-bit PNG)}
async function buildIco(entries) {
  // Convert each PNG to raw RGBA via sharp
  const frames = await Promise.all(
    entries.map(async ({ size, pngBuf }) => {
      const raw = await sharp(pngBuf).ensureAlpha().raw().toBuffer()
      return { size, raw }
    })
  )

  const HEADER_SIZE = 6
  const DIR_ENTRY_SIZE = 16
  const headerBytes = HEADER_SIZE + DIR_ENTRY_SIZE * frames.length

  // Each frame: BMP DIB header (40 bytes) + XOR mask (size*size*4) + AND mask (size*size/8 rounded to 4 bytes)
  const frameDatas = frames.map(({ size, raw }) => {
    const dibHeader = Buffer.alloc(40)
    dibHeader.writeUInt32LE(40, 0)         // header size
    dibHeader.writeInt32LE(size, 4)        // width
    dibHeader.writeInt32LE(size * 2, 8)   // height (doubled for ICO)
    dibHeader.writeUInt16LE(1, 12)         // color planes
    dibHeader.writeUInt16LE(32, 14)        // bits per pixel
    dibHeader.writeUInt32LE(0, 16)         // compression (none)
    dibHeader.writeUInt32LE(size * size * 4, 20) // image size

    // XOR mask: convert RGBA → BGRA
    const xorMask = Buffer.alloc(size * size * 4)
    for (let i = 0; i < size * size; i++) {
      xorMask[i * 4 + 0] = raw[i * 4 + 2] // B
      xorMask[i * 4 + 1] = raw[i * 4 + 1] // G
      xorMask[i * 4 + 2] = raw[i * 4 + 0] // R
      xorMask[i * 4 + 3] = raw[i * 4 + 3] // A
    }

    // AND mask: 1 bit per pixel, rows must be multiple of 4 bytes
    const andRowBytes = Math.ceil(size / 8) * 1
    const andRowPadded = Math.ceil(andRowBytes / 4) * 4
    const andMask = Buffer.alloc(andRowPadded * size, 0)

    return Buffer.concat([dibHeader, xorMask, andMask])
  })

  // Build ICO
  const header = Buffer.alloc(HEADER_SIZE)
  header.writeUInt16LE(0, 0)  // reserved
  header.writeUInt16LE(1, 2)  // type: ICO
  header.writeUInt16LE(frames.length, 4)

  const dirEntries = []
  let offset = headerBytes
  for (let i = 0; i < frames.length; i++) {
    const entry = Buffer.alloc(DIR_ENTRY_SIZE)
    const s = frames[i].size
    entry.writeUInt8(s >= 256 ? 0 : s, 0)  // width (0=256)
    entry.writeUInt8(s >= 256 ? 0 : s, 1)  // height
    entry.writeUInt8(0, 2)   // color count
    entry.writeUInt8(0, 3)   // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(frameDatas[i].length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += frameDatas[i].length
    dirEntries.push(entry)
  }

  return Buffer.concat([header, ...dirEntries, ...frameDatas])
}

async function main() {
  const appDir = join(process.cwd(), 'src', 'app')
  const publicDir = join(process.cwd(), 'public')

  console.log('Generating favicon assets...')

  // 1. Dark-background icon (for favicon.ico, manifest icons)
  const png16  = await svgToPng(SVG, 16)
  const png32  = await svgToPng(SVG, 32)
  const png48  = await svgToPng(SVG, 48)
  const png192 = await svgToPng(SVG, 192)
  const png512 = await svgToPng(SVG, 512)

  // 2. Light icon for apple-touch-icon (needs white/light bg)
  const pngApple = await svgToPng(SVG_LIGHT, 180)

  // 3. Build ICO (16 + 32 + 48)
  const icoBuffer = await buildIco([
    { size: 16, pngBuf: png16 },
    { size: 32, pngBuf: png32 },
    { size: 48, pngBuf: png48 },
  ])

  // Write files
  writeFileSync(join(appDir, 'favicon.ico'), icoBuffer)
  console.log('✓ src/app/favicon.ico (16+32+48px)')

  writeFileSync(join(appDir, 'icon.png'), png32)
  console.log('✓ src/app/icon.png (32px) — used by Next.js for <link rel="icon">')

  writeFileSync(join(appDir, 'apple-icon.png'), pngApple)
  console.log('✓ src/app/apple-icon.png (180px) — iOS home screen')

  writeFileSync(join(publicDir, 'icon-192.png'), png192)
  console.log('✓ public/icon-192.png (192px) — PWA manifest')

  writeFileSync(join(publicDir, 'icon-512.png'), png512)
  console.log('✓ public/icon-512.png (512px) — PWA manifest')

  // Write SVG for modern browsers
  writeFileSync(join(appDir, 'icon.svg'), SVG_LIGHT)
  console.log('✓ src/app/icon.svg — scalable SVG icon')

  console.log('\nDone! All favicon assets generated.')
}

main().catch(err => { console.error(err); process.exit(1) })
