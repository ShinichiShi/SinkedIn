"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { CreatePost } from "@/components/post/create-post";
import { LeftSidebar } from "@/components/sidebar/leftsidebar";
import { RightSidebar } from "@/components/sidebar/rightsidebar";
import { useRouter } from "next/navigation";
import { firebaseApp } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { HashLoader as Loader } from "react-spinners";
import { toast } from "react-toastify";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc, 
  increment,
  arrayUnion,
  arrayRemove,
  where
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { ThumbsDown, MessageCircle, Link2, UserPlus, UserMinus } from "lucide-react";
import Image from "next/image";
import type { ReactElement, FC, ReactNode } from 'react';
import type { ForwardRefComponent } from 'framer-motion';

type Post = {
  id: string;
  content: string;
  userName: string;
  userProfilePic?: string;
  userId: string;
  timestamp: { seconds: number } | null;
  createdAt?: string;
  dislikes: number;
  dislikedBy: string[];
  shares: number;
  comments: Comment[];
};

type Comment = {
  userId: string;
  userName: string;
  text: string;
  profilePic?: string;
  timestamp: string;
};

const MotionButton = motion.button;

const CustomLoader: FC<{
  loading: boolean;
  size: number;
  color: string;
}> = ({ loading, size, color }) => {
  return <div><Loader loading={loading} size={size} color={color} /></div>;
};

