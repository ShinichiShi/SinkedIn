"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, query, limit, startAfter } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { motion, HTMLMotionProps } from "framer-motion";
import { useRouter } from "next/navigation";
import { firebaseApp } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { HashLoader } from "react-spinners";
import { toast } from "react-toastify";
import type { ReactElement } from 'react';

interface CustomMotionDivProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

interface CustomMotionButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
}

type User = {
  id: string;
  username: string;
  email: string;
  profilepic?: string;
  followers: string[];
  following: string[];
};

export default function NetworkPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const defaultAvatar = "/default-avatar.png";

  const fetchInitialUsers = useCallback(async () => {
    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const usersQuery = query(
        collection(db, "users"),
        limit(10)
      );
      const querySnapshot = await getDocs(usersQuery);
      const userList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      
      setUsers(userList);
      setFilteredUsers(userList);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 10);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadMoreUsers = useCallback(async () => {
    if (!lastVisible || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const usersQuery = query(
        collection(db, "users"),
        startAfter(lastVisible),
        limit(10)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const newUsers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      
      setUsers(prevUsers => [...prevUsers, ...newUsers]);
      setFilteredUsers(prevUsers => [...prevUsers, ...newUsers]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 10);
    } catch (error) {
      console.error("Error loading more users:", error);
      toast.error("Error loading more users");
    } finally {
      setLoadingMore(false);
    }
  }, [lastVisible, loadingMore, hasMore]);

  useEffect(() => {
    fetchInitialUsers();
  }, [fetchInitialUsers]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreUsers();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMoreUsers, hasMore, loadingMore]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
      setHasMore(false); // Disable infinite scroll while searching
    } else {
      setFilteredUsers(users);
      setHasMore(true); // Re-enable infinite scroll when search is cleared
    }
  }, [searchQuery, users]);

  const handleFollow = async (targetUserId: string) => {
    const auth = getAuth(firebaseApp);
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      toast.error("Please log in to follow users");
      router.push("/login");
      return;
    }

    try {
      // Update current user's following list
      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId)
      });

      // Update target user's followers list
      const targetUserRef = doc(db, "users", targetUserId);
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUser.uid)
      });

      // Update local state
      setUsers(users.map(user => {
        if (user.id === targetUserId) {
          return {
            ...user,
            followers: [...(user.followers || []), currentUser.uid]
          };
        }
        return user;
      }));

      toast.success("Successfully followed user!");
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    const auth = getAuth(firebaseApp);
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      toast.error("Please log in to unfollow users");
      router.push("/login");
      return;
    }

    try {
      // Remove from current user's following list
      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId)
      });

      // Remove from target user's followers list
      const targetUserRef = doc(db, "users", targetUserId);
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUser.uid)
      });

      // Update local state
      setUsers(users.map(user => {
        if (user.id === targetUserId) {
          return {
            ...user,
            followers: user.followers?.filter(id => id !== currentUser.uid) || []
          };
        }
        return user;
      }));

      toast.success("Successfully unfollowed user!");
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <HashLoader color="white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Network</h1>
        <input
          type="text"
          placeholder="Search users..."
          className="w-full p-4 mb-8 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <div className="grid grid-cols-1 gap-6">
          {filteredUsers.map((user) => {
            const auth = getAuth(firebaseApp);
            const currentUser = auth.currentUser;
            const isFollowing = currentUser && user.followers?.includes(currentUser.uid);
            const isCurrentUser = currentUser && user.id === currentUser.uid;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-purple-500/20">
                    <AvatarImage
                      as={Image}
                      src={user.profilepic || defaultAvatar}
                      alt={user.username}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{user.username}</h3>
                    <p className="text-gray-400">{user.email}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-400">
                      <span>{user.followers?.length || 0} followers</span>
                      <span>{user.following?.length || 0} following</span>
                    </div>
                  </div>
                  {!isCurrentUser && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
                      className={`px-6 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                        isFollowing 
                          ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-500'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90'
                      }`}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
          {!loading && hasMore && (
            <div
              ref={observerTarget}
              className="flex justify-center p-4"
            >
              {loadingMore && <HashLoader color="white" size={30} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
