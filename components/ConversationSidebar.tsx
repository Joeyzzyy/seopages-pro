'use client';

import { useState, useEffect } from 'react';
import type { SiteContext, ContentItem, ContentProject } from '@/lib/supabase';
import TasksPanel from './TasksPanel';

interface TaskStep {
  step_number: number;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface ConversationSidebarProps {
  siteContexts: SiteContext[];
  contentItems: ContentItem[];
  contentProjects: ContentProject[];
  onEditSiteContext: (type: 'logo' | 'header' | 'footer' | 'meta' | 'sitemap') => void;
  onSelectContentItem: (item: ContentItem) => void;
  onRefreshContent: () => void;
  onDeleteProject: (projectId: string, projectName: string) => void;
  onDeleteContentItem: (itemId: string, itemTitle: string) => void;
  onOpenContextModal?: () => void;
  conversationId?: string;
  currentTasks?: TaskStep[];
}

export default function ConversationSidebar({
  siteContexts,
  contentItems,
  contentProjects,
  onEditSiteContext,
  onSelectContentItem,
  onRefreshContent,
  onDeleteProject,
  onDeleteContentItem,
  onOpenContextModal,
  conversationId,
  currentTasks = [],
}: ConversationSidebarProps) {
  // Group items by project first
  const groupedContent = contentProjects.map(project => ({
    ...project,
    items: contentItems.filter(item => item.project_id === project.id)
  }));

  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'project' | 'item';
    id: string;
    name: string;
    itemCount?: number;
  } | null>(null);
  const [expandedOnSite, setExpandedOnSite] = useState(true);
  const [expandedBrandAssets, setExpandedBrandAssets] = useState(true);
  const [expandedMetaInfo, setExpandedMetaInfo] = useState(true);
  const [expandedHeroSection, setExpandedHeroSection] = useState(false);
  const [expandedSocialProof, setExpandedSocialProof] = useState(false);
  const [expandedAboutUs, setExpandedAboutUs] = useState(false);
  const [expandedContactInfo, setExpandedContactInfo] = useState(false);

  // Auto-expand first project when content loads
  useEffect(() => {
    if (groupedContent.length > 0 && Object.keys(expandedClusters).length === 0) {
      setExpandedClusters({ [groupedContent[0].id]: true });
    }
  }, [groupedContent.length]);

  const sidebarWidth = 'w-72';

  const toggleCluster = (projectId: string) => {
    setExpandedClusters(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Items without a project (Uncategorized)
  const uncategorizedItems = contentItems.filter(item => !item.project_id);

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
      case 'meta-info':
        return !!(logoContext?.brand_name || logoContext?.subtitle || logoContext?.meta_description);
      case 'logo':
        return !!(logoContext?.file_url || logoContext?.logo_light || logoContext?.logo_dark);
      case 'colors':
        return !!(logoContext?.primary_color || logoContext?.secondary_color);
      case 'typography':
        return !!(logoContext?.heading_font || logoContext?.body_font);
      case 'tone':
        return !!logoContext?.tone;
      case 'languages':
        return !!logoContext?.languages;
      case 'header':
        return !!headerContext?.content;
      case 'footer':
        return !!footerContext?.content;
      case 'meta-tags':
        return !!metaContext?.content;
      case 'sitemap':
        return !!sitemapContext?.content;
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
      case 'key-pages':
        return !!siteContexts.find(ctx => ctx.type === 'key-website-pages')?.content;
      case 'landing-pages':
        return !!siteContexts.find(ctx => ctx.type === 'landing-pages')?.content;
      case 'blog-resources':
        return !!siteContexts.find(ctx => ctx.type === 'blog-resources')?.content;
      default:
        return false;
    }
  };

  // Red dot indicator component
  const RedDot = () => (
    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full ml-1" title="未填充"></span>
  );

  const getStatusStyle = (status: string): React.CSSProperties => {
    if (status === 'ready') {
      return {
        background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      };
    }
    if (status === 'generated') {
      return {
        background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      };
    }
    switch (status) {
      case 'in_production': return { color: '#F59E0B' };
      case 'published': return { color: '#10B981' };
      default: return { color: '#9CA3AF' };
    }
  };

