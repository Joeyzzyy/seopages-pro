import type { Metadata } from "next";
import "./globals.css";

// Using system fonts to bypass Google Fonts download issues during build
const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  metadataBase: new URL('https://seopages.pro'),
  title: {
    default: 'seopages.pro - AI-Powered Alternative Page Generator',
    template: '%s | seopages.pro',
  },
  description: 'Generate SEO & GEO optimized alternative pages in minutes. Get deploy-ready HTML code for competitor comparison pages. No subscriptions, you own the code.',
  keywords: ['alternative page generator', 'SEO pages', 'competitor comparison pages', 'AI page generator', 'GEO optimization', 'comparison landing pages'],
  authors: [{ name: 'seopages.pro' }],
  creator: 'seopages.pro',
  publisher: 'seopages.pro',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://seopages.pro',
    siteName: 'seopages.pro',
    title: 'seopages.pro - AI-Powered Alternative Page Generator',
    description: 'Generate SEO & GEO optimized alternative pages in minutes. Get deploy-ready HTML code for competitor comparison pages.',
    images: [
      {
        url: '/new-logo.png',
        width: 512,
        height: 512,
        alt: 'seopages.pro Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'seopages.pro - AI-Powered Alternative Page Generator',
    description: 'Generate SEO & GEO optimized alternative pages in minutes. Deploy-ready HTML, no subscriptions.',
    images: ['/new-logo.png'],
  },
  alternates: {
    canonical: 'https://seopages.pro',
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
  },
};

// Organization Schema JSON-LD
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'seopages.pro',
  url: 'https://seopages.pro',
  logo: 'https://seopages.pro/new-logo.png',
  description: 'AI-powered alternative page generator for SEO and GEO optimized competitor comparison pages.',
  email: 'wps_zy@126.com',
  sameAs: [],
};

// WebSite Schema for sitelinks search
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'seopages.pro',
  url: 'https://seopages.pro',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://seopages.pro/alternative-page-guide?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
