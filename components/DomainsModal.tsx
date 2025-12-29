'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Domain {
  id: string;
  domain: string;
  verification_type: string;
  verification_token: string;
  verified: boolean;
  verified_at: string | null;
  subdirectories: Subdirectory[];
}

interface Subdirectory {
  id: string;
  domain_id: string;
  path: string;
}

interface DomainsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DomainsModal({ isOpen, onClose }: DomainsModalProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [newSubdir, setNewSubdir] = useState('');
  const [addingSubdir, setAddingSubdir] = useState<string | null>(null);
  const [proxyConfig, setProxyConfig] = useState<any>(null);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const brandGradient = 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)';

  useEffect(() => {
    if (isOpen) {
      fetchDomains();
    }
  }, [isOpen]);

  // Auto-expand unverified domains
  useEffect(() => {
    const unverifiedIds = domains.filter(d => !d.verified).map(d => d.id);
    if (unverifiedIds.length > 0) {
      setExpandedDomains(prev => {
        const newSet = new Set(prev);
        unverifiedIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [domains]);

  const toggleExpanded = (id: string) => {
    setExpandedDomains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch('/api/domains', { headers });
      const data = await res.json();
      setDomains(data.domains || []);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    
    try {
      setAdding(true);
      const headers = await getAuthHeaders();
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers,
        body: JSON.stringify({ domain: newDomain }),
      });
      const data = await res.json();
      
      if (data.success) {
        setNewDomain('');
        await fetchDomains();
        if (data.domain?.id) {
          setExpandedDomains(prev => new Set(prev).add(data.domain.id));
        }
        setMessage({ type: 'success', text: 'Domain added successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add domain' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add domain' });
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (domainId: string) => {
    try {
      setVerifying(domainId);
      const headers = await getAuthHeaders();
      const res = await fetch('/api/domains/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ domainId }),
      });
      const data = await res.json();
      
      if (data.verified) {
        setMessage({ type: 'success', text: 'Domain verified successfully!' });
        fetchDomains();
      } else {
        setMessage({ type: 'error', text: data.details || 'Verification failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Verification failed' });
    } finally {
      setVerifying(null);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/domains?id=${domainId}`, { method: 'DELETE', headers });
      fetchDomains();
      setMessage({ type: 'success', text: 'Domain deleted' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  const handleAddSubdir = async (domainId: string) => {
    if (!newSubdir.trim()) return;
    
    try {
      setAddingSubdir(domainId);
      const headers = await getAuthHeaders();
      const res = await fetch('/api/domains/subdirectories', {
        method: 'POST',
        headers,
        body: JSON.stringify({ domainId, path: newSubdir }),
      });
      const data = await res.json();
      
      if (data.success) {
        setNewSubdir('');
        setProxyConfig(data.proxyConfig);
        setShowProxyModal(true);
        fetchDomains();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add' });
    } finally {
      setAddingSubdir(null);
    }
  };

  const handleDeleteSubdir = async (subdirId: string) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/domains/subdirectories?id=${subdirId}`, { method: 'DELETE', headers });
      fetchDomains();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard' });
  };

  const showProxyConfigForPath = (domain: string, path: string) => {
    const targetUrl = process.env.NEXT_PUBLIC_RENDERING_SERVICE_URL || 'https://your-rendering-service.com';
    
    const config = {
      vercel: {
        description: `Add this to your vercel.json file in the 'rewrites' section.`,
        config: `{
  "source": "${path}/:path*",
  "destination": "${targetUrl}${path}/:path*"
}`
      },
      nginx: {
        description: `Add this to your Nginx server block configuration.`,
        config: `location ${path} {
  proxy_pass ${targetUrl}${path};
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}`
      },
      cloudflare: {
        description: `Configure a Page Rule or Transform Rule in Cloudflare.`,
        config: `URL: ${domain}${path}/*
Forwarding URL (301): ${targetUrl}${path}/$1`
      },
      nextjs: {
        description: `Add this to your next.config.js file in the 'rewrites' async function.`,
        config: `{
  source: '${path}/:path*',
  destination: '${targetUrl}${path}/:path*',
}`
      }
    };
    
    setProxyConfig(config);
    setShowProxyModal(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div 
          className="bg-[#FAFAFA] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-[#E5E5E5]" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E5E5E5]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#111827] tracking-tight">Domain Management</h2>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mt-1">Connect domains to publish content</p>
              </div>
              <button 
                onClick={onClose} 
                className="text-[#9CA3AF] hover:text-[#111827] transition-colors text-xl font-light"
              >
                ×
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mx-6 mt-4 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between ${
              message.type === 'success' 
                ? 'bg-[#111827]/5 text-[#111827]' 
                : 'bg-[#111827] text-white'
            }`}>
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="ml-4 opacity-60 hover:opacity-100 text-sm">×</button>
            </div>
          )}

          {/* Add Domain Form */}
          <div className="px-6 py-5">
            <div className="flex gap-3">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="flex-1 px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:border-[#9A8FEA] transition-colors placeholder:text-[#9CA3AF]"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
              />
              <button
                onClick={handleAddDomain}
                disabled={adding || !newDomain.trim()}
                className="px-6 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: brandGradient }}
              >
                {adding ? 'Adding...' : 'Add Domain'}
              </button>
            </div>
          </div>

          {/* Domains List */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 mx-auto mb-3 rounded-full border-2 border-[#E5E5E5] border-t-[#9A8FEA] animate-spin" />
                <p className="text-[#9CA3AF] text-xs">Loading...</p>
              </div>
            ) : domains.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#374151] text-sm font-medium">No domains added yet</p>
                <p className="text-[#9CA3AF] text-xs mt-1">Add your first domain to start publishing</p>
              </div>
            ) : (
              domains.map((domain) => {
                const isExpanded = expandedDomains.has(domain.id);
                return (
                  <div 
                    key={domain.id} 
                    className={`bg-white rounded-xl border overflow-hidden transition-all ${
                      !domain.verified 
                        ? 'border-[#FFAF40]/50' 
                        : 'border-[#E5E5E5]'
                    }`}
                  >
                    {/* Domain Header */}
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAFAFA]/50 transition-colors"
                      onClick={() => toggleExpanded(domain.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            domain.verified ? 'bg-[#111827]' : 'bg-[#FFAF40]'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-[#111827] text-sm">{domain.domain}</div>
                          <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mt-0.5">
                            {domain.verified ? 'Verified' : 'Pending Verification'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!domain.verified && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVerify(domain.id); }}
                            disabled={verifying === domain.id}
                            className="px-4 py-2 text-xs font-bold rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: brandGradient }}
                          >
                            {verifying === domain.id ? 'Checking...' : 'Verify Now'}
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleExpanded(domain.id); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#9CA3AF] text-sm"
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDomain(domain.id); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#111827]/5 text-[#9CA3AF] hover:text-[#111827] transition-colors text-sm"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                      <div className="px-4 pb-4 space-y-4">
                        {/* Verification Instructions (if not verified) */}
                        {!domain.verified && (
                          <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5]">
                            <div className="text-xs font-bold text-[#111827] mb-1">DNS Configuration Required</div>
                            <p className="text-[10px] text-[#6B7280] mb-4">Add this TXT record to your DNS settings</p>
                            
                            <div className="space-y-3">
                              <div className="p-3 bg-white rounded-lg border border-[#E5E5E5]">
                                <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-1">Host / Name</div>
                                <code className="text-sm font-mono text-[#111827]">_mini-agent-verify</code>
                              </div>
                              
                              <div className="p-3 bg-white rounded-lg border border-[#E5E5E5]">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide">Value</span>
                                  <button 
                                    onClick={() => copyToClipboard(domain.verification_token)}
                                    className="text-[10px] font-bold text-[#6B7280] hover:text-[#111827] transition-colors"
                                  >
                                    Copy
                                  </button>
                                </div>
                                <code className="text-sm font-mono text-[#111827] break-all block">{domain.verification_token}</code>
                              </div>
                            </div>
                            
                            <p className="text-[10px] text-[#9CA3AF] mt-4 text-center">
                              DNS propagation may take up to 48 hours
                            </p>
                          </div>
                        )}

                        {/* Subdirectories (only for verified domains) */}
                        {domain.verified && (
                          <div className="space-y-3">
                            <div className="text-xs font-bold text-[#111827]">Subdirectories</div>
                            
                            {domain.subdirectories && domain.subdirectories.length > 0 && (
                              <div className="space-y-2">
                                {domain.subdirectories.map((subdir) => (
                                  <div key={subdir.id} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
                                    <code className="text-xs text-[#374151] font-mono">{domain.domain}{subdir.path}</code>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => showProxyConfigForPath(domain.domain, subdir.path)}
                                        className="text-[10px] font-bold text-[#6B7280] hover:text-[#111827] transition-colors"
                                      >
                                        Config
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubdir(subdir.id)}
                                        className="text-[#9CA3AF] hover:text-[#111827] transition-colors text-sm"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newSubdir}
                                onChange={(e) => setNewSubdir(e.target.value)}
                                placeholder="/blog or /resources"
                                className="flex-1 px-4 py-2.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-xs focus:outline-none focus:border-[#9A8FEA] transition-colors placeholder:text-[#9CA3AF]"
                              />
                              <button
                                onClick={() => handleAddSubdir(domain.id)}
                                disabled={addingSubdir === domain.id || !newSubdir.trim()}
                                className="px-4 py-2.5 rounded-lg text-white text-xs font-bold disabled:opacity-40 transition-all hover:opacity-90"
                                style={{ background: brandGradient }}
                              >
                                {addingSubdir === domain.id ? 'Adding...' : 'Add Path'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Proxy Configuration Modal */}
      {showProxyModal && proxyConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={() => setShowProxyModal(false)}>
          <div className="bg-[#FAFAFA] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-[#E5E5E5]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-[#E5E5E5]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#111827] tracking-tight">Proxy Configuration</h2>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mt-1">Forward subdirectory requests to your rendering service</p>
                </div>
                <button 
                  onClick={() => setShowProxyModal(false)} 
                  className="text-[#9CA3AF] hover:text-[#111827] transition-colors text-xl font-light"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {Object.entries(proxyConfig).map(([platform, config]: [string, any]) => (
                <div key={platform} className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#F3F4F6] flex items-center justify-between">
                    <span className="font-bold text-sm text-[#111827] capitalize">{platform}</span>
                    <button
                      onClick={() => copyToClipboard(config.config)}
                      className="text-[10px] font-bold text-[#6B7280] hover:text-[#111827] transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#6B7280] mb-3">{config.description}</p>
                    <pre className="p-4 bg-[#111827] rounded-lg text-xs text-[#9A8FEA] overflow-x-auto font-mono leading-relaxed">
                      {config.config}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
