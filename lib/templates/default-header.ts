/**
 * Default Tailwind-based header template
 * User can customize: logo, site name, navigation links
 * Supports nested dropdown menus for complex navigation structures
 */

export interface NavItem {
  label: string;
  url: string;
  children?: NavItem[]; // Nested dropdown items
}

export interface HeaderConfig {
  siteName: string;
  logo?: string; // URL to logo image
  navigation: NavItem[];
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
 * Generate a single nav item (with optional dropdown)
 */
function generateNavItem(item: NavItem): string {
  // If has children, render as dropdown
  if (item.children && item.children.length > 0) {
    return `
        <div class="relative group">
          <button class="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap">
            ${escapeHtml(item.label)}
            <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          <div class="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div class="bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]">
              ${item.children.map(child => `
              <a href="${escapeHtml(child.url)}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                ${escapeHtml(child.label)}
              </a>
              `).join('')}
            </div>
          </div>
        </div>`;
  }
  
  // Simple link without dropdown
  return `
        <a href="${escapeHtml(item.url)}" class="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap">
          ${escapeHtml(item.label)}
        </a>`;
}

/**
 * Generate Tailwind header HTML from config
 * Supports nested navigation with dropdown menus
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
        <a href="/" class="text-2xl font-bold hover:text-gray-600 transition-colors">
          ${escapeHtml(config.siteName)}
        </a>
        `}
      </div>
      
      <!-- Navigation with dropdown support -->
      <nav class="hidden md:flex items-center space-x-6 flex-1 justify-center">
        ${config.navigation.map(item => generateNavItem(item)).join('')}
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
      <button class="md:hidden p-2 rounded-lg hover:text-gray-600" aria-label="Menu" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    </div>
    
    <!-- Mobile Menu -->
    <div id="mobile-menu" class="hidden md:hidden pt-4 pb-2 border-t border-gray-100 mt-4">
      <nav class="flex flex-col space-y-2">
        ${config.navigation.map(item => {
          if (item.children && item.children.length > 0) {
            return `
        <div class="py-2">
          <span class="block text-sm font-semibold text-gray-900 mb-2">${escapeHtml(item.label)}</span>
          <div class="pl-4 space-y-1">
            ${item.children.map(child => `
            <a href="${escapeHtml(child.url)}" class="block py-1 text-sm text-gray-600 hover:text-gray-900">${escapeHtml(child.label)}</a>
            `).join('')}
          </div>
        </div>`;
          }
          return `
        <a href="${escapeHtml(item.url)}" class="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900">${escapeHtml(item.label)}</a>`;
        }).join('')}
        ${config.ctaButton ? `
        <a href="${escapeHtml(config.ctaButton.url)}" class="inline-block mt-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg text-center" style="${buttonStyle}">
          ${escapeHtml(config.ctaButton.label)}
        </a>
        ` : ''}
      </nav>
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

