import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { generateHeaderHTML, defaultHeaderConfig, type HeaderConfig } from '@/lib/templates/default-header';
import { generateFooterHTML, defaultFooterConfig, type FooterConfig } from '@/lib/templates/default-footer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const initialize_site_branding = tool({
  description: `Initialize default site branding (header and footer) with Tailwind CSS.
  
This tool creates a professional, consistent header and footer using Tailwind CSS framework.
User can customize: site name, logo, navigation links, colors.

IMPORTANT: Call this tool if the user hasn't set up header/footer yet, or if they want to reset to defaults.`,
  parameters: z.object({
    user_id: z.string().describe('The user ID'),
    site_name: z.string().describe('The site/company name'),
    logo_url: z.string().optional().describe('URL to logo image (optional)'),
    navigation: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).optional().describe('Navigation links (optional, will use defaults if not provided)'),
  }),
  execute: async ({ user_id, site_name, logo_url, navigation }) => {
    try {
      // Build header config
      const headerConfig: HeaderConfig = {
        siteName: site_name,
        logo: logo_url,
        navigation: navigation || defaultHeaderConfig.navigation,
        ctaButton: defaultHeaderConfig.ctaButton,
      };

      // Build footer config
      const footerConfig: FooterConfig = {
        companyName: site_name,
        tagline: `Welcome to ${site_name}`,
        logo: logo_url,
        columns: defaultFooterConfig.columns,
        socialMedia: defaultFooterConfig.socialMedia,
      };

      // Generate HTML
      const headerHTML = generateHeaderHTML(headerConfig);
      const footerHTML = generateFooterHTML(footerConfig);

      // Save header
      const { error: headerError } = await supabase
        .from('site_contexts')
        .upsert({
          user_id,
          type: 'header',
          content: headerHTML,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,type',
        });

      if (headerError) {
        console.error('[initialize_site_branding] Header error:', headerError);
        throw new Error(`Failed to save header: ${headerError.message}`);
      }

      // Save footer
      const { error: footerError } = await supabase
        .from('site_contexts')
        .upsert({
          user_id,
          type: 'footer',
          content: footerHTML,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,type',
        });

      if (footerError) {
        console.error('[initialize_site_branding] Footer error:', footerError);
        throw new Error(`Failed to save footer: ${footerError.message}`);
      }

      // Generate basic Tailwind head tags
      const headTags = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      /* Additional custom styles if needed */
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
    </style>
  `.trim();

      // Save head tags
      const { error: headError } = await supabase
        .from('site_contexts')
        .upsert({
          user_id,
          type: 'head',
          content: headTags,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,type',
        });

      if (headError) {
        console.error('[initialize_site_branding] Head tags error:', headError);
        throw new Error(`Failed to save head tags: ${headError.message}`);
      }

      return {
        success: true,
        message: `Site branding initialized successfully for "${site_name}"`,
        header_preview: headerHTML.substring(0, 200) + '...',
        footer_preview: footerHTML.substring(0, 200) + '...',
        uses_tailwind: true,
        customization_tip: 'User can edit the saved HTML in site_contexts table to customize further',
      };
    } catch (error: any) {
      console.error('[initialize_site_branding] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});



