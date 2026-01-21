/**
 * SVG to WebP Conversion Tool
 * Converts SVG files to optimized WebP format for web performance
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

interface ConversionOptions {
  width?: number;
  height?: number;
  quality?: number;
  background?: string;
}

const DEFAULT_OPTIONS: ConversionOptions = {
  width: 1200,
  quality: 85,
  background: '#0A0A0A',
};

export async function convertSVGtoWebP(
  svgPath: string,
  outputPath: string,
  options: ConversionOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Read SVG file
  const svgBuffer = fs.readFileSync(svgPath);
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Convert to WebP using sharp
  await sharp(svgBuffer)
    .resize(opts.width, opts.height, {
      fit: 'contain',
      background: opts.background,
    })
    .webp({
      quality: opts.quality,
      effort: 6, // Higher effort = better compression
    })
    .toFile(outputPath);
  
  const stats = fs.statSync(outputPath);
  console.log(`✓ WebP saved to: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

export async function convertSVGStringToWebP(
  svgString: string,
  outputPath: string,
  options: ConversionOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Convert to WebP using sharp
  await sharp(Buffer.from(svgString))
    .resize(opts.width, opts.height, {
      fit: 'contain',
      background: opts.background,
    })
    .webp({
      quality: opts.quality,
      effort: 6,
    })
    .toFile(outputPath);
  
  const stats = fs.statSync(outputPath);
  console.log(`✓ WebP saved to: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

export async function batchConvert(
  inputDir: string,
  outputDir: string,
  options: ConversionOptions = {}
): Promise<void> {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.svg'));
  
  console.log(`Converting ${files.length} SVG files to WebP...`);
  
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace('.svg', '.webp'));
    
    try {
      await convertSVGtoWebP(inputPath, outputPath, options);
    } catch (error) {
      console.error(`✗ Failed to convert ${file}:`, error);
    }
  }
  
  console.log('Batch conversion complete!');
}

// CLI usage
const args = process.argv.slice(2);

if (args.length >= 2) {
  if (args[0] === '--batch') {
    batchConvert(args[1], args[2], {
      width: args[3] ? parseInt(args[3]) : undefined,
      quality: args[4] ? parseInt(args[4]) : undefined,
    }).catch(console.error);
  } else {
    const [inputPath, outputPath, width, quality] = args;
    
    convertSVGtoWebP(inputPath, outputPath, {
      width: width ? parseInt(width) : undefined,
      quality: quality ? parseInt(quality) : undefined,
    }).catch(console.error);
  }
} else if (args.length > 0) {
  console.log('Usage: npx ts-node svg-to-webp.ts <input.svg> <output.webp> [width] [quality]');
  console.log('       npx ts-node svg-to-webp.ts --batch <input-dir> <output-dir>');
}
