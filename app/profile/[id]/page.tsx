"use client";

import { useState, useEffect, useCallback, JSX } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsDown, MessageCircle, Share, Edit, LogOut, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { doc, getDoc, collection, query, getDocs, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseApp, db } from "@/lib/firebase";
import { toast } from "react-toastify";
import { UserListItem } from "@/components/profile/user-list-item";

interface UserData {
  username: string;
  email: string;
  location?: string;
  bio?: string;
  profilepic?: string;
  backgroundImage?: string;
  failedExperience?: string[];
  misEducation?: string[];
  failureHighlights?: string[];
  followers: string[];
  following: string[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  userId: string;
  timestamp: any;
  dislikes?: number;
  comments?: any[];
  shares?: number;
}

export default function UserProfile(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (!userId) return;

    const auth = getAuth(firebaseApp);
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      router.push("/login");
      return;
    }

    try {
      // Check if this is the user's own profile
      setIsOwnProfile(currentUser.uid === userId);

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

      // Fetch current user's data
      const currentUserDoc = doc(db, "users", currentUser.uid);
      const currentUserSnap = await getDoc(currentUserDoc);
      if (currentUserSnap.exists()) {
        setCurrentUserData(currentUserSnap.data() as UserData);
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
  }, [userId, router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = async () => {
    const auth = getAuth(firebaseApp);
    try {
      await auth.signOut();
      router.push("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  const handleEdit = () => {
    router.push("/profile/edit");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin text-primary">Loading...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-white">User Not Found</h1>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const getTabClassName = (tab: 'posts' | 'followers' | 'following') => {
    return cn(
      'px-6 py-3 text-sm font-medium transition-all cursor-pointer',
      activeTab === tab
        ? 'border-b-2 border-white text-white'
        : 'text-gray-400 hover:text-white border-b-2 border-transparent hover:border-gray-600'
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-purple-800">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-purple-800 px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-6">
            {/* Profile Image */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
              {userData?.profilepic ? (
                <img 
                  src={userData.profilepic} 
                  alt={userData.username || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-slate-700 text-white">
                  {userData?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">
                {userData?.username?.toUpperCase()}
              </h1>
              <p className="text-gray-200 text-lg mb-4">
                {userData?.bio || "Embracing failures as stepping stones to success"}
              </p>
              
              {/* Stats */}
              <div className="flex items-center gap-6 text-gray-200">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span>{userData?.location || "Unknown"}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{userData?.followers?.length || 0}</span> Followers
                </div>
                <div className="text-sm">
                  <span className="font-medium">{userData?.following?.length || 0}</span> Following
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isOwnProfile && (
              <div className="flex gap-3">
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  onClick={handleLogout}
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700 bg-slate-800">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={getTabClassName('posts')}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={getTabClassName('followers')}
            >
              Followers ({userData?.followers?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={getTabClassName('following')}
            >
              Following ({userData?.following?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-6">
          {activeTab === 'posts' && (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  onClick={() => router.push(`/post/${post.id}`)}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        {userData?.profilepic ? (
                          <img
                            src={userData.profilepic}
                            alt={userData.username || "Profile"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-slate-700 text-white">
                            {userData?.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-white">
                          {userData?.username || "Anonymous"}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : ""}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-gray-200 leading-relaxed mb-4">
                      {post.content}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <ThumbsDown className="h-5 w-5" />
                        <span>{post.dislikes || 0}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <MessageCircle className="h-5 w-5" />
                        <span>{post.comments?.length || 0}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Share className="h-5 w-5" />
                        <span>{post.shares || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {posts.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                  {userData.username} hasn&apos;t shared any failure stories yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'followers' && (
            <div className="grid gap-4">
              {userData?.followers.map((followerId) => (
                <UserListItem key={followerId} userId={followerId} />
              ))}
              {!userData?.followers.length && (
                <div className="text-center text-gray-400 py-12">
                  {userData.username} has no followers yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'following' && (
            <div className="grid gap-4">
              {userData?.following?.map((followingId) => (
                <UserListItem key={followingId} userId={followingId} />
              ))}
              {!userData?.following?.length && (
                <div className="text-center text-gray-400 py-12">
                  {userData.username} isn&apos;t following anyone yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}