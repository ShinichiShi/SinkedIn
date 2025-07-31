"use client";
import { useEffect, useState } from 'react';

interface InfiniteScrollDebugProps {
  posts: any[];
  hasMore: boolean;
  loadingMore: boolean;
  enabled?: boolean;
}

export const InfiniteScrollDebug = ({ 
  posts, 
  hasMore, 
  loadingMore, 
  enabled = process.env.NODE_ENV === 'development'
}: InfiniteScrollDebugProps) => {
  const [loadCount, setLoadCount] = useState(0);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [lastPostCount, setLastPostCount] = useState(0);

  useEffect(() => {
    if (loadingMore) {
      setLoadCount(prev => prev + 1);
      setLastLoadTime(Date.now());
    }
  }, [loadingMore]);

  useEffect(() => {
    if (posts.length !== lastPostCount) {
      setLastPostCount(posts.length);
    }
  }, [posts.length, lastPostCount]);

  if (!enabled) return null;

  const timeSinceLastLoad = lastLoadTime ? Date.now() - lastLoadTime : 0;

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white text-xs p-3 rounded-lg font-mono z-50 max-w-sm">
      <div className="mb-2 font-bold text-green-300">✅ FIXED Infinite Scroll</div>
      <div className="space-y-1">
        <div>Posts: <span className="text-green-400">{posts.length}</span></div>
        <div>Has More: {hasMore ? '✅' : '❌'}</div>
        <div>Loading: {loadingMore ? '🔄 YES' : '⏹️ NO'}</div>
        <div>Load Count: <span className={loadCount > 10 ? 'text-red-400' : 'text-green-400'}>{loadCount}</span></div>
        <div>Last Load: {lastLoadTime ? new Date(lastLoadTime).toLocaleTimeString() : 'Never'}</div>
        <div>Time Since: <span className="text-blue-400">{Math.round(timeSinceLastLoad / 1000)}s</span></div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-green-300 text-xs">✅ Smart Protection</div>
        <div className="text-xs text-gray-400">1s throttle | 300ms debounce</div>
        <div className="text-xs text-gray-400">Post count tracking</div>
        <div className="text-xs text-gray-400">Proper observer cleanup</div>
        {loadCount > 15 && (
          <div className="text-red-400 text-xs mt-1">⚠️ High load count - check for issues</div>
        )}
      </div>
    </div>
  );
};
