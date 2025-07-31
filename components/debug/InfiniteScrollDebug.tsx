"use client";
import { useEffect, useState } from 'react';

interface InfiniteScrollDebugProps {
  posts: any[];
  hasMore: boolean;
  loadingMore: boolean;
  enabled?: boolean;
  onReset?: () => void;
  disabled?: boolean;
  hookLoadCount?: number;
}

export const InfiniteScrollDebug = ({ 
  posts, 
  hasMore, 
  loadingMore, 
  enabled = process.env.NODE_ENV === 'development',
  onReset,
  disabled = false,
  hookLoadCount = 0
}: InfiniteScrollDebugProps) => {
  const [loadCount, setLoadCount] = useState(0);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [lastPostCount, setLastPostCount] = useState(0);
  const [loadHistory, setLoadHistory] = useState<Array<{time: number, postCount: number}>>([]);

  useEffect(() => {
    if (loadingMore) {
      setLoadCount(prev => prev + 1);
      setLastLoadTime(Date.now());
    }
  }, [loadingMore]);

  useEffect(() => {
    if (posts.length !== lastPostCount) {
      setLoadHistory(prev => [...prev.slice(-4), { time: Date.now(), postCount: posts.length }]);
      setLastPostCount(posts.length);
    }
  }, [posts.length, lastPostCount]);

  if (!enabled) return null;

  const timeSinceLastLoad = lastLoadTime ? Date.now() - lastLoadTime : 0;
  const isStale = timeSinceLastLoad > 10000; // Consider stale after 10 seconds

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white text-xs p-3 rounded-lg font-mono z-50 max-w-sm">
      <div className="mb-2 font-bold text-yellow-300">🔄 SIMPLIFIED Infinite Scroll</div>
      <div className="space-y-1">
        <div>Posts: <span className="text-green-400">{posts.length}</span></div>
        <div>Has More: {hasMore ? '✅' : '❌'}</div>
        <div>Loading: {loadingMore ? '🔄 YES' : '⏹️ NO'}</div>
        <div>Component Loads: <span className={loadCount > 3 ? 'text-red-400' : 'text-yellow-400'}>{loadCount}</span></div>
        <div>Hook Loads: <span className={hookLoadCount > 3 ? 'text-red-400' : 'text-yellow-400'}>{hookLoadCount}</span></div>
        <div>Disabled: {disabled ? '🔴 YES' : '🟢 NO'}</div>
        <div>Last Load: {lastLoadTime ? new Date(lastLoadTime).toLocaleTimeString() : 'Never'}</div>
        <div>Time Since: <span className={isStale ? 'text-green-400' : 'text-yellow-400'}>{Math.round(timeSinceLastLoad / 1000)}s</span></div>
      </div>
      
      {loadHistory.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-xs text-gray-300 mb-1">Recent Loads:</div>
          {loadHistory.slice(-3).map((entry, i) => (
            <div key={i} className="text-xs text-gray-400">
              {new Date(entry.time).toLocaleTimeString()}: {entry.postCount} posts
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-green-300 text-xs">✅ SIMPLE Protection</div>
        <div className="text-xs text-gray-400">Max: 3 loads | 3s interval</div>
        <div className="text-xs text-gray-400">Hard disable after limit</div>
        {disabled && (
          <div className="text-red-400 text-xs mt-1">� INFINITE SCROLL DISABLED</div>
        )}
        {hookLoadCount >= 3 && (
          <div className="text-red-400 text-xs mt-1">🚨 MAX LOADS REACHED!</div>
        )}
        {onReset && (hookLoadCount > 0 || disabled) && (
          <button 
            onClick={() => {
              setLoadCount(0);
              setLoadHistory([]);
              onReset();
            }}
            className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
          >
            🔄 Reset Everything
          </button>
        )}
      </div>
    </div>
  );
};
