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
import ImageGallery from "@/components/post/ImageGallery";
import PostContent from "@/components/post/PostContent";
import PostHeader from "@/components/post/PostHeader";
import PostActions from "@/components/post/PostActions";
import CommentSection from "@/components/post/CommentSection";
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
import { motion, AnimatePresence } from "framer-motion";
import type { ReactElement, FC, ReactNode } from 'react';
import {Post, Comment} from "@/types";

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
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  
  const fetchInitialPosts = async (tab: 'foryou' | 'following' = activeTab) => {
    try {
      let postsQuery;
      
      if (tab === 'following') {
        // If no following users, return empty array
        if (userFollowing.length === 0) {
          setPosts([]);
          setLastVisible(null);
          setHasMore(false);
          return;
        }
        
        // Handle Firestore 'in' query limitation (max 10 items)
        // If user follows more than 10 people, we need to make multiple queries
        const followingBatches = [];
        for (let i = 0; i < userFollowing.length; i += 10) {
          followingBatches.push(userFollowing.slice(i, i + 10));
        }
        
        let allPosts: Post[] = [];
        
        // Execute queries for each batch
        for (const batch of followingBatches) {
          const batchQuery = query(
            collection(db, "posts"),
            where("userId", "in", batch),
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
        
        // Sort all posts by timestamp and limit to 10 most recent
        allPosts.sort((a, b) => {
          const aTime = a.timestamp?.seconds || 0;
          const bTime = b.timestamp?.seconds || 0;
          return bTime - aTime;
        });
        
        const postsData = allPosts.slice(0, 10);
        
        // Set lastVisible for pagination
        if (postsData.length > 0) {
          // Find the document snapshot for the last post
          const lastPostId = postsData[postsData.length - 1].id;
          const lastPostQuery = query(
            collection(db, "posts"),
            where("__name__", "==", lastPostId)
          );
          const lastPostSnapshot = await getDocs(lastPostQuery);
          setLastVisible(lastPostSnapshot.docs[0]);
        }
        
        // Process posts with user data
        const processedPosts = await processPostsWithUserData(postsData);
        setPosts(processedPosts);
        setHasMore(postsData.length === 10);
        
      } else {
        // Fetch all posts for "For you" tab
        postsQuery = query(
          collection(db, "posts"),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        
        const documentSnapshots = await getDocs(postsQuery);
        
        const postsData = documentSnapshots.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        const processedPosts = await processPostsWithUserData(postsData);
        
        setPosts(processedPosts);
        setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
        setHasMore(documentSnapshots.docs.length === 10);
      }
      
    } catch (error) {
      console.error("Error fetching initial posts:", error);
      toast.error("Error loading posts");
    }
  };

  const processPostsWithUserData = async (postsData: Post[]) => {
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
    
    console.log("Processed posts with profile pics:", postsWithProfilePics);
    console.log("Total cached users:", currentUserCache.size);
    console.log("Firestore reads for users:", uncachedUserIds.length);
    
    return postsWithProfilePics;
  };

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
        
        // Handle multiple batches for following users
        const followingBatches = [];
        for (let i = 0; i < userFollowing.length; i += 10) {
          followingBatches.push(userFollowing.slice(i, i + 10));
        }
        
        let allPosts: Post[] = [];
        
        for (const batch of followingBatches) {
          const batchQuery = query(
            collection(db, "posts"),
            where("userId", "in", batch),
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
        
        // Sort and limit
        allPosts.sort((a, b) => {
          const aTime = a.timestamp?.seconds || 0;
          const bTime = b.timestamp?.seconds || 0;
          return bTime - aTime;
        });
        
        newPostsData = allPosts.slice(0, 10);
        
      } else {
        const postsQuery = query(
          collection(db, "posts"),
          orderBy("timestamp", "desc"),
          startAfter(lastVisible),
          limit(10)
        );
        
        const documentSnapshots = await getDocs(postsQuery);
        
        newPostsData = documentSnapshots.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        // Update lastVisible for "For you" tab
        if (documentSnapshots.docs.length > 0) {
          setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length-1]);
        }
      }
      
      if (newPostsData.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      // Process new posts with user data
      const processedNewPosts = await processPostsWithUserData(newPostsData);
      
      console.log("Loaded more posts with profile pics:", processedNewPosts);
      
      setPosts(prevPosts => [...prevPosts, ...processedNewPosts]);
      setHasMore(newPostsData.length === 10);
      
      // Update lastVisible for following tab
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
  }, [lastVisible, loadingMore, hasMore, cachedUsers, activeTab, userFollowing]);

  const handleTabChange = (tab: 'foryou' | 'following') => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    setPosts([]);
    setLastVisible(null);
    setHasMore(true);
    setLoadingMore(false);
    
    // Fetch posts for the new tab
    fetchInitialPosts(tab);
  };

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

      const fixedComments: Comment[] = updatedComments.map((comment) => ({
        ...comment,
        timestamp: comment.timestamp instanceof Date
          ? comment.timestamp
          : new Date(comment.timestamp),
      }));       

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, comments: fixedComments } : p
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

  // Re-fetch posts when userFollowing changes and we're on following tab
  useEffect(() => {
    if (userFollowing.length > 0 && activeTab === 'following' && !loading) {
      fetchInitialPosts('following');
    }
  }, [userFollowing, activeTab]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <CustomLoader loading={loading} size={50} color="#3b82f6" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 md:container">
      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar */}
            <aside className="hidden lg:block w-64">
      <LeftSidebar />
    </aside>
      
       <main className="flex-1 overflow-y-auto max-h-[calc(100vh-120px)] no-scrollbar px-4 py-6 lg:mr-80">
      <div className="max-w-2xl ">
              {/* Create Post */}
              <div className="mb-3">
                <CreatePost />
              </div>

              {/* Feed Tabs */}
              <div className="mb-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex">
                    <button
                      onClick={() => handleTabChange('foryou')}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'foryou'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      For you
                    </button>
                    <button
                      onClick={() => handleTabChange('following')}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'following'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      Following
                    </button>
                  </div>
                </div>
              </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              <AnimatePresence>
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
                   
                  >
                    {/* Post Header */}
                    <div onClick={() => handlePostClick(post.id)}>
                    <PostHeader 
                    post={post}
                    currentUser = {currentUser}
                    userFollowing = {userFollowing}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                    />
                    <PostContent content={post.content}/>
                    </div>
                    
                    {/* Image Gallery */}
                    <div className="px-4">
                      <ImageGallery images={post.images || []} postId={post.id} />
                    </div>

                    {/* Post Actions */}
                    <PostActions 
                    post={post}
                    currentUser={currentUser}
                    onDislike={handleDislike}
                    onShare={handleShare}
                    onToggleComment={toggleCommentBox}/>

                    {/* Comment Section */}
                     <CommentSection 
                      post={post}
                      currentUser={currentUser}
                      cachedUsers={cachedUsers}
                      onCommentInputChange={(setPostId: string, value: string) => {
                        setCommentInputs(prev => ({
                          ...prev,
                          [setPostId]: value
                        }));
                      }}
                      onPostComment={handlePostComment}
                      commentInput={commentInputs[post.id]}
                      commentBoxStates={commentBoxStates}
                     />         
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="flex justify-center py-8">
                  <CustomLoader loading={loadingMore} size={30} color="#3b82f6" />
                </div>
              )}

              {/* Load More Trigger */}
              <div ref={observerTarget} className="h-10" />

              {/* End of Feed Message */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    You&apos;ve reached the end of your feed...How jobless can you be -_-
                  </p>
                </div>
              )}

              {/* No Posts Message */}
              {!loading && posts.length === 0 && (
                <div className="text-center py-12">
                  {activeTab === 'following' ? (
                    <>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">
                        No posts from people you follow
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        Follow some users to see their posts here
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">
                        No posts to display
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        Follow some users or create your first post!
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        <aside className="hidden lg:block fixed right-0 top-0 h-full w-80">
      <RightSidebar />
    </aside>
       
      </div>
    </div>
  );
}