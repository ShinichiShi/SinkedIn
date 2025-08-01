
// hooks/useUserProfile.ts (Updated)
import { useState, useCallback, useEffect } from 'react';
import { Post, UserData } from '@/types';
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export const useUserProfile = (userId: string | null, currentUser: any, setUserFollowing: Function) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const router = useRouter();

  const getAuthToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    return await currentUser.getIdToken();
  };

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
      const token = await getAuthToken();

      // Fetch the profile user's data
      const userResponse = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          toast.error("User not found");
          router.push("/");
          return;
        }
        const error = await userResponse.json();
        throw new Error(error.error || 'Failed to fetch user data');
      }

      const { user: fetchedUserData } = await userResponse.json();
      setUserData(fetchedUserData);

      // Fetch current user's data to check following status
      const currentUserResponse = await fetch(`/api/users/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (currentUserResponse.ok) {
        const { user: currentUserData } = await currentUserResponse.json();
        setCurrentUserData(currentUserData);
        setUserFollowing(currentUserData.following || []);
        setIsFollowing((currentUserData.following || []).includes(userId));
      }

      // Fetch user's posts - this could also be moved to an API route
      // For now, keeping the existing logic but you may want to create /api/users/[userId]/posts
      const postsParams = new URLSearchParams({
        tab: 'foryou',
        page: '0',
        limit: '100',
      });

      const postsResponse = await fetch(`/api/posts?${postsParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (postsResponse.ok) {
        const { posts: allPosts } = await postsResponse.json();
        const userPosts = allPosts.filter((post: Post) => post.userId === userId);
        setPosts(userPosts);
      }

    } catch (error) {
      console.error("Error fetching user data or posts:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser, setUserFollowing, router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    userData,
    setUserData,
    currentUserData,
    posts,
    setPosts,
    loading,
    isFollowing,
    setIsFollowing,
    fetchUserData
  };
};