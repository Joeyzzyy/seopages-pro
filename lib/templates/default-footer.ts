/**
 * Default Tailwind-based footer template
 * User can customize: company info, links, social media
 */

export interface FooterConfig {
  companyName: string;
  tagline?: string;
  logo?: string;
  columns: Array<{
    title: string;
    links: Array<{
      label: string;
      url: string;
    }>;
  }>;
  socialMedia?: Array<{
    platform: 'twitter' | 'facebook' | 'linkedin' | 'github' | 'instagram';
    url: string;
  }>;
  copyright?: string;
  backgroundColor?: string; // CSS color value (can be hex, rgb, or gradient)
  textColor?: string; // CSS color value
}

export const defaultFooterConfig: FooterConfig = {
  companyName: 'My Company',
  tagline: 'Building the future, one line of code at a time.',
  columns: [
    {
      title: 'Product',
      links: [
        { label: 'Features', url: '/features' },
        { label: 'Pricing', url: '/pricing' },
        { label: 'FAQ', url: '/faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', url: '/about' },
        { label: 'Blog', url: '/blog' },
        { label: 'Careers', url: '/careers' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', url: '/help' },
        { label: 'Contact', url: '/contact' },
        { label: 'Privacy', url: '/privacy' },
      ],
    },
  ],
  socialMedia: [
    { platform: 'twitter', url: 'https://twitter.com/example' },
    { platform: 'linkedin', url: 'https://linkedin.com/company/example' },
  ],
  backgroundColor: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
  textColor: '#E5E7EB',
};

/**
 * Generate Tailwind footer HTML from config
 */
export function generateFooterHTML(config: FooterConfig): string {
  // Use custom colors if provided, otherwise use defaults
  const bgStyle = config.backgroundColor 
    ? `style="background: ${config.backgroundColor};"` 
    : `class="bg-gray-900"`;
  
  const textColor = config.textColor || '#D1D5DB';
  const headingColor = config.textColor || '#FFFFFF';
  
  return `<footer ${bgStyle}>
  <div class="container mx-auto px-4 py-12" style="color: ${textColor};">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-16">
      <!-- Company Info -->
      <div class="md:col-span-1">
        <div class="flex flex-col space-y-3">
          ${config.logo ? `
          <img src="${escapeHtml(config.logo)}" alt="${escapeHtml(config.companyName)}" class="h-10 w-auto" />
          ` : `
          <h3 class="text-xl font-bold" style="color: ${headingColor};">${escapeHtml(config.companyName)}</h3>
          `}
          ${config.tagline ? `
          <p class="text-xs font-normal opacity-90">
            ${escapeHtml(config.tagline)}
          </p>
          ` : ''}
        </div>
        
        <!-- Social Media -->
        ${config.socialMedia && config.socialMedia.length > 0 ? `
        <div class="flex space-x-6 mt-6">
          ${config.socialMedia.map(social => `
          <a href="${escapeHtml(social.url)}" target="_blank" rel="noopener noreferrer" class="hover:opacity-75 transition-opacity" aria-label="${social.platform}">
            ${getSocialIcon(social.platform)}
          </a>
          `).join('')}
        </div>
        ` : ''}
      </div>
      
      <!-- Link Columns -->
      ${config.columns.map(column => `
      <div>
        <h4 class="text-sm font-semibold uppercase tracking-wider mb-4" style="color: ${headingColor};">
          ${escapeHtml(column.title)}
        </h4>
        <ul class="space-y-4">
          ${column.links.map(link => `
          <li>
            <a href="${escapeHtml(link.url)}" class="text-sm hover:opacity-75 transition-opacity">
              ${escapeHtml(link.label)}
            </a>
          </li>
          `).join('')}
        </ul>
      </div>
      `).join('')}
    </div>
    
    <!-- Copyright -->
    <div class="border-t border-gray-800 mt-8 pt-8 text-sm text-center" style="opacity: 0.75;">
      <p>
        ${config.copyright || `© ${new Date().getFullYear()} ${escapeHtml(config.companyName)}. All rights reserved.`}
      </p>
    </div>
  </div>
</footer>`;
}

function getSocialIcon(platform: string): string {
  const iconClass = "w-5 h-5";
  
  const icons: { [key: string]: string } = {
    twitter: `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>`,
    facebook: `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>`,
    linkedin: `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    github: `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
    instagram: `<svg class="${iconClass}" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
  };
  
  return icons[platform] || '';
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

