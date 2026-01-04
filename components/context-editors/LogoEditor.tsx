'use client';

import { useState, useEffect } from 'react';

interface LogoEditorProps {
  logoUrl?: string;
  onLogoChange: (file: File | null, previewUrl: string | null) => void;
}

export default function LogoEditor({ logoUrl, onLogoChange }: LogoEditorProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(logoUrl || null);

  useEffect(() => {
    if (logoUrl) {
      setLogoPreviewUrl(logoUrl);
    }
  }, [logoUrl]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result as string;
        setLogoPreviewUrl(previewUrl);
        onLogoChange(file, previewUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[#374151] mb-2">
        Logo
      </label>
      <div className="flex gap-4 items-start">
        {/* Upload Section */}
        <div className="flex-1">
          <input
            type="file"
            id="logo-upload"
            accept="image/*"
            onChange={handleLogoFileChange}
            className="sr-only"
          />
          <label
            htmlFor="logo-upload"
            className="inline-flex items-center px-3 py-1.5 border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#374151] bg-white hover:bg-[#F9FAFB] cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5 mr-1.5 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Logo
          </label>
          {logoFile && (
            <p className="text-xs text-[#6B7280] mt-2">
              {logoFile.name}
            </p>
          )}
        </div>

        {/* Preview Section */}
        {logoPreviewUrl && (
          <div className="flex-1 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]">
            <div className="flex items-center justify-center h-20">
              <img
                src={logoPreviewUrl}
                alt="Logo preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

