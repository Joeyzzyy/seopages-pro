'use client';

import FileDownloadCard from './FileDownloadCard';

interface ToolInvocationDisplayProps {
  toolInvocation: any;
}

export default function ToolInvocationDisplay({ toolInvocation }: ToolInvocationDisplayProps) {
  const toolName = toolInvocation.toolName;
  const toolDisplayName = toolName?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Tool';
  
  // Show calling state
  if (toolInvocation.state === 'call') {
    return (
      <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-3 text-sm">
        <div className="flex items-center gap-2 text-[#6B7280]">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="font-medium">Using tool: {toolDisplayName}</span>
        </div>
        {toolInvocation.args && Object.keys(toolInvocation.args).length > 0 && (
          <div className="mt-2 pl-6 text-xs text-[#9CA3AF]">
            {Object.entries(toolInvocation.args).slice(0, 2).map(([key, value]: [string, any]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span> {typeof value === 'string' ? value.slice(0, 50) : JSON.stringify(value).slice(0, 50)}
                {(typeof value === 'string' ? value.length : JSON.stringify(value).length) > 50 ? '...' : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (toolInvocation.state === 'result') {
    const result = toolInvocation.result;
    
    // Hide tracker files - they're shown in Latest Task sidebar
    if (result.metadata?.isTracker || result.filename?.includes('conversation-tracker-')) {
      return null;
    }
    
    // Check if this is a file download result
    if (result.filename && result.content && result.mimeType) {
      return <FileDownloadCard result={result} />;
    }

    // Check if this is an HTML report result - render in iframe using base64 content
    // Use startsWith to handle 'text/html;charset=utf-8'
    if (toolName === 'markdown_to_html_report' && result.success && result.content && result.mimeType?.startsWith('text/html')) {
      // Decode base64 content with proper UTF-8 handling
      // atob() returns Latin-1, need to convert to UTF-8 for Chinese/unicode support
      const binaryString = atob(result.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const htmlContent = new TextDecoder('utf-8').decode(bytes);
      
      // Create a blob URL for opening in new tab (with UTF-8 charset)
      const blob = new Blob([bytes], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      
      return (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h18v18H3zM12 8v8M8 12h8" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">📊 Interactive Report</h4>
                <p className="text-[10px] text-white/70">{result.filename} • {result.charts_generated || 0} charts</p>
              </div>
            </div>
            <button 
              onClick={() => window.open(blobUrl, '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              Open Full Screen
            </button>
          </div>
          <div className="relative bg-[#fafafa] w-full" style={{ height: '500px' }}>
            <iframe 
              srcDoc={htmlContent}
              className="w-full h-full border-0"
              title="Interactive Report"
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </div>
      );
    }
    
    // Check if this is a planning result
    if (result.plan && result.plan.steps) {
      const plan = result.plan;
      return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 text-sm">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              <path d="M9 12h6m-6 4h6" />
            </svg>
            <span className="font-semibold text-blue-900">Execution Plan Created</span>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-blue-800">
              <span className="font-medium">Task:</span> {plan.task_summary}
            </div>
            <div className="text-xs text-blue-700">
              <span className="font-medium">{plan.total_steps} Steps:</span>
              <ol className="mt-1 ml-4 space-y-1 list-decimal">
                {plan.steps.slice(0, 3).map((step: any, idx: number) => (
                  <li key={idx}>
                    {step.description}
                    <span className="text-blue-500 text-[10px] ml-1">
                      ({step.required_tools.join(', ')})
                    </span>
                  </li>
                ))}
                {plan.steps.length > 3 && (
                  <li className="text-blue-500">... and {plan.steps.length - 3} more steps</li>
                )}
              </ol>
            </div>
          </div>
        </div>
      );
    }

    // Check if this is an SEO audit result
    if (toolName === 'seo_audit' && result.success) {
      const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-[#10B981]';
        if (score >= 60) return 'text-[#F59E0B]';
        return 'text-[#EF4444]';
      };

      return (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[#F9FAFB] p-4 border-b border-[#E5E5E5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-[#111827] text-sm">SEO EEAT Audit</h4>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium">{result.page_type} • {result.content_type}</p>
              </div>
            </div>
            <div className={`text-2xl font-black ${getScoreColor(result.overall_score)}`}>
              {result.overall_score}<span className="text-xs text-[#9CA3AF] font-medium ml-0.5">/100</span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(result.scores).map(([key, value]: [string, any]) => (
                <div key={key} className="text-center p-2 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
                  <div className="text-[10px] text-[#6B7280] uppercase font-bold mb-1">{key.slice(0, 3)}</div>
                  <div className={`text-sm font-black ${getScoreColor(value)}`}>{value}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Key Findings ({result.eeat_checks.length})
              </div>
              <div className="max-h-48 overflow-y-auto pr-1 space-y-2 thin-scrollbar">
                {result.eeat_checks.slice(0, 6).map((check: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#F3F4F6] text-[11px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#111827]">{check.checkId}: {check.checkName}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        check.status === 'pass' ? 'bg-green-100 text-green-700' : 
                        check.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {check.status}
                      </span>
                    </div>
                    <p className="text-[#6B7280] leading-relaxed">{check.message}</p>
                    {check.suggestion && (
                      <div className="mt-1.5 pt-1.5 border-t border-[#F3F4F6] text-blue-600 font-medium">
                        💡 {check.suggestion}
                      </div>
                    )}
                  </div>
                ))}
                {result.eeat_checks.length > 6 && (
                  <div className="text-center text-[10px] text-[#9CA3AF] py-1">
                    + {result.eeat_checks.length - 6} more findings in full report
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Check if this is a GEO audit result
    if (toolName === 'geo_audit' && result.success) {
      const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-[#8B5CF6]';
        if (score >= 60) return 'text-[#F59E0B]';
        return 'text-[#EF4444]';
      };

      return (
        <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[#F5F3FF] p-4 border-b border-[#EDE9FE] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-[#111827] text-sm">GEO CORE Audit</h4>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium">AI Search Visibility • {result.page_type}</p>
              </div>
            </div>
            <div className={`text-2xl font-black ${getScoreColor(result.overall_score)}`}>
              {result.overall_score}<span className="text-xs text-[#9CA3AF] font-medium ml-0.5">/100</span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(result.scores).map(([key, value]: [string, any]) => (
                <div key={key} className="text-center p-2 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
                  <div className="text-[10px] text-[#6B7280] uppercase font-bold mb-1">{key.slice(0, 3)}</div>
                  <div className={`text-sm font-black ${getScoreColor(value)}`}>{value}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Insights ({result.geo_core_checks.length})
              </div>
              <div className="max-h-48 overflow-y-auto pr-1 space-y-2 thin-scrollbar">
                {result.geo_core_checks.slice(0, 6).map((check: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#F3F4F6] text-[11px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#111827]">{check.checkId}: {check.checkName}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        check.status === 'pass' ? 'bg-purple-100 text-purple-700' : 
                        check.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {check.status}
                      </span>
                    </div>
                    <p className="text-[#6B7280] leading-relaxed">{check.message}</p>
                    {check.suggestion && (
                      <div className="mt-1.5 pt-1.5 border-t border-[#F3F4F6] text-purple-600 font-medium">
                        ✨ {check.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Check if this is keyword data
    if (result.keyword && result.found !== false) {
      const getDifficultyColor = (kd: number) => {
        if (kd >= 70) return 'text-[#EF4444]';
        if (kd >= 40) return 'text-[#F59E0B]';
        return 'text-[#10B981]';
      };

      return (
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-2.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-[#111827] truncate">{result.keyword}</span>
            <span className="text-[#9CA3AF] uppercase shrink-0">{result.database}</span>
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-[#6B7280]">
            <span>Vol: <strong className="text-[#111827]">{result.searchVolume?.toLocaleString()}</strong></span>
            <span>KD: <strong className={getDifficultyColor(result.keywordDifficulty)}>{result.keywordDifficulty?.toFixed(0)}%</strong></span>
            <span>CPC: <strong className="text-[#111827]">${result.cpc?.toFixed(2)}</strong></span>
            <span>Comp: <strong className="text-[#111827]">{(result.competition * 100)?.toFixed(0)}%</strong></span>
          </div>
        </div>
      );
    }
    
    // Fallback for error or not found
    if (result.found === false || result.error) {
      return (
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-4 text-sm">
          <div className="flex items-start gap-2 text-[#6B7280]">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <div className="font-semibold mb-1">No Data Found</div>
              <div>{result.error || 'No data available for this keyword'}</div>
            </div>
          </div>
        </div>
      );
    }
    
    // Generic tool result display for other tools
    return (
      <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-3 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-medium text-[#6B7280]">Tool completed: {toolDisplayName}</span>
        </div>
        {result && typeof result === 'object' && Object.keys(result).length > 0 && (
          <div className="pl-6 text-xs text-[#9CA3AF] space-y-1 max-h-32 overflow-y-auto thin-scrollbar">
            {Object.entries(result).slice(0, 5).map(([key, value]: [string, any]) => {
              if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                return (
                  <div key={key}>
                    <span className="font-medium">{key}:</span> {String(value).slice(0, 100)}
                    {String(value).length > 100 ? '...' : ''}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  }
  
  return null;
}

