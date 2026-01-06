import type { SiteContext } from '@/lib/supabase';

export interface SectionProps {
  siteContexts: SiteContext[];
  showDebugInfo?: boolean;
}

// Offsite Context Types
export interface LinkItem {
  platform: string;
  url: string;
}

export interface OffsiteContext {
  id?: string;
  user_id?: string;
  project_id?: string;
  // Monitoring Scope
  brand_keywords: string[];
  product_keywords: string[];
  key_persons: string[];
  hashtags: string[];
  required_keywords: string[];
  excluded_keywords: string[];
  regions: string[];
  languages: string[];
  // Owned Presence
  official_channels: LinkItem[];
  executive_accounts: LinkItem[];
  // Reviews & Listings
  review_platforms: LinkItem[];
  directories: LinkItem[];
  storefronts: LinkItem[];
  // Community
  forums: LinkItem[];
  qa_platforms: LinkItem[];
  branded_groups: LinkItem[];
  // Media
  media_channels: LinkItem[];
  coverage: LinkItem[];
  events: LinkItem[];
  // KOLs
  creators: LinkItem[];
  experts: LinkItem[];
  press_contacts: LinkItem[];
  // Metadata
  created_at?: string;
  updated_at?: string;
}

export interface OffsiteSectionProps {
  offsiteContext: OffsiteContext | null;
  onOffsiteContextChange: (context: Partial<OffsiteContext>) => void;
  isLoading?: boolean;
}

// Brand & Site Section
export interface BrandSiteSectionProps extends SectionProps {
  // Meta Info
  metaTitle: string;
  setMetaTitle: (v: string) => void;
  metaDescription: string;
  setMetaDescription: (v: string) => void;
  metaKeywords: string;
  setMetaKeywords: (v: string) => void;
  domainName: string;
  setDomainName: (v: string) => void;
  ogImage: string;
  setOgImage: (v: string) => void;
  onOgImageFileChange: (file: File | null) => void;
  ogImagePreview: string | null;
  
  // Logo & Favicon URLs
  logoLightUrl: string;
  setLogoLightUrl: (v: string) => void;
  logoDarkUrl: string;
  setLogoDarkUrl: (v: string) => void;
  faviconLightUrl: string;
  setFaviconLightUrl: (v: string) => void;
  faviconDarkUrl: string;
  setFaviconDarkUrl: (v: string) => void;
  
  // File uploads
  onLogoLightFileChange: (file: File | null) => void;
  onLogoDarkFileChange: (file: File | null) => void;
  onFaviconLightFileChange: (file: File | null) => void;
  onFaviconDarkFileChange: (file: File | null) => void;
  
  // Previews
  logoLightPreview: string | null;
  logoDarkPreview: string | null;
  faviconLightPreview: string | null;
  faviconDarkPreview: string | null;
  
  // Colors
  primaryColor: string;
  setPrimaryColor: (v: string) => void;
  secondaryColor: string;
  setSecondaryColor: (v: string) => void;
  
  // Typography & Tone
  headingFont: string;
  setHeadingFont: (v: string) => void;
  bodyFont: string;
  setBodyFont: (v: string) => void;
  tone: string;
  setTone: (v: string) => void;
  languages: string;
  setLanguages: (v: string) => void;
  
  // Header & Footer
  userLogoUrl: string | null;
  setHeaderConfig: (config: any) => void;
  setFooterConfig: (config: any) => void;
  
  // Refs
  brandAssetsRef: React.RefObject<HTMLDivElement | null>;
  colorsRef: React.RefObject<HTMLDivElement | null>;
  typographyRef: React.RefObject<HTMLDivElement | null>;
  toneRef: React.RefObject<HTMLDivElement | null>;
  languagesRef: React.RefObject<HTMLDivElement | null>;
  headerRef: React.RefObject<HTMLDivElement | null>;
  footerRef: React.RefObject<HTMLDivElement | null>;
  sitemapRef: React.RefObject<HTMLDivElement | null>;
}

// Hero Section
export interface HeroSectionProps extends SectionProps {
  heroSectionContent: string;
  setHeroSectionContent: (v: string) => void;
  heroSectionRef: React.RefObject<HTMLDivElement | null>;
}

// Pages Section
export interface PagesSectionProps extends SectionProps {
  keyWebsitePagesContent: string;
  setKeyWebsitePagesContent: (v: string) => void;
  landingPagesContent: string;
  setLandingPagesContent: (v: string) => void;
  blogResourcesContent: string;
  setBlogResourcesContent: (v: string) => void;
  
  keyWebsitePagesRef: React.RefObject<HTMLDivElement | null>;
  landingPagesRef: React.RefObject<HTMLDivElement | null>;
  blogResourcesRef: React.RefObject<HTMLDivElement | null>;
}

// Business Context Section
export interface BusinessContextSectionProps extends SectionProps {
  problemStatementContent: string;
  setProblemStatementContent: (v: string) => void;
  whoWeServeContent: string;
  setWhoWeServeContent: (v: string) => void;
  useCasesContent: string;
  setUseCasesContent: (v: string) => void;
  industriesContent: string;
  setIndustriesContent: (v: string) => void;
  productsServicesContent: string;
  setProductsServicesContent: (v: string) => void;
  
  problemStatementRef: React.RefObject<HTMLDivElement | null>;
  whoWeServeRef: React.RefObject<HTMLDivElement | null>;
  useCasesRef: React.RefObject<HTMLDivElement | null>;
  industriesRef: React.RefObject<HTMLDivElement | null>;
  productsServicesRef: React.RefObject<HTMLDivElement | null>;
}

// Trust & Company Section
export interface TrustCompanySectionProps extends SectionProps {
  socialProofContent: string;
  setSocialProofContent: (v: string) => void;
  leadershipTeamContent: string;
  setLeadershipTeamContent: (v: string) => void;
  aboutUsContent: string;
  setAboutUsContent: (v: string) => void;
  faqContent: string;
  setFaqContent: (v: string) => void;
  contactInfoContent: string;
  setContactInfoContent: (v: string) => void;
  
  socialProofRef: React.RefObject<HTMLDivElement | null>;
  leadershipTeamRef: React.RefObject<HTMLDivElement | null>;
  aboutUsRef: React.RefObject<HTMLDivElement | null>;
  faqRef: React.RefObject<HTMLDivElement | null>;
  contactInfoRef: React.RefObject<HTMLDivElement | null>;
}

