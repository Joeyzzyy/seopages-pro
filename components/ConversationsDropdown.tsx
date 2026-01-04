'use client';

import { useEffect, useRef } from 'react';
import type { Conversation } from '@/lib/supabase';

interface ConversationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

export default function ConversationsDropdown({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  buttonRef,
}: ConversationsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  // Sort by created_at descending (newest first)
  const sortedConversations = [...conversations].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSelectConversation = (conversationId: string) => {
    onSelectConversation(conversationId);
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-1 w-80 bg-white rounded-xl shadow-2xl border border-[#E5E5E5] flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ maxHeight: '500px' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E5E5E5] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">All Chats</h3>
            <p className="text-[10px] text-[#6B7280] mt-0.5">
              {sortedConversations.length} conversation{sortedConversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#111827] transition-all"
            title="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <div className="w-12 h-12 rounded-full bg-[#F9FAFB] flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-[#D1D5DB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-xs text-[#6B7280]">No conversations yet</p>
          </div>
        ) : (
          <div className="p-2">
            {sortedConversations.map((conv) => {
              const isActive = conv.id === currentConversationId;
              return (
                <div
                  key={conv.id}
                  className={`relative group rounded-lg transition-all mb-1 border ${
                    isActive
                      ? 'bg-gradient-to-br from-[#FFF7ED] to-[#F3F4F6] border-[#111827]'
                      : 'bg-white hover:bg-[#F9FAFB] border-transparent hover:border-[#E5E5E5]'
                  }`}
                >
                  <button
                    onClick={() => handleSelectConversation(conv.id)}
                    className="w-full text-left p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        {isActive && (
                          <div 
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)'
                            }}
                          />
                        )}
                        <h4 className="text-xs font-bold text-[#111827] truncate">
                          {conv.title || 'Untitled'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-[#9CA3AF] font-medium">
                          {formatDate(conv.created_at)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                          className="p-1 rounded hover:bg-red-50 text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                          title="Delete conversation"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {conv.description && (
                      <p className="text-[10px] text-[#6B7280] line-clamp-2 leading-relaxed ml-3">
                        {conv.description}
                      </p>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

