/**
 * Default Tailwind-based header template
 * User can customize: logo, site name, navigation links
 */

export interface HeaderConfig {
  siteName: string;
  logo?: string; // URL to logo image
  navigation: Array<{
    label: string;
    url: string;
  }>;
  ctaButton?: {
    label: string;
    url: string;
    color: string; // CSS color value (can be hex, rgb, or gradient)
  };
}

export const defaultHeaderConfig: HeaderConfig = {
  siteName: 'My Site',
  navigation: [
    { label: 'Home', url: '/' },
    { label: 'About', url: '/about' },
    { label: 'Services', url: '/services' },
    { label: 'Contact', url: '/contact' },
  ],
  ctaButton: {
    label: 'Get Started',
    url: '/get-started',
    color: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
  },
};

/**
 * Generate Tailwind header HTML from config
 */
export function generateHeaderHTML(config: HeaderConfig): string {
  // Button style - use the color directly (supports both solid colors and gradients)
  const buttonColor = config.ctaButton?.color || '#3B82F6';
  const buttonStyle = `background: ${buttonColor}; color: white;`;
  
  return `<header class="bg-white text-gray-900 border-b border-gray-200 sticky top-0 z-50 shadow-sm">
  <div class="container mx-auto px-6 py-4 max-w-7xl">
    <div class="flex items-center justify-between gap-8">
      <!-- Logo & Site Name -->
      <div class="flex items-center space-x-3 flex-shrink-0">
        ${config.logo ? `
        <a href="/" class="flex items-center">
          <img src="${escapeHtml(config.logo)}" alt="${escapeHtml(config.siteName)}" class="h-8 w-auto" />
        </a>
        ` : `
        <a href="/" class="text-2xl font-bold hover:text-blue-600 transition-colors">
          ${escapeHtml(config.siteName)}
        </a>
        `}
      </div>
      
      <!-- Navigation -->
      <nav class="hidden md:flex items-center space-x-8 flex-1 justify-center">
        ${config.navigation.map(link => `
        <a href="${escapeHtml(link.url)}" class="text-sm font-medium hover:text-blue-600 transition-colors whitespace-nowrap">
          ${escapeHtml(link.label)}
        </a>
        `).join('')}
      </nav>
      
      <!-- CTA Button -->
      ${config.ctaButton ? `
      <div class="hidden md:block flex-shrink-0">
        <a href="${escapeHtml(config.ctaButton.url)}" class="inline-block px-6 py-2.5 text-sm font-medium rounded-lg hover:opacity-90 transition-all whitespace-nowrap" style="${buttonStyle}">
          ${escapeHtml(config.ctaButton.label)}
        </a>
      </div>
      ` : ''}
      
      <!-- Mobile Menu Button -->
      <button class="md:hidden p-2 rounded-lg hover:text-blue-600" aria-label="Menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </div>
  </div>
</header>`;
}

function escapeHtml(text: any): string {
  if (text === null || text === undefined) return '';
  const str = String(text);
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