  const handleProjectContextMenu = (e: React.MouseEvent, project: ContentProject) => {
    e.preventDefault();
    e.stopPropagation();
    const itemCount = contentItems.filter(item => item.project_id === project.id).length;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'project',
      id: project.id,
      name: project.name,
      itemCount,
    });
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: ContentItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'item',
      id: item.id,
      name: item.title,
    });
  };

  const handleContextMenuAction = (action: 'delete') => {
    if (!contextMenu) return;
    
    if (action === 'delete') {
      if (contextMenu.type === 'project') {
        onDeleteProject(contextMenu.id, contextMenu.name);
      } else {
        onDeleteContentItem(contextMenu.id, contextMenu.name);
      }
    }
    setContextMenu(null);
  };

  return (
    <aside className={`${sidebarWidth} bg-white border border-[#E5E5E5] rounded-lg shadow-sm flex flex-col h-full overflow-hidden`} onClick={() => setContextMenu(null)}>
      
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Context Section (Top 1/3) */}
        <div className="flex flex-col h-1/3 min-h-0 border-b border-[#E5E5E5]">
          <div className="px-4 py-1.5 text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center justify-between shrink-0 border-b border-[#E5E5E5] h-10">
            <span>Context</span>
            <button
              onClick={() => onOpenContextModal?.()}
              className="p-1 rounded hover:bg-white text-[#6B7280] hover:text-[#111827] transition-all"
              title="Add Context"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar px-2 pb-2 pt-2">
            <div className="space-y-0">
              {/* On Site - Expandable */}
              <div>
                <button
                  onClick={() => setExpandedOnSite(!expandedOnSite)}
                  className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-[#F3F4F6] transition-all text-left group"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <svg 
                      className={`w-3 h-3 text-[#9CA3AF] transition-transform ${expandedOnSite ? 'rotate-90' : ''}`} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                    <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="text-xs font-medium text-[#374151]">On Site</span>
                  </div>
                </button>

                {/* On Site Sub-items */}
                {expandedOnSite && (
                  <div className="ml-5 mt-0.5 space-y-0">
                    {/* Brand Assets - Expandable */}
                    <div>
                      <button
                        onClick={() => setExpandedBrandAssets(!expandedBrandAssets)}
                        className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                      >
                        <svg 
                          className={`w-2.5 h-2.5 text-[#9CA3AF] transition-transform ${expandedBrandAssets ? 'rotate-90' : ''}`} 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                          Brand Assets
                        </span>
                      </button>
                      
                      {expandedBrandAssets && (
                        <div className="ml-4 mt-0 space-y-0">
                          {/* Meta Info */}
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full flex items-center px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            <span>Meta Info</span>
                            {!hasContextValue('meta-info') && <RedDot />}
                          </button>
                          
                          {/* Logo URL */}
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full flex items-center px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            <span>Logo URL</span>
                            {!hasContextValue('logo') && <RedDot />}
                          </button>
                          
                          {/* Colors */}
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full flex items-center px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            <span>Colors</span>
                            {!hasContextValue('colors') && <RedDot />}
                          </button>
                          
                          {/* Typography */}
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full flex items-center px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            <span>Typography</span>
                            {!hasContextValue('typography') && <RedDot />}
                          </button>
                          
                          {/* Tone */}
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full flex items-center px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            <span>Tone</span>
                            {!hasContextValue('tone') && <RedDot />}
                          </button>
                          
                          {/* Languages */}
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full flex items-center px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            <span>Languages</span>
                            {!hasContextValue('languages') && <RedDot />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Site Elements */}
                    <div>
                      <button
                        onClick={() => setExpandedMetaInfo(!expandedMetaInfo)}
                        className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                      >
                        <svg 
                          className={`w-2.5 h-2.5 text-[#9CA3AF] transition-transform ${expandedMetaInfo ? 'rotate-90' : ''}`} 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                          Site Elements
                        </span>
                      </button>
                      
                      {expandedMetaInfo && (
                        <div className="ml-4 mt-0 space-y-0">
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full flex items-center px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            <span>Header</span>
                            {!hasContextValue('header') && <RedDot />}
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full flex items-center px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            <span>Footer</span>
                            {!hasContextValue('footer') && <RedDot />}
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full flex items-center px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            <span>Meta Tags</span>
                            {!hasContextValue('meta-tags') && <RedDot />}
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full flex items-center px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            <span>Sitemap</span>
                            {!hasContextValue('sitemap') && <RedDot />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Key Website Pages */}
                    <button
                      onClick={() => onOpenContextModal?.()}
                      className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                    >
                      <div className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        Key Pages
                      </span>
                      {!hasContextValue('key-pages') && <RedDot />}
                    </button>

                    {/* Landing Pages */}
                    <button
                      onClick={() => onOpenContextModal?.()}
                      className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                    >
                      <div className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        Landing Pages
                      </span>
                      {!hasContextValue('landing-pages') && <RedDot />}
                    </button>

                    {/* Blog & Resources */}
                    <button
                      onClick={() => onOpenContextModal?.()}
                      className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                    >
                      <div className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        Blog & Resources
                      </span>
                      {!hasContextValue('blog-resources') && <RedDot />}
                    </button>

                    {/* Hero Section - Expandable */}
                    <div>
                      <button
                        onClick={() => setExpandedHeroSection(!expandedHeroSection)}
                        className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                      >
                        <svg 
                          className={`w-2.5 h-2.5 text-[#9CA3AF] transition-transform ${expandedHeroSection ? 'rotate-90' : ''}`} 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                          Hero Section
                        </span>
                        {!hasContextValue('hero-section') && <RedDot />}
                      </button>
                      
                      {expandedHeroSection && (
                        <div className="ml-4 mt-0 space-y-0">
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Headline
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Subheadline
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Call to Action
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Media
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Metrics
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Problem Statement */}
                    <button
                      onClick={() => onOpenContextModal?.()}
                      className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                    >
                      <div className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        Problem Statement
                      </span>
                      {!hasContextValue('problem-statement') && <RedDot />}
                    </button>

                    {/* Who We Serve */}
                    <button
                      onClick={() => onOpenContextModal?.()}
                      className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                    >
                      <div className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        Who We Serve
                      </span>
                      {!hasContextValue('who-we-serve') && <RedDot />}
                    </button>

                    {/* Use Cases */}
                    <button
                      onClick={() => onOpenContextModal?.()}
                      className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                    >
                      <div className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        Use Cases
                      </span>
                      {!hasContextValue('use-cases') && <RedDot />}
                    </button>

                    {/* Industries */}
                    <button
                      onClick={() => onOpenContextModal?.()}
                      className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                    >
                      <div className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        Industries
                      </span>
                      {!hasContextValue('industries') && <RedDot />}
                    </button>

                    {/* Products & Services */}
                    <button
                      onClick={() => onOpenContextModal?.()}
                      className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                    >
                      <div className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        Products & Services
                      </span>
                      {!hasContextValue('products-services') && <RedDot />}
                    </button>

                    {/* Social Proof & Trust - Expandable */}
                    <div>
                      <button
                        onClick={() => setExpandedSocialProof(!expandedSocialProof)}
                        className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                      >
                        <svg 
                          className={`w-2.5 h-2.5 text-[#9CA3AF] transition-transform ${expandedSocialProof ? 'rotate-90' : ''}`} 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                          Social Proof
                        </span>
                        {!hasContextValue('social-proof') && <RedDot />}
                      </button>
                      
                      {expandedSocialProof && (
                        <div className="ml-4 mt-0 space-y-0">
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Testimonials
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Case Studies
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Badges
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Awards
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Guarantees
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Integrations
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Leadership Team */}
                    <button
                      onClick={() => onOpenContextModal?.()}
                      className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                    >
                      <div className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        Leadership Team
                      </span>
                      {!hasContextValue('leadership-team') && <RedDot />}
                    </button>

                    {/* About Us - Expandable */}
                    <div>
                      <button
                        onClick={() => setExpandedAboutUs(!expandedAboutUs)}
                        className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                      >
                        <svg 
                          className={`w-2.5 h-2.5 text-[#9CA3AF] transition-transform ${expandedAboutUs ? 'rotate-90' : ''}`} 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                          About Us
                        </span>
                        {!hasContextValue('about-us') && <RedDot />}
                      </button>
                      
                      {expandedAboutUs && (
                        <div className="ml-4 mt-0 space-y-0">
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Company Story
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Mission & Vision
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Core Values
                          </button>
                        </div>
                      )}
                    </div>

                    {/* FAQ */}
                    <button
                      onClick={() => onOpenContextModal?.()}
                      className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                    >
                      <div className="w-2.5 h-2.5" />
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                        FAQ
                      </span>
                      {!hasContextValue('faq') && <RedDot />}
                    </button>

                    {/* Contact Information - Expandable */}
                    <div>
                      <button
                        onClick={() => setExpandedContactInfo(!expandedContactInfo)}
                        className="w-full flex items-center gap-2 px-2 py-0.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left"
                      >
                        <svg 
                          className={`w-2.5 h-2.5 text-[#9CA3AF] transition-transform ${expandedContactInfo ? 'rotate-90' : ''}`} 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                          Contact Info
                        </span>
                        {!hasContextValue('contact-info') && <RedDot />}
                      </button>
                      
                      {expandedContactInfo && (
                        <div className="ml-4 mt-0 space-y-0">
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Primary Contact
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Location & Hours
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Support Channels
                          </button>
                          <button
                            onClick={() => onOpenContextModal?.()}
                            className="w-full px-2 py-0.5 rounded-lg text-left text-[11px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                          >
                            Additional
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Off Site */}
              <button
                disabled
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left group opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-2 flex-1">
                  <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="text-xs font-medium text-[#374151]">Off Site</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-bold">Soon</span>
              </button>

              {/* Knowledge */}
              <button
                disabled
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left group opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-2 flex-1">
                  <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span className="text-xs font-medium text-[#374151]">Knowledge</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-bold">Soon</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page Blueprint Section (Middle 1/3) */}
        <div className="flex flex-col h-1/3 min-h-0 border-b border-[#E5E5E5]">
          <div className="px-4 py-1.5 text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center justify-between shrink-0 border-b border-[#E5E5E5] h-10">
            <div className="flex items-center gap-2">
              <span>Page Blueprint</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRefreshContent();
                }}
                className="p-0.5 rounded hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer"
                title="Refresh Content"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </button>
            </div>
            <span className="bg-[#F3F4F6] text-[#6B7280] px-1.5 py-0.5 rounded text-[11px] font-medium">
              {contentItems.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar px-2 pb-2">
            {contentItems.length === 0 && contentProjects.length === 0 ? (
              <div className="px-3 py-4 text-[11px] text-[#9CA3AF] italic text-center">
                No page blueprints yet
              </div>
            ) : (
              <div className="space-y-1">
                {/* Topic Clusters (Projects) */}
                {groupedContent.map((cluster) => (
                  <div key={cluster.id} className="space-y-0.5">
                    <button
                      onClick={() => toggleCluster(cluster.id)}
                      onContextMenu={(e) => handleProjectContextMenu(e, cluster)}
                      className="w-full flex items-center gap-1.5 p-1 rounded hover:bg-[#F3F4F6] transition-all cursor-pointer group"
                    >
                      <span className={`text-[10px] text-[#D1D5DB] transition-transform ${expandedClusters[cluster.id] ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      <span className="flex-1 text-[11px] font-bold text-[#4B5563] truncate text-left uppercase tracking-tight">
                        {cluster.name}
                      </span>
                    </button>
                    
                    {expandedClusters[cluster.id] && (
                      <div className="pl-2 ml-2 space-y-0.5">
                        {cluster.items.map((item) => {
                          const isGenerated = item.status === 'generated' || !!item.generated_content;
                          return (
                          <div key={item.id} className="group relative flex items-center gap-2 p-1 rounded hover:bg-[#F3F4F6] transition-all text-left">
                            <button
                              onClick={() => onSelectContentItem(item)}
                              onContextMenu={(e) => handleItemContextMenu(e, item)}
                              className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
                            >
                              {isGenerated ? (
                                <svg className="w-3.5 h-3.5 text-[#10B981] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                  <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-[#D1D5DB] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                  <polyline points="13 2 13 9 20 9" />
                                </svg>
                              )}
                              <span className="flex-1 text-[11px] text-[#374151] truncate">
                                {item.title}
                              </span>
                            </button>
                            
                            {/* Live Preview Link for Generated Pages */}
                            {isGenerated && (
                              <a
                                href={`/api/preview/${item.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all shrink-0 cursor-pointer"
                                title="View Live Page"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg className="w-3 h-3 text-[#9A8FEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 8" />
                                  <line x1="10" y1="11" x2="21" y2="3" />
                                </svg>
                              </a>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Uncategorized Items */}
                {uncategorizedItems.map((item) => {
                  const isGenerated = item.status === 'generated' || !!item.generated_content;
                  return (
                  <div key={item.id} className="group relative flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F3F4F6] transition-all text-left">
                    <button
                      onClick={() => onSelectContentItem(item)}
                      onContextMenu={(e) => handleItemContextMenu(e, item)}
                      className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
                    >
                      {isGenerated ? (
                        <svg className="w-3.5 h-3.5 text-[#10B981] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-[#D1D5DB] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                      )}
                      <span className="flex-1 text-[11px] text-[#374151] truncate">
                        {item.title}
                      </span>
                    </button>
                    
                    {/* Live Preview Link for Generated Pages */}
                    {isGenerated && (
                      <a
                        href={`/api/preview/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all shrink-0 cursor-pointer"
                        title="View Live Page"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3 text-[#9A8FEA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 8" />
                          <line x1="10" y1="11" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tasks Section (Bottom 1/3) */}
        <div className="flex flex-col h-1/3 min-h-0">
          <div className="px-4 py-1.5 text-xs font-bold text-[#111827] uppercase tracking-wider shrink-0 border-b border-[#E5E5E5] h-10 flex items-center">
            Tasks
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar px-2 pb-2 pt-2">
            <TasksPanel 
              conversationId={conversationId}
              tasks={currentTasks}
            />
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Invisible overlay to catch clicks */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed bg-white border border-[#E5E5E5] rounded-md shadow-lg py-0.5 z-50 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleContextMenuAction('delete')}
              className="w-full px-3 py-1.5 text-left text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>
                {contextMenu.type === 'project' 
                  ? `Delete Project${contextMenu.itemCount && contextMenu.itemCount > 0 ? ` (${contextMenu.itemCount})` : ''}`
                  : 'Delete'
                }
              </span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
