"use client";

import { CldUploadWidget } from 'next-cloudinary';
import { ReactNode } from 'react';

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (url: string) => void;
  variant: 'profile' | 'background' | 'post';
  children?: ReactNode;
}

export function CloudinaryUploadWidget({ onUploadSuccess, variant, children }: CloudinaryUploadWidgetProps) {
  return (
    <CldUploadWidget
      uploadPreset={process.env.CLOUDINARY_UPLOAD_PRESET}
      onSuccess={(result: any) => {
        if (result.info && result.info.secure_url) {
          onUploadSuccess(result.info.secure_url);
        }
      }}
    >
      {({ open }) => (
        <div onClick={() => open()} className="cursor-pointer">
          {children ?? (
            <button
              className="px-4 py-2 text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
            > 
              {variant === 'profile' ? '📷 Change Profile Picture' : '🖼️ Change Background'}
            </button>
          )}
        </div>
      )}
    </CldUploadWidget>
  );
}