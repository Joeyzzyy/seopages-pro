'use client';

import { useState, useEffect, useRef } from 'react';
import type { SiteContext } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import LogoEditor from './context-editors/LogoEditor';
import HeaderEditor from './context-editors/HeaderEditor';
import FooterEditor from './context-editors/FooterEditor';
import MetaEditor from './context-editors/MetaEditor';
import SitemapViewer from './context-editors/SitemapViewer';
import HeroSectionEditor from './context-editors/HeroSectionEditor';
import SocialProofEditor from './context-editors/SocialProofEditor';
import AboutUsEditor from './context-editors/AboutUsEditor';
import ContactInformationEditor from './context-editors/ContactInformationEditor';
import TextContentEditor from './context-editors/TextContentEditor';
import { generateHeaderHTML } from '@/lib/templates/default-header';
import { generateFooterHTML } from '@/lib/templates/default-footer';

interface ContextModalNewProps {
  isOpen: boolean;
  onClose: () => void;
  siteContexts: SiteContext[];
  onSave: (data: {
    type: SiteContext['type'];
    content?: string;
    fileUrl?: string;
  }) => Promise<void>;
}

type TabType = 'onsite' | 'offsite' | 'knowledge';

export default function ContextModalNew({
  isOpen,
  onClose,
  siteContexts,
  onSave,
}: ContextModalNewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('onsite');
  const [isSaving, setIsSaving] = useState(false);
  
  // Navigation expand states
  const [expandedNavBrandAssets, setExpandedNavBrandAssets] = useState(true);
  const [expandedNavSiteElements, setExpandedNavSiteElements] = useState(true);
  const [expandedNavHeroSection, setExpandedNavHeroSection] = useState(false);
  const [expandedNavSocialProof, setExpandedNavSocialProof] = useState(false);
  const [expandedNavAboutUs, setExpandedNavAboutUs] = useState(false);
  const [expandedNavContactInfo, setExpandedNavContactInfo] = useState(false);

  // Form states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  
  // Brand Assets states
  const [brandName, setBrandName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [favicon, setFavicon] = useState('');
  const [logoLight, setLogoLight] = useState('');
  const [logoDark, setLogoDark] = useState('');
  const [iconLight, setIconLight] = useState('');
  const [iconDark, setIconDark] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#9A8FEA');
  const [secondaryColor, setSecondaryColor] = useState('#FF5733');
  const [typography, setTypography] = useState('');
  const [tone, setTone] = useState('');
  const [languages, setLanguages] = useState('');
  
  const [headerConfig, setHeaderConfig] = useState<any>(null);
  const [footerConfig, setFooterConfig] = useState<any>(null);
  const [metaContent, setMetaContent] = useState('');
  
  // New content states
  const [keyWebsitePagesContent, setKeyWebsitePagesContent] = useState('');
  const [landingPagesContent, setLandingPagesContent] = useState('');
  const [blogResourcesContent, setBlogResourcesContent] = useState('');
  const [heroSectionContent, setHeroSectionContent] = useState('');
  const [problemStatementContent, setProblemStatementContent] = useState('');
  const [whoWeServeContent, setWhoWeServeContent] = useState('');
  const [useCasesContent, setUseCasesContent] = useState('');
  const [industriesContent, setIndustriesContent] = useState('');
  const [productsServicesContent, setProductsServicesContent] = useState('');
  const [socialProofContent, setSocialProofContent] = useState('');
  const [leadershipTeamContent, setLeadershipTeamContent] = useState('');
  const [aboutUsContent, setAboutUsContent] = useState('');
  const [faqContent, setFaqContent] = useState('');
  const [contactInfoContent, setContactInfoContent] = useState('');

  // Refs for scrolling
  const brandAssetsRef = useRef<HTMLDivElement>(null);
  const colorsRef = useRef<HTMLDivElement>(null);
  const typographyRef = useRef<HTMLDivElement>(null);
  const toneRef = useRef<HTMLDivElement>(null);
  const languagesRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const sitemapRef = useRef<HTMLDivElement>(null);
  
  // New refs for content sections
  const keyWebsitePagesRef = useRef<HTMLDivElement>(null);
  const landingPagesRef = useRef<HTMLDivElement>(null);
  const blogResourcesRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const problemStatementRef = useRef<HTMLDivElement>(null);
  const whoWeServeRef = useRef<HTMLDivElement>(null);
  const useCasesRef = useRef<HTMLDivElement>(null);
  const industriesRef = useRef<HTMLDivElement>(null);
  const productsServicesRef = useRef<HTMLDivElement>(null);
  const socialProofRef = useRef<HTMLDivElement>(null);
  const leadershipTeamRef = useRef<HTMLDivElement>(null);
  const aboutUsRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const contactInfoRef = useRef<HTMLDivElement>(null);

  // Get contexts by type
  const logoContext = siteContexts.find(c => c.type === 'logo');
  const headerContext = siteContexts.find(c => c.type === 'header');
  const footerContext = siteContexts.find(c => c.type === 'footer');
  const metaContext = siteContexts.find(c => c.type === 'meta');
  const sitemapContext = siteContexts.find(c => c.type === 'sitemap');
  
  // New context types
  const keyWebsitePagesContext = siteContexts.find(c => c.type === 'key-website-pages');
  const landingPagesContext = siteContexts.find(c => c.type === 'landing-pages');
  const blogResourcesContext = siteContexts.find(c => c.type === 'blog-resources');
  const heroSectionContext = siteContexts.find(c => c.type === 'hero-section');
  const problemStatementContext = siteContexts.find(c => c.type === 'problem-statement');
  const whoWeServeContext = siteContexts.find(c => c.type === 'who-we-serve');
  const useCasesContext = siteContexts.find(c => c.type === 'use-cases');
  const industriesContext = siteContexts.find(c => c.type === 'industries');
  const productsServicesContext = siteContexts.find(c => c.type === 'products-services');
  const socialProofContext = siteContexts.find(c => c.type === 'social-proof-trust');
  const leadershipTeamContext = siteContexts.find(c => c.type === 'leadership-team');
  const aboutUsContext = siteContexts.find(c => c.type === 'about-us');
  const faqContext = siteContexts.find(c => c.type === 'faq');
  const contactInfoContext = siteContexts.find(c => c.type === 'contact-information');

  const userLogoUrl = logoContext?.file_url || null;

  // Initialize states when modal opens
  useEffect(() => {
    if (isOpen) {
      setLogoPreviewUrl(logoContext?.file_url || null);
      setMetaContent(metaContext?.content || '');
      
      // Load brand asset fields from logo context
      if (logoContext) {
        const ctx = logoContext as any;
        setBrandName(ctx.brand_name || '');
        setSubtitle(ctx.subtitle || '');
        setMetaDescription(ctx.meta_description || '');
        setOgImage(ctx.og_image || '');
        setFavicon(ctx.favicon || '');
        setLogoLight(ctx.logo_light || '');
        setLogoDark(ctx.logo_dark || '');
        setIconLight(ctx.icon_light || '');
        setIconDark(ctx.icon_dark || '');
        setPrimaryColor(ctx.primary_color || '#9A8FEA');
        setSecondaryColor(ctx.secondary_color || '#FF5733');
        setTypography(ctx.heading_font || '');
        setTone(ctx.tone || '');
        setLanguages(ctx.languages || '');
      }
      
      // Load new content types
      setKeyWebsitePagesContent(keyWebsitePagesContext?.content || '');
      setLandingPagesContent(landingPagesContext?.content || '');
      setBlogResourcesContent(blogResourcesContext?.content || '');
      setHeroSectionContent(heroSectionContext?.content || '');
      setProblemStatementContent(problemStatementContext?.content || '');
      setWhoWeServeContent(whoWeServeContext?.content || '');
      setUseCasesContent(useCasesContext?.content || '');
      setIndustriesContent(industriesContext?.content || '');
      setProductsServicesContent(productsServicesContext?.content || '');
      setSocialProofContent(socialProofContext?.content || '');
      setLeadershipTeamContent(leadershipTeamContext?.content || '');
      setAboutUsContent(aboutUsContext?.content || '');
      setFaqContent(faqContext?.content || '');
      setContactInfoContent(contactInfoContext?.content || '');
    }
  }, [isOpen, logoContext, metaContext, keyWebsitePagesContext, landingPagesContext, 
      blogResourcesContext, heroSectionContext, problemStatementContext, whoWeServeContext,
      useCasesContext, industriesContext, productsServicesContext, socialProofContext,
      leadershipTeamContext, aboutUsContext, faqContext, contactInfoContext]);

  const handleLogoChange = (file: File | null, previewUrl: string | null) => {
    setLogoFile(file);
    setLogoPreviewUrl(previewUrl);
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Save logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);

        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const uploadResponse = await fetch('/api/upload-logo', {
          method: 'POST',
          body: formData,
          headers,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.details || 'Failed to upload logo');
        }

        const uploadData = await uploadResponse.json();
        await onSave({ type: 'logo', fileUrl: uploadData.url });
      }

      // Save brand asset fields (stored in a general context type or with logo)
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Save brand assets (all fields)
      await fetch('/api/site-contexts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'logo', // Store brand assets with logo type
          brandName,
          subtitle,
          metaDescription,
          ogImage,
          favicon,
          logoLight,
          logoDark,
          iconLight,
          iconDark,
          primaryColor,
          secondaryColor,
          headingFont: typography,
          bodyFont: typography, // Using same for now, can split later
          tone,
          languages,
        }),
      });

      // Save header if configured
      if (headerConfig) {
        await onSave({
          type: 'header',
          content: generateHeaderHTML(headerConfig),
        });
      }

      // Save footer if configured
      if (footerConfig) {
        await onSave({
          type: 'footer',
          content: generateFooterHTML(footerConfig),
        });
      }

      // Save meta if changed
      if (metaContent) {
        await onSave({
          type: 'meta',
          content: metaContent,
        });
      }
      
      // Save new content types
      const saveContentIfChanged = async (type: SiteContext['type'], content: string) => {
        if (content && content.trim()) {
          await onSave({ type, content });
        }
      };
      
      await saveContentIfChanged('key-website-pages', keyWebsitePagesContent);
      await saveContentIfChanged('landing-pages', landingPagesContent);
      await saveContentIfChanged('blog-resources', blogResourcesContent);
      await saveContentIfChanged('hero-section', heroSectionContent);
      await saveContentIfChanged('problem-statement', problemStatementContent);
      await saveContentIfChanged('who-we-serve', whoWeServeContent);
      await saveContentIfChanged('use-cases', useCasesContent);
      await saveContentIfChanged('industries', industriesContent);
      await saveContentIfChanged('products-services', productsServicesContent);
      await saveContentIfChanged('social-proof-trust', socialProofContent);
      await saveContentIfChanged('leadership-team', leadershipTeamContent);
      await saveContentIfChanged('about-us', aboutUsContent);
      await saveContentIfChanged('faq', faqContent);
      await saveContentIfChanged('contact-information', contactInfoContent);

      onClose();
    } catch (error) {
      console.error('Error saving context:', error);
      alert(error instanceof Error ? error.message : 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Helper function to check if a context field has value
  const hasContextValue = (field: string): boolean => {
    const logoContext = siteContexts.find(ctx => ctx.type === 'logo');
    const headerContext = siteContexts.find(ctx => ctx.type === 'header');
    const footerContext = siteContexts.find(ctx => ctx.type === 'footer');
    const metaContext = siteContexts.find(ctx => ctx.type === 'meta');
    const sitemapContext = siteContexts.find(ctx => ctx.type === 'sitemap');
    
    // Helper to check if JSON content has any meaningful values
    const hasJsonContent = (content: string | null | undefined): boolean => {
      if (!content) return false;
      try {
        const parsed = JSON.parse(content);
        // Check if any value in the object is non-empty
        return Object.values(parsed).some(val => val && String(val).trim() !== '');
      } catch {
        // If not JSON, treat as regular string
        return !!content && content.trim() !== '';
      }
    };
    
    switch (field) {
      case 'brand-assets':
        return !!(logoContext?.brand_name || logoContext?.primary_color || logoContext?.heading_font || logoContext?.tone || logoContext?.languages);
      case 'colors':
        return !!(logoContext?.primary_color || logoContext?.secondary_color);
      case 'typography':
        return !!(logoContext?.heading_font || logoContext?.body_font);
      case 'tone':
        return !!logoContext?.tone;
      case 'languages':
        return !!logoContext?.languages;
      case 'key-pages':
        return !!siteContexts.find(ctx => ctx.type === 'key-website-pages')?.content;
      case 'landing-pages':
        return !!siteContexts.find(ctx => ctx.type === 'landing-pages')?.content;
      case 'blog-resources':
        return !!siteContexts.find(ctx => ctx.type === 'blog-resources')?.content;
      case 'hero-section':
        return hasJsonContent(siteContexts.find(ctx => ctx.type === 'hero-section')?.content);
      case 'problem-statement':
        return !!siteContexts.find(ctx => ctx.type === 'problem-statement')?.content;
      case 'who-we-serve':
        return !!siteContexts.find(ctx => ctx.type === 'who-we-serve')?.content;
      case 'use-cases':
        return !!siteContexts.find(ctx => ctx.type === 'use-cases')?.content;
      case 'industries':
        return !!siteContexts.find(ctx => ctx.type === 'industries')?.content;
      case 'products-services':
        return !!siteContexts.find(ctx => ctx.type === 'products-services')?.content;
      case 'social-proof':
        return hasJsonContent(siteContexts.find(ctx => ctx.type === 'social-proof-trust')?.content);
      case 'about-us':
        return hasJsonContent(siteContexts.find(ctx => ctx.type === 'about-us')?.content);
      case 'leadership-team':
        return !!siteContexts.find(ctx => ctx.type === 'leadership-team')?.content;
      case 'faq':
        return !!siteContexts.find(ctx => ctx.type === 'faq')?.content;
      case 'contact-info':
        return hasJsonContent(siteContexts.find(ctx => ctx.type === 'contact-information')?.content);
      case 'site-elements':
        return !!(headerContext?.content || footerContext?.content || metaContext?.content || sitemapContext?.content);
      case 'header':
        return !!headerContext?.content;
      case 'footer':
        return !!footerContext?.content;
      case 'meta-tags':
        return !!metaContext?.content;
      case 'sitemap':
        return !!sitemapContext?.content;
      default:
        return false;
    }
  };

  // Red dot indicator component
  const RedDot = () => (
    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-auto" title="未填充"></span>
  );

  // Define navigation item types
  type NavChild = {
    label: string;
    ref: React.RefObject<HTMLDivElement | null>;
    checkKey?: string;
  };

  type NavGroup = {
    label: string;
    icon: React.ReactElement;
    checkKey?: string;
    ref?: React.RefObject<HTMLDivElement | null>;
    expanded?: boolean;
    setExpanded?: (value: boolean) => void;
    children?: NavChild[];
  };

  // Define navigation structure with expandable groups
  const navigationGroups: NavGroup[] = [
    {
      label: 'Brand Assets',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
      expanded: expandedNavBrandAssets,
      setExpanded: setExpandedNavBrandAssets,
      checkKey: 'brand-assets',
      children: [
        { label: 'Colors', ref: colorsRef, checkKey: 'colors' },
        { label: 'Typography', ref: typographyRef, checkKey: 'typography' },
        { label: 'Tone & Voice', ref: toneRef, checkKey: 'tone' },
        { label: 'Languages', ref: languagesRef, checkKey: 'languages' },
      ]
    },
    {
      label: 'Key Website Pages',
      ref: keyWebsitePagesRef,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      checkKey: 'key-pages',
    },
    {
      label: 'Landing Pages',
      ref: landingPagesRef,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></svg>,
      checkKey: 'landing-pages',
    },
    {
      label: 'Blog & Resources',
      ref: blogResourcesRef,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>,
      checkKey: 'blog-resources',
    },
    {
      label: 'Hero Section',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
      expanded: expandedNavHeroSection,
      setExpanded: setExpandedNavHeroSection,
      checkKey: 'hero-section',
      children: [
        { label: 'Headline', ref: heroSectionRef },
        { label: 'Subheadline', ref: heroSectionRef },
        { label: 'Call to Action', ref: heroSectionRef },
        { label: 'Media', ref: heroSectionRef },
        { label: 'Metrics', ref: heroSectionRef },
      ]
    },
    {
      label: 'Problem Statement',
      ref: problemStatementRef,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
      checkKey: 'problem-statement',
    },
    {
      label: 'Who We Serve',
      ref: whoWeServeRef,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
      checkKey: 'who-we-serve',
    },
    {
      label: 'Use Cases',
      ref: useCasesRef,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
      checkKey: 'use-cases',
    },
    {
      label: 'Industries',
      ref: industriesRef,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
      checkKey: 'industries',
    },
    {
      label: 'Products & Services',
      ref: productsServicesRef,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
      checkKey: 'products-services',
    },
    {
      label: 'Social Proof & Trust',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
      expanded: expandedNavSocialProof,
      setExpanded: setExpandedNavSocialProof,
      checkKey: 'social-proof',
      children: [
        { label: 'Testimonials', ref: socialProofRef },
        { label: 'Case Studies', ref: socialProofRef },
        { label: 'Badges', ref: socialProofRef },
        { label: 'Awards', ref: socialProofRef },
        { label: 'Guarantees', ref: socialProofRef },
        { label: 'Integrations', ref: socialProofRef },
      ]
    },
    {
      label: 'Leadership Team',
      ref: leadershipTeamRef,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>,
      checkKey: 'leadership-team',
    },
    {
      label: 'About Us',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
      expanded: expandedNavAboutUs,
      setExpanded: setExpandedNavAboutUs,
      checkKey: 'about-us',
      children: [
        { label: 'Company Story', ref: aboutUsRef },
        { label: 'Mission & Vision', ref: aboutUsRef },
        { label: 'Core Values', ref: aboutUsRef },
      ]
    },
    {
      label: 'FAQ',
      ref: faqRef,
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
      checkKey: 'faq',
    },
    {
      label: 'Contact Information',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>,
      expanded: expandedNavContactInfo,
      setExpanded: setExpandedNavContactInfo,
      checkKey: 'contact-info',
      children: [
        { label: 'Primary Contact', ref: contactInfoRef },
        { label: 'Location & Hours', ref: contactInfoRef },
        { label: 'Support Channels', ref: contactInfoRef },
        { label: 'Additional', ref: contactInfoRef },
      ]
    },
    {
      label: 'Site Elements',
      icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /></svg>,
      expanded: expandedNavSiteElements,
      setExpanded: setExpandedNavSiteElements,
      checkKey: 'site-elements',
      children: [
        { label: 'Header', ref: headerRef, checkKey: 'header' },
        { label: 'Footer', ref: footerRef, checkKey: 'footer' },
        { label: 'Meta Tags', ref: metaRef, checkKey: 'meta-tags' },
        { label: 'Sitemap', ref: sitemapRef, checkKey: 'sitemap' },
      ]
    },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#111827] mb-1">
                Context Wizard
              </h2>
              <p className="text-sm text-[#6B7280] leading-relaxed max-w-3xl">
                Define your brand identity, products, team, competitive positioning, and upload supporting knowledge to power smarter agent decisions.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#F3F4F6] rounded transition-colors ml-4 shrink-0"
            >
              <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E5E5] shrink-0 px-6">
          <button
            onClick={() => setActiveTab('onsite')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'onsite'
                ? 'text-[#111827]'
                : 'text-[#9CA3AF] hover:text-[#6B7280]'
            }`}
          >
            On Site
            {activeTab === 'onsite' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{
                  background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('offsite')}
            disabled
            className="px-4 py-3 text-sm font-medium text-[#9CA3AF] opacity-50 cursor-not-allowed relative"
          >
            Off Site
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-bold">Soon</span>
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            disabled
            className="px-4 py-3 text-sm font-medium text-[#9CA3AF] opacity-50 cursor-not-allowed relative"
          >
            Knowledge
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-bold">Soon</span>
          </button>
        </div>

        {/* Content with Navigation */}
        <div className="flex flex-1 min-h-0">
          {/* Left Navigation */}
          <div className="w-64 border-r border-[#E5E5E5] overflow-y-auto thin-scrollbar shrink-0">
            <div className="p-3 space-y-0.5">
              {navigationGroups.map((group, index) => (
                <div key={index}>
                  {group.children ? (
                    /* Expandable Group */
                    <div>
                      <button
                        onClick={() => group.setExpanded?.(!group.expanded)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-[#F3F4F6] font-medium text-[#374151]"
                      >
                        <svg 
                          className={`w-3 h-3 text-[#9CA3AF] transition-transform ${group.expanded ? 'rotate-90' : ''}`} 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                        {group.icon}
                        <span className="flex-1">{group.label}</span>
                        {group.checkKey && !hasContextValue(group.checkKey) && <RedDot />}
                      </button>
                      {group.expanded && (
                        <div className="ml-5 mt-0.5 space-y-0.5">
                          {group.children.map((child, childIndex) => (
                            <button
                              key={childIndex}
                              onClick={() => child.ref && scrollToSection(child.ref)}
                              className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left text-xs transition-colors hover:bg-[#F3F4F6] text-[#6B7280]"
                            >
                              <span className="flex-1">{child.label}</span>
                              {child.checkKey && !hasContextValue(child.checkKey) && <RedDot />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Non-expandable Item */
                    <button
                      onClick={() => group.ref && scrollToSection(group.ref)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-[#F3F4F6] font-medium text-[#374151]"
                    >
                      <div className="w-3 h-3" />
                      {group.icon}
                      <span className="flex-1">{group.label}</span>
                      {group.checkKey && !hasContextValue(group.checkKey) && <RedDot />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <form onSubmit={handleSaveAll} className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto p-6 thin-scrollbar">
              {activeTab === 'onsite' && (
                <div className="space-y-8 max-w-4xl">
                  {/* Brand Assets Section */}
                  <div ref={brandAssetsRef}>
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Brand Assets</h3>
                    </div>
                    
                    <div className="space-y-4 pl-7">
                      {/* Logo */}
                      <LogoEditor
                        logoUrl={userLogoUrl || undefined}
                        onLogoChange={handleLogoChange}
                      />

                      {/* Brand Name */}
                      <div>
                        <label className="block text-sm font-medium text-[#374151] mb-2">
                          Brand Name *
                        </label>
                        <input
                          type="text"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g., Pollo AI"
                          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent"
                        />
                      </div>

                      {/* Subtitle */}
                      <div>
                        <label className="block text-sm font-medium text-[#374151] mb-2">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={subtitle}
                          onChange={(e) => setSubtitle(e.target.value)}
                          placeholder="e.g., All-in-One AI Video & Image Generator"
                          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent"
                        />
                      </div>

                      {/* Meta Description */}
                      <div>
                        <label className="block text-sm font-medium text-[#374151] mb-2">
                          Meta Description
                        </label>
                        <textarea
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                          placeholder="e.g., Create stunning AI videos and images with Pollo AI - integrating Sora 2, Veo 3.1, Midjourney, and 10+ leading AI models into one powerful platform."
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent resize-none"
                        />
                      </div>

                      {/* Open Graph Image */}
                      <div>
                        <label className="block text-sm font-medium text-[#374151] mb-2">
                          Open Graph Image
                        </label>
                        <input
                          type="text"
                          value={ogImage}
                          onChange={(e) => setOgImage(e.target.value)}
                          placeholder="e.g., https://pollo.ai/og-image.jpg"
                          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent"
                        />
                      </div>

                      {/* Favicon */}
                      <div>
                        <label className="block text-sm font-medium text-[#374151] mb-2">
                          Favicon
                        </label>
                        <input
                          type="text"
                          value={favicon}
                          onChange={(e) => setFavicon(e.target.value)}
                          placeholder="e.g., https://pollo.ai/favicon.ico"
                          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent"
                        />
                      </div>

                      {/* Logo URLs */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-[#374151]">
                          Logo URL
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={logoLight}
                            onChange={(e) => setLogoLight(e.target.value)}
                            placeholder="Light theme logo (e.g., https://pollo.ai/logo-light.svg)"
                            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={logoDark}
                            onChange={(e) => setLogoDark(e.target.value)}
                            placeholder="Dark theme logo (e.g., https://pollo.ai/logo-dark.svg)"
                            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={iconLight}
                            onChange={(e) => setIconLight(e.target.value)}
                            placeholder="Light theme icon (e.g., https://pollo.ai/icon-light.svg)"
                            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={iconDark}
                            onChange={(e) => setIconDark(e.target.value)}
                            placeholder="Dark theme icon (e.g., https://pollo.ai/icon-dark.svg)"
                            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Colors & Typography - Two columns */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Colors */}
                        <div ref={colorsRef}>
                          <label className="block text-sm font-medium text-[#374151] mb-2">
                            Brand Colors
                          </label>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-[#6B7280] mb-1">Primary Color</label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  value={primaryColor}
                                  onChange={(e) => setPrimaryColor(e.target.value)}
                                  className="w-10 h-10 rounded border border-[#E5E5E5] cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={primaryColor}
                                  onChange={(e) => setPrimaryColor(e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] font-mono"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-[#6B7280] mb-1">Secondary Color</label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  value={secondaryColor}
                                  onChange={(e) => setSecondaryColor(e.target.value)}
                                  className="w-10 h-10 rounded border border-[#E5E5E5] cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={secondaryColor}
                                  onChange={(e) => setSecondaryColor(e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Typography */}
                        <div ref={typographyRef}>
                          <label className="block text-sm font-medium text-[#374151] mb-2">
                            Typography
                          </label>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-[#6B7280] mb-1">Heading Font</label>
                              <input
                                type="text"
                                value={typography}
                                onChange={(e) => setTypography(e.target.value)}
                                placeholder="e.g., Inter"
                                className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[#6B7280] mb-1">Body Font</label>
                              <input
                                type="text"
                                placeholder="e.g., Roboto"
                                className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tone & Voice */}
                      <div ref={toneRef}>
                        <label className="block text-sm font-medium text-[#374151] mb-2">
                          Tone & Voice
                        </label>
                        <textarea
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          placeholder="e.g., Professional, friendly, conversational, technical..."
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent resize-none"
                        />
                      </div>

                      {/* Languages */}
                      <div ref={languagesRef}>
                        <label className="block text-sm font-medium text-[#374151] mb-2">
                          Languages
                        </label>
                        <input
                          type="text"
                          value={languages}
                          onChange={(e) => setLanguages(e.target.value)}
                          placeholder="e.g., English, Chinese, Spanish"
                          className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AD6FF] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Site Elements Section */}
                  <div className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Site Elements</h3>
                    </div>
                    
                    <div className="space-y-6 pl-7">
                      {/* Header */}
                      <div ref={headerRef}>
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Header</h4>
                        </div>
                        <HeaderEditor
                          logoUrl={userLogoUrl || undefined}
                          onConfigChange={setHeaderConfig}
                        />
                      </div>

                      {/* Footer */}
                      <div ref={footerRef} className="border-t border-[#E5E5E5] pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="15" x2="21" y2="15" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Footer</h4>
                        </div>
                        <FooterEditor
                          logoUrl={userLogoUrl || undefined}
                          onConfigChange={setFooterConfig}
                        />
                      </div>

                      {/* Meta Tags */}
                      <div ref={metaRef} className="border-t border-[#E5E5E5] pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Meta Tags</h4>
                        </div>
                        <MetaEditor
                          initialContent={metaContext?.content || undefined}
                          onContentChange={setMetaContent}
                        />
                      </div>

                      {/* Sitemap */}
                      <div ref={sitemapRef} className="border-t border-[#E5E5E5] pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18" />
                            <path d="M18 17V9" />
                            <path d="M13 17V5" />
                            <path d="M8 17v-3" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Sitemap</h4>
                        </div>
                        <SitemapViewer content={sitemapContext?.content || undefined} />
                      </div>
                    </div>
                  </div>

                  {/* Key Website Pages */}
                  <div ref={keyWebsitePagesRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Key Website Pages</h3>
                    </div>
                    <div className="pl-7">
                      <TextContentEditor
                        initialContent={keyWebsitePagesContext?.content || undefined}
                        onContentChange={setKeyWebsitePagesContent}
                        placeholder="List your key website pages (e.g., Home, About, Products, Services, Contact)"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Landing Pages */}
                  <div ref={landingPagesRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 3v18" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Landing Pages</h3>
                    </div>
                    <div className="pl-7">
                      <TextContentEditor
                        initialContent={landingPagesContext?.content || undefined}
                        onContentChange={setLandingPagesContent}
                        placeholder="Describe your landing pages and their purposes"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Blog & Resources */}
                  <div ref={blogResourcesRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Blog & Resources</h3>
                    </div>
                    <div className="pl-7">
                      <TextContentEditor
                        initialContent={blogResourcesContext?.content || undefined}
                        onContentChange={setBlogResourcesContent}
                        placeholder="Blog categories, resource types, content themes"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Hero Section */}
                  <div ref={heroSectionRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Hero Section</h3>
                    </div>
                    <div className="pl-7">
                      <HeroSectionEditor
                        initialContent={heroSectionContext?.content || undefined}
                        onContentChange={setHeroSectionContent}
                      />
                    </div>
                  </div>

                  {/* Problem Statement */}
                  <div ref={problemStatementRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Problem Statement</h3>
                    </div>
                    <div className="pl-7">
                      <TextContentEditor
                        initialContent={problemStatementContext?.content || undefined}
                        onContentChange={setProblemStatementContent}
                        placeholder="What problem does your product/service solve?"
                        rows={5}
                      />
                    </div>
                  </div>

                  {/* Who We Serve */}
                  <div ref={whoWeServeRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Who We Serve</h3>
                    </div>
                    <div className="pl-7">
                      <TextContentEditor
                        initialContent={whoWeServeContext?.content || undefined}
                        onContentChange={setWhoWeServeContent}
                        placeholder="Target audience, customer personas, ideal customers"
                        rows={5}
                      />
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div ref={useCasesRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Use Cases</h3>
                    </div>
                    <div className="pl-7">
                      <TextContentEditor
                        initialContent={useCasesContext?.content || undefined}
                        onContentChange={setUseCasesContent}
                        placeholder="Common use cases and application scenarios"
                        rows={5}
                      />
                    </div>
                  </div>

                  {/* Industries */}
                  <div ref={industriesRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Industries</h3>
                    </div>
                    <div className="pl-7">
                      <TextContentEditor
                        initialContent={industriesContext?.content || undefined}
                        onContentChange={setIndustriesContent}
                        placeholder="Industries you serve (e.g., Healthcare, Finance, E-commerce)"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Products & Services */}
                  <div ref={productsServicesRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Products & Services</h3>
                    </div>
                    <div className="pl-7">
                      <TextContentEditor
                        initialContent={productsServicesContext?.content || undefined}
                        onContentChange={setProductsServicesContent}
                        placeholder="Describe your products and services offerings"
                        rows={6}
                      />
                    </div>
                  </div>

                  {/* Social Proof & Trust */}
                  <div ref={socialProofRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Social Proof & Trust</h3>
                    </div>
                    <div className="pl-7">
                      <SocialProofEditor
                        initialContent={socialProofContext?.content || undefined}
                        onContentChange={setSocialProofContent}
                      />
                    </div>
                  </div>

                  {/* Leadership Team */}
                  <div ref={leadershipTeamRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <polyline points="17 11 19 13 23 9" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Leadership Team</h3>
                    </div>
                    <div className="pl-7">
                      <TextContentEditor
                        initialContent={leadershipTeamContext?.content || undefined}
                        onContentChange={setLeadershipTeamContent}
                        placeholder="Key team members, executives, advisors"
                        rows={5}
                      />
                    </div>
                  </div>

                  {/* About Us */}
                  <div ref={aboutUsRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">About Us</h3>
                    </div>
                    <div className="pl-7">
                      <AboutUsEditor
                        initialContent={aboutUsContext?.content || undefined}
                        onContentChange={setAboutUsContent}
                      />
                    </div>
                  </div>

                  {/* FAQ */}
                  <div ref={faqRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">FAQ</h3>
                    </div>
                    <div className="pl-7">
                      <TextContentEditor
                        initialContent={faqContext?.content || undefined}
                        onContentChange={setFaqContent}
                        placeholder="Common questions and answers about your product/service"
                        rows={6}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div ref={contactInfoRef} className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Contact Information</h3>
                    </div>
                    <div className="pl-7">
                      <ContactInformationEditor
                        initialContent={contactInfoContext?.content || undefined}
                        onContentChange={setContactInfoContent}
                      />
                    </div>
                  </div>

                  {/* Site Elements Section */}
                  <div className="border-t border-[#E5E5E5] pt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                      </svg>
                      <h3 className="text-base font-bold text-[#111827]">Site Elements</h3>
                    </div>
                    
                    <div className="space-y-6 pl-7">
                      {/* Header */}
                      <div ref={headerRef}>
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Header</h4>
                        </div>
                        <HeaderEditor
                          logoUrl={userLogoUrl || undefined}
                          onConfigChange={setHeaderConfig}
                        />
                      </div>

                      {/* Footer */}
                      <div ref={footerRef} className="border-t border-[#E5E5E5] pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="15" x2="21" y2="15" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Footer</h4>
                        </div>
                        <FooterEditor
                          logoUrl={userLogoUrl || undefined}
                          onConfigChange={setFooterConfig}
                        />
                      </div>

                      {/* Meta Tags */}
                      <div ref={metaRef} className="border-t border-[#E5E5E5] pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Meta Tags</h4>
                        </div>
                        <MetaEditor
                          initialContent={metaContext?.content || undefined}
                          onContentChange={setMetaContent}
                        />
                      </div>

                      {/* Sitemap */}
                      <div ref={sitemapRef} className="border-t border-[#E5E5E5] pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18" />
                            <path d="M18 17V9" />
                            <path d="M13 17V5" />
                            <path d="M8 17v-3" />
                          </svg>
                          <h4 className="text-sm font-semibold text-[#374151]">Sitemap</h4>
                        </div>
                        <SitemapViewer content={sitemapContext?.content || undefined} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'offsite' && (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-[#9CA3AF] italic">Off Site features coming soon</p>
                </div>
              )}

              {activeTab === 'knowledge' && (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-[#9CA3AF] italic">Knowledge base features coming soon</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
