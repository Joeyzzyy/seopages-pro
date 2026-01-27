/**
 * Rebuild hero-main.svg with embedded logo and glow effect
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GALLERY_DIR = path.join(__dirname, '../public/images/ph-gallery');
const LOGO_PATH = path.join(__dirname, '../public/new-logo.png');

// Read logo and convert to base64
const logoBuffer = fs.readFileSync(LOGO_PATH);
const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1270 760" fill="none">
  <defs>
    <radialGradient id="glow1" cx="25%" cy="35%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#050505" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="75%" cy="65%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#050505" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="80"/>
    </filter>
    <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feFlood flood-color="#8b5cf6" flood-opacity="0.5" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="card-shadow" x="-30%" y="-20%" width="160%" height="150%">
      <feDropShadow dx="0" dy="15" stdDeviation="30" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>
  
  <rect width="1270" height="760" fill="#050505"/>
  
  <!-- Light orbs -->
  <ellipse cx="300" cy="250" rx="400" ry="300" fill="url(#glow1)" filter="url(#blur)"/>
  <ellipse cx="970" cy="510" rx="350" ry="280" fill="url(#glow2)" filter="url(#blur)"/>
  
  <!-- Logo with glow -->
  <g transform="translate(80, 45)" filter="url(#logo-glow)">
    <image href="${logoBase64}" x="0" y="0" width="50" height="50"/>
  </g>
  <text x="145" y="80" font-family="SF Pro Display, -apple-system, system-ui, sans-serif" font-size="20" font-weight="600" fill="white">seopages.pro</text>
  
  <!-- Left content -->
  <g transform="translate(80, 200)">
    <!-- Badge -->
    <g transform="translate(0, 0)">
      <rect width="180" height="36" rx="18" fill="#8b5cf6" opacity="0.15"/>
      <text x="90" y="24" font-family="SF Pro Text, -apple-system, system-ui, sans-serif" font-size="13" font-weight="600" fill="#a78bfa" text-anchor="middle">AI-Powered SEO</text>
    </g>
    
    <!-- Main headline -->
    <text y="100" font-family="SF Pro Display, -apple-system, system-ui, sans-serif" font-size="72" font-weight="700" fill="white" letter-spacing="-3">SEO Pages</text>
    <text y="180" font-family="SF Pro Display, -apple-system, system-ui, sans-serif" font-size="72" font-weight="700" fill="#52525b" letter-spacing="-3">Generator</text>
    
    <!-- Subheadline -->
    <text y="250" font-family="SF Pro Text, -apple-system, system-ui, sans-serif" font-size="22" font-weight="500" fill="#a1a1aa">Create top-tier competitor comparison</text>
    <text y="282" font-family="SF Pro Text, -apple-system, system-ui, sans-serif" font-size="22" font-weight="500" fill="#a1a1aa">pages with AI in minutes</text>
    
    <!-- Feature pills -->
    <g transform="translate(0, 330)">
      <rect width="130" height="38" rx="19" fill="#0a0a0a" stroke="#27272a" stroke-width="1"/>
      <text x="65" y="25" font-family="SF Pro Text, -apple-system, system-ui, sans-serif" font-size="13" font-weight="600" fill="#d4d4d4" text-anchor="middle">GPT-4</text>
      
      <rect x="145" width="140" height="38" rx="19" fill="#0a0a0a" stroke="#27272a" stroke-width="1"/>
      <text x="215" y="25" font-family="SF Pro Text, -apple-system, system-ui, sans-serif" font-size="13" font-weight="600" fill="#d4d4d4" text-anchor="middle">1500+ lines</text>
      
      <rect x="300" width="120" height="38" rx="19" fill="#0a0a0a" stroke="#27272a" stroke-width="1"/>
      <text x="360" y="25" font-family="SF Pro Text, -apple-system, system-ui, sans-serif" font-size="13" font-weight="600" fill="#d4d4d4" text-anchor="middle">Schema.org</text>
    </g>
  </g>
  
  <!-- Right preview cards -->
  <g transform="translate(680, 140)">
    <!-- Back card -->
    <g transform="translate(80, 60)" opacity="0.5" filter="url(#card-shadow)">
      <rect width="420" height="440" rx="12" fill="#0a0a0a" stroke="#1f1f23" stroke-width="1"/>
      <rect x="0" y="0" width="420" height="40" rx="12" fill="#141418"/>
      <circle cx="20" cy="20" r="5" fill="#27272a"/>
      <circle cx="40" cy="20" r="5" fill="#27272a"/>
      <circle cx="60" cy="20" r="5" fill="#27272a"/>
    </g>
    
    <!-- Front card -->
    <g transform="translate(0, 0)" filter="url(#card-shadow)">
      <rect width="440" height="480" rx="14" fill="#0a0a0a" stroke="#27272a" stroke-width="1"/>
      
      <!-- Browser bar -->
      <rect x="0" y="0" width="440" height="44" rx="14" fill="#141418"/>
      <circle cx="22" cy="22" r="5" fill="#3f3f46"/>
      <circle cx="42" cy="22" r="5" fill="#3f3f46"/>
      <circle cx="62" cy="22" r="5" fill="#3f3f46"/>
      <rect x="120" y="14" width="200" height="16" rx="4" fill="#1f1f23"/>
      
      <!-- Page content -->
      <g transform="translate(28, 65)">
        <!-- Hero -->
        <rect width="384" height="80" rx="8" fill="#141418"/>
        <g transform="translate(16, 16)">
          <circle cx="22" cy="24" r="18" fill="#27272a"/>
          <rect x="50" y="10" width="36" height="20" rx="5" fill="#8b5cf6"/>
          <text x="68" y="24" font-family="SF Pro Display, -apple-system, system-ui, sans-serif" font-size="10" font-weight="700" fill="white" text-anchor="middle">VS</text>
          <circle cx="105" cy="24" r="18" fill="#1f1f23"/>
          <rect x="135" y="8" width="160" height="12" rx="3" fill="#3f3f46"/>
          <rect x="135" y="28" width="120" height="8" rx="2" fill="#27272a"/>
        </g>
        
        <!-- Comparison table -->
        <g transform="translate(0, 100)">
          <rect width="384" height="140" rx="8" fill="#0f0f12" stroke="#1f1f23" stroke-width="1"/>
          <rect x="0" y="0" width="384" height="36" rx="8" fill="#141418"/>
          <text x="20" y="24" font-family="SF Pro Text, -apple-system, system-ui, sans-serif" font-size="11" font-weight="600" fill="#71717a">Feature</text>
          <text x="240" y="24" font-family="SF Pro Text, -apple-system, system-ui, sans-serif" font-size="11" font-weight="600" fill="#a78bfa">Brand</text>
          <text x="320" y="24" font-family="SF Pro Text, -apple-system, system-ui, sans-serif" font-size="11" font-weight="600" fill="#71717a">Other</text>
          
          <rect x="20" y="52" width="120" height="8" rx="2" fill="#27272a"/>
          <circle cx="260" cy="56" r="8" fill="#8b5cf6" opacity="0.2"/>
          <path d="M256 56 L259 59 L264 53" stroke="#a78bfa" stroke-width="1.5" fill="none"/>
          <circle cx="340" cy="56" r="8" fill="#ef4444" opacity="0.2"/>
          
          <rect x="20" y="82" width="100" height="8" rx="2" fill="#27272a"/>
          <circle cx="260" cy="86" r="8" fill="#8b5cf6" opacity="0.2"/>
          <path d="M256 86 L259 89 L264 83" stroke="#a78bfa" stroke-width="1.5" fill="none"/>
          <circle cx="340" cy="86" r="8" fill="#f59e0b" opacity="0.2"/>
          
          <rect x="20" y="112" width="140" height="8" rx="2" fill="#27272a"/>
          <circle cx="260" cy="116" r="8" fill="#8b5cf6" opacity="0.2"/>
          <path d="M256 116 L259 119 L264 113" stroke="#a78bfa" stroke-width="1.5" fill="none"/>
          <circle cx="340" cy="116" r="8" fill="#8b5cf6" opacity="0.2"/>
        </g>
        
        <!-- CTA -->
        <g transform="translate(0, 260)">
          <rect width="384" height="60" rx="8" fill="#8b5cf6" opacity="0.1"/>
          <rect x="142" y="16" width="100" height="28" rx="8" fill="#8b5cf6"/>
        </g>
        
        <!-- FAQ -->
        <g transform="translate(0, 340)">
          <rect width="384" height="70" rx="8" fill="#141418"/>
          <rect x="16" y="16" width="80" height="10" rx="2" fill="#3f3f46"/>
          <rect x="16" y="36" width="350" height="6" rx="1" fill="#27272a"/>
          <rect x="16" y="50" width="300" height="6" rx="1" fill="#1f1f23"/>
        </g>
      </g>
    </g>
  </g>
</svg>`;

fs.writeFileSync(path.join(GALLERY_DIR, 'hero-main.svg'), heroSvg, 'utf-8');
console.log('✓ hero-main.svg rebuilt successfully');
