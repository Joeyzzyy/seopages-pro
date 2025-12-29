'use client';

import { useState, useEffect } from 'react';
import type { ContentItem } from '@/lib/supabase';
import Toast from './Toast';

interface ContentDrawerProps {
  item: ContentItem | null;
  onClose: () => void;
}

export default function ContentDrawer({ item, onClose }: ContentDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'details'>('preview');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [toast, setToast] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Determine if this is a generated page (wide mode)
  const hasGeneratedContent = !!item?.generated_content;

  useEffect(() => {
    if (item) {
      setIsVisible(true);
      // Automatically select tab based on content status
      if (item.generated_content) {
        setActiveTab('preview');
      } else {
        setActiveTab('details');
      }
    } else {
      setIsVisible(false);
    }
  }, [item]);

  if (!item && !isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-all duration-500 z-[100] ${
          item ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer - Full screen for generated content, narrow for info-only */}
      <div 
        className={`fixed right-0 top-0 h-full bg-white shadow-[-20px_0_50px_-12px_rgba(0,0,0,0.15)] z-[101] transform transition-all duration-500 flex flex-col ${
          item ? 'translate-x-0' : 'translate-x-full'
        } ${hasGeneratedContent ? 'w-screen' : 'w-full max-w-lg rounded-l-2xl'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        {/* Header - Only show tabs when there's generated content */}
        <div className={`flex items-center bg-white sticky top-0 z-10 px-4 shrink-0 ${hasGeneratedContent ? 'border-b border-[#F5F5F5]' : ''}`}>
          {/* Tabs - Only show when there's generated content */}
          {hasGeneratedContent && (
            <div className="flex gap-1 flex-1 items-center">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'preview'
                    ? 'text-[#111827]'
                    : 'text-[#9CA3AF] hover:text-[#6B7280]'
                }`}
              >
                Preview
                {activeTab === 'preview' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(80deg, #FFAF40 -21.49%, #D194EC 18.44%, #9A8FEA 61.08%, #65B4FF 107.78%)' }} />
                )}
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'code'
                    ? 'text-[#111827]'
                    : 'text-[#9CA3AF] hover:text-[#6B7280]'
                }`}
              >
                Code
                {activeTab === 'code' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(80deg, #FFAF40 -21.49%, #D194EC 18.44%, #9A8FEA 61.08%, #65B4FF 107.78%)' }} />
                )}
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'details'
                    ? 'text-[#111827]'
                    : 'text-[#9CA3AF] hover:text-[#6B7280]'
                }`}
              >
                Info
                {activeTab === 'details' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(80deg, #FFAF40 -21.49%, #D194EC 18.44%, #9A8FEA 61.08%, #65B4FF 107.78%)' }} />
                )}
              </button>

              {/* View Mode Switcher - Only in Preview Tab */}
              {activeTab === 'preview' && (
                <div className="ml-8 flex items-center bg-[#F3F4F6] p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('desktop')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                      viewMode === 'desktop' 
                        ? 'bg-white text-[#111827] shadow-sm' 
                        : 'text-[#9CA3AF] hover:text-[#6B7280]'
                    }`}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    PC
                  </button>
                  <button
                    onClick={() => setViewMode('mobile')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                      viewMode === 'mobile' 
                        ? 'bg-white text-[#111827] shadow-sm' 
                        : 'text-[#9CA3AF] hover:text-[#6B7280]'
                    }`}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="12" y1="18" x2="12" y2="18.01" />
                    </svg>
                    MOBILE
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Title and close button - expand to fill when no tabs */}
          <div className={`flex items-center gap-4 ${hasGeneratedContent ? 'px-4 border-l border-[#F5F5F5]' : 'flex-1'} my-2`}>
            <div className="flex flex-col min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[#111827] truncate mb-0.5 leading-none">{item?.title}</h2>
              <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF] font-medium whitespace-nowrap">
                <span className="bg-[#F3F4F6] px-1.5 py-0.5 rounded-md uppercase tracking-wider text-[#6B7280] border border-[#E5E5E5]">{item?.page_type || 'blog'}</span>
                <span>•</span>
                <span>Created {item?.created_at ? new Date(item.created_at).toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : '-'}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#6B7280]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Preview Tab Content */}
          {activeTab === 'preview' && (
            <div className="flex-1 flex flex-col bg-[#F9FAFB] p-4 md:p-6 overflow-hidden">
              {/* Browser Window Mockup */}
              <div className={`flex-1 bg-white border border-[#E5E5E5] overflow-hidden shadow-2xl flex flex-col transition-all duration-500 ease-in-out ${
                viewMode === 'mobile' 
                  ? 'max-w-[560px] mx-auto rounded-[3.5rem] border-[12px] border-[#111827] ring-4 ring-[#E5E5E5]' 
                  : 'w-full rounded-xl'
              }`}>
                {/* Browser Header - Only show in desktop mode */}
                {viewMode === 'desktop' && (
                  <div className="bg-[#F3F4F6] border-b border-[#E5E5E5] px-4 py-2 flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E5E5E5]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF]"></div>
                  </div>
                    <div className="flex-1 bg-white border border-[#D1D5DB] rounded-md px-3 py-1 flex items-center justify-between">
                      <span className="text-[11px] text-[#9CA3AF] font-mono truncate uppercase tracking-tighter">
                        {typeof window !== 'undefined' ? window.location.origin.replace(/^https?:\/\//, '') : 'seenos.ai'}/p/{item?.slug || item?.id?.slice(0, 8)}
                      </span>
                      <button 
                        onClick={() => {
                          if (item?.id) {
                            window.open(`/api/preview/${item.id}`, '_blank');
                          }
                        }}
                        className="p-1 hover:bg-[#F3F4F6] rounded text-[#9CA3AF] hover:text-[#111827] transition-all active:scale-90"
                        title="Open Live Preview"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile Notch - Only show in mobile mode */}
                {viewMode === 'mobile' && (
                  <div className="h-6 bg-[#111827] flex items-center justify-center shrink-0">
                    <div className="w-20 h-4 bg-black rounded-b-xl"></div>
                  </div>
                )}

                {/* Browser Content */}
                <div className="flex-1 bg-white overflow-hidden relative">
                  {!item?.generated_content ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAFAFA]">
                      <svg className="w-12 h-12 text-[#E5E5E5] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z" />
                        <path d="M12 9v6m-3-3h6" />
                      </svg>
                      <p className="text-sm font-medium text-[#9CA3AF]">No generated content available for this item</p>
                    </div>
                  ) : (
                    <iframe 
                      srcDoc={item.generated_content}
                      className="w-full h-full border-none"
                      title="Page Preview"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                {/* Mobile Home Bar - Only show in mobile mode */}
                {viewMode === 'mobile' && (
                  <div className="h-6 bg-[#111827] flex items-center justify-center shrink-0">
                    <div className="w-24 h-1 bg-white/20 rounded-full mb-1"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Code Tab Content */}
          {activeTab === 'code' && (
            <div className="flex-1 bg-[#1E1E1E] flex flex-col overflow-hidden">
              <div className="bg-[#2D2D2D] px-6 py-3 flex items-center justify-between border-b border-[#3D3D3D] shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-[0.2em]">HTML Source Code</span>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(item?.generated_content || '');
                    setToast({ isOpen: true, message: 'Code copied to clipboard!' });
                  }}
                  className="px-3 py-1.5 bg-[#3D3D3D] hover:bg-[#4D4D4D] text-white text-[10px] font-bold rounded-md transition-all active:scale-95 uppercase tracking-wider"
                >
                  Copy to Clipboard
                </button>
              </div>
              <div className="flex-1 p-6 overflow-auto thin-scrollbar font-mono">
                {!item?.generated_content ? (
                  <p className="text-[#6B7280] italic text-sm">No code available</p>
                ) : (
                  <pre className="text-[#D4D4D4] text-xs leading-[1.8] whitespace-pre-wrap break-all">
                    {item.generated_content}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Info Tab Content (Details renamed) */}
          {activeTab === 'details' && (
            <div className="flex-1 overflow-y-auto thin-scrollbar bg-[#FAFAFA]">
              <div className={`mx-auto p-6 space-y-8 ${hasGeneratedContent ? 'max-w-5xl md:p-10 md:space-y-10' : 'max-w-lg'}`}>
                {/* Info Tab Content */}
                <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#111827] mb-2">{item?.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="px-2.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded-full font-medium uppercase text-[10px] tracking-wider border border-[#E5E5E5]">
                        {item?.page_type || 'blog'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-medium uppercase text-[10px] tracking-wider border ${
                        item?.status === 'ready' ? 'bg-[#F3F4F6] text-[#374151] border-[#E5E5E5]' :
                        item?.status === 'in_production' ? 'bg-[#111827] text-white border-[#111827]' :
                        item?.status === 'generated' ? 'bg-[#FAFAFA] text-[#111827] border-[#E5E5E5]' :
                        item?.status === 'published' ? 'bg-white text-[#111827] border-[#111827]' :
                        'bg-gray-50 text-gray-600 border-gray-100'
                      }`}>
                        {item?.status === 'ready' ? 'Ready' : 
                         item?.status === 'generated' ? 'Generated' : 
                         item?.status === 'in_production' ? 'Production' :
                         item?.status === 'published' ? 'Published' :
                         item?.status}
                      </span>
                      <span className="text-[#D1D5DB]">|</span>
                      <span className="text-[#6B7280]">
                        Created: <span className="text-[#111827] font-medium">{new Date(item?.created_at || '').toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Priority Display */}
                  <div className="bg-[#F9FAFB] px-4 py-3 rounded-xl border border-[#F0F0F0] shrink-0">
                    <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase mb-1.5 tracking-wider">Priority Level</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((p) => (
                        <div 
                          key={p}
                          className={`w-5 h-1.5 rounded-full transition-colors ${
                            p <= (item?.priority || 0) 
                              ? (item?.priority || 0) >= 4 ? 'bg-[#111827]' : 'bg-[#6B7280]'
                              : 'bg-[#E5E5E5]'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-xs font-bold text-[#111827]">L{item?.priority || 3}</span>
                    </div>
                  </div>
                </div>

                {/* Grid layout for more info - single column for narrow drawer */}
                <div className={`grid gap-8 ${hasGeneratedContent ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
                  <div className={`space-y-8 ${hasGeneratedContent ? 'lg:col-span-7' : ''}`}>
                    {/* SEO Section */}
                    <section className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
                      <div className="px-6 py-4 border-b border-[#F5F5F5] bg-[#F9FAFB]">
                        <h3 className="text-xs font-bold text-[#111827] uppercase tracking-[0.1em]">SEO & Meta Strategy</h3>
                      </div>
                      <div className="p-6 space-y-6">
                        <div>
                          <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase mb-2">Target Keyword</label>
                          <div className="relative inline-block">
                            <span className="text-lg text-[#111827] font-bold">{item?.target_keyword || '-'}</span>
                            <div className="absolute -bottom-1 left-0 right-0 h-1 rounded-full opacity-60" style={{ background: 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)' }} />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase mb-2">SEO Title</label>
                          <div className="text-sm text-[#374151] leading-relaxed font-medium">{item?.seo_title || '-'}</div>
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase mb-2">Meta Description</label>
                          <div className="text-sm text-[#6B7280] leading-[1.6] bg-[#F8F9FA] p-4 rounded-xl border border-[#F1F3F5]">{item?.seo_description || '-'}</div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase mb-2">Slug</label>
                            <div className="text-xs text-[#111827] font-mono bg-[#F3F4F6] px-3 py-1.5 rounded-lg border border-[#E5E5E5] truncate">
                              {typeof window !== 'undefined' ? window.location.origin : ''}/p/{item?.slug || item?.id?.slice(0, 8)}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase mb-2">Estimated Word Count</label>
                            <div className="text-xs text-[#111827] font-bold bg-[#F3F4F6] px-3 py-1.5 rounded-lg border border-[#E5E5E5] inline-block">{item?.estimated_word_count || '0'} Words</div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Content Outline */}
                    <section className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
                      <div className="px-6 py-4 border-b border-[#F5F5F5] bg-[#F9FAFB]">
                        <h3 className="text-xs font-bold text-[#111827] uppercase tracking-[0.1em]">Content Architecture</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        {item?.outline?.h1 && (
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-[9px] font-black text-[#9CA3AF] uppercase block mb-1">Pillar H1</span>
                            <div className="text-base font-bold text-[#111827]">{item.outline.h1}</div>
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          {item?.outline?.sections?.map((section: any, idx: number) => (
                            <div key={idx} className="p-4 bg-white border border-[#E5E5E5] rounded-xl hover:border-[#111827] transition-all group">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <span className="text-[9px] font-black text-[#9CA3AF] uppercase block mb-1 group-hover:text-[#111827] transition-colors">Section H2</span>
                                  <div className="text-sm font-bold text-[#111827]">{section.h2}</div>
                                </div>
                                {section.word_count && (
                                  <span className="text-[10px] font-bold text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded-md group-hover:bg-[#111827] group-hover:text-white transition-colors">
                                    ~{section.word_count}w
                                  </span>
                                )}
                              </div>
                              
                              {section.h3s && section.h3s.length > 0 && (
                                <div className="mt-3 grid grid-cols-1 gap-1.5 border-t border-[#F9FAFB] pt-3">
                                  {section.h3s.map((h3: string, h3Idx: number) => (
                                    <div key={h3Idx} className="text-xs text-[#6B7280] flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
                                      {h3}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className={`space-y-8 ${hasGeneratedContent ? 'lg:col-span-5' : ''}`}>
                    {/* Metrics Dashboard */}
                    {item?.keyword_data && (
                      <section className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-[#F5F5F5] bg-[#F9FAFB]">
                          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-[0.1em]">Target Opportunity</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                          <div className="bg-[#F3F4F6] p-4 rounded-2xl border border-[#E5E5E5]">
                            <label className="block text-[9px] font-black text-[#9CA3AF] uppercase mb-1">Monthly Vol</label>
                            <div className="text-xl font-black text-[#111827]">{item.keyword_data.volume?.toLocaleString() || '-'}</div>
                          </div>
                          <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E5E5] relative overflow-hidden group">
                            <label className="block text-[9px] font-black text-[#6B7280] uppercase mb-1 relative z-10">Difficulty</label>
                            <div className="text-xl font-black text-[#111827] relative z-10">{typeof item.keyword_data.kd === 'number' ? `${item.keyword_data.kd}%` : '-'}</div>
                            <div className="absolute bottom-0 left-0 h-1 transition-all duration-500 group-hover:h-full opacity-5 w-full" style={{ background: 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)' }} />
                          </div>
                          <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E5E5] relative overflow-hidden group">
                            <label className="block text-[9px] font-black text-[#6B7280] uppercase mb-1 relative z-10">Est. CPC</label>
                            <div className="text-xl font-black text-[#111827] relative z-10">{typeof item.keyword_data.cpc === 'number' ? `$${item.keyword_data.cpc.toFixed(2)}` : '-'}</div>
                            <div className="absolute bottom-0 left-0 h-1 transition-all duration-500 group-hover:h-full opacity-5 w-full" style={{ background: 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)' }} />
                          </div>
                          <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-[#E5E5E5] relative overflow-hidden group">
                            <label className="block text-[9px] font-black text-[#6B7280] uppercase mb-1 relative z-10">Competition</label>
                            <div className="text-xl font-black text-[#111827] relative z-10">{typeof item.keyword_data.competition === 'number' && !isNaN(item.keyword_data.competition) ? `${(item.keyword_data.competition * 100).toFixed(0)}%` : '-'}</div>
                            <div className="absolute bottom-0 left-0 h-1 transition-all duration-500 group-hover:h-full opacity-5 w-full" style={{ background: 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)' }} />
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Linking */}
                    {item?.internal_links && item.internal_links.length > 0 && (
                      <section className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-[#F5F5F5] bg-[#F9FAFB]">
                          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-[0.1em]">Linking Strategy</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          {item.internal_links.map((link: any, idx: number) => (
                            <div key={idx} className="bg-white border border-[#E5E5E5] rounded-xl p-4 hover:shadow-md transition-shadow group">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center transition-colors group-hover:bg-[#111827]">
                                  <svg className="w-3 h-3 text-[#6B7280] group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                  </svg>
                                </div>
                                <span className="text-[11px] font-black text-[#111827] truncate">TO: {link.target_page}</span>
                              </div>
                              <div className="pl-8">
                                <div className="text-[10px] text-[#6B7280] mb-1">Anchor Text</div>
                                <div className="text-xs font-bold text-[#111827] px-2 py-1 bg-white rounded border border-[#E5E5E5] inline-block shadow-sm relative overflow-hidden">
                                  <span className="relative z-10">{link.anchor_text}</span>
                                  <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40" style={{ background: 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)' }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Market References */}
                    {item?.reference_urls && item.reference_urls.length > 0 && (
                      <section className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-[#F5F5F5] bg-[#F9FAFB]">
                          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-[0.1em]">Market References</h3>
                        </div>
                        <div className="p-4 space-y-2">
                          {item.reference_urls.map((url, idx) => (
                            <a 
                              key={idx} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group block p-3 bg-[#FAFAFA] border border-transparent hover:border-[#E5E5E5] hover:bg-white rounded-xl transition-all"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[11px] text-[#6B7280] truncate font-medium group-hover:text-[#111827]">{url}</span>
                                <svg className="w-3 h-3 text-[#9CA3AF] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                                </svg>
                              </div>
                            </a>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <Toast 
        isOpen={toast.isOpen} 
        message={toast.message} 
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))} 
      />
    </>
  );
}

