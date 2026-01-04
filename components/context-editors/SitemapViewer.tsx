'use client';

interface SitemapViewerProps {
  content?: string;
}

export default function SitemapViewer({ content }: SitemapViewerProps) {
  if (!content) {
    return (
      <div className="p-6 text-center text-sm text-[#9CA3AF] italic">
        No sitemap data stored.
      </div>
    );
  }

  try {
    const data = JSON.parse(content);
    
    // Check if we have categorizedUrls with actual content
    const hasCategorizedUrls = data.categorizedUrls && 
      typeof data.categorizedUrls === 'object' && 
      Object.keys(data.categorizedUrls).length > 0;
    
    // Check if we have topicHubs
    const hasTopicHubs = data.topicHubs && Array.isArray(data.topicHubs) && data.topicHubs.length > 0;
    
    // Determine if data is categorized
    const isCategorized = hasCategorizedUrls || hasTopicHubs;
    
    // Get URLs array
    const urls = data.urls || (Array.isArray(data) ? data : []);
    
    // Get categories - prefer categorizedUrls, fallback to topicHubs
    let categories = null;
    if (hasCategorizedUrls) {
      categories = data.categorizedUrls;
    } else if (hasTopicHubs) {
      // Convert topicHubs to categories format
      categories = {};
      data.topicHubs.forEach((hub: any) => {
        // Use allUrls if available, otherwise use sampleUrls
        const hubUrls = hub.allUrls || hub.sampleUrls || [];
        if (hubUrls.length > 0) {
          categories[hub.name] = hubUrls;
        }
      });
    }

    console.log('[SitemapViewer] Data:', { 
      isCategorized, 
      urlsCount: urls?.length, 
      hasCategorizedUrls,
      hasTopicHubs,
      categoriesCount: categories ? Object.keys(categories).length : 0
    });

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Sitemap Analysis
          </label>
          <div className="border border-[#E5E5E5] rounded-lg bg-[#F9FAFB] p-4 max-h-[500px] overflow-y-auto thin-scrollbar">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                <p className="text-[10px] font-bold text-[#111827] uppercase tracking-widest">
                  Total URLs: {urls?.length || 0}
                </p>
                {isCategorized && (
                  <span className="text-[9px] font-bold bg-[#9A8FEA]/10 text-[#9A8FEA] px-2 py-0.5 rounded-full">
                    AUTO-CATEGORIZED
                  </span>
                )}
              </div>

              {isCategorized && categories && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categories).map(([cat, list]: [string, any]) => {
                    if (!list || list.length === 0) return null;
                    return (
                      <div key={cat} className="flex items-center gap-1.5 bg-white border border-[#F0F0F0] px-2 py-1 rounded-lg">
                        <span className="text-[10px] font-bold text-[#374151] uppercase">{cat}</span>
                        <span className="text-[9px] font-medium text-[#9CA3AF] bg-[#FAFAFA] px-1.5 py-0.5 rounded-md border border-[#F5F5F5]">{list.length}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-4">
                {isCategorized && categories && Object.keys(categories).length > 0 ? (
                  Object.entries(categories).map(([cat, list]: [string, any]) => {
                    if (!list || list.length === 0) return null;
                    
                    // Find the corresponding topicHub for additional info
                    const topicHub = hasTopicHubs ? data.topicHubs.find((h: any) => h.name === cat) : null;
                    const totalCount = topicHub?.urlCount || list.length;
                    
                    return (
                      <div key={cat} className="space-y-1.5">
                        <h4 className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-tighter flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9AD6FF]"></span>
                          {cat} ({totalCount} URLs)
                        </h4>
                        <div className="grid grid-cols-1 gap-1 pl-3 border-l border-[#F0F0F0]">
                          {list.slice(0, 50).map((url: string, i: number) => (
                            <div key={i} className="text-[11px] text-[#4B5563] truncate font-mono hover:text-[#9A8FEA] cursor-default" title={url}>
                              {url}
                            </div>
                          ))}
                          {list.length > 50 && (
                            <div className="text-[10px] text-[#9CA3AF] italic pl-1">
                              + {list.length - 50} more urls shown... (Total: {totalCount} URLs in this hub)
                            </div>
                          )}
                          {list.length <= 50 && totalCount > list.length && (
                            <div className="text-[10px] text-[#9CA3AF] italic pl-1">
                              Showing sample URLs (Total: {totalCount} URLs in this hub)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : urls && urls.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {urls.slice(0, 100).map((url: string, i: number) => (
                      <div key={i} className="text-[11px] text-[#4B5563] truncate font-mono" title={url}>
                        {i + 1}. {url}
                      </div>
                    ))}
                    {urls.length > 100 && (
                      <div className="text-[10px] text-[#9CA3AF] italic pl-1 mt-2">
                        + {urls.length - 100} more urls...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#9CA3AF] italic">No URLs found in sitemap data.</p>
                    <p className="text-xs text-[#9CA3AF] mt-2">Run "Site Context Acquisition" skill to fetch your sitemap.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-3 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
            <span className="font-bold text-blue-600 mr-1">NOTE:</span>
            Sitemap data is acquired via the <strong>"Site Context Acquisition"</strong> skill. It is automatically categorized by path structure (Blog, Product, etc.) to help the AI map your topic clusters more accurately.
          </p>
        </div>
      </div>
    );
  } catch (e) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 text-xs font-mono">
          Error parsing sitemap JSON: {e instanceof Error ? e.message : 'Unknown error'}
        </p>
      </div>
    );
  }
}

