import { useState, useCallback, useEffect } from 'react';
import { Post, UserData } from '@/types';
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { collection, getDocs, query } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

export const useUserProfile = (userId: string | null, currentUser: any, setUserFollowing: Function) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const router = useRouter();

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
      // Fetch the profile user's data
      const userDoc = doc(db, "users", userId);
      const docSnap = await getDoc(userDoc);
    
      if (docSnap.exists()) {
        const fetchedUserData = docSnap.data() as UserData;
        setUserData(fetchedUserData);
      } else {
        toast.error("User not found");
        router.push("/");
        return;
      }

      // Fetch current user's data to check following status
      const currentUserDoc = doc(db, "users", user.uid);
      const currentUserSnap = await getDoc(currentUserDoc);
      if (currentUserSnap.exists()) {
        const currentUserData = currentUserSnap.data() as UserData;
        setCurrentUserData(currentUserData);
        setUserFollowing(currentUserData.following || []);
        setIsFollowing((currentUserData.following || []).includes(userId));
      }

      // Fetch user's posts
      const postsCollection = collection(db, "posts");
      const postsQuery = query(postsCollection);
      const querySnapshot = await getDocs(postsQuery);
      const fetchedPosts = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Post, "id">),
        }))
        .filter((post) => post.userId === userId);
    
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching user data or posts:", error);
      toast.error("Failed to fetch user data");
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