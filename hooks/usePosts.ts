import { useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '@/types';
import { toast } from 'react-toastify';

export const usePosts = (userFollowing: string[], userCache: Map<string, any>, fetchUsers: (userIds: string[]) => Promise<Map<string, any>>) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');

  const processPostsWithUserData = useCallback(async (postsData: Post[]) => {
    const allUserIds = Array.from(new Set(postsData.map((post: Post) => post.userId)));
    const updatedUserCache = await fetchUsers(allUserIds);
    
    const postsWithProfilePics: Post[] = postsData.map((post: Post) => {
      const userData = updatedUserCache.get(post.userId);
      return {
        ...post,
        userProfilePic: userData?.profilepic || null,
        userName: userData?.username || post.userName || "Anonymous"
      };
    });
    
    console.log("Processed posts with profile pics:", postsWithProfilePics);
    return postsWithProfilePics;
  }, [fetchUsers]);

  const fetchInitialPosts = useCallback(async (tab: 'foryou' | 'following' = activeTab) => {
    try {
      let postsData: Post[] = [];
      
      if (tab === 'following') {
        if (userFollowing.length === 0) {
          setPosts([]);
          setLastVisible(null);
          setHasMore(false);
          return;
        }
        
        const followingBatches = [];
        for (let i = 0; i < userFollowing.length; i += 10) {
          followingBatches.push(userFollowing.slice(i, i + 10));
        }
        
        let allPosts: Post[] = [];
        
        for (const batch of followingBatches) {
          const batchQuery = query(
            collection(db, "posts"),
            where("userId", "in", batch),
            where("deleted", "!=", true),
            orderBy("timestamp", "desc"),
            limit(10)
          );
          
          const batchSnapshot = await getDocs(batchQuery);
          const batchPosts = batchSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Post[];
          
          allPosts = [...allPosts, ...batchPosts];
        }
        
        allPosts.sort((a, b) => {
          const aTime = a.timestamp?.seconds || 0;
          const bTime = b.timestamp?.seconds || 0;
          return bTime - aTime;
        });
        
        postsData = allPosts.slice(0, 10);
        
        if (postsData.length > 0) {
          const lastPostId = postsData[postsData.length - 1].id;
          const lastPostQuery = query(
            collection(db, "posts"),
            where("__name__", "==", lastPostId)
          );
          const lastPostSnapshot = await getDocs(lastPostQuery);
          setLastVisible(lastPostSnapshot.docs[0]);
        }
        
      } else {
        const postsQuery = query(
          collection(db, "posts"),
          where("deleted", "!=", true),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        
        const documentSnapshots = await getDocs(postsQuery);
        
        postsData = documentSnapshots.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
      }
      
      const processedPosts = await processPostsWithUserData(postsData);
      setPosts(processedPosts);
      setHasMore(postsData.length === 10);
      
    } catch (error) {
      console.error("Error fetching initial posts:", error);
      toast.error("Error loading posts");
    }
  }, [activeTab, userFollowing, processPostsWithUserData]);

  const loadMorePosts = useCallback(async () => {
    if (!lastVisible || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      let newPostsData: Post[] = [];
      
      if (activeTab === 'following') {
        if (userFollowing.length === 0) {
          setLoadingMore(false);
          return;
        }
        
        const followingBatches = [];
        for (let i = 0; i < userFollowing.length; i += 10) {
          followingBatches.push(userFollowing.slice(i, i + 10));
        }
        
        let allPosts: Post[] = [];
        
        for (const batch of followingBatches) {
          const batchQuery = query(
            collection(db, "posts"),
            where("userId", "in", batch),
            where("deleted", "!=", true),
            orderBy("timestamp", "desc"),
            startAfter(lastVisible),
            limit(10)
          );
          
          const batchSnapshot = await getDocs(batchQuery);
          const batchPosts = batchSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Post[];
          
          allPosts = [...allPosts, ...batchPosts];
        }
        
        allPosts.sort((a, b) => {
          const aTime = a.timestamp?.seconds || 0;
          const bTime = b.timestamp?.seconds || 0;
          return bTime - aTime;
        });
        
        newPostsData = allPosts.slice(0, 10);
        
      } else {
        const postsQuery = query(
          collection(db, "posts"),
          where("deleted", "!=", true),
          orderBy("timestamp", "desc"),
          startAfter(lastVisible),
          limit(10)
        );
        
        const documentSnapshots = await getDocs(postsQuery);
        
        newPostsData = documentSnapshots.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        if (documentSnapshots.docs.length > 0) {
          setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
        }
      }
      
      if (newPostsData.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      const processedNewPosts = await processPostsWithUserData(newPostsData);
      setPosts(prevPosts => [...prevPosts, ...processedNewPosts]);
      setHasMore(newPostsData.length === 10);
      
      if (activeTab === 'following' && newPostsData.length > 0) {
        const lastPostId = newPostsData[newPostsData.length - 1].id;
        const lastPostQuery = query(
          collection(db, "posts"),
          where("__name__", "==", lastPostId)
        );
        const lastPostSnapshot = await getDocs(lastPostQuery);
        if (lastPostSnapshot.docs.length > 0) {
          setLastVisible(lastPostSnapshot.docs[0]);
        }
      }
      
    } catch (error) {
      console.error("Error loading more posts:", error);
      toast.error("Error loading more posts");
    } finally {
      setLoadingMore(false);
    }
  }, [lastVisible, loadingMore, hasMore, activeTab, userFollowing, processPostsWithUserData]);

  const handleTabChange = useCallback((tab: 'foryou' | 'following') => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    setPosts([]);
    setLastVisible(null);
    setHasMore(true);
    setLoadingMore(false);
    
    fetchInitialPosts(tab);
  }, [activeTab, fetchInitialPosts]);

  return {
    posts,
    setPosts,
    lastVisible,
    hasMore,
    loadingMore,
    activeTab,
    fetchInitialPosts,
    loadMorePosts,
    handleTabChange
  };
};
