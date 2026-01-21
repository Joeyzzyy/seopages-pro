import { tool } from 'ai';
import { z } from 'zod';

/**
 * Generate CSS theme configuration for alternative pages.
 * This tool creates CSS variables and utility classes based on brand colors.
 */
export const generate_theme_config = tool({
  description: `Generate CSS theme configuration based on brand colors.
  
This tool creates:
- CSS variables for all color shades (50-900)
- Utility classes for backgrounds, text, borders
- Gradient utilities
- Theme presets (3 built-in themes)

The generated CSS can be injected into any alternative page HTML.`,
  parameters: z.object({
    primary_color: z.string().describe('Primary brand color in hex format (e.g., #0ea5e9)'),
    secondary_color: z.string().optional().describe('Secondary/accent color in hex'),
    include_presets: z.boolean().optional().default(true).describe('Include 3 theme preset buttons'),
    theme_presets: z.array(z.object({
      name: z.string(),
      display_name: z.string(),
      primary_hue: z.number(),
      primary_saturation: z.number(),
      gradient_from: z.string().optional(),
      gradient_to: z.string().optional(),
    })).optional().describe('Custom theme presets'),
  }),
  execute: async ({ primary_color, secondary_color, include_presets, theme_presets }) => {
    // Convert hex to HSL
    const primaryHsl = hexToHsl(primary_color);
    const secondaryHsl = secondary_color ? hexToHsl(secondary_color) : { h: (primaryHsl.h + 180) % 360, s: primaryHsl.s, l: primaryHsl.l };
    
    // Default theme presets
    const defaultPresets = [
      { name: 'blue', display_name: 'Ocean Blue', primary_hue: 199, primary_saturation: 89, gradient_from: 'sky-400', gradient_to: 'blue-600' },
      { name: 'emerald', display_name: 'Emerald Green', primary_hue: 160, primary_saturation: 84, gradient_from: 'emerald-400', gradient_to: 'teal-600' },
      { name: 'violet', display_name: 'Violet Purple', primary_hue: 263, primary_saturation: 70, gradient_from: 'violet-400', gradient_to: 'purple-600' },
    ];
    
    const presets = theme_presets || defaultPresets;
    
    // Generate CSS variables
    const cssVariables = `
    :root {
      /* Primary Brand Colors - Generated from ${primary_color} */
      --brand-50: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 97%);
      --brand-100: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 93%);
      --brand-200: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 85%);
      --brand-300: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 70%);
      --brand-400: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 60%);
      --brand-500: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 50%);
      --brand-600: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 45%);
      --brand-700: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 35%);
      --brand-800: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 25%);
      --brand-900: hsl(${primaryHsl.h}, ${primaryHsl.s}%, 15%);
      
      /* Secondary Colors */
      --secondary-50: hsl(${secondaryHsl.h}, ${secondaryHsl.s}%, 97%);
      --secondary-500: hsl(${secondaryHsl.h}, ${secondaryHsl.s}%, 50%);
      --secondary-600: hsl(${secondaryHsl.h}, ${secondaryHsl.s}%, 45%);
      
      /* HSL values for dynamic calculations */
      --brand-hue: ${primaryHsl.h};
      --brand-sat: ${primaryHsl.s}%;
    }`;
    
    // Generate utility classes
    const utilityClasses = `
    /* Brand Color Utilities */
    .text-brand-50 { color: var(--brand-50); }
    .text-brand-100 { color: var(--brand-100); }
    .text-brand-500 { color: var(--brand-500); }
    .text-brand-600 { color: var(--brand-600); }
    .text-brand-700 { color: var(--brand-700); }
    
    .bg-brand-50 { background-color: var(--brand-50); }
    .bg-brand-100 { background-color: var(--brand-100); }
    .bg-brand-500 { background-color: var(--brand-500); }
    .bg-brand-600 { background-color: var(--brand-600); }
    
    .border-brand-100 { border-color: var(--brand-100); }
    .border-brand-200 { border-color: var(--brand-200); }
    .border-brand-500 { border-color: var(--brand-500); }
    
    .hover\\:text-brand-600:hover { color: var(--brand-600); }
    .hover\\:text-brand-700:hover { color: var(--brand-700); }
    .hover\\:bg-brand-50:hover { background-color: var(--brand-50); }
    .hover\\:bg-brand-100:hover { background-color: var(--brand-100); }
    
    .ring-brand-500 { --tw-ring-color: var(--brand-500); }
    .focus\\:ring-brand-500:focus { --tw-ring-color: var(--brand-500); }
    
    /* Gradient utilities */
    .from-brand-400 { --tw-gradient-from: var(--brand-400); }
    .from-brand-500 { --tw-gradient-from: var(--brand-500); }
    .to-brand-600 { --tw-gradient-to: var(--brand-600); }
    .to-brand-700 { --tw-gradient-to: var(--brand-700); }
    
    .from-brand-100\\/40 { --tw-gradient-from: hsl(var(--brand-hue), var(--brand-sat), 93%, 0.4); }
    
    /* Primary Button */
    .btn-primary {
      background: linear-gradient(135deg, var(--brand-500), var(--brand-600));
      color: white;
      transition: all 0.2s ease;
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, var(--brand-600), var(--brand-700));
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    /* Secondary Button */
    .btn-secondary {
      background: var(--brand-50);
      color: var(--brand-700);
      border: 1px solid var(--brand-200);
      transition: all 0.2s ease;
    }
    .btn-secondary:hover {
      background: var(--brand-100);
      border-color: var(--brand-300);
    }`;
    
    // Generate theme switcher JavaScript
    const themeSwitcherJs = include_presets ? `
    // Theme Presets
    const themePresets = ${JSON.stringify(presets.reduce((acc, p) => {
      acc[p.name] = { h: p.primary_hue, s: p.primary_saturation };
      return acc;
    }, {} as Record<string, { h: number; s: number }>))};
    
    function setTheme(name) {
      const theme = themePresets[name];
      if (!theme) return;
      
      const root = document.documentElement;
      root.style.setProperty('--brand-hue', theme.h);
      root.style.setProperty('--brand-sat', theme.s + '%');
      root.style.setProperty('--brand-50', \`hsl(\${theme.h}, \${theme.s}%, 97%)\`);
      root.style.setProperty('--brand-100', \`hsl(\${theme.h}, \${theme.s}%, 93%)\`);
      root.style.setProperty('--brand-200', \`hsl(\${theme.h}, \${theme.s}%, 85%)\`);
      root.style.setProperty('--brand-300', \`hsl(\${theme.h}, \${theme.s}%, 70%)\`);
      root.style.setProperty('--brand-400', \`hsl(\${theme.h}, \${theme.s}%, 60%)\`);
      root.style.setProperty('--brand-500', \`hsl(\${theme.h}, \${theme.s}%, 50%)\`);
      root.style.setProperty('--brand-600', \`hsl(\${theme.h}, \${theme.s}%, 45%)\`);
      root.style.setProperty('--brand-700', \`hsl(\${theme.h}, \${theme.s}%, 35%)\`);
      root.style.setProperty('--brand-800', \`hsl(\${theme.h}, \${theme.s}%, 25%)\`);
      root.style.setProperty('--brand-900', \`hsl(\${theme.h}, \${theme.s}%, 15%)\`);
      
      localStorage.setItem('altpage-theme', name);
    }
    
    // Load saved theme on page load
    (function() {
      const saved = localStorage.getItem('altpage-theme');
      if (saved && themePresets[saved]) setTheme(saved);
    })();` : '';
    
    // Generate theme switcher HTML
    const themeSwitcherHtml = include_presets ? `
    <!-- Theme Switcher -->
    <div class="theme-switcher fixed top-4 right-4 z-50 flex gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200">
      ${presets.map(p => `
      <button 
        onclick="setTheme('${p.name}')" 
        class="w-7 h-7 rounded-full bg-gradient-to-br from-${p.gradient_from || p.name + '-400'} to-${p.gradient_to || p.name + '-600'} hover:scale-110 transition-transform" 
        title="${p.display_name}"
        style="background: linear-gradient(135deg, hsl(${p.primary_hue}, ${p.primary_saturation}%, 60%), hsl(${p.primary_hue}, ${p.primary_saturation}%, 45%));"
      ></button>`).join('')}
    </div>` : '';
    
    return {
      success: true,
      css_variables: cssVariables,
      utility_classes: utilityClasses,
      theme_switcher_js: themeSwitcherJs,
      theme_switcher_html: themeSwitcherHtml,
      
      // Complete style block for injection
      complete_style_block: `<style>\n${cssVariables}\n${utilityClasses}\n</style>`,
      complete_script_block: themeSwitcherJs ? `<script>\n${themeSwitcherJs}\n</script>` : '',
      
      primary_hsl: primaryHsl,
      secondary_hsl: secondaryHsl,
      presets,
      
      message: `Generated theme config with ${presets.length} presets. Inject css_variables and utility_classes into <style>, and theme_switcher_js into <script>.`,
    };
  },
});

// Helper: Convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
