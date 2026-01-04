'use client';

import { useState } from 'react';
import type { FileRecord } from '@/lib/supabase';

interface SkillsAndArtifactsSidebarProps {
  skills: any[];
  files: FileRecord[];
  onPlaybookClick: (skill: any) => void;
  onDeleteFile: (fileId: string, storagePath: string) => void;
}

// Helper function to get file extension and icon
const getFileTypeInfo = (filename: string, mimeType?: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  // Define file type groups with colors and icons
  const fileTypes: Record<string, { color: string; bg: string; icon: string }> = {
    // Documents
    'pdf': { color: '#EF4444', bg: '#FEF2F2', icon: 'PDF' },
    'doc': { color: '#2563EB', bg: '#EFF6FF', icon: 'DOC' },
    'docx': { color: '#2563EB', bg: '#EFF6FF', icon: 'DOC' },
    'txt': { color: '#6B7280', bg: '#F3F4F6', icon: 'TXT' },
    
    // Spreadsheets
    'xls': { color: '#10B981', bg: '#ECFDF5', icon: 'XLS' },
    'xlsx': { color: '#10B981', bg: '#ECFDF5', icon: 'XLS' },
    'csv': { color: '#10B981', bg: '#ECFDF5', icon: 'CSV' },
    
    // Presentations
    'ppt': { color: '#F59E0B', bg: '#FEF3C7', icon: 'PPT' },
    'pptx': { color: '#F59E0B', bg: '#FEF3C7', icon: 'PPT' },
    
    // Images
    'jpg': { color: '#8B5CF6', bg: '#F5F3FF', icon: 'JPG' },
    'jpeg': { color: '#8B5CF6', bg: '#F5F3FF', icon: 'JPG' },
    'png': { color: '#8B5CF6', bg: '#F5F3FF', icon: 'PNG' },
    'gif': { color: '#8B5CF6', bg: '#F5F3FF', icon: 'GIF' },
    'svg': { color: '#8B5CF6', bg: '#F5F3FF', icon: 'SVG' },
    'webp': { color: '#8B5CF6', bg: '#F5F3FF', icon: 'WEBP' },
    
    // Code
    'js': { color: '#F59E0B', bg: '#FEF3C7', icon: 'JS' },
    'ts': { color: '#2563EB', bg: '#EFF6FF', icon: 'TS' },
    'jsx': { color: '#06B6D4', bg: '#ECFEFF', icon: 'JSX' },
    'tsx': { color: '#06B6D4', bg: '#ECFEFF', icon: 'TSX' },
    'html': { color: '#EF4444', bg: '#FEF2F2', icon: 'HTML' },
    'css': { color: '#2563EB', bg: '#EFF6FF', icon: 'CSS' },
    'json': { color: '#10B981', bg: '#ECFDF5', icon: 'JSON' },
    'xml': { color: '#F59E0B', bg: '#FEF3C7', icon: 'XML' },
    
    // Archives
    'zip': { color: '#6B7280', bg: '#F3F4F6', icon: 'ZIP' },
    'rar': { color: '#6B7280', bg: '#F3F4F6', icon: 'RAR' },
    'tar': { color: '#6B7280', bg: '#F3F4F6', icon: 'TAR' },
    
    // Others
    'md': { color: '#374151', bg: '#F9FAFB', icon: 'MD' },
  };
  
  return fileTypes[ext] || { color: '#9CA3AF', bg: '#F3F4F6', icon: ext.toUpperCase().slice(0, 3) || 'FILE' };
};

