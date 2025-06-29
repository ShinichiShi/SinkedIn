import React from 'react'
import { useEffect, useState, useCallback, useRef } from "react";
import Image from 'next/image';
import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
const ImageGallery: FC<ImageGalleryProps> = ({ images, postId }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImageIndex(null);
  };

  const nextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="relative group mt-3">
        {/* Scroll buttons - only show if more than 3 images */}
        {images.length > 3 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollLeft}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 
                p-2 rounded-full bg-black/50 hover:bg-black/70 text-white 
                backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeft size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollRight}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 
                p-2 rounded-full bg-black/50 hover:bg-black/70 text-white 
                backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronRight size={16} />
            </motion.button>
          </>
        )}

        {/* Images container */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {images.map((imageUrl:string, index:any) => (
            <motion.div
              key={`${postId}-image-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex-shrink-0 group/image cursor-pointer"
              onClick={() => openImageModal(index)}
              style={{
                width: images.length === 1 ? '100%' : '280px',
                height: images.length === 1 ? '400px' : '200px',
                maxWidth: images.length === 1 ? '500px' : '280px'
              }}
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden 
                border border-gray-200 dark:border-gray-700/50 bg-gray-100 dark:bg-gray-800/50">
                <Image
                  src={imageUrl}
                  alt={`Post image ${index + 1}`}
                  fill
                  className="object-cover group-hover/image:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 
                  transition-all duration-300 flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="p-2 rounded-full bg-white/90 dark:bg-gray-800/90 
                      text-gray-800 dark:text-white opacity-0 group-hover/image:opacity-100 
                      transition-opacity duration-200"
                  >
                    <Maximize2 size={16} />
                  </motion.div>
                </div>

                {/* Image counter for multiple images */}
                {images.length > 1 && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full 
                    bg-black/60 text-white text-xs backdrop-blur-sm">
                    {index + 1} / {images.length}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll indicator dots for multiple images */}
        {images.length > 3 && (
          <div className="flex justify-center mt-2 gap-1">
            {Array.from({ length: Math.ceil(images.length / 3) }).map((_, index) => (
              <div
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
              />
            ))}
          </div>
        )}
      </div>

      {/* Full-screen image modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeImageModal}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <Image
                  src={images[selectedImageIndex]}
                  alt={`Full size image ${selectedImageIndex + 1}`}
                  width={800}
                  height={600}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
                
                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeImageModal}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 
                    hover:bg-black/70 text-white backdrop-blur-sm"
                >
                  <ChevronRight size={20} className="rotate-45" />
                </motion.button>

                {/* Navigation buttons for multiple images */}
                {images.length > 1 && (
                  <>
                    {selectedImageIndex > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 
                          p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
                      >
                        <ChevronLeft size={24} />
                      </motion.button>
                    )}
                    
                    {selectedImageIndex < images.length - 1 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 
                          p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
                      >
                        <ChevronRight size={24} />
                      </motion.button>
                    )}

                    {/* Image counter */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                      px-3 py-1 rounded-full bg-black/60 text-white text-sm backdrop-blur-sm">
                      {selectedImageIndex + 1} of {images.length}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
export default ImageGallery;
interface ImageGalleryProps {
  images: string[];
  postId: string;
}