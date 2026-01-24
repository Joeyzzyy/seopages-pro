import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

// Initialize Supabase client with proxy support for server-side operations
const supabase = createServerSupabaseAdmin();

// Simple Markdown to HTML converter
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Tables
  html = html.replace(/^\|(.+)\|$/gim, (match) => {
    const cells = match.split('|').filter(c => c.trim() !== '');
    if (match.includes('---')) {
      return ''; // Header separator line
    }
    const isHeader = !match.toLowerCase().includes('---') && match.includes('|'); // Simplified header detection
    const tag = 'td'; // Will be refined by container replace
    return `<tr>${cells.map(c => `<${tag} class="border border-gray-200 px-4 py-2">${c.trim()}</${tag}>`).join('')}</tr>`;
  });
  
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, (match) => {
    return `<div class="overflow-x-auto my-8 rounded-xl border border-gray-100 shadow-sm"><table class="min-w-full divide-y divide-gray-200 text-sm">` + match + `</table></div>`;
  });

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold text-gray-900 mt-12 mb-6">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-extrabold text-gray-900 mt-16 mb-8">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-black text-gray-900 mb-10">$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  
  // Images (must come before links to avoid conflicts)
  // Handle side-by-side images (two consecutive images)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)\s*!\[([^\]]*)\]\(([^)]+)\)/g, 
    '<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8"><img src="$2" alt="$1" class="content-image" /><img src="$4" alt="$3" class="content-image" /></div>'
  );
  // Single images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="content-image" />');
  
  // CTA Buttons (links with action-oriented text like "Try", "Get Started", "Sign Up", etc.)
  const ctaPatterns = /\[(Try|Get Started|Sign Up|Start Free|See How|Learn More|Get It Now|Try Now|Start Now|Get Started Free|See Full|Compare Now|Try [^]]+ Now|Get [^]]+ Now)([^\]]*)\]\(([^)]+)\)/gi;
  html = html.replace(ctaPatterns, (match, action, rest, url) => {
    return `<a href="${url}" class="inline-block mt-6 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-center">${action}${rest}</a>`;
  });
  
  // Regular Links (not CTAs)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-600 font-semibold hover:underline">$1</a>');
  
  // Unordered lists
  html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 mb-2">$1</li>');
  html = html.replace(/(<li class="ml-4 mb-2">.*<\/li>\n?)+/g, (match) => {
    return '<ul class="list-disc space-y-2 my-6">' + match + '</ul>';
  });
  
  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-2">$1</li>');
  html = html.replace(/(<li class="ml-4 mb-2">.*<\/li>\n?)+/g, (match) => {
    return '<ol class="list-decimal space-y-2 my-6">' + match + '</ol>';
  });
  
  // Paragraphs (lines that aren't already HTML tags)
  html = html.split('\n').map(line => {
    line = line.trim();
    if (!line) return '';
    if (line.startsWith('<')) return line;
    return `<p class="mb-6 leading-relaxed">${line}</p>`;
  }).filter(line => line).join('\n');
  
  return html;
}

