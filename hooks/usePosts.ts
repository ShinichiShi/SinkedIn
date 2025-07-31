import { useState, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  where,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const isLoadingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  const processPostsWithUserData = useCallback(async (postsData: Post[]) => {
    try {
      console.log("Processing posts with user data, count:", postsData.length);
      const allUserIds = Array.from(new Set(postsData.map((post: Post) => post.userId)));
      console.log("Unique user IDs to fetch:", allUserIds.length);
      
      // Limit post user fetching to 100 users at a time to avoid overwhelming the system
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
      return postsData; // Return original posts if processing fails
    }
  }, [fetchUsers]);

  const fetchInitialPosts = useCallback(async (tab: 'foryou' | 'following' = activeTab) => {
    console.log("🚀 fetchInitialPosts called with tab:", tab, "isLoadingRef.current:", isLoadingRef.current);
    
    // Use ref to prevent multiple concurrent calls
    if (isLoadingRef.current) {
      console.log("⚠️ fetchInitialPosts: Already loading, returning early");
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    console.log(`🔄 fetchInitialPosts: Starting to fetch initial ${POSTS_PER_PAGE} posts for tab:`, tab);
    
    try {
      let postsQuery;
      
      if (tab === 'following') {
        console.log("fetchInitialPosts: Processing following tab, userFollowing length:", userFollowing.length);
        
        if (userFollowing.length === 0) {
          console.log("fetchInitialPosts: No users being followed, setting empty state");
          setPosts([]);
          setHasMore(false);
          setLastVisible(null);
          return;
        }
        
        // Fetch initial posts from followed users (limited to 20)
        postsQuery = query(
          collection(db, "posts"),
          where("userId", "in", userFollowing.slice(0, 10)), // Take first 10 users only (Firestore limit)
          orderBy("timestamp", "desc"),
          limit(POSTS_PER_PAGE)
        );
        
      } else {
        console.log("fetchInitialPosts: Processing foryou tab - loading initial posts");
        
        // Fetch initial posts for 'foryou' tab (limited to 20)
        postsQuery = query(
          collection(db, "posts"),
          orderBy("timestamp", "desc"),
          limit(POSTS_PER_PAGE)
        );
      }
      
      const documentSnapshots = await getDocs(postsQuery);
      console.log("fetchInitialPosts: Query returned", documentSnapshots.docs.length, "posts");
      
      const postsData = documentSnapshots.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      // Filter out deleted posts on the client side
      const filteredPosts = postsData.filter(post => !post.deleted);
      console.log("fetchInitialPosts: Filtered out deleted posts, remaining:", filteredPosts.length);
      
      // Set last visible document for pagination
      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(lastDoc || null);
      
      // Check if we have more posts to load - if we got exactly POSTS_PER_PAGE, there might be more
      setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);
      
      console.log(`🎯 fetchInitialPosts: hasMore set to ${documentSnapshots.docs.length === POSTS_PER_PAGE}, got ${documentSnapshots.docs.length} docs`);
      
      console.log(`fetchInitialPosts: Fetched ${filteredPosts.length} initial posts for ${tab} tab`);
      
      const processedPosts = await processPostsWithUserData(filteredPosts);
      console.log("fetchInitialPosts: Processed posts, setting state");
      
      setPosts(processedPosts);
      console.log(`fetchInitialPosts: Set ${processedPosts.length} posts in state`);
      
    } catch (error) {
      console.error("fetchInitialPosts: Error fetching posts:", error);
      toast.error("Error loading posts");
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
      lastVisible: !!lastVisible
    });
    
    if (!hasMore || isLoadingMoreRef.current || !lastVisible) {
      console.log("loadMorePosts: Conditions not met for loading more");
      return;
    }
    
    isLoadingMoreRef.current = true;
    setLoadingMore(true);
    console.log("loadMorePosts: Starting to fetch more posts");
    
    try {
      let postsQuery;
      
      if (activeTab === 'following') {
        if (userFollowing.length === 0) {
          console.log("loadMorePosts: No users being followed");
          setHasMore(false);
          return;
        }
        
        // Fetch more posts from followed users
        postsQuery = query(
          collection(db, "posts"),
          where("userId", "in", userFollowing.slice(0, 10)),
          orderBy("timestamp", "desc"),
          startAfter(lastVisible),
          limit(POSTS_PER_PAGE)
        );
        
      } else {
        // Fetch more posts for 'foryou' tab
        postsQuery = query(
          collection(db, "posts"),
          orderBy("timestamp", "desc"),
          startAfter(lastVisible),
          limit(POSTS_PER_PAGE)
        );
      }
      
      const documentSnapshots = await getDocs(postsQuery);
      console.log("loadMorePosts: Query returned", documentSnapshots.docs.length, "more posts");
      
      if (documentSnapshots.docs.length === 0) {
        setHasMore(false);
        console.log("loadMorePosts: No more posts available");
        return;
      }
      
      const morePosts = documentSnapshots.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      // Filter out deleted posts on the client side
      const filteredMorePosts = morePosts.filter(post => !post.deleted);
      console.log("loadMorePosts: Filtered out deleted posts, remaining:", filteredMorePosts.length);
      
      // Update last visible document
      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(lastDoc);
      
      // Check if we have more posts to load
      setHasMore(documentSnapshots.docs.length === POSTS_PER_PAGE);
      
      const processedMorePosts = await processPostsWithUserData(filteredMorePosts);
      
      // Append new posts to existing posts
      setPosts(prevPosts => {
        const existingIds = new Set(prevPosts.map(p => p.id));
        const newPosts = processedMorePosts.filter(p => !existingIds.has(p.id));
        console.log(`loadMorePosts: Adding ${newPosts.length} new posts to existing ${prevPosts.length} posts`);
        return [...prevPosts, ...newPosts];
      });
      
    } catch (error) {
      console.error("loadMorePosts: Error fetching more posts:", error);
      toast.error("Error loading more posts");
    } finally {
      isLoadingMoreRef.current = false;
      setLoadingMore(false);
      console.log("loadMorePosts: Completed");
    }
  }, [activeTab, userFollowing, hasMore, lastVisible, posts.length, loadingMore, processPostsWithUserData]);

  const handleTabChange = useCallback((tab: 'foryou' | 'following') => {
    if (tab === activeTab || isLoadingRef.current) return;
    
    console.log(`Switching to ${tab} tab`);
    
    setActiveTab(tab);
    setPosts([]);
    setHasMore(true);
    setLastVisible(null);
    
    fetchInitialPosts(tab);
  }, [activeTab, fetchInitialPosts]);

  return {
    posts,
    setPosts,
    loading,
    loadingMore,
    activeTab,
    hasMore,
    lastVisible,
    fetchInitialPosts,
    loadMorePosts,
    handleTabChange
  };
};