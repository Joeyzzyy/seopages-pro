'use client';

import { useState } from 'react';

interface TaskStep {
  step_number: number;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface TasksPanelProps {
  conversationId?: string;
  tasks: TaskStep[];
}

export default function TasksPanel({ conversationId, tasks }: TasksPanelProps) {
  if (!conversationId || tasks.length === 0) {
    return (
      <div className="px-3 py-4 text-[11px] text-[#9CA3AF] italic text-center">
        Tasks will appear here when execution starts
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tasks.map((task) => {
        const isCompleted = task.status === 'completed';
        const isInProgress = task.status === 'in_progress';
        const isFailed = task.status === 'failed';
        
        return (
          <div
            key={task.step_number}
            className="px-2 py-1.5 hover:bg-[#F9FAFB] transition-colors rounded"
          >
            <div className="flex items-center gap-2">
              {/* Status Icon */}
              <div className="flex items-center justify-center w-3 h-3 flex-shrink-0">
                {isCompleted && (
                  <svg className="w-3 h-3 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isInProgress && (
                  <svg className="w-3 h-3 text-[#F59E0B] animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                {isFailed && (
                  <svg className="w-3 h-3 text-[#EF4444]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
                {!isCompleted && !isInProgress && !isFailed && (
                  <svg className="w-3 h-3 text-[#D1D5DB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </div>

              {/* Task Description */}
              <p className={`text-[11px] text-[#374151] flex-1 ${isCompleted ? 'line-through opacity-60' : ''}`}>
                {task.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

