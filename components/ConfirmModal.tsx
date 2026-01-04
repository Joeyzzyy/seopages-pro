'use client';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export default function ConfirmModal({ 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm, 
  onCancel,
  isDangerous = false
}: ConfirmModalProps) {
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50" 
        onClick={onCancel}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full ${isDangerous ? 'bg-[#FEF2F2]' : 'bg-[#F3F4F6]'} flex items-center justify-center flex-shrink-0`}>
                <svg className={`w-6 h-6 ${isDangerous ? 'text-[#EF4444]' : 'text-[#6B7280]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isDangerous ? (
                    <>
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </>
                  ) : (
                    <circle cx="12" cy="12" r="10" />
                  )}
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#111827] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 bg-white border border-[#E5E5E5] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isDangerous 
                    ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                    : 'bg-[#111827] text-white hover:bg-[#374151]'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}