export default function SkillsAndArtifactsSidebar({
  skills,
  files,
  onPlaybookClick,
  onDeleteFile,
}: SkillsAndArtifactsSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<'research' | 'build' | 'optimize' | 'monitor'>('research');
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const playbookSkills = skills.filter(s => s.metadata?.category !== 'system');
  
  const categoryOrder = ['research', 'build', 'optimize', 'monitor'];
  
  // Extract and sort all categories dynamically
  const dynamicCategories = Array.from(new Set(playbookSkills.map(s => s.metadata?.category).filter(Boolean))) as string[];
  dynamicCategories.sort((a, b) => {
    const aIdx = categoryOrder.indexOf(a);
    const bIdx = categoryOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  
  const categoryNames: Record<string, string> = {
    research: 'Research',
    build: 'Build',
    optimize: 'Optimize',
    monitor: 'Monitor'
  };

  const categories = dynamicCategories.map(id => ({
    id,
    name: categoryNames[id] || id.charAt(0).toUpperCase() + id.slice(1)
  }));

  const groupedSkills: Record<string, any[]> = {};

  // Populate skills for each category
  dynamicCategories.forEach(cat => {
    groupedSkills[cat] = playbookSkills.filter(s => s.metadata?.category === cat);
  });

  Object.keys(groupedSkills).forEach(cat => {
    groupedSkills[cat].sort((a, b) => {
      // 1. Prioritize OpenSource skills
      const aIsOS = !!a.metadata?.isOpenSource;
      const bIsOS = !!b.metadata?.isOpenSource;
      if (aIsOS !== bIsOS) return aIsOS ? -1 : 1;

      // 2. Sort by availability (playbook trigger present)
      const aAvail = !!a.metadata?.playbook?.trigger;
      const bAvail = !!b.metadata?.playbook?.trigger;
      if (aAvail !== bAvail) return aAvail ? -1 : 1;

      // 3. Sort by priority
      const aPriority = parseInt(a.metadata?.priority || '99');
      const bPriority = parseInt(b.metadata?.priority || '99');
      if (aPriority !== bPriority) return aPriority - bPriority;

      return a.name.localeCompare(b.name);
    });
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg className="w-4 h-4 text-[#10B981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
      </svg>
    );
  };

  return (
    <>
    <aside className="w-80 bg-white border border-[#E5E5E5] rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* Skills Section (Top 1/2) */}
      <div className="flex flex-col h-1/2 min-h-0 border-b border-[#E5E5E5]">
        <div className="px-4 py-1.5 text-xs font-bold text-[#111827] uppercase tracking-wider shrink-0 border-b border-[#E5E5E5] h-10 flex items-center">
          Playbooks
        </div>
        
        {/* Category Tabs */}
        <div className="px-2 pb-2 shrink-0">
          <div className="flex gap-1 bg-[#FAFAFA] rounded-lg p-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              if (groupedSkills[cat.id]?.length === 0) return null;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                    isActive 
                      ? 'bg-white text-[#111827] shadow-sm' 
                      : 'text-[#9CA3AF] hover:text-[#6B7280]'
                  }`}
                  title={cat.name}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills List */}
        <div className="flex-1 overflow-y-auto thin-scrollbar px-2 pb-2">
          <div className="space-y-1">
            {groupedSkills[activeCategory]?.map((skill) => {
              const isAvailable = !!skill.metadata?.playbook?.trigger;
              
              return (
                <button
                  key={skill.id}
                  onClick={() => {
                    if (isAvailable) {
                      onPlaybookClick(skill);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`w-full group flex items-start gap-2 p-2 rounded-lg transition-all text-left ${
                    isAvailable
                      ? 'hover:bg-[#FAFAFA] cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                  title={skill.description}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[11px] font-bold truncate ${
                        isAvailable ? 'text-[#374151]' : 'text-[#9CA3AF]'
                      }`}>
                        {skill.name.split(': ')[1] || skill.name}
                      </span>
                      {skill.metadata?.isOpenSource && (
                        <span className="flex-none px-1 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[6px] font-black tracking-tighter border border-emerald-100 uppercase">
                          Open
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] line-clamp-2 leading-relaxed">
                      {skill.description}
                    </span>
                  </div>
                  {!isAvailable ? (
                    <span className="text-[8px] font-black text-[#D1D5DB] uppercase tracking-tighter bg-[#FAFAFA] px-1.5 py-0.5 rounded border border-[#F5F5F5] shrink-0 mt-0.5">Soon</span>
                  ) : (
                    <svg className="w-3 h-3 text-[#E5E5E5] group-hover:text-[#111827] transition-colors shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Artifacts Section (Bottom 1/2) */}
      <div className="flex flex-col h-1/2 min-h-0">
        <div className="px-4 py-1.5 text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center justify-between shrink-0 border-b border-[#E5E5E5] h-10">
          <span>Artifacts</span>
          <span className="bg-[#F3F4F6] text-[#6B7280] px-1.5 py-0.5 rounded text-[11px] font-medium">
            {files.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto thin-scrollbar px-2 pb-2">
          {files.length === 0 ? (
            <div className="px-3 py-4 text-[11px] text-[#9CA3AF] italic text-center">
              No files yet
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((file) => {
                const fileInfo = getFileTypeInfo(file.filename, file.file_type);
                
                return (
                  <div
                    key={file.id}
                    className="group flex items-center gap-2 p-2 rounded-lg hover:bg-[#FAFAFA] transition-all cursor-pointer"
                    onClick={() => setPreviewFile(file)}
                  >
                    {/* File Type Badge */}
                    <div 
                      className="shrink-0 w-10 h-10 rounded flex items-center justify-center text-[9px] font-black"
                      style={{ 
                        backgroundColor: fileInfo.bg,
                        color: fileInfo.color
                      }}
                    >
                      {fileInfo.icon}
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-[#374151] truncate">
                        {file.filename}
                      </div>
                      <div className="text-[10px] text-[#9CA3AF]">
                        {new Date(file.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    {/* Action Buttons - Always visible */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Download Button */}
                      {file.public_url && (
                        <a
                          href={file.public_url}
                          download={file.filename}
                          className="p-1 hover:bg-white rounded transition-all cursor-pointer"
                          title="Download File"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-3.5 h-3.5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>

    {/* File Preview Modal */}
    {previewFile && (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setPreviewFile(null)}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded flex items-center justify-center text-[9px] font-black shrink-0"
                style={{ 
                  backgroundColor: getFileTypeInfo(previewFile.filename).bg,
                  color: getFileTypeInfo(previewFile.filename).color
                }}
              >
                {getFileTypeInfo(previewFile.filename).icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111827]">{previewFile.filename}</h3>
                <p className="text-sm text-[#6B7280]">
                  {new Date(previewFile.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Download Button */}
              {previewFile.public_url && (
                <a
                  href={previewFile.public_url}
                  download={previewFile.filename}
                  className="px-4 py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download
                </a>
              )}
              {/* Close Button */}
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-hidden p-6">
            {previewFile.public_url && (
              <div className="w-full h-full">
                {/* Image Preview */}
                {previewFile.mime_type?.startsWith('image/') ? (
                  <img 
                    src={previewFile.public_url} 
                    alt={previewFile.filename}
                    className="max-w-full max-h-full object-contain mx-auto"
                  />
                ) : previewFile.mime_type === 'application/pdf' ? (
                  /* PDF Preview */
                  <iframe
                    src={previewFile.public_url}
                    className="w-full h-full border-0 rounded-lg"
                    title={previewFile.filename}
                  />
                ) : previewFile.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     previewFile.mime_type === 'application/msword' ||
                     previewFile.mime_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     previewFile.mime_type === 'application/vnd.ms-excel' ||
                     previewFile.mime_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                     previewFile.mime_type === 'application/vnd.ms-powerpoint' ||
                     previewFile.filename.endsWith('.doc') ||
                     previewFile.filename.endsWith('.docx') ||
                     previewFile.filename.endsWith('.xls') ||
                     previewFile.filename.endsWith('.xlsx') ||
                     previewFile.filename.endsWith('.ppt') ||
                     previewFile.filename.endsWith('.pptx') ? (
                  /* Office Documents - Google Docs Viewer */
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.public_url)}&embedded=true`}
                    className="w-full h-full border-0 rounded-lg"
                    title={`${previewFile.filename} preview`}
                  />
                ) : previewFile.mime_type?.startsWith('text/') || 
                     previewFile.file_type === 'csv' || 
                     previewFile.file_type === 'json' ? (
                  /* Text/CSV/JSON Preview */
                  <iframe
                    src={previewFile.public_url}
                    className="w-full h-full border border-[#E5E5E5] rounded-lg"
                    title={previewFile.filename}
                  />
                ) : (
                  /* Generic Preview */
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div 
                      className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-black mb-4"
                      style={{ 
                        backgroundColor: getFileTypeInfo(previewFile.filename).bg,
                        color: getFileTypeInfo(previewFile.filename).color
                      }}
                    >
                      {getFileTypeInfo(previewFile.filename).icon}
                    </div>
                    <p className="text-lg font-medium text-[#374151] mb-2">{previewFile.filename}</p>
                    <p className="text-sm text-[#6B7280] mb-6">Preview not available for this file type</p>
                    <a
                      href={previewFile.public_url}
                      download={previewFile.filename}
                      className="px-6 py-3 rounded-lg text-sm font-medium text-white transition-all shadow-sm hover:shadow-md"
                      style={{
                        background: 'linear-gradient(80deg, rgb(255, 175, 64) -21.49%, rgb(209, 148, 236) 18.44%, rgb(154, 143, 234) 61.08%, rgb(101, 180, 255) 107.78%)'
                      }}
                    >
                      Download File
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

