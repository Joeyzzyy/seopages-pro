'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface KnowledgeFile {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  description: string | null;
  tags: string[] | null;
  created_at: string;
  url: string | null;
}

interface KnowledgeSectionProps {
  projectId: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// File type icon component
function FileIcon({ mimeType, className = "w-4 h-4" }: { mimeType: string; className?: string }) {
  // PDF
  if (mimeType === 'application/pdf') {
    return (
      <svg className={`${className} text-red-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M10 12h4M10 16h4M8 12h.01M8 16h.01" />
      </svg>
    );
  }
  // Word documents
  if (mimeType.includes('msword') || mimeType.includes('wordprocessingml')) {
    return (
      <svg className={`${className} text-blue-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
        <line x1="8" y1="9" x2="10" y2="9" />
      </svg>
    );
  }
  // Excel/Spreadsheets
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType === 'text/csv') {
    return (
      <svg className={`${className} text-green-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <rect x="8" y="12" width="8" height="6" rx="1" />
        <line x1="12" y1="12" x2="12" y2="18" />
        <line x1="8" y1="15" x2="16" y2="15" />
      </svg>
    );
  }
  // JSON
  if (mimeType === 'application/json') {
    return (
      <svg className={`${className} text-yellow-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M8 13h2l1 3 2-6 1 3h2" />
      </svg>
    );
  }
  // Markdown
  if (mimeType === 'text/markdown') {
    return (
      <svg className={`${className} text-gray-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M7 15v-4l2 2 2-2v4M15 11v4m0-4l2 2m-2-2l-2 2" />
      </svg>
    );
  }
  // Plain text
  if (mimeType === 'text/plain') {
    return (
      <svg className={`${className} text-gray-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="14" y2="17" />
      </svg>
    );
  }
  // Images
  if (mimeType.startsWith('image/')) {
    return (
      <svg className={`${className} text-purple-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  // Default file icon
  return (
    <svg className={`${className} text-gray-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileTypeLabel(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'text/plain': 'TXT',
    'text/csv': 'CSV',
    'text/markdown': 'MD',
    'application/json': 'JSON',
    'image/png': 'PNG',
    'image/jpeg': 'JPG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
  };
  return typeMap[mimeType] || 'File';
}

export default function KnowledgeSection({ projectId }: KnowledgeSectionProps) {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; fileId: string; fileName: string }>({
    isOpen: false,
    fileId: '',
    fileName: ''
  });
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch files on mount and when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchFiles();
    }
  }, [projectId]);

  const fetchFiles = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/knowledge?projectId=${projectId}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files');
      }

      setFiles(data.files || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !projectId) return;

    const file = fileList[0];

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 10MB limit`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      // Add new file to list
      setFiles(prev => [data.file, ...prev]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const openDeleteConfirm = (file: KnowledgeFile) => {
    setDeleteConfirm({ isOpen: true, fileId: file.id, fileName: file.file_name });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false, fileId: '', fileName: '' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.fileId) return;
    
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/knowledge?id=${deleteConfirm.fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete file');
      }

      // Remove from list
      setFiles(prev => prev.filter(f => f.id !== deleteConfirm.fileId));
      closeDeleteConfirm();
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  if (!projectId) {
    return (
      <div className="p-4 text-center text-xs text-[#9CA3AF]">
        Select a project to manage knowledge files
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragOver
            ? 'border-[#9A8FEA] bg-[#F5F3FF]'
            : 'border-[#E5E5E5] hover:border-[#D1D5DB]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.md,.json,.png,.jpg,.jpeg,.gif,.webp"
        />

        {uploading ? (
          <div className="py-2">
            <div className="animate-spin w-5 h-5 border-2 border-[#9A8FEA] border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs text-[#6B7280]">Uploading...</p>
          </div>
        ) : (
          <div className="py-2">
            <svg
              className="w-6 h-6 mx-auto mb-2 text-[#9CA3AF]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
            <p className="text-xs text-[#6B7280] mb-1">
              Drag & drop or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[#9A8FEA] hover:underline"
              >
                browse
              </button>
            </p>
            <p className="text-[10px] text-[#9CA3AF]">
              PDF, DOC, XLS, TXT, CSV, MD, JSON, Images • Max 10MB
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}

      {/* File List */}
      <div className="space-y-1.5">
        {loading ? (
          <div className="py-4 text-center">
            <div className="animate-spin w-5 h-5 border-2 border-[#9CA3AF] border-t-transparent rounded-full mx-auto" />
          </div>
        ) : files.length === 0 ? (
          <div className="py-4 text-center text-xs text-[#9CA3AF]">
            No knowledge files uploaded yet
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 p-2 bg-[#F9FAFB] rounded-lg group"
            >
              {/* File Icon */}
              <div className="w-8 h-8 flex items-center justify-center bg-white rounded border border-[#E5E5E5] flex-shrink-0">
                <FileIcon mimeType={file.file_type} className="w-4 h-4" />
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#374151] truncate">
                  {file.file_name}
                </p>
                <p className="text-[10px] text-[#9CA3AF]">
                  {getFileTypeLabel(file.file_type)} • {formatFileSize(file.file_size)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-[#6B7280] hover:text-[#374151] hover:bg-white rounded"
                    title="Download"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                )}
                <button
                  onClick={() => setDeleteConfirm({ isOpen: true, fileId: file.id, fileName: file.file_name })}
                  className="p-1 text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* File Count */}
      {files.length > 0 && (
        <div className="text-[10px] text-[#9CA3AF] text-center">
          {files.length} file{files.length !== 1 ? 's' : ''} •{' '}
          {formatFileSize(files.reduce((sum, f) => sum + f.file_size, 0))} total
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setDeleteConfirm({ isOpen: false, fileId: '', fileName: '' })} 
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Warning Icon */}
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-[#111827] text-center mb-2">
              Delete File
            </h3>
            
            {/* Message */}
            <p className="text-sm text-[#6B7280] text-center mb-6">
              Are you sure you want to delete <span className="font-medium text-[#374151]">"{deleteConfirm.fileName}"</span>? This action cannot be undone.
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, fileId: '', fileName: '' })}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#E5E5E5] rounded-lg hover:bg-[#F9FAFB] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

