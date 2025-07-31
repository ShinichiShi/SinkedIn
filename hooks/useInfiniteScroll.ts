import { useEffect, useRef } from 'react';

export const useInfiniteScroll = (
  loadMorePosts: () => void,
  hasMore: boolean,
  loadingMore: boolean,
  currentPostCount?: number
) => {
  const observerTarget = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastLoadTime = useRef<number>(0);
  const isLoading = useRef<boolean>(false);
  const loadMoreRef = useRef(loadMorePosts);
  
  console.log('useInfiniteScroll: Hook called with:', {
    hasMore,
    loadingMore,
    currentPostCount,
    loadMorePostsType: typeof loadMorePosts
  });
  
  // Update ref when function changes
  loadMoreRef.current = loadMorePosts;
  
  useEffect(() => {
    console.log('useInfiniteScroll: Effect triggered with:', {
      hasMore,
      loadingMore,
      observerTargetExists: !!observerTarget.current
    });
    
    // Clean up existing observer
    if (observerRef.current) {
      console.log('useInfiniteScroll: Cleaning up existing observer');
      observerRef.current.disconnect();
    }

    // Don't create observer if no more posts
    if (!hasMore) {
      console.log('useInfiniteScroll: No more posts available, not creating observer');
      return;
    }

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      try {
        const entry = entries[0];
        
        console.log('useInfiniteScroll: Intersection observed:', {
          isIntersecting: entry?.isIntersecting,
          hasMore,
          loadingMore,
          isLoadingInternal: isLoading.current,
          boundingRect: entry?.boundingClientRect,
          intersectionRatio: entry?.intersectionRatio
        });
        
        if (
          entry?.isIntersecting && 
          hasMore && 
          !loadingMore && 
          !isLoading.current
        ) {
          const now = Date.now();
          
          // Throttle requests - at least 1 second between loads
          if (now - lastLoadTime.current < 1000 && lastLoadTime.current > 0) {
            console.log('useInfiniteScroll: Throttled - too soon since last load:', now - lastLoadTime.current, 'ms');
            return;
          }
          
          isLoading.current = true;
          lastLoadTime.current = now;
          
          console.log('useInfiniteScroll: Triggering loadMorePosts');
          
          try {
            loadMoreRef.current();
            console.log('useInfiniteScroll: loadMorePosts called successfully');
          } catch (loadError) {
            console.error('useInfiniteScroll: Error calling loadMorePosts:', loadError);
            isLoading.current = false;
          }
          
          // Reset loading flag after delay
          setTimeout(() => {
            isLoading.current = false;
            console.log('useInfiniteScroll: Reset internal loading flag');
          }, 1500);
        } else {
          console.log('useInfiniteScroll: Intersection conditions not met for loading');
        }
      } catch (intersectionError) {
        console.error('useInfiniteScroll: Error in handleIntersection:', intersectionError);
        isLoading.current = false;
      }
    };

    try {
      // Create new observer
      const observer = new IntersectionObserver(handleIntersection, {
        threshold: 0.1,
        rootMargin: '50px'
      });

      observerRef.current = observer;
      console.log('useInfiniteScroll: Created new IntersectionObserver');

      // Observe target if available
      if (observerTarget.current) {
        observer.observe(observerTarget.current);
        console.log('useInfiniteScroll: Observer attached to target element');
      } else {
        console.warn('useInfiniteScroll: Observer target not available yet');
      }
    } catch (observerError) {
      console.error('useInfiniteScroll: Error creating IntersectionObserver:', observerError);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        console.log('useInfiniteScroll: Cleaning up observer in effect cleanup');
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore]); // Safe to exclude loadMorePosts since we use ref

  // Reset loading state when loadingMore changes to false
  useEffect(() => {
    console.log('useInfiniteScroll: loadingMore changed to:', loadingMore);
    if (!loadingMore) {
      isLoading.current = false;
      console.log('useInfiniteScroll: Reset internal loading flag due to loadingMore change');
    }
  }, [loadingMore]);

  console.log('useInfiniteScroll: Returning observerTarget ref');
  
  return { 
    observerTarget
  };
};