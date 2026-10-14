import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard App Icon SVG (512x512)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080C14"/>
      <stop offset="50%" stop-color="#0E1626"/>
      <stop offset="100%" stop-color="#070A10"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE07D"/>
      <stop offset="50%" stop-color="#F5BA31"/>
      <stop offset="100%" stop-color="#D9910D"/>
    </linearGradient>
    <linearGradient id="goldGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F5BA31" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#F5BA31" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Card -->
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)" />
  <rect x="10" y="10" width="492" height="492" rx="100" fill="none" stroke="url(#goldGrad)" stroke-width="4" stroke-opacity="0.3" />

  <!-- Ambient Glow Behind Chart -->
  <circle cx="256" cy="220" r="140" fill="url(#goldGlow)" filter="url(#glow)" />

  <!-- Geometric Rising Bars -->
  <g transform="translate(116, 120)">
    <!-- First Short Bar -->
    <path d="M20 200 L60 120 L88 200 H20 Z" fill="url(#goldGrad)" opacity="0.85" />
    
    <!-- Middle Rising Bar -->
    <path d="M80 200 L136 80 L164 200 H80 Z" fill="url(#goldGrad)" opacity="0.95" />
    
    <!-- Tallest Spear Bar -->
    <path d="M156 200 L228 20 L248 60 L192 200 H156 Z" fill="url(#goldGrad)" filter="url(#glow)" />
    
    <!-- Dynamic Rising Trend Line -->
    <path d="M30 170 L115 100 L180 50 L240 10" stroke="url(#goldGrad)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Trend Arrow Tip -->
    <polygon points="240,10 265,30 235,45" fill="url(#goldGrad)" />
  </g>

  <!-- Typography: IQ-PLUS -->
  <text x="256" y="420" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="64" letter-spacing="4" fill="url(#goldGrad)" text-anchor="middle">
    IQ-PLUS
  </text>
  <text x="256" y="455" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="600" font-size="20" letter-spacing="6" fill="#94A3B8" text-anchor="middle">
    TRADING
  </text>
</svg>`;

// 2. Maskable App Icon SVG (512x512 full bleed background with safe zone inner logo)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080C14"/>
      <stop offset="50%" stop-color="#0E1626"/>
      <stop offset="100%" stop-color="#070A10"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE07D"/>
      <stop offset="50%" stop-color="#F5BA31"/>
      <stop offset="100%" stop-color="#D9910D"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Full-bleed background for maskable shape cropping -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Content scaled inside 80% safe zone circle (center 256, 256, max radius ~200) -->
  <g transform="translate(136, 120) scale(0.85)">
    <!-- First Short Bar -->
    <path d="M20 200 L60 120 L88 200 H20 Z" fill="url(#goldGrad)" opacity="0.85" />
    
    <!-- Middle Rising Bar -->
    <path d="M80 200 L136 80 L164 200 H80 Z" fill="url(#goldGrad)" opacity="0.95" />
    
    <!-- Tallest Spear Bar -->
    <path d="M156 200 L228 20 L248 60 L192 200 H156 Z" fill="url(#goldGrad)" filter="url(#glow)" />
    
    <!-- Dynamic Rising Trend Line -->
    <path d="M30 170 L115 100 L180 50 L240 10" stroke="url(#goldGrad)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Trend Arrow Tip -->
    <polygon points="240,10 265,30 235,45" fill="url(#goldGrad)" />
  </g>

  <!-- Typography: IQ-PLUS inside Safe Zone -->
  <text x="256" y="385" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="56" letter-spacing="4" fill="url(#goldGrad)" text-anchor="middle">
    IQ-PLUS
  </text>
  <text x="256" y="420" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="600" font-size="18" letter-spacing="6" fill="#94A3B8" text-anchor="middle">
    TRADING
  </text>
</svg>`;

async function buildIcons() {
  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), maskableSvg);

  const standardBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // Generate PNG files
  await sharp(standardBuffer).resize(192, 192).toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(standardBuffer).resize(512, 512).toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(maskableBuffer).resize(512, 512).toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await sharp(standardBuffer).resize(180, 180).toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(standardBuffer).resize(32, 32).toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(standardBuffer).resize(32, 32).toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Successfully generated crisp PWA icon assets in public/');
}

buildIcons().catch(err => {
  console.error('Error building icons:', err);
  process.exit(1);
});
