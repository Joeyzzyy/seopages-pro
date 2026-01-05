'use client';

import { useState, useEffect, useCallback } from 'react';

interface ProgressEvent {
  phase: string;
  progress: number;
  message: string;
  data?: any;
}

interface ContextAcquisitionProgressProps {
  url: string;
  userId: string;
  projectId: string;
  onComplete: () => void;
  onError?: (error: string) => void;
}

const PHASE_ICONS: Record<string, string> = {
  homepage: '🌐',
  sitemap: '🗺️',
  brand: '🎨',
  content: '📄',
  contact: '📞',
  complete: '✅',
  error: '❌',
};

const PHASE_LABELS: Record<string, string> = {
  homepage: 'Homepage',
  sitemap: 'Sitemap',
  brand: 'Brand Assets',
  content: 'Content',
  contact: 'Contact Info',
};

export default function ContextAcquisitionProgress({
  url,
  userId,
  projectId,
  onComplete,
  onError,
}: ContextAcquisitionProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('homepage');
  const [message, setMessage] = useState('Starting context acquisition...');
  const [phaseResults, setPhaseResults] = useState<Record<string, { status: string; message: string }>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [finalData, setFinalData] = useState<any>(null);

  const startAcquisition = useCallback(async () => {
    if (hasStarted) return;
    setHasStarted(true);

    try {
      const response = await fetch('/api/context-acquisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, userId, projectId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: ProgressEvent = JSON.parse(line.slice(6));
              
              setProgress(event.progress);
              setCurrentPhase(event.phase);
              setMessage(event.message);

              if (event.phase !== 'complete' && event.phase !== 'error') {
                setPhaseResults(prev => ({
                  ...prev,
                  [event.phase]: {
                    status: event.progress > 0 ? 'done' : 'pending',
                    message: event.message
                  }
                }));
              }

              if (event.phase === 'complete') {
                setIsComplete(true);
                setFinalData(event.data);
                // Wait a bit to show the complete state
                setTimeout(() => {
                  onComplete();
                }, 1500);
              }

              if (event.phase === 'error') {
                onError?.(event.message);
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Context acquisition error:', error);
      setMessage(`Error: ${error.message}`);
      onError?.(error.message);
    }
  }, [url, userId, projectId, hasStarted, onComplete, onError]);

  useEffect(() => {
    startAcquisition();
  }, [startAcquisition]);

  const phases = ['homepage', 'sitemap', 'brand', 'content', 'contact'];

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-2xl mb-2">
            {isComplete ? '🎉' : '🔍'}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isComplete ? 'Context Acquired!' : 'Acquiring Site Context'}
          </h2>
          <p className="text-sm text-gray-500 mt-1 truncate max-w-xs mx-auto">
            {url}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{progress}%</span>
            <span>{message}</span>
          </div>
        </div>

        {/* Phase List */}
        <div className="space-y-2">
          {phases.map((phase) => {
            const result = phaseResults[phase];
            const isCurrent = phase === currentPhase && !isComplete;
            const isDone = result?.status === 'done' || (progress > 0 && phases.indexOf(phase) < phases.indexOf(currentPhase));
            
            return (
              <div 
                key={phase}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  isCurrent 
                    ? 'bg-blue-50 border border-blue-100' 
                    : isDone 
                      ? 'bg-emerald-50 border border-emerald-100' 
                      : 'bg-gray-50'
                }`}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-sm ${
                  isDone 
                    ? 'bg-emerald-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-500 text-white animate-pulse' 
                      : 'bg-gray-200 text-gray-400'
                }`}>
                  {isDone ? '✓' : isCurrent ? '...' : PHASE_ICONS[phase]}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    isDone 
                      ? 'text-emerald-700' 
                      : isCurrent 
                        ? 'text-blue-700' 
                        : 'text-gray-400'
                  }`}>
                    {PHASE_LABELS[phase]}
                  </div>
                  {result?.message && (isCurrent || isDone) && (
                    <div className="text-xs text-gray-500 truncate max-w-[250px]">
                      {result.message}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Summary */}
        {isComplete && finalData && (
          <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="text-sm font-medium text-emerald-800 mb-2">
              ✅ {finalData.message}
            </div>
            {finalData.savedFields && finalData.savedFields.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {finalData.savedFields.map((field: string) => (
                  <span 
                    key={field}
                    className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded"
                  >
                    {field}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

