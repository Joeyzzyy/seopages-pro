import { tool } from 'ai';
import { z } from 'zod';
import { createServerSupabaseAdmin } from '@/lib/supabase-server';

// Lazy-initialize Supabase client to ensure proxy is configured
let _supabase: ReturnType<typeof createServerSupabaseAdmin> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createServerSupabaseAdmin();
  }
  return _supabase;
}

export const fix_style_conflicts = tool({
  description: `Fix CSS style conflicts between page content and site contexts (header/footer).
  
This tool analyzes the HTML and applies CSS scoping to prevent style conflicts. It reads the HTML from the database and saves the fixed version back.

Call this tool AFTER merge_html_with_site_contexts and BEFORE save_final_page.`,
  parameters: z.object({
    item_id: z.string().describe('The ID of the content item to fetch from database'),
    merged_html: z.string().optional().describe('Optional merged HTML string (if provided, this overrides the database content)'),
    scope_class: z.string().optional().default('page-content-scope').describe('CSS class name to use for scoping (default: page-content-scope)'),
  }),
  execute: async ({ item_id, merged_html, scope_class }) => {
    try {
      let htmlToProcess = merged_html;

      // If merged_html is not provided, fetch it from the database using item_id
      if (!htmlToProcess && item_id) {
        console.log(`[fix_style_conflicts] Fetching merged HTML from DB for item: ${item_id}`);
        const { data: item, error: fetchError } = await getSupabase()
          .from('content_items')
          .select('generated_content')
          .eq('id', item_id)
          .single();
        
        if (fetchError || !item?.generated_content) {
          throw new Error(`Failed to fetch content item or it has no generated content: ${fetchError?.message || 'Empty content'}`);
        }
        htmlToProcess = item.generated_content;
      }

      if (!htmlToProcess) {
        throw new Error('No HTML provided or found in database.');
      }

      // 🔍 DEBUG: Check for header/footer in input
      console.log(`[fix_style_conflicts] 🔍 INPUT HTML length: ${htmlToProcess.length} chars`);
      const inputHasHeader = /<header[\s\S]*?<\/header>/i.test(htmlToProcess);
      const inputHasFooter = /<footer[\s\S]*?<\/footer>/i.test(htmlToProcess);
      console.log(`[fix_style_conflicts] 🔍 INPUT has <header>: ${inputHasHeader}`);
      console.log(`[fix_style_conflicts] 🔍 INPUT has <footer>: ${inputHasFooter}`);
      console.log(`[fix_style_conflicts] 🔍 INPUT starts with: ${htmlToProcess.substring(0, 300)}`);

      // Extract head and body content
      const headMatch = htmlToProcess.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      const bodyMatch = htmlToProcess.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      
      if (!headMatch || !bodyMatch) {
        return {
          success: false,
          error: 'Invalid HTML structure: missing <head> or <body> tags',
          fixed_html: htmlToProcess.length > 5000 ? htmlToProcess.substring(0, 5000) + '...' : htmlToProcess,
        };
      }

      let headContent = headMatch[1];
      let bodyContent = bodyMatch[1];

      // Step 1: Identify and extract page content styles
      const styleMatches = [...headContent.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
      let pageContentStyles = '';
      let otherStyles = '';
      
      for (const match of styleMatches) {
        const styleContent = match[1];
        // Check if this is page content style (has generic selectors like body, h1, h2, etc.)
        const hasGenericSelectors = /\b(body|main|article|h[1-6]|p|ul|ol|li|a|strong|table|img)\s*\{/i.test(styleContent);
        
        if (hasGenericSelectors) {
          pageContentStyles += styleContent;
        } else {
          otherStyles += match[0]; // Keep the full <style> tag
        }
      }

      // Step 2: Scope the page content styles
      const scopedStyles = scopePageContentStyles(pageContentStyles, scope_class);

      // Step 3: Add minimal CSS isolation (removed aggressive reset to preserve Tailwind)
      const cssReset = `
    /* Minimal CSS isolation for page content */
    .${scope_class} {
      display: block;
      box-sizing: border-box;
    }
    .${scope_class} * {
      box-sizing: border-box;
    }
`;

      // Step 4: Rebuild head with scoped styles
      const newHeadContent = headContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove all old styles
        + `\n<style>\n${cssReset}\n${scopedStyles}\n</style>\n` // Add scoped styles
        + (otherStyles ? `\n${otherStyles}\n` : ''); // Add back other styles (like from head_tags)

      // Step 5: Wrap page content in scoped container
      const wrappedBodyContent = wrapContentWithScope(bodyContent, scope_class);

      // Step 6: Rebuild complete HTML
      let fixedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${newHeadContent}
</head>
<body>
${wrappedBodyContent}
</body>
</html>`;

      // 🔧 FIX: Clean null characters (\u0000) that PostgreSQL text type doesn't support
      const nullCharCount = (fixedHtml.match(/\u0000/g) || []).length;
      if (nullCharCount > 0) {
        console.log(`[fix_style_conflicts] ⚠️ Found ${nullCharCount} null characters (\\u0000), cleaning...`);
        fixedHtml = fixedHtml.replace(/\u0000/g, '');
      }

      // 🔧 FIX: Remove any Theme Switcher HTML (should be controlled externally, not in the page)
      const themeSwitcherPattern = /<!-- Theme Switcher -->[\s\S]*?<div[^>]*class="[^"]*fixed[^"]*top[^"]*right[^"]*z-50[^"]*flex[^"]*gap[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
      if (themeSwitcherPattern.test(fixedHtml)) {
        console.log(`[fix_style_conflicts] 🧹 Removing embedded Theme Switcher HTML...`);
        fixedHtml = fixedHtml.replace(themeSwitcherPattern, '');
      }
      // Also remove the setTheme script if present
      const themeScriptPattern = /\/\/ Theme Switcher[\s\S]*?function setTheme\([\s\S]*?if \(savedTheme\) setTheme\(savedTheme\);/g;
      if (themeScriptPattern.test(fixedHtml)) {
        console.log(`[fix_style_conflicts] 🧹 Removing Theme Switcher JavaScript...`);
        fixedHtml = fixedHtml.replace(themeScriptPattern, '');
      }

      // 🔍 DEBUG: Check for header/footer in output
      const outputHasHeader = /<header[\s\S]*?<\/header>/i.test(fixedHtml);
      const outputHasFooter = /<footer[\s\S]*?<\/footer>/i.test(fixedHtml);
      console.log(`[fix_style_conflicts] 🔍 OUTPUT has <header>: ${outputHasHeader}`);
      console.log(`[fix_style_conflicts] 🔍 OUTPUT has <footer>: ${outputHasFooter}`);
      console.log(`[fix_style_conflicts] 🔍 OUTPUT length: ${fixedHtml.length} chars`);
      
      // Warn if header/footer were lost
      if (inputHasHeader && !outputHasHeader) {
        console.error(`[fix_style_conflicts] ❌ WARNING: Header was LOST during processing!`);
      }
      if (inputHasFooter && !outputHasFooter) {
        console.error(`[fix_style_conflicts] ❌ WARNING: Footer was LOST during processing!`);
      }

      // Save the fixed HTML back to the database
      if (item_id) {
        console.log(`[fix_style_conflicts] 💾 Saving fixed HTML to database for item: ${item_id}`);
        const { data: saveResult, error: saveError } = await getSupabase()
          .from('content_items')
          .update({
            generated_content: fixedHtml,
            status: 'in_production',
            updated_at: new Date().toISOString()
          })
          .eq('id', item_id)
          .select('id');
        
        if (saveError) {
          console.error(`[fix_style_conflicts] ❌ SAVE ERROR:`, saveError);
        } else {
          console.log(`[fix_style_conflicts] ✅ SAVE SUCCESS!`);
        }
      }

      // Step 7: Analyze conflicts and generate report
      const conflicts = analyzeStyleConflicts(htmlToProcess);

      return {
        success: true,
        item_id,
        fixed_html: fixedHtml.length > 5000 ? fixedHtml.substring(0, 5000) + '... (truncated)' : fixedHtml,
        full_html_length: fixedHtml.length,
        scope_class,
        conflicts_detected: conflicts.length,
        message: `Style conflicts fixed and saved to database. The final step (save final page) will read the content from the database using the item_id.`,
      };
    } catch (error: any) {
      console.error('[fix_style_conflicts] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

/**
 * Scope page content styles to only apply within the scoped container
 */
function scopePageContentStyles(styleContent: string, scopeClass: string): string {
  // Global utility classes that should NOT be scoped
  const globalUtilityClasses = [
    '.btn-primary',
    '.btn-secondary',
    '.badge-winner',
    '.bg-brand-icon',
    '.bg-brand-bg',
    '.text-brand',
    '.text-brand-icon',
    '.ring-brand-icon',
    '.border-brand',
    '.faq-item',
    '.faq-content',
    '.faq-icon',
    '.faq-trigger',
  ];
  
  // Step 1: Extract and preserve @keyframes blocks (don't scope them at all)
  const keyframesBlocks: string[] = [];
  let contentWithoutKeyframes = styleContent.replace(/@keyframes\s+[\w-]+\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gi, (match) => {
    keyframesBlocks.push(match);
    return `__KEYFRAMES_${keyframesBlocks.length - 1}__`;
  });
  
  // Step 2: Extract and preserve @media blocks (process their content separately)
  const mediaBlocks: { query: string; content: string }[] = [];
  contentWithoutKeyframes = contentWithoutKeyframes.replace(/@media\s*([^{]+)\{([\s\S]*?)\}(?=\s*(?:@|\.|#|[a-z]|\*|\/\*|$))/gi, (match, query, content) => {
    mediaBlocks.push({ query: query.trim(), content });
    return `__MEDIA_${mediaBlocks.length - 1}__`;
  });
  
  // Step 3: Extract and preserve comments
  const comments: string[] = [];
  let cleanedContent = contentWithoutKeyframes.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    comments.push(match);
    return `__COMMENT_${comments.length - 1}__`;
  });
  
  // Step 4: Process regular CSS rules
  const scopedContent = scopeRegularRules(cleanedContent, scopeClass, globalUtilityClasses, comments);
  
  // Step 5: Process @media blocks (scope their inner content)
  const scopedMediaBlocks = mediaBlocks.map((block, idx) => {
    const innerScoped = scopeRegularRules(block.content, scopeClass, globalUtilityClasses, comments);
    return `@media ${block.query} {\n${innerScoped}\n}`;
  });
  
  // Step 6: Restore everything
  let result = scopedContent;
  
  // Restore media blocks
  result = result.replace(/__MEDIA_(\d+)__/g, (_, idx) => scopedMediaBlocks[parseInt(idx)]);
  
  // Restore keyframes blocks (unchanged)
  result = result.replace(/__KEYFRAMES_(\d+)__/g, (_, idx) => keyframesBlocks[parseInt(idx)]);
  
  // Restore comments
  result = result.replace(/__COMMENT_(\d+)__/g, (_, idx) => comments[parseInt(idx)]);
  
  return result;
}

/**
 * Scope regular CSS rules (not @keyframes or @media)
 */
function scopeRegularRules(
  content: string, 
  scopeClass: string, 
  globalUtilityClasses: string[],
  comments: string[]
): string {
  // Split by closing brace to get individual rules
  const rules = content.split('}').filter(r => r.trim());
  
  const scopedRules = rules.map(rule => {
    let trimmedRule = rule.trim();
    if (!trimmedRule) return '';
    
    // Skip placeholder tokens
    if (trimmedRule.match(/^__(?:KEYFRAMES|MEDIA|COMMENT)_\d+__$/)) {
      return trimmedRule;
    }
    
    // Extract any comment/placeholder at the beginning
    let leading = '';
    const leadingMatch = trimmedRule.match(/^((?:__(?:COMMENT|KEYFRAMES|MEDIA)_\d+__\s*)+)/);
    if (leadingMatch) {
      leading = leadingMatch[1];
      trimmedRule = trimmedRule.replace(leadingMatch[0], '').trim();
    }
    
    if (!trimmedRule) {
      return leading;
    }
    
    // Split selector and properties
    const braceIdx = trimmedRule.indexOf('{');
    if (braceIdx === -1) return leading + trimmedRule;
    
    const selector = trimmedRule.substring(0, braceIdx).trim();
    const properties = trimmedRule.substring(braceIdx + 1).trim();
    
    // Skip @rules that weren't extracted
    if (selector.startsWith('@')) {
      return leading + trimmedRule + '}';
    }
    
    // Handle multiple selectors (comma-separated)
    const selectors = selector.split(',').map(s => s.trim());
    
    const scopedSelectors = selectors.map(sel => {
      // Replace ':root' with the scope class
      if (sel === ':root') {
        return `.${scopeClass}`;
      }
      
      // Replace 'body' with the scope class
      if (sel === 'body' || sel === 'body *') {
        return `.${scopeClass}`;
      }
      
      // Check if this selector starts with a global utility class - DON'T scope these
      // Matches: .class, .class:pseudo, .class .child, .class.another-class
      const isGlobalUtility = globalUtilityClasses.some(utilClass => 
        sel === utilClass || 
        sel.startsWith(utilClass + ':') || 
        sel.startsWith(utilClass + ' ') ||
        sel.startsWith(utilClass + '.')  // Handle compound class selectors like .faq-item.active
      );
      
      if (isGlobalUtility) {
        return sel;
      }
      
      // Prepend scope class to all other selectors
      return `.${scopeClass} ${sel}`;
    });
    
    return `${leading}${scopedSelectors.join(',\n')} {\n  ${properties}\n}`;
  });
  
  return scopedRules.join('\n\n');
}

/**
 * Wrap the main content (between header and footer) with scope class
 */
function wrapContentWithScope(bodyContent: string, scopeClass: string): string {
  // Check if this is a standalone complete page (has both header and footer within body)
  const hasHeader = /<header[\s\S]*?<\/header>/i.test(bodyContent);
  const hasFooter = /<footer[\s\S]*?<\/footer>/i.test(bodyContent);
  const hasMain = /<main[\s\S]*?<\/main>/i.test(bodyContent);
  
  // If it's a complete standalone page with header, main, and footer
  // We should only scope the <main> element, not wrap everything
  if (hasHeader && hasFooter && hasMain) {
    const mainMatch = bodyContent.match(/(<main[^>]*>[\s\S]*?<\/main>)/i);
    if (mainMatch) {
      const mainContent = mainMatch[1];
      let wrapped;
      if (mainContent.includes('class="')) {
        wrapped = mainContent.replace('class="', `class="${scopeClass} `);
      } else {
        wrapped = mainContent.replace(/^<main([^>]*)>/, `<main$1 class="${scopeClass}">`);
      }
      return bodyContent.replace(mainContent, wrapped);
    }
    // If for some reason we can't find main, return as-is
    return bodyContent;
  }
  
  // Try to detect header and footer boundaries
  // Common patterns: <header>, <nav>, <footer>, or elements with id/class containing these keywords
  
  // Simple approach: find the main content area
  // Look for <main> tag or <article> tag
  const mainMatch = bodyContent.match(/(<main[^>]*>[\s\S]*?<\/main>)/i);
  const articleMatch = bodyContent.match(/(<article[^>]*>[\s\S]*?<\/article>)/i);
  
  if (mainMatch) {
    const mainContent = mainMatch[1];
    let wrapped;
    if (mainContent.includes('class="')) {
      wrapped = mainContent.replace('class="', `class="${scopeClass} `);
    } else {
      wrapped = mainContent.replace(/^<main([^>]*)>/, `<main$1 class="${scopeClass}">`);
    }
    return bodyContent.replace(mainContent, wrapped);
  } else if (articleMatch) {
    const articleContent = articleMatch[1];
    let wrapped;
    if (articleContent.includes('class="')) {
      wrapped = articleContent.replace('class="', `class="${scopeClass} `);
    } else {
      wrapped = articleContent.replace(/^<article([^>]*)>/, `<article$1 class="${scopeClass}">`);
    }
    return bodyContent.replace(articleContent, wrapped);
  }
  
  // Fallback: wrap everything in a div
  // This assumes header and footer are at the start and end
  // Try to identify header (first significant element) and footer (last significant element)
  
  // Look for header-like elements at the start
  const headerPatterns = [
    /<header[\s\S]*?<\/header>/i,
    /<nav[\s\S]*?<\/nav>/i,
    /<div[^>]*(?:class|id)=["'][^"']*(?:header|nav|navbar|menu|site-header)[^"']*["'][^>]*>[\s\S]*?<\/div>/i,
  ];
  
  let headerEnd = 0;
  for (const pattern of headerPatterns) {
    const match = bodyContent.match(pattern);
    if (match && match.index !== undefined) {
      headerEnd = Math.max(headerEnd, match.index + match[0].length);
    }
  }
  
  // Look for footer-like elements at the end
  const footerPatterns = [
    /<footer[\s\S]*?<\/footer>/i,
    /<div[^>]*(?:class|id)=["'][^"']*footer[^"']*["'][^>]*>[\s\S]*?<\/div>/i,
  ];
  
  let footerStart = bodyContent.length;
  for (const pattern of footerPatterns) {
    const matches = [...bodyContent.matchAll(new RegExp(pattern, 'gi'))];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      if (lastMatch.index !== undefined && lastMatch.index > headerEnd) {
        footerStart = Math.min(footerStart, lastMatch.index);
      }
    }
  }
  
  // Extract parts
  const beforeContent = bodyContent.substring(0, headerEnd);
  const contentPart = bodyContent.substring(headerEnd, footerStart);
  const afterContent = bodyContent.substring(footerStart);
  
  // Wrap the middle part
  return `${beforeContent}\n<div class="${scopeClass}">\n${contentPart}\n</div>\n${afterContent}`;
}

/**
 * Analyze and detect style conflicts
 */
function analyzeStyleConflicts(html: string): Array<{ type: string; description: string; severity: 'high' | 'medium' | 'low' }> {
  const conflicts: Array<{ type: string; description: string; severity: 'high' | 'medium' | 'low' }> = [];
  
  // Check for multiple CSS resets
  const resetCount = (html.match(/\*\s*\{\s*margin:\s*0/gi) || []).length;
  if (resetCount > 1) {
    conflicts.push({
      type: 'multiple_resets',
      description: `Detected ${resetCount} CSS reset rules that may conflict`,
      severity: 'medium',
    });
  }
  
  // Check for conflicting body styles
  const bodyStyleCount = (html.match(/body\s*\{[^}]*\}/gi) || []).length;
  if (bodyStyleCount > 1) {
    conflicts.push({
      type: 'body_style_conflict',
      description: `Multiple body style rules (${bodyStyleCount}) may override each other`,
      severity: 'high',
    });
  }
  
  // Check for !important usage (indicates existing conflicts)
  const importantCount = (html.match(/!important/gi) || []).length;
  if (importantCount > 5) {
    conflicts.push({
      type: 'excessive_important',
      description: `Found ${importantCount} !important declarations, suggesting style conflicts`,
      severity: 'medium',
    });
  }
  
  // Check for duplicate class names in header/footer and content
  const classMatches = html.match(/class=["']([^"']+)["']/gi);
  if (classMatches) {
    const classes = classMatches.map(m => m.match(/class=["']([^"']+)["']/)?.[1]).filter(Boolean);
    const classCounts = new Map<string, number>();
    classes.forEach(cls => {
      cls?.split(' ').forEach(c => {
        classCounts.set(c, (classCounts.get(c) || 0) + 1);
      });
    });
    
    const duplicates = Array.from(classCounts.entries()).filter(([_, count]) => count > 3);
    if (duplicates.length > 0) {
      conflicts.push({
        type: 'duplicate_classes',
        description: `Common class names used in multiple contexts: ${duplicates.slice(0, 3).map(([c]) => c).join(', ')}`,
        severity: 'low',
      });
    }
  }
  
  return conflicts;
}

// Explicit default export for better compatibility
export default fix_style_conflicts;

