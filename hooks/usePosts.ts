import { useState, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '@/types';
import { toast } from 'react-toastify';

export const usePosts = (userFollowing: string[], userCache: Map<string, any>, fetchUsers: (userIds: string[], maxUsers?: number) => Promise<Map<string, any>>) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const isLoadingRef = useRef(false);

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

  const fetchAllPosts = useCallback(async (tab: 'foryou' | 'following' = activeTab) => {
    console.log("fetchAllPosts called with tab:", tab, "isLoadingRef.current:", isLoadingRef.current);
    
    // Use ref to prevent multiple concurrent calls
    if (isLoadingRef.current) {
      console.log("fetchAllPosts: Already loading, returning early");
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    console.log("fetchAllPosts: Starting to fetch ALL posts for tab:", tab);
    
    try {
      let postsData: Post[] = [];
      
      if (tab === 'following') {
        console.log("fetchAllPosts: Processing following tab, userFollowing length:", userFollowing.length);
        
        if (userFollowing.length === 0) {
          console.log("fetchAllPosts: No users being followed, setting empty state");
          setPosts([]);
          return;
        }
        
        try {
          // Load ALL posts from followed users (no limit)
          const followingQuery = query(
            collection(db, "posts"),
            where("userId", "in", userFollowing.slice(0, 10)), // Take first 10 users only (Firestore limit)
            where("deleted", "!=", true),
            orderBy("timestamp", "desc")
            // No limit - load everything!
          );
          
          const followingSnapshot = await getDocs(followingQuery);
          console.log("fetchAllPosts: Following query returned", followingSnapshot.docs.length, "posts");
          
          postsData = followingSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Post[];
          
        } catch (followingError) {
          console.error("fetchAllPosts: Error fetching following posts:", followingError);
          toast.error("Error fetching posts from followed users");
          throw followingError;
        }
        
      } else {
        console.log("fetchAllPosts: Processing foryou tab - loading ALL posts");
        
        try {
          const postsQuery = query(
            collection(db, "posts"),
            where("deleted", "!=", true),
            orderBy("timestamp", "desc")
            // No limit - load everything!
          );
          
          const documentSnapshots = await getDocs(postsQuery);
          console.log("fetchAllPosts: ForYou tab returned", documentSnapshots.docs.length, "posts");
          
          postsData = documentSnapshots.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Post[];
          
        } catch (foryouError) {
          console.error("fetchAllPosts: Error fetching foryou posts:", foryouError);
          toast.error("Error fetching posts for For You tab");
          throw foryouError;
        }
      }
      
      console.log(`fetchAllPosts: Fetched ${postsData.length} total posts for ${tab} tab`);
      
      const processedPosts = await processPostsWithUserData(postsData);
      console.log("fetchAllPosts: Processed posts, setting state");
      
      setPosts(processedPosts);
      console.log(`fetchAllPosts: Set ${processedPosts.length} posts in state`);
      
    } catch (error) {
      console.error("fetchAllPosts: Error fetching posts:", error);
      toast.error("Error loading posts");
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
      console.log("fetchAllPosts: Completed, loading set to false");
    }
  }, [activeTab, userFollowing, processPostsWithUserData]);

  const handleTabChange = useCallback((tab: 'foryou' | 'following') => {
    if (tab === activeTab || isLoadingRef.current) return;
    
    console.log(`Switching to ${tab} tab`);
    
    setActiveTab(tab);
    setPosts([]);
    
    fetchAllPosts(tab);
  }, [activeTab, fetchAllPosts]);

  return {
    posts,
    setPosts,
    loading,
    activeTab,
    fetchInitialPosts: fetchAllPosts, // Renamed for compatibility
    handleTabChange,
    // Removed infinite scroll related properties
    hasMore: false,
    loadingMore: false,
    lastVisible: null,
    loadMorePosts: () => {} // Empty function for compatibility
  };
};