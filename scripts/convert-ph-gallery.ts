/**
 * Convert PH Gallery SVGs to PNG
 * Usage: npx ts-node scripts/convert-ph-gallery.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '../public/images/ph-gallery');
const OUTPUT_DIR = INPUT_DIR;

async function convertToPNG() {
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.svg'));
  
  console.log(`\n📸 Converting ${files.length} SVG files to PNG...\n`);
  
  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file.replace('.svg', '.png'));
    
    try {
      const svgBuffer = fs.readFileSync(inputPath);
      
      await sharp(svgBuffer)
        .resize(1270, 760, {
          fit: 'contain',
          background: '#050505',
        })
        .png({
          compressionLevel: 6,
        })
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      console.log(`✓ ${file} → ${file.replace('.svg', '.png')} (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error(`✗ Failed to convert ${file}:`, error);
    }
  }
  
  console.log('\n✅ Conversion complete!\n');
}

convertToPNG().catch(console.error);