export default function Feed(): ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [dislikedPosts, setDislikedPosts] = useState<string[]>([]);
  const [cachedUsers, setCachedUsers] = useState<Map<string, any>>(new Map());
  const [commentBoxStates, setCommentBoxStates] = useState<{[key: string]: boolean}>({});
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userFollowing, setUserFollowing] = useState<string[]>([]);
  
  const fetchInitialPosts = async () => {
    try {
      // Create a compound query to handle both server timestamp and client timestamp
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      const documentSnapshots = await getDocs(postsQuery);
      
      const postsData = documentSnapshots.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      // Get unique user IDs from posts that aren't already cached
      const allUserIds = Array.from(new Set(postsData.map((post: Post) => post.userId)));
      const uncachedUserIds = allUserIds.filter(userId => !cachedUsers.has(userId));
      
      console.log(`Total users needed: ${allUserIds.length}, Cached: ${allUserIds.length - uncachedUserIds.length}, New fetches: ${uncachedUserIds.length}`);
      
      let currentUserCache = new Map(cachedUsers);
      
      // Only fetch users that aren't in cache
      if (uncachedUserIds.length > 0) {
        // Firestore 'in' query has a limit of 10, so we need to batch if more than 10 users
        const batches = [];
        for (let i = 0; i < uncachedUserIds.length; i += 10) {
          const batch = uncachedUserIds.slice(i, i + 10);
          batches.push(batch);
        }
        
        for (const batch of batches) {
          const usersQuery = query(
            collection(db, "users"),
            where("__name__", "in", batch)
          );
          const usersSnapshot = await getDocs(usersQuery);
          
          usersSnapshot.docs.forEach(doc => {
            currentUserCache.set(doc.id, doc.data());
          });
        }
        
        setCachedUsers(currentUserCache);
      }
      
      // Combine posts with user profile pictures
      const postsWithProfilePics: Post[] = postsData.map((post: Post) => {
        const userData = currentUserCache.get(post.userId);
        return {
          ...post,
          userProfilePic: userData?.profilepic || null,
          userName: userData?.username || post.userName || "Anonymous"
        };
      });
      
      console.log("Fetched posts with profile pics:", postsWithProfilePics);
      console.log("Total cached users:", currentUserCache.size);
      console.log("Firestore reads for users:", uncachedUserIds.length);
      
      setPosts(postsWithProfilePics);
      setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
      setHasMore(documentSnapshots.docs.length === 10);
    } catch (error) {
      console.error("Error fetching initial posts:", error);
      toast.error("Error loading posts");
    }
  };

  const loadMorePosts = useCallback(async () => {
    if (!lastVisible || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(10)
      );
      const documentSnapshots = await getDocs(postsQuery);
      
      const newPostsData = documentSnapshots.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      if (newPostsData.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      // Get unique user IDs from new posts that aren't already cached
      const allUserIds = Array.from(new Set(newPostsData.map((post: Post) => post.userId)));
      const uncachedUserIds = allUserIds.filter(userId => !cachedUsers.has(userId));
      
      // console.log(`Load more - Total users needed: ${allUserIds.length}, Cached: ${allUserIds.length - uncachedUserIds.length}, New fetches: ${uncachedUserIds.length}`);
      
      let currentUserCache = new Map(cachedUsers);
      
      // Only fetch users that aren't in cache
      if (uncachedUserIds.length > 0) {
        const batches = [];
        for (let i = 0; i < uncachedUserIds.length; i += 10) {
          const batch = uncachedUserIds.slice(i, i + 10);
          batches.push(batch);
        }
        
        for (const batch of batches) {
          const usersQuery = query(
            collection(db, "users"),
            where("__name__", "in", batch)
          );
          const usersSnapshot = await getDocs(usersQuery);
          
          usersSnapshot.docs.forEach(doc => {
            currentUserCache.set(doc.id, doc.data());
          });
        }
        
        setCachedUsers(currentUserCache);
      }
      
      // Combine new posts with user profile pictures using cache
      const newPostsWithProfilePics: Post[] = newPostsData.map((post: Post) => {
        const userData = currentUserCache.get(post.userId);
        return {
          ...post,
          userProfilePic: userData?.profilepic || null,
          userName: userData?.username || post.userName || "Anonymous"
        };
      });
      
      console.log("Loaded more posts with profile pics:", newPostsWithProfilePics);
      console.log("Firestore reads for users in load more:", uncachedUserIds.length);
      
      setPosts(prevPosts => [...prevPosts, ...newPostsWithProfilePics]);
      setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
      setHasMore(documentSnapshots.docs.length === 10);
    } catch (error) {
      console.error("Error loading more posts:", error);
      toast.error("Error loading more posts");
    } finally {
      setLoadingMore(false);
    }
  }, [lastVisible, loadingMore, hasMore, cachedUsers]);

  const handleDislike = async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("You need to be logged in to dislike a post.");
        return;
      }

      const postRef = doc(db, "posts", postId);
      const postIndex = posts.findIndex((post) => post.id === postId);
      const post = posts[postIndex];
      const userId = currentUser.uid;
      const hasDisliked = post.dislikedBy?.includes(userId);

      if (hasDisliked) {
        const updatedDislikedBy = post.dislikedBy.filter((id: string) => id !== userId);
        await updateDoc(postRef, {
          dislikes: Math.max((post.dislikes || 0) - 1, 0),
          dislikedBy: updatedDislikedBy,
        });

        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? {
              ...p,
              dislikes: Math.max((p.dislikes || 0) - 1, 0),
              dislikedBy: updatedDislikedBy,
            } : p
          )
        );
        setDislikedPosts(dislikedPosts.filter((id) => id !== postId));
      } else {
        const updatedDislikedBy = [...(post.dislikedBy || []), userId];
        await updateDoc(postRef, {
          dislikes: (post.dislikes || 0) + 1,
          dislikedBy: updatedDislikedBy,
        });

        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? {
              ...p,
              dislikes: (p.dislikes || 0) + 1,
              dislikedBy: updatedDislikedBy,
            } : p
          )
        );
        setDislikedPosts([...dislikedPosts, postId]);
      }
    } catch (error) {
      console.error("Error updating dislikes:", error);
      toast.error("Failed to update dislike.");
    }
  };

  const handleShare = async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        shares: increment(1),
      });

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p
        )
      );

      const shareUrl = `${window.location.origin}/post/${postId}`;
      if (navigator.share) {
        await navigator.share({
          title: "Check out this post!",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Post link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error("Failed to share post.");
    }
  };

  const toggleCommentBox = (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCommentBoxStates((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handlePostComment = async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Please log in to comment");
        return;
      }

      const commentText = commentInputs[postId];
      if (!commentText?.trim()) {
        toast.error("Comment cannot be empty");
        return;
      }

      const postRef = doc(db, "posts", postId);
      const postIndex = posts.findIndex((post) => post.id === postId);
      const post = posts[postIndex];

      let userProfilePic = cachedUsers.get(currentUser.uid)?.profilepic;
      if (!userProfilePic) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userProfilePic = userData.profilepic;
          setCachedUsers(prev => new Map(prev).set(currentUser.uid, userData));
        }
      }

      const newComment = {
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        text: commentText,
        profilePic: userProfilePic || null,
        timestamp: new Date().toISOString(),
      };

      const updatedComments = [...(post.comments || []), newComment];
      
      await updateDoc(postRef, {
        comments: updatedComments,
      });

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, comments: updatedComments } : p
        )
      );

      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const fetchCommentProfilePics = async (comments: Comment[]) => {
    const uncachedUserIds = comments
      .filter(comment => !cachedUsers.has(comment.userId))
      .map(comment => comment.userId);

    if (uncachedUserIds.length > 0) {
      const batches = [];
      for (let i = 0; i < uncachedUserIds.length; i += 10) {
        batches.push(uncachedUserIds.slice(i, i + 10));
      }

      let currentUserCache = new Map(cachedUsers);
      for (const batch of batches) {
        const usersQuery = query(
          collection(db, "users"),
          where("__name__", "in", batch)
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        usersSnapshot.docs.forEach(doc => {
          currentUserCache.set(doc.id, doc.data());
        });
      }
      setCachedUsers(currentUserCache);
    }
  };

  const formatRelativeTime = (timestamp: any): string => {
    if (!timestamp) return "";

    const now = new Date();
    const postDate = timestamp?.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    if (!(postDate instanceof Date) || isNaN(postDate.getTime())) {
      return "";
    }

    const diffInMs = now.getTime() - postDate.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    } else {
      return postDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const handleFollow = async (targetUserId: string, event: React.MouseEvent) => {
    event.stopPropagation();
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
      setUserFollowing(prev => [...prev, targetUserId]);
      toast.success("Successfully followed user!");
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
    }
  };

  const handleUnfollow = async (targetUserId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!currentUser) {
      toast.error("Please log in to unfollow users");
      router.push("/login");
      return;
    }

    try {
      // Update current user's following list
      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId)
      });

      // Update target user's followers list
      const targetUserRef = doc(db, "users", targetUserId);
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUser.uid)
      });

      // Update local state
      setUserFollowing(prev => prev.filter(id => id !== targetUserId));
      toast.success("Successfully unfollowed user!");
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    }
  };

  // Move all useEffect hooks to the top level, not conditionally called
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePosts();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMorePosts, hasMore, loadingMore]);

  useEffect(() => {
    try {
      const auth = getAuth(firebaseApp);
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      } else {
        fetchInitialPosts().finally(() => setLoading(false));
      }
    } catch (error: any) {
      toast.error("Error fetching user data:" + error.message);
    }
  }, [router]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const auth = getAuth(firebaseApp);
        const user = auth.currentUser;
        if (user) {
          setCurrentUser(user);
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserFollowing(userData.following || []);
          }
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
    const fetchAllCommentProfilePics = async () => {
      const allComments = posts.flatMap(post => post.comments || []);
      if (allComments.length > 0) {
        await fetchCommentProfilePics(allComments);
      }
    };

    if (posts.length > 0) {
      fetchAllCommentProfilePics();
    }
  }, [posts]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div><Loader loading={true} size={50} color="white" /></div>
    </div>
  );

  return (
    <div className="container max-h-screen mx-auto px-4 py-8">
      <aside className="lg:block">
        <div><LeftSidebar /></div>
      </aside>
      
      <main className="flex-1 h-screen overflow-y-auto max-h-[calc(100vh-120px)] max-w-2xl md:mx-[28%] no-scrollbar">
        <CreatePost />
        
        {posts.map((post) => (          
          <div
            key={post.id}
            onClick={() => handlePostClick(post.id)}
            className="bg-white dark:bg-card/80 text-card-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 space-y-6 mb-4 cursor-pointer border-2 border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 backdrop-filter backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-accent/5"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full overflow-hidden relative ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all duration-300 hover:ring-primary/40">
                <Image
                    src={post.userProfilePic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                    alt={`${post.userName}'s avatar`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
              </div>              
              <div className="flex-1">
                <div className="flex justify-between items-start">                  
                  <div>
                    <h3 className="font-semibold text-base text-foreground hover:text-primary transition-colors duration-200">{post.userName || "Anonymous"}</h3>
                    <p className="text-sm text-muted-foreground/80">
                      {formatRelativeTime(post.timestamp || post.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              {currentUser && post.userId !== currentUser.uid && (
                userFollowing.includes(post.userId) ? (
                  <MotionButton
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleUnfollow(post.userId, e)}
                    className="flex items-center space-x-2 rounded-full px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 transition-all duration-200"
                  >
                    <div><UserMinus className="h-5 w-5" /></div>
                    <span>Unfollow</span>
                  </MotionButton>
                ) : (
                  <MotionButton
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleFollow(post.userId, e)}
                    className="flex items-center space-x-2 rounded-full px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 transition-all duration-200"
                  >
                    <div><UserPlus className="h-5 w-5" /></div>
                    <span>Follow</span>
                  </MotionButton>
                )
              )}
            </div>
              
            <div className="text-base text-gray-800 dark:text-foreground/90 leading-relaxed whitespace-pre-wrap rounded-lg bg-gray-50 dark:bg-accent/5">
              {post.content}
            </div>
              
            <div className="flex justify-between border-gray-200 dark:border-border/30">
            <div className="flex items-center">

           
              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleDislike(post.id, e)}
                className={`flex items-center space-x-2 rounded-full px-4 py-2 transition-all duration-200 ${
                  dislikedPosts.includes(post.id)
                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    : "hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600"
                }`}
              >
                <div><ThumbsDown className={`h-5 w-5 ${dislikedPosts.includes(post.id) ? "text-red-600" : ""}`} /></div>
                <span>{post.dislikes || 0}</span>
              </MotionButton>

              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={(e) => toggleCommentBox(post.id, e)}
                className={`flex items-center space-x-2 rounded-full px-4 py-2 transition-all duration-200 ${
                  commentBoxStates[post.id]
                    ? "bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <div><MessageCircle className="h-5 w-5" /></div>
                <span>{post.comments?.length || 0}</span>
              </MotionButton>

              </div>
              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleShare(post.id, e)}
                className={`flex items-center space-x-2 rounded-full px-4 py-2 transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-muted-foreground hover:text-purple-600`}
              >
                <div><Link2 className="h-5 w-5" /></div>
                <span>{post.shares || 0}</span>
              </MotionButton>              
            </div>

            {commentBoxStates[post.id] && (
              <div onClick={(e) => e.stopPropagation()}>
                <div className="flex space-x-2">
                  <textarea
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs(prev => ({
                      ...prev,
                      [post.id]: e.target.value
                    }))}
                    placeholder="Write a comment..."
                    className="flex-1 px-1 rounded-xl placeholder:p-2 border border-gray-200 dark:border-border bg-white dark:bg-background/50 backdrop-blur-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                  />
                  <button
                    onClick={(e) => handlePostComment(post.id, e)}
                    className="px-4 bg-primary/90 text-primary-foreground rounded-xl hover:bg-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!commentInputs[post.id]?.trim()}
                  >
                    Post
                  </button>
                </div>

                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {post.comments.map((comment: Comment, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-2 rounded-xl bg-gray-50 dark:bg-accent/30 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-accent/40 transition-all duration-200">
                        <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm">
                          <Image
                            src={cachedUsers.get(comment.userId)?.profilepic || comment.profilePic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                            alt="Commenter avatar"
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-3 items-center">
                            <p className="font-medium text-sm">{comment.userName || "Anonymous"}</p>
                            <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(comment.timestamp)}
                             </p>
                          </div>
                          <p className="text-sm text-foreground/90 mt-1">{comment.text}</p>
                          
                </div>
              </div>
            ))} 
          </div>
        )}
      </div>
    )}
  </div>
))}

        {loadingMore && (
          <div className="flex justify-center my-4">
            <div><Loader loading={true} size={30} color="white" /></div>
          </div>
        )}

        <div ref={observerTarget} style={{ height: "20px" }} />
      </main>
      
      <aside className="lg:block">
        <div><RightSidebar /></div>
      </aside>
    </div>
  );
}