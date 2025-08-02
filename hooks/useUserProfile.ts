
// hooks/useUserProfile.ts (Optimized with timeout handling)
import { useState, useCallback, useEffect } from 'react';
import { Post, UserData } from '@/types';
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";

export const useUserProfile = (userId: string | null, currentUser: any, setUserFollowing: Function) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const router = useRouter();

  const getAuthToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    return await currentUser.getIdToken();
  };

  const fetchUserPosts = useCallback(async (token?: string) => {
    if (!userId) return;

    try {
      setPostsLoading(true);
      setLoadingProgress(prev => Math.max(prev, 50));
      const authToken = token || await getAuthToken();

      // Use 10 second timeout for posts
      const postsResponse = await fetchWithTimeout(`/api/users/${userId}/posts?page=0&limit=20`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }, 10000);

      if (postsResponse.ok) {
        const { posts: userPosts } = await postsResponse.json();
        setPosts(userPosts);
        setLoadingProgress(100);
      } else {
        console.error("Failed to fetch user posts");
        toast.error("Failed to load user posts");
      }

    } catch (error) {
      console.error("Error fetching user posts:", error);
      if (error instanceof Error && error.message.includes('timed out')) {
        toast.error("Posts are taking too long to load (>10 seconds). Please refresh the page.");
        setError("Posts loading timeout");
      }
    } finally {
      setPostsLoading(false);
    }
  }, [userId]);

  const fetchUserData = useCallback(async () => {
    if (!userId || !currentUser) {
      setLoading(false);
      return;
    }

    const user = auth.currentUser;
    
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLoadingProgress(20);
      
      // Reset previous data when fetching new user
      setUserData(null);
      setPosts([]);

      const token = await getAuthToken();

      // Use 10 second timeout for profile data
      const profileResponse = await fetchWithTimeout(`/api/users/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }, 10000);

      setLoadingProgress(40);

      if (!profileResponse.ok) {
        if (profileResponse.status === 404) {
          setError("User not found");
          toast.error("User not found");
          setTimeout(() => router.push("/"), 2000);
          return;
        }
        const error = await profileResponse.json();
        throw new Error(error.error || 'Failed to fetch user profile');
      }

      const { user: fetchedUserData, currentUser: currentUserData, isFollowing: userIsFollowing } = await profileResponse.json();
      
      setUserData(fetchedUserData);
      setCurrentUserData(currentUserData);
      setUserFollowing(currentUserData?.following || []);
      setIsFollowing(userIsFollowing);
      setLoadingProgress(60);

      // Fetch posts separately (don't wait for it to complete profile loading)
      fetchUserPosts(token);

    } catch (error) {
      console.error("Error fetching user profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch user profile";
      setError(errorMessage);
      
      if (errorMessage.includes('timed out')) {
        toast.error("Profile is taking too long to load (>10 seconds). Please check your connection and try again.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser, setUserFollowing, router, fetchUserPosts]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Reset state when userId changes to prevent showing stale data
  useEffect(() => {
    setUserData(null);
    setPosts([]);
    setError(null);
    setLoadingProgress(0);
    setLoading(true);
  }, [userId]);

  return {
    userData,
    setUserData,
    currentUserData,
    posts,
    setPosts,
    loading,
    postsLoading,
    loadingProgress,
    error,
    isFollowing,
    setIsFollowing,
    fetchUserData,
    fetchUserPosts
  };
};