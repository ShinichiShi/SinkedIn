"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsDown, MessageCircle, Link2, UserPlus, UserMinus } from "lucide-react";
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

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (!userId) return;

    const auth = getAuth(firebaseApp);
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
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
        
        // Check if current user is following this profile
        setIsFollowing(fetchedUserData.followers?.includes(currentUser.uid) || false);
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

  const handleFollow = async () => {
    const auth = getAuth(firebaseApp);
    const currentUser = auth.currentUser;
    
    if (!currentUser || !userData) {
      toast.error("You must be logged in to follow users");
      return;
    }

    if (currentUser.uid === userId) {
      toast.error("You cannot follow yourself");
      return;
    }

    setFollowLoading(true);

    try {
      const userDoc = doc(db, "users", userId);
      const currentUserDoc = doc(db, "users", currentUser.uid);

      if (isFollowing) {
        // Unfollow
        await updateDoc(userDoc, {
          followers: arrayRemove(currentUser.uid)
        });
        await updateDoc(currentUserDoc, {
          following: arrayRemove(userId)
        });
        setIsFollowing(false);
        setUserData(prev => ({
          ...prev!,
          followers: prev!.followers.filter(id => id !== currentUser.uid)
        }));
        toast.success("Unfollowed successfully");
      } else {
        // Follow
        await updateDoc(userDoc, {
          followers: arrayUnion(currentUser.uid)
        });
        await updateDoc(currentUserDoc, {
          following: arrayUnion(userId)
        });
        setIsFollowing(true);
        setUserData(prev => ({
          ...prev!,
          followers: [...prev!.followers, currentUser.uid]
        }));
        toast.success("Followed successfully");
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-primary">Loading...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const getTabClassName = (tab: 'posts' | 'followers' | 'following') => {
    return activeTab === tab
      ? 'px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary'
      : 'px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background/80 to-background pt-[64px]">
      {/* Hero Section */}
      <div className="relative w-full h-[200px] md:h-[280px]">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"
          style={{
            backgroundImage: userData?.backgroundImage ? `url(${userData.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
        </div>
        
        <div className="absolute -bottom-16 left-4 md:left-8 flex flex-col md:flex-row md:items-end gap-4 md:gap-6 w-[calc(100%-2rem)]">
          <div className="relative group">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-background bg-primary/10 shadow-xl overflow-hidden transition-transform duration-300 group-hover:scale-105">
              {userData?.profilepic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={userData.profilepic} 
                  alt={userData.username || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold">
                  {userData?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {userData?.username}
            </h1>
            <p className="text-muted-foreground max-w-md text-sm md:text-base">
              {userData?.bio || "No bio yet"}
            </p>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              {userData?.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="inline-block w-4 h-4">📍</span>
                  <span>{userData.location}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                <div className="px-3 py-1 rounded-full bg-secondary/10 border border-border/50 backdrop-blur-sm">
                  <span className="text-xs md:text-sm font-medium">{userData?.followers?.length || 0} Followers</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-secondary/10 border border-border/50 backdrop-blur-sm">
                  <span className="text-xs md:text-sm font-medium">{userData?.following?.length || 0} Following</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute md:relative top-0 right-4 md:right-0 md:mb-4 md:ml-auto flex gap-2">
            <Button
              onClick={handleFollow}
              disabled={followLoading}
              variant={isFollowing ? "secondary" : "default"}
              size="sm"
              className="gap-2"
            >
              {followLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isFollowing ? (
                <UserMinus className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-24 md:mt-20 px-4 md:px-6">
        <div className="flex gap-2 mb-6 border-b sticky top-[64px] bg-background/80 backdrop-blur-sm z-10">
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
            Followers
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={getTabClassName('following')}
          >
            Following
          </button>
        </div>

        <div className="mt-6">
          {activeTab === 'posts' && (
            <div className="grid gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/post/${post.id}`)}
                  className="p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/50 group cursor-pointer"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden relative ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                      {userData?.profilepic ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={userData.profilepic}
                          alt={userData.username || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-primary/10">
                          {userData?.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {userData?.username || "Anonymous"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap px-4 py-2 rounded-lg bg-accent/5">
                    {post.content}
                  </div>

                  <div className="flex justify-around pt-4 mt-4 border-t border-border/30">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <ThumbsDown className="h-5 w-5" />
                      <span>{post.dislikes || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MessageCircle className="h-5 w-5" />
                      <span>{post.comments?.length || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Link2 className="h-5 w-5" />
                      <span>{post.shares || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="text-center text-muted-foreground">
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
                <div className="text-center text-muted-foreground">
                  {userData.username} has no followers yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'following' && (
            <div className="grid gap-4">
              {userData?.following.map((followingId) => (
                <UserListItem key={followingId} userId={followingId} />
              ))}
              {!userData?.following.length && (
                <div className="text-center text-muted-foreground">
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