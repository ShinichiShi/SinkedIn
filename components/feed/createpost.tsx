'use client';

import React, { useState, useRef } from 'react';
import { Image, Link, Send, User, X, Paperclip, Loader } from 'lucide-react';

export function CreatePost() {  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file);
    } else {
      alert('Please upload an image or PDF file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      // TODO: Implement post creation with file upload
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API call
      console.log('Creating post:', content, selectedFile);
      setContent('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-lg p-6 mb-6 transition-all">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Share Your Story</h3>
            <p className="text-sm text-muted-foreground">Your failures today are tomorrow's success stories.</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            placeholder="What did you learn from your recent failure?"
            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[120px] transition-all"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {selectedFile && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center space-x-2">
              <Paperclip className="w-4 h-4" />
              <span>{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-destructive hover:text-destructive/90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex space-x-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Image className="w-5 h-5" />
              <span className="text-sm font-medium">Add Photo</span>
            </button>
            <button
              type="button"
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Link className="w-5 h-5" />
              <span className="text-sm font-medium">Add Link</span>
            </button>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!content.trim() || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Posting...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Share Failure</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}