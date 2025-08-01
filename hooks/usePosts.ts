
// hooks/usePosts.ts (Updated)
import { useState, useCallback, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { Post } from '@/types';
import { toast } from 'react-toastify';

const POSTS_PER_PAGE = 20;

export const usePosts = (userFollowing: string[], userCache: Map<string, any>, fetchUsers: (userIds: string[], maxUsers?: number) => Promise<Map<string, any>>) => {
  console.log("🔥 usePosts hook initialized", { userFollowingLength: userFollowing.length });
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const isLoadingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  const getAuthToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    return await currentUser.getIdToken();
  };

  const processPostsWithUserData = useCallback(async (postsData: Post[]) => {
    try {
      console.log("Processing posts with user data, count:", postsData.length);
      const allUserIds = Array.from(new Set(postsData.map((post: Post) => post.userId)));
      console.log("Unique user IDs to fetch:", allUserIds.length);
      
      const updatedUserCache = await fetchUsers(allUserIds, 100);
      console.log("Updated user cache size:", updatedUserCache.size);
      
      const postsWithProfilePics: Post[] = postsData.map((post: Post) => {
        const userData = updatedUserCache.get(post.userId);
        return {
          ...post,
          userProfilePic: userData?.profilepic || null,
          userName: userData?.username || post.userName || "Anonymous"
        };
      });
      
      console.log("Processed posts with profile pics:", postsWithProfilePics.length);
      return postsWithProfilePics;
    } catch (error) {
      console.error("Error in processPostsWithUserData:", error);
      toast.error("Error processing posts with user data");
      return postsData;
    }
  }, [fetchUsers]);

  const fetchInitialPosts = useCallback(async (tab: 'foryou' | 'following' = activeTab) => {
    console.log("🚀 fetchInitialPosts called with tab:", tab, "isLoadingRef.current:", isLoadingRef.current);
    
    if (isLoadingRef.current) {
      console.log("⚠️ fetchInitialPosts: Already loading, returning early");
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    console.log(`🔄 fetchInitialPosts: Starting to fetch initial ${POSTS_PER_PAGE} posts for tab:`, tab);
    
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        tab,
        page: '0',
        limit: POSTS_PER_PAGE.toString(),
      });

      if (tab === 'following' && userFollowing.length > 0) {
        params.append('following', userFollowing.join(','));
      }

      const response = await fetch(`/api/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch posts');
      }

      const { posts: postsData, hasMore: moreAvailable } = await response.json();
      console.log("fetchInitialPosts: API returned", postsData.length, "posts");
      
      setHasMore(moreAvailable);
      setCurrentPage(0);
      
      const processedPosts = await processPostsWithUserData(postsData);
      console.log("fetchInitialPosts: Processed posts, setting state");
      
      setPosts(processedPosts);
      console.log(`fetchInitialPosts: Set ${processedPosts.length} posts in state`);
      
    } catch (error) {
      console.error("fetchInitialPosts: Error fetching posts:", error);
      toast.error(error instanceof Error ? error.message : "Error loading posts");
      setHasMore(false);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
      console.log("fetchInitialPosts: Completed, loading set to false");
    }
  }, [activeTab, userFollowing, processPostsWithUserData]);

  const loadMorePosts = useCallback(async () => {
    console.log("loadMorePosts called, current state:", {
      hasMore,
      loadingMore,
      postsLength: posts.length,
      currentPage
    });
    
    if (!hasMore || isLoadingMoreRef.current) {
      console.log("loadMorePosts: Conditions not met for loading more");
      return;
    }
    
    isLoadingMoreRef.current = true;
    setLoadingMore(true);
    console.log("loadMorePosts: Starting to fetch more posts");
    
    try {
      const token = await getAuthToken();
      const nextPage = currentPage + 1;
      const params = new URLSearchParams({
        tab: activeTab,
        page: nextPage.toString(),
        limit: POSTS_PER_PAGE.toString(),
      });

      if (activeTab === 'following' && userFollowing.length > 0) {
        params.append('following', userFollowing.join(','));
      }

      const response = await fetch(`/api/posts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch more posts');
      }

      const { posts: morePosts, hasMore: moreAvailable } = await response.json();
      console.log("loadMorePosts: API returned", morePosts.length, "more posts");
      
      if (morePosts.length === 0) {
        setHasMore(false);
        console.log("loadMorePosts: No more posts available");
        return;
      }
      
      setHasMore(moreAvailable);
      setCurrentPage(nextPage);
      
      const processedMorePosts = await processPostsWithUserData(morePosts);
      
      setPosts(prevPosts => {
        const existingIds = new Set(prevPosts.map(p => p.id));
        const newPosts = processedMorePosts.filter(p => !existingIds.has(p.id));
        console.log(`loadMorePosts: Adding ${newPosts.length} new posts to existing ${prevPosts.length} posts`);
        return [...prevPosts, ...newPosts];
      });
      
    } catch (error) {
      console.error("loadMorePosts: Error fetching more posts:", error);
      toast.error(error instanceof Error ? error.message : "Error loading more posts");
    } finally {
      isLoadingMoreRef.current = false;
      setLoadingMore(false);
      console.log("loadMorePosts: Completed");
    }
  }, [activeTab, userFollowing, hasMore, currentPage, processPostsWithUserData]);

  const handleTabChange = useCallback((tab: 'foryou' | 'following') => {
    if (tab === activeTab || isLoadingRef.current) return;
    
    console.log(`Switching to ${tab} tab`);
    
    setActiveTab(tab);
    setPosts([]);
    setHasMore(true);
    setCurrentPage(0);
    
    fetchInitialPosts(tab);
  }, [activeTab, fetchInitialPosts]);

  return {
    posts,
    setPosts,
    loading,
    loadingMore,
    activeTab,
    hasMore,
    fetchInitialPosts,
    loadMorePosts,
    handleTabChange
  };
};
