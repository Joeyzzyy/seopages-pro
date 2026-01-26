'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface InitializationPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

interface InitData {
  logo?: string;
  brandName?: string;
  brandColors?: string[];
  headerItems?: number;
  footerColumns?: number;
  ogImage?: string;
  competitors?: Array<{ name: string; logo?: string; domain?: string }>;
  pagesCreated?: number;
  // Real-time logs
  logs?: Array<{ time: string; type: 'info' | 'success' | 'error' | 'warning'; message: string }>;
}

interface SiteInitializationOverlayProps {
  domain: string;
  messages: any[];
  isLoading: boolean;
  initPhase?: 'brand' | 'competitors' | 'planning' | 'done';
  initData?: InitData;
  onComplete?: () => void;
}

// Phase card component - minimal, elegant design
const PhaseCard = ({ 
  phase, 
  index, 
  totalPhases,
  initData,
}: { 
  phase: InitializationPhase; 
  index: number; 
  totalPhases: number;
  initData?: InitData;
}) => {
  const isActive = phase.status === 'running';
  const isCompleted = phase.status === 'completed';
  
  // Render data preview based on phase
  const renderPhaseData = () => {
    if (phase.id === 'brand' && isCompleted && initData) {
      const hasLogo = initData.logo;
      const hasColors = initData.brandColors && initData.brandColors.length > 0;
      const hasBrand = initData.brandName;
      const hasHeader = initData.headerItems && initData.headerItems > 0;
      const hasFooter = initData.footerColumns && initData.footerColumns > 0;
      
      if (!hasLogo && !hasColors && !hasBrand && !hasHeader && !hasFooter) return null;
      
      return (
        <div className="mt-2 pl-8 animate-fade-in space-y-2">
          {/* Main brand info row - monochrome */}
          <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg border border-gray-200">
            {/* Logo */}
            {hasLogo && (
              <div className="flex-shrink-0 w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={initData.logo} 
                  alt="Logo" 
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Brand name */}
            {hasBrand && (
              <span className="text-sm font-medium text-gray-800">
                {initData.brandName}
              </span>
            )}
            
            {/* Colors */}
            {hasColors && (
              <div className="flex items-center gap-1">
                {initData.brandColors!.slice(0, 5).map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
            
            <svg className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          
          {/* Additional extracted info */}
          {(hasHeader || hasFooter) && (
            <div className="flex items-center gap-3 text-xs text-gray-400 px-3">
              {hasHeader && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  {initData.headerItems} nav items
                </span>
              )}
              {hasFooter && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {initData.footerColumns} footer cols
                </span>
              )}
            </div>
          )}
        </div>
      );
    }
    
    if (phase.id === 'competitors' && isCompleted && initData?.competitors?.length) {
      return (
        <div className="mt-2 pl-8 animate-fade-in">
          <div className="flex flex-wrap gap-1.5">
            {initData.competitors.slice(0, 6).map((comp, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 py-1 px-2.5 bg-gray-100 rounded-md text-xs text-gray-600"
              >
                {comp.name}
              </div>
            ))}
            {initData.competitors.length > 6 && (
              <span className="text-xs text-gray-400 self-center ml-1">
                +{initData.competitors.length - 6}
              </span>
            )}
          </div>
        </div>
      );
    }
    
    if (phase.id === 'planning' && isCompleted && initData?.pagesCreated) {
      return (
        <div className="mt-2 pl-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 py-1.5 px-3 bg-gray-100 rounded-md">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {initData.pagesCreated} page{initData.pagesCreated > 1 ? 's' : ''} created
            </span>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div 
      className="relative"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div 
        className={`
          flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-400
          ${isActive 
            ? 'bg-white/80 backdrop-blur-sm shadow-sm' 
            : 'bg-transparent'
          }
        `}
      >
        {/* Step indicator - monochrome */}
        <div 
          className={`
            flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-300
            ${isActive 
              ? 'bg-gray-900 text-white' 
              : isCompleted
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-300'
            }
          `}
        >
          {isCompleted ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            index + 1
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 
            className={`text-sm transition-colors duration-300 ${
              isActive ? 'text-gray-900 font-medium' : isCompleted ? 'text-gray-600' : 'text-gray-300'
            }`}
          >
            {phase.name}
          </h3>
          {isActive && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {phase.description}
            </p>
          )}
        </div>
        
        {/* Loading indicator for active */}
        {isActive && (
          <div className="flex-shrink-0">
            <div className="w-3.5 h-3.5 border-[1.5px] border-gray-200 border-t-gray-400 rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {/* Phase data preview */}
      {renderPhaseData()}
    </div>
  );
};

// Main component
export default function SiteInitializationOverlay({ 
  domain, 
  messages, 
  isLoading,
  initPhase = 'brand',
  initData = {},
  onComplete 
}: SiteInitializationOverlayProps) {
  const [showTip, setShowTip] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Check for errors in messages
  useEffect(() => {
    const errorMsg = messages.find(m => 
      m.content?.includes('Error:') ||
      m.role === 'assistant' && m.content?.toLowerCase().includes('error')
    );
    if (errorMsg) {
      setHasError(true);
      // Auto-complete after short delay to exit initialization mode
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
    }
  }, [messages, onComplete]);
  
  // Timeout protection - exit after 5 minutes if stuck (increased from 3 due to competitor discovery)
  useEffect(() => {
    if (elapsedTime >= 300 && !hasError) { // 5 minutes
      console.log('[Initialization] Timeout reached, exiting initialization mode');
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);
    }
  }, [elapsedTime, hasError, onComplete]);
  
  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };
  
  // Determine phase status based on initPhase prop (from parent state)
  const phases: InitializationPhase[] = useMemo(() => {
    let phase1Status: 'pending' | 'running' | 'completed' = 'pending';
    let phase2Status: 'pending' | 'running' | 'completed' = 'pending';
    let phase3Status: 'pending' | 'running' | 'completed' = 'pending';
    
    // Use initPhase prop to determine status
    // Phase is only 'completed' when we move to the NEXT phase
    switch (initPhase) {
      case 'brand':
        // Brand phase is running (not completed until we move to competitors)
        phase1Status = 'running';
        break;
      case 'competitors':
        phase1Status = 'completed';
        phase2Status = 'running';
        break;
      case 'planning':
        phase1Status = 'completed';
        phase2Status = 'completed';
        phase3Status = 'running';
        break;
      case 'done':
        phase1Status = 'completed';
        phase2Status = 'completed';
        phase3Status = 'completed';
        break;
    }
    
    return [
      {
        id: 'brand',
        name: 'Brand Assets',
        description: 'Extracting logo, colors, header & footer',
        status: phase1Status,
      },
      {
        id: 'competitors',
        name: 'Competitor Discovery',
        description: 'Finding competitors via AI + web search',
        status: phase2Status,
      },
      {
        id: 'planning',
        name: 'Page Planning',
        description: 'Creating comparison & listicle page blueprints',
        status: phase3Status,
      },
    ];
  }, [initPhase, isLoading]);
  
  // Note: We no longer auto-complete - user must click "Enter Workspace" button
  
  // Show tip after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowTip(true), 10000);
    return () => clearTimeout(timer);
  }, []);
  
  // Calculate progress
  const completedCount = phases.filter(p => p.status === 'completed').length;
  const progress = (completedCount / phases.length) * 100;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#FAFAFA]">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        
        {/* Subtle gradient orbs - very light */}
        <div 
          className="absolute w-[600px] h-[600px] -top-40 -right-40 rounded-full opacity-[0.08]"
          style={{
            background: 'radial-gradient(circle, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] -bottom-32 -left-32 rounded-full opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
          }}
        />
      </div>
      
      {/* Content container - wider for logs */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6">
        {/* Two column layout */}
        <div className="flex gap-6">
          {/* Left: Progress info */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              {/* Title row */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100">
                  <img 
                    src="/new-logo.png" 
                    alt="seopages.pro" 
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-gray-800">
                    Setting up your workspace
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="relative w-1.5 h-1.5">
                      <div className="absolute inset-0 rounded-full bg-gray-400 animate-ping opacity-50" />
                      <div className="relative w-1.5 h-1.5 rounded-full bg-gray-500" />
                    </div>
                    <span className="text-xs text-gray-500">{domain}</span>
                  </div>
                </div>
              </div>
              
              {/* Progress bar - monochrome */}
              <div className="flex items-center gap-3">
                <div className="flex-1 relative h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-800 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-16 text-right">{formatTime(elapsedTime)}</span>
              </div>
            </div>
            
            {/* Phases */}
            <div className="space-y-2">
              {phases.map((phase, index) => (
                <PhaseCard 
                  key={phase.id} 
                  phase={phase} 
                  index={index} 
                  totalPhases={phases.length}
                  initData={initData}
                />
              ))}
            </div>
            
            {/* Success summary when all done */}
            {initPhase === 'done' && (
              <div className="mt-4 animate-fade-in">
                {/* Combined success message + button with glow effect */}
                <div className="relative group animate-success-pop">
                  {/* Animated gradient glow behind button */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-glow-pulse" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-violet-600 to-fuchsia-500 rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500 animate-glow-pulse-reverse" />
                  
                  {/* Button with integrated success message */}
                  <button
                    onClick={onComplete}
                    className="relative w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all flex items-center justify-center gap-4 shadow-xl animate-button-slide"
                  >
                    {/* Checkmark icon */}
                    <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center animate-check-scale">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    
                    {/* Text */}
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-gray-400 font-medium">Setup complete!</span>
                      <span className="text-base font-bold text-white">Enter Workspace</span>
                    </div>
                    
                    {/* Arrow icon */}
                    <svg className="w-5 h-5 ml-auto text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Right: Live logs terminal */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="text-[10px] text-gray-400 font-mono ml-2">Live Progress</span>
              </div>
              
              {/* Terminal content - custom scrollbar */}
              <div className="h-72 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed scrollbar-thin" id="logs-container" style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>
                {initData?.logs && initData.logs.length > 0 ? (
                  initData.logs.map((log, i) => (
                    <div key={i} className="flex gap-2 mb-0.5">
                      <span className="text-gray-600 flex-shrink-0">{log.time}</span>
                      <span className={
                        log.type === 'success' ? 'text-gray-300' :
                        log.type === 'error' ? 'text-gray-400' :
                        log.type === 'warning' ? 'text-gray-400' :
                        'text-gray-500'
                      }>
                        {log.type === 'success' && '✓ '}
                        {log.type === 'error' && '✗ '}
                        {log.type === 'warning' && '! '}
                        {log.message}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="text-gray-500 mb-2">$ initializing workspace...</div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
                      <span>Waiting for data...</span>
                    </div>
                  </>
                )}
                
                {/* Blinking cursor */}
                {initPhase !== 'done' && (
                  <div className="flex items-center mt-2">
                    <span className="text-gray-600">$</span>
                    <div className="w-1.5 h-3.5 bg-gray-500 ml-1 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom line - subtle */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
      
      {/* Custom styles */}
      <style jsx>{`
        /* Custom scrollbar for terminal */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #4B5563;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.6; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scale-in {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
        
        @keyframes success-pop {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes check-scale {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        @keyframes button-slide {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes arrow-bounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        
        .animate-success-pop {
          animation: success-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-check-scale {
          animation: check-scale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
          transform: scale(0);
        }
        
        .animate-button-slide {
          animation: button-slide 0.4s ease-out 0.3s forwards;
          opacity: 0;
        }
        
        .animate-arrow-bounce {
          animation: arrow-bounce 1s ease-in-out infinite 0.5s;
        }
        
        @keyframes glow-pulse {
          0%, 100% { 
            opacity: 0.6; 
            transform: scale(1) rotate(0deg);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.05) rotate(3deg);
          }
        }
        
        @keyframes glow-pulse-reverse {
          0%, 100% { 
            opacity: 0.4; 
            transform: scale(1.05) rotate(-3deg);
          }
          50% { 
            opacity: 0.6; 
            transform: scale(1) rotate(0deg);
          }
        }
        
        .animate-glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        
        .animate-glow-pulse-reverse {
          animation: glow-pulse-reverse 3s ease-in-out infinite 1.5s;
        }
      `}</style>
    </div>
  );
}