export const assemble_html_page = tool({
  description: `Convert drafted sections into a high-end HTML5 document with advanced Tailwind CSS styling. 

  FEATURES:
  - Professional typography (Plus Jakarta Sans)
  - Layout optimizations for Blogs, Landing Pages, etc.
  - Automatic citation styling for external links
  - Responsive and modern design`,
  parameters: z.object({
    item_id: z.string().describe('The ID of the content item'),
    page_title: z.string().describe('The main H1 title of the page'),
    page_type: z.literal('alternative').optional().default('alternative').describe('Page type - always alternative page with premium styling'),
    seo_title: z.string().optional().describe('SEO title for meta tag'),
    seo_description: z.string().optional().describe('SEO description for meta tag'),
    seo_keywords: z.string().optional().describe('SEO keywords for meta tag (comma-separated)'),
    og_image: z.string().optional().describe('Open Graph image URL for social sharing'),
    site_url: z.string().optional().describe('Main site URL for canonical and OG tags'),
    cta_button: z.object({
      text: z.string().describe('CTA button text, e.g. "Try ProductName Free", "Get Started"'),
      url: z.string().describe('CTA button URL - should be the product main website URL'),
    }).optional().describe('Hero section CTA button - links to product website for conversion'),
    sections: z.preprocess(
      (val) => Array.isArray(val) ? val.filter(i => i !== null && typeof i === 'object') : val,
      z.array(z.object({
        section_title: z.string().describe('Section H2 title'),
        markdown_content: z.string().describe('Markdown content for this section')
      }))
    ).describe('All drafted sections'),
    images: z.preprocess(
      (val) => Array.isArray(val) ? val.filter(i => i !== null && typeof i === 'object') : val,
      z.array(z.object({
        placeholder_id: z.string().describe('The placeholder ID'),
        public_url: z.string().describe('The COMPLETE public URL'),
        alt_text: z.string().optional().describe('Alt text'),
        publicUrl: z.string().optional(),
        filename: z.string().optional()
      }))
    ).optional().describe('Mapping of image placeholder IDs to URLs'),
  }),
  execute: async ({ item_id, page_title, page_type, seo_title, seo_description, seo_keywords, og_image, site_url, cta_button, sections, images = [] }) => {
    // Normalize images
    const normalizedImages = await Promise.all(images.map(async (img) => {
      let publicUrl = img.public_url || img.publicUrl || '';
      if (publicUrl && !publicUrl.startsWith('http://') && !publicUrl.startsWith('https://')) {
        const filename = publicUrl || img.filename;
        if (filename) {
          try {
            const { data: fileRecords } = await supabase
              .from('files')
              .select('public_url')
              .eq('filename', filename)
              .order('created_at', { ascending: false })
              .limit(1);
            if (fileRecords && fileRecords.length > 0 && fileRecords[0].public_url) {
              publicUrl = fileRecords[0].public_url;
            }
          } catch (e) {}
        }
      }
      return { placeholder_id: img.placeholder_id, public_url: publicUrl, alt_text: img.alt_text };
    }));
    
    const imageMap = new Map(normalizedImages.map(img => [img.placeholder_id, img]));
    
    // Check for missing images
    const missingImages: string[] = [];
    sections.forEach(section => {
      const placeholders = section.markdown_content.match(/!\[IMAGE_PLACEHOLDER:([^\]]+)\]/g) || [];
      placeholders.forEach(placeholder => {
        const placeholderId = placeholder.match(/IMAGE_PLACEHOLDER:([^\]]+)/)?.[1];
        if (placeholderId && !imageMap.has(placeholderId)) {
          missingImages.push(`${placeholderId} (in section "${section.section_title}")`);
        }
      });
    });
    
    if (missingImages.length > 0) {
      return { success: false, error: `MISSING IMAGES: ${missingImages.join(', ')}`, item_id };
    }
    
    // Convert Markdown to HTML
    const sectionsHtml = sections.map((section, index) => {
      let markdown = section.markdown_content;
      
      // Robust title cleaning
      const sectionTitle = section.section_title.trim();
      const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const redundantPatterns = [
        new RegExp(`^\\s*#{1,3}\\s*${escapedTitle}\\s*(\\n|$)`, 'i'), 
        new RegExp(`^\\s*\\*\\*\\s*${escapedTitle}\\s*\\*\\*\\s*(\\n|$)`, 'i'), 
        new RegExp(`^\\s*${escapedTitle}\\s*(\\n|$)`, 'i'), 
      ];
      redundantPatterns.forEach(pattern => { markdown = markdown.replace(pattern, ''); });

      // Replace images
      markdown = markdown.replace(/!\[IMAGE_PLACEHOLDER:([^\]]+)\]/g, (match, placeholderId) => {
        const imageInfo = imageMap.get(placeholderId);
        if (imageInfo && imageInfo.public_url) {
          const altText = imageInfo.alt_text || section.section_title || 'Section image';
          return `![${altText}](${imageInfo.public_url})`;
        }
        return '';
      });
      
      const html = markdownToHtml(markdown);
      
      // High-end styling
      const sectionId = `section-${index}`;
      const sectionClass = "py-12 border-b border-gray-100 last:border-0";
      const titleClass = "text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 tracking-tight leading-tight";

      return `    <section id="${sectionId}" class="${sectionClass}">
      <h2 class="${titleClass}">${escapeHtml(section.section_title)}</h2>
      <div class="prose prose-indigo prose-lg max-w-none text-gray-600 leading-relaxed space-y-6 citation-enhanced">
${html.split('\n').map(line => '        ' + line).join('\n')}
      </div>
    </section>`;
    }).join('\n\n');

    const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
    
    :root {
      --primary: #8b5cf6;
      --primary-dark: #7c3aed;
      --accent: #06b6d4;
    }

    * {
      scroll-behavior: smooth;
    }

    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      background-color: #ffffff;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Section styling */
    .page-content-scope section {
      position: relative;
      padding: 4rem 0;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .page-content-scope section:last-child {
      border-bottom: none;
    }

    /* Premium card styling for sections */
    .page-content-scope .prose {
      background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
      border-radius: 1.5rem;
      padding: 2.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }

    .page-content-scope .prose a { 
      color: var(--primary); 
      text-decoration: none;
      font-weight: 600; 
      transition: all 0.2s ease;
      background: linear-gradient(transparent 60%, rgba(139, 92, 246, 0.15) 60%);
    }
    
    .page-content-scope .prose a:hover { 
      color: var(--primary-dark);
      background: linear-gradient(transparent 60%, rgba(139, 92, 246, 0.3) 60%);
    }

    .page-content-scope .prose h2 {
      font-size: 2.25rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1.5rem;
      letter-spacing: -0.025em;
      line-height: 1.2;
    }

    .page-content-scope .prose h3 { 
      font-size: 1.5rem; 
      font-weight: 700; 
      color: #1e293b; 
      margin-top: 2.5rem; 
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
    }

    .page-content-scope .prose p { 
      margin-bottom: 1.5rem; 
      font-size: 1.125rem;
      line-height: 1.85;
      color: #475569;
    }

    .page-content-scope .prose ul, .page-content-scope .prose ol { 
      margin: 1.5rem 0; 
      padding-left: 1.5rem; 
    }

    .page-content-scope .prose li { 
      margin-bottom: 0.75rem; 
      padding-left: 0.5rem;
      color: #475569;
      line-height: 1.7;
    }

    .page-content-scope .prose li::marker {
      color: var(--primary);
    }

    /* Premium image styling */
    .page-content-scope .content-image { 
      width: 100%; 
      border-radius: 1rem; 
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); 
      margin: 2.5rem 0; 
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid #e2e8f0;
    }
    
    .page-content-scope .content-image:hover {
      transform: translateY(-4px) scale(1.01);
      box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.2);
    }

    /* CTA Button styling */
    .page-content-scope .prose a[href]:has(> strong),
    .page-content-scope .prose a.cta-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white !important;
      font-weight: 700;
      border-radius: 0.75rem;
      box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.4);
      transition: all 0.3s ease;
      text-decoration: none;
      border: none;
    }
    
    .page-content-scope .prose a[href]:has(> strong):hover,
    .page-content-scope .prose a.cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px -5px rgba(139, 92, 246, 0.5);
    }

    /* Comparison table styling */
    .page-content-scope table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 2rem 0;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .page-content-scope th {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      font-weight: 700;
      padding: 1rem 1.5rem;
      text-align: left;
    }

    .page-content-scope td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .page-content-scope tr:last-child td {
      border-bottom: none;
    }

    .page-content-scope tr:nth-child(even) {
      background: #f8fafc;
    }

    /* External link indicator */
    .citation-enhanced a[href^="http"]::after { 
      content: '↗'; 
      font-size: 0.7em; 
      margin-left: 4px; 
      vertical-align: super; 
      opacity: 0.5; 
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .page-content-scope section {
      animation: fadeInUp 0.6s ease-out forwards;
    }

    .page-content-scope section:nth-child(2) { animation-delay: 0.1s; }
    .page-content-scope section:nth-child(3) { animation-delay: 0.2s; }
    .page-content-scope section:nth-child(4) { animation-delay: 0.3s; }
    .page-content-scope section:nth-child(5) { animation-delay: 0.4s; }
    `;

    // ALTERNATIVE PAGE: Premium conversion-focused design
    const bodyContent = `
  <!-- Hero Section with Gradient Background -->
  <header class="relative overflow-hidden">
    <!-- Animated gradient background -->
    <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent"></div>
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent"></div>
    
    <!-- Grid pattern overlay -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
    
    <div class="relative max-w-7xl mx-auto px-6 py-24 md:py-36 lg:py-44">
      <div class="max-w-4xl mx-auto text-center">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-white/90 text-sm font-semibold tracking-wide">Alternative Solution</span>
        </div>
        
        <!-- Main Title -->
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-8">
          ${escapeHtml(page_title)}
        </h1>
        
        <!-- Description -->
        ${seo_description ? `<p class="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed font-medium mb-10">${escapeHtml(seo_description)}</p>` : ''}
        
        <!-- CTA Button - Links to product website for conversion -->
        ${(cta_button?.url || site_url) ? `
        <a href="${escapeHtml(cta_button?.url || site_url || '/')}" class="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:scale-105 transition-all duration-300">
          ${escapeHtml(cta_button?.text || 'Get Started Free')}
          <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </a>
        ` : ''}
      </div>
    </div>
    
    <!-- Bottom fade -->
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-6 py-16 md:py-24">
    ${sectionsHtml}
    
    <!-- Final CTA Section -->
    <section class="mt-24 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-12 md:p-20 text-center">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/30 via-transparent to-transparent"></div>
      <div class="relative">
        <h2 class="text-3xl md:text-5xl font-black text-white mb-6">Ready to Make the Switch?</h2>
        <p class="text-xl text-white/70 max-w-2xl mx-auto mb-10">Join thousands of satisfied users who have already discovered a better alternative.</p>
        <a href="${escapeHtml(cta_button?.url || site_url || '/')}" class="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-slate-900 font-bold text-lg rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300">
          ${escapeHtml(cta_button?.text || 'Get Started Now')}
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
        </a>
      </div>
    </section>
  </main>`;

    // Build meta tags
    const metaTags = [
      `<meta charset="UTF-8">`,
      `<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
      `<title>${escapeHtml(seo_title || page_title)}</title>`,
      seo_description ? `<meta name="description" content="${escapeHtml(seo_description)}">` : '',
      seo_keywords ? `<meta name="keywords" content="${escapeHtml(seo_keywords)}">` : '',
      // Open Graph tags
      `<meta property="og:title" content="${escapeHtml(seo_title || page_title)}">`,
      seo_description ? `<meta property="og:description" content="${escapeHtml(seo_description)}">` : '',
      `<meta property="og:type" content="website">`,
      og_image ? `<meta property="og:image" content="${escapeHtml(og_image)}">` : '',
      site_url ? `<meta property="og:url" content="${escapeHtml(site_url)}">` : '',
      // Twitter Card tags
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${escapeHtml(seo_title || page_title)}">`,
      seo_description ? `<meta name="twitter:description" content="${escapeHtml(seo_description)}">` : '',
      og_image ? `<meta name="twitter:image" content="${escapeHtml(og_image)}">` : '',
      site_url ? `<link rel="canonical" href="${escapeHtml(site_url)}">` : '',
    ].filter(Boolean).join('\n  ');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  ${metaTags}
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${customStyles}</style>
</head>
<body class="antialiased text-gray-900 bg-white page-content-scope">
${bodyContent}
</body>
</html>`;

    console.log(`[assemble_html_page] Saving intermediate HTML to database for item: ${item_id}`);
    await supabase.from('content_items').update({ generated_content: html, status: 'in_production', updated_at: new Date().toISOString() }).eq('id', item_id);

    return {
      success: true,
      item_id,
      html_content: html.length > 5000 ? html.substring(0, 5000) + '... (truncated)' : html,
      message: `Base HTML page assembled with high-end ${page_type} styling. Saved to database.

CONTINUITY REMINDER: This is ONLY the base HTML. You MUST immediately continue with these steps IN THIS EXACT ORDER:
1. Call 'merge_html_with_site_contexts' with item_id: "${item_id}" to add site header/footer
2. Call 'fix_style_conflicts' with item_id: "${item_id}" to isolate styles
3. Call 'save_final_page' with item_id: "${item_id}" to finalize and save
DO NOT STOP until 'save_final_page' returns success.`,
      filename: `page-${item_id}.html`,
      mimeType: 'text/html',
      size: html.length,
      needsUpload: true,
      metadata: { item_id, page_title, page_type, createdAt: new Date().toISOString() }
    };
  },
});

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
