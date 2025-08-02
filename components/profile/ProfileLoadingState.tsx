// components/profile/ProfileLoadingState.tsx
import React from 'react';

interface ProfileLoadingStateProps {
  isLoading: boolean;
  loadingProgress?: number;
  error?: string | null;
  children: React.ReactNode;
}

export const ProfileLoadingState: React.FC<ProfileLoadingStateProps> = ({
  isLoading,
  loadingProgress = 0,
  error,
  children
}) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {/* Main spinner */}
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-blue-400 font-bold text-sm">{Math.round(loadingProgress)}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>

          {/* Loading text */}
          <h2 className="text-xl font-semibold text-white mb-2">Loading Profile</h2>
          <p className="text-gray-400 text-sm">
            {loadingProgress < 30 && "Authenticating..."}
            {loadingProgress >= 30 && loadingProgress < 50 && "Fetching user data..."}
            {loadingProgress >= 50 && loadingProgress < 80 && "Loading posts..."}
            {loadingProgress >= 80 && "Almost ready..."}
          </p>

          {/* Timeout warning */}
          {loadingProgress > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              Maximum wait time: 10 seconds
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2 text-white">Something went wrong</h1>
          <p className="text-gray-400 mb-6 text-sm">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors w-full"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.history.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors w-full"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Loading skeleton for posts with shimmer effect
export const PostsLoadingSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 relative overflow-hidden">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
);

// Simple inline loader for posts section
export const PostsInlineLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
    <p className="text-gray-400 text-sm">Loading posts...</p>
    <p className="text-gray-500 text-xs mt-1">Maximum wait: 10 seconds</p>
  </div>
);
