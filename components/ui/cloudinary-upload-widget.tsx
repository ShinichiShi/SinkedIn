"use client";

import { CldUploadWidget } from 'next-cloudinary';

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (url: string) => void;
  variant: 'profile' | 'background';
}

export function CloudinaryUploadWidget({ onUploadSuccess, variant }: CloudinaryUploadWidgetProps) {
  return (
    <CldUploadWidget
      uploadPreset="sinkedin_uploads"
      onUpload={(result: any) => {
        if (result.info && result.info.secure_url) {
          onUploadSuccess(result.info.secure_url);
        }
      }}
    >
      {({ open }) => (
        <button
          onClick={() => open()}
          className="px-4 py-2 text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
        >
          {variant === 'profile' ? '📷 Change Profile Picture' : '🖼️ Change Background'}
        </button>
      )}
    </CldUploadWidget>
  );
}
