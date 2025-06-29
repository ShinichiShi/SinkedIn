import React from 'react'
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { X,Plus } from "lucide-react";
interface PostImage {
  file: File;
  preview: string;
  id: string;
}
interface ImagePreviewProps {
  postImages: PostImage[];
  removeImage: (id: string) => void;
  maxImages: number;
  handleFileSelect: (files: FileList) => void;
}
export default function ImagePreview({postImages,removeImage,maxImages,handleFileSelect}:ImagePreviewProps) {
  return (
    <AnimatePresence>
                {postImages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="relative"
                  >
                    {/* Scrollable container */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      <style jsx>{`
                        .scrollbar-hide {
                          -ms-overflow-style: none;
                          scrollbar-width: none;
                        }
                        .scrollbar-hide::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      
                      {postImages.map((image:any, index:any) => (
                        <motion.div
                          key={image.id}
                          initial={{ opacity: 0, scale: 0.8, x: 20 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden 
                            border border-slate-600/40 group bg-slate-700/30"
                        >
                          <Image
                            src={image.preview}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          
                          {/* Remove button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeImage(image.id)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 
                              hover:bg-red-500/80 text-white transition-colors duration-200 
                              backdrop-blur-sm opacity-0 group-hover:opacity-100"
                          >
                            <X size={12} />
                          </motion.button>
                          
                          {/* Image counter */}
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full 
                            bg-slate-900/80 text-white text-xs backdrop-blur-sm">
                            {index + 1}
                          </div>

                          {/* Preview indicator */}
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full 
                            bg-blue-500/80 text-white text-xs backdrop-blur-sm">
                            Preview
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Add more button at the end */}
                      {postImages.length < maxImages && (
                        <motion.label
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-shrink-0 w-32 h-32 rounded-xl border-2 border-dashed 
                            border-slate-600/60 hover:border-slate-500/80 transition-colors duration-200 
                            flex flex-col items-center justify-center cursor-pointer bg-slate-700/20 
                            hover:bg-slate-700/40 group"
                        >
                          <Plus size={20} className="text-slate-400 group-hover:text-slate-300 mb-1" />
                          <span className="text-xs text-slate-400 group-hover:text-slate-300">
                            Add More
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                            className="hidden"
                          />
                        </motion.label>
                      )}
                    </div>

                    {/* Scroll indicator */}
                    {postImages.length > 3 && (
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 
                        bg-gradient-to-l from-slate-800/80 to-transparent w-8 h-full 
                        pointer-events-none flex items-center justify-end pr-1">
                        <div className="w-1 h-8 bg-slate-500/50 rounded-full" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
  )
}
