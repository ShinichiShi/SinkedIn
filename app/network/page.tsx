"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import Image from "next/image";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { firebaseApp } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { HashLoader } from "react-spinners";
import { toast } from "react-toastify";

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
  const router = useRouter();
  const defaultAvatar = "/default-avatar.png"; // Path to your placeholder avatar image

  useEffect(() => {
    const fetchUsers = async () => {
      const auth = getAuth(firebaseApp);
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(userList);
        setFilteredUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
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

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <HashLoader color="white" />
      </div>
    );

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
        
        {loading ? (
          <div className="flex justify-center">
            <HashLoader color="white" />
          </div>
        ) : (
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
                      <Image
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
          </div>
        )}
      </div>
    </div>
  );
}
