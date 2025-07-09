import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface PostImage {
  file: File;
  preview: string;
  id: string;
}

export const useImageHandling = (maxImages: number) => {
  const [postImages, setPostImages] = useState<PostImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleFileSelect = useCallback((files: FileList) => {
    const newImages: PostImage[] = [];
    
    Array.from(files).forEach((file) => {
      if (postImages.length + newImages.length >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image size should be less than 10MB');
        return;
      }

      const preview = URL.createObjectURL(file);
      const newImage: PostImage = {
        file,
        preview,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };

      newImages.push(newImage);
    });

    if (newImages.length > 0) {
      setPostImages(prev => [...prev, ...newImages]);
    }
  }, [postImages.length, maxImages]);

  const removeImage = useCallback((imageId: string) => {
    setPostImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  }, []);

  const uploadImagesToCloudinary = useCallback(async (images: PostImage[]): Promise<string[]> => {
    if (images.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const image of images) {
        const url = await uploadToCloudinary(image.file);
        uploadedUrls.push(url);
      }
      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw new Error("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  }, []);

  return {
    postImages,
    setPostImages,
    uploadingImages,
    handleFileSelect,
    removeImage,
    uploadImagesToCloudinary
  };
};