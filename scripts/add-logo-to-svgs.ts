/**
 * Add logo with glow effect to all PH Gallery SVGs
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

// Logo with glow effect SVG snippet
const logoWithGlow = `
  <!-- Logo with glow -->
  <defs>
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
  </defs>
  <g transform="translate(80, 45)" filter="url(#logo-glow)">
    <image href="${logoBase64}" x="0" y="0" width="50" height="50"/>
  </g>
  <text x="145" y="80" font-family="SF Pro Display, -apple-system, system-ui, sans-serif" font-size="20" font-weight="600" fill="white">seopages.pro</text>
`;

// Process each SVG
const svgFiles = fs.readdirSync(GALLERY_DIR).filter(f => f.endsWith('.svg'));

console.log(`\n🎨 Adding logo to ${svgFiles.length} SVG files...\n`);

for (const file of svgFiles) {
  const filePath = path.join(GALLERY_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove old logo section if exists
  content = content.replace(/<!-- Logo with glow -->[\s\S]*?<text[^>]*>seopages\.pro<\/text>/g, '');
  content = content.replace(/<text[^>]*>seopages\.pro<\/text>/g, '');
  
  // Remove old logo glow filter if exists  
  content = content.replace(/<filter id="logo-glow"[\s\S]*?<\/filter>/g, '');
  content = content.replace(/<radialGradient id="logo-glow-gradient"[\s\S]*?<\/radialGradient>/g, '');
  content = content.replace(/<g transform="translate\(80, 50\)"[\s\S]*?<text[^>]*>seopages\.pro<\/text>\s*<\/g>/g, '');
  
  // Find position after opening <svg> tag and first <rect> (background)
  const insertPos = content.indexOf('</svg>');
  
  if (insertPos !== -1) {
    // Insert logo before closing </svg>
    content = content.slice(0, insertPos) + logoWithGlow + '\n' + content.slice(insertPos);
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ ${file}`);
  } else {
    console.error(`✗ Could not process ${file}`);
  }
}

console.log('\n✅ Logo added to all SVGs!\n');
