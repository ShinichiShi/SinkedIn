"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { HashLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ThumbsDown, Link2, ArrowLeft, MoreHorizontal, Clock } from "lucide-react";
import { LeftSidebar } from "@/components/sidebar/leftsidebar";
import { formatRelativeTime as formatTime } from "@/utils/timeUtils";
import { RightSidebar } from "@/components/sidebar/rightsidebar";
import { Comment,Post } from "@/types";
import { createCommentNotification } from "@/lib/notifications";


interface UserData {
  username: string;
  profilepic: string;
}

const PostPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [dislikedPosts, setDislikedPosts] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState<string>("");
  const [cachedUsers, setCachedUsers] = useState<Map<string, UserData>>(new Map());
  const [showComments, setShowComments] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);

  // Function to get default profile picture with first letter of username
  const getDefaultProfilePic = (username: string) => {
    const firstLetter = username?.charAt(0)?.toUpperCase() || 'A';
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="#3b82f6" rx="20"/>
        <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${firstLetter}</text>
      </svg>
    `)}`;
  };

  // Function to fetch user data and cache it
  const fetchUserData = async (userIds: string[]) => {
    const uncachedUserIds = userIds.filter(userId => !cachedUsers.has(userId));
    
    if (uncachedUserIds.length === 0) return;

    let currentUserCache = new Map(cachedUsers);
    
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
        const userData = doc.data() as UserData;
        currentUserCache.set(doc.id, userData);
      });
    }
    
    setCachedUsers(currentUserCache);
    return currentUserCache;
  };

  // Function to fetch current user data
  const fetchCurrentUserData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Check if current user data is already cached
    if (cachedUsers.has(currentUser.uid)) {
      setCurrentUserData(cachedUsers.get(currentUser.uid) || null);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        setCurrentUserData(userData);
        
        // Add to cache
        setCachedUsers(prev => new Map(prev).set(currentUser.uid, userData));
      } else {
        // Fallback to auth user data if no document exists
        const fallbackUserData: UserData = {
          username: currentUser.displayName || "Anonymous",
          profilepic: ""
        };
        setCurrentUserData(fallbackUserData);
      }
    } catch (error) {
      console.error("Error fetching current user data:", error);
      // Fallback to auth user data
      const fallbackUserData: UserData = {
        username: currentUser?.displayName || "Anonymous",
        profilepic: ""
      };
      setCurrentUserData(fallbackUserData);
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const postRef = doc(db, "posts", id as string);
        const postDoc = await getDoc(postRef);

        if (postDoc.exists()) {
          const postData = { id: postDoc.id, ...postDoc.data() } as Post;
          
          // Collect all user IDs that need profile data
          const userIds = [postData.userId];
          if (postData.comments) {
            postData.comments.forEach((comment: Comment) => {
              if (comment.userId && !userIds.includes(comment.userId)) {
                userIds.push(comment.userId);
              }
            });
          }

          // Add current user to the list if authenticated
          const currentUser = auth.currentUser;
          if (currentUser && !userIds.includes(currentUser.uid)) {
            userIds.push(currentUser.uid);
          }

          // Fetch user data for all users
          const userCache = await fetchUserData(userIds);
          const finalUserCache = userCache || cachedUsers;

          // Update post with profile picture
          const userData = finalUserCache.get(postData.userId);
          const updatedPost: Post = {
            ...postData,
            userProfilePic: userData?.profilepic || "",
            userName: userData?.username || postData.userName || "Anonymous",
          };

          // Update comments with profile pictures
          if (updatedPost.comments) {
            updatedPost.comments = updatedPost.comments.map((comment: Comment) => {
              const commentUserData = finalUserCache.get(comment.userId);
              return {
                ...comment,
                profilePic: commentUserData?.profilepic || "",
                userName: commentUserData?.username || comment.userName || "Anonymous",
              };
            });
          }

          setPost(updatedPost);
          
          // Fetch current user data for comment input
          await fetchCurrentUserData();
        } else {
          console.error("Post not found");
          router.push("/404");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, router]);

  useEffect(() => {
    // Fetch current user data when auth state changes
    fetchCurrentUserData();
  }, [cachedUsers]);

  const handleDislike = async (postId: string) => {
    if (!post) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("You need to be logged in to dislike a post.");
        return;
      }

      const postRef = doc(db, "posts", postId);
      const userId = currentUser.uid;
      const hasDisliked = post.dislikedBy?.includes(userId);

      if (hasDisliked) {
        const updatedDislikedBy = post.dislikedBy?.filter((id: string) => id !== userId) || [];
        await updateDoc(postRef, {
          dislikes: Math.max((post.dislikes || 0) - 1, 0),
          dislikedBy: updatedDislikedBy,
        });

        setPost((prev: Post | null) => prev ? ({
          ...prev,
          dislikes: Math.max((prev.dislikes || 0) - 1, 0),
          dislikedBy: updatedDislikedBy,
        }) : null);
        setDislikedPosts(dislikedPosts.filter((id) => id !== postId));
      } else {
        const updatedDislikedBy = [...(post.dislikedBy || []), userId];
        await updateDoc(postRef, {
          dislikes: (post.dislikes || 0) + 1,
          dislikedBy: updatedDislikedBy,
        });

        setPost((prev: Post | null) => prev ? ({
          ...prev,
          dislikes: (prev.dislikes || 0) + 1,
          dislikedBy: updatedDislikedBy,
        }) : null);
        setDislikedPosts([...dislikedPosts, postId]);
      }
    } catch (error) {
      console.error("Error updating dislikes:", error);
      toast.error("Failed to update dislike.");
    }
  };

  const handleShare = async (postId: string) => {
    if (!post) return;

    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        shares: (post.shares || 0) + 1,
      });

      setPost((prev: Post | null) => prev ? ({
        ...prev,
        shares: (prev.shares || 0) + 1,
      }) : null);

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

  const toggleCommentBox = () => {
    setShowComments(!showComments);
  };
  
  const handlePostComment = async () => {
    if (!post) return;

    const currentUser = auth.currentUser;

    if (!currentUser) {
      toast.error("You need to be logged in to comment.");
      return;
    }

    if (!commentInput.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }

    try {
      const postRef = doc(db, "posts", post.id);
      
      // Get current user data for the comment
      const currentUserInfo = cachedUsers.get(currentUser.uid);
      let userName = currentUser.displayName || "Anonymous";
      let profilePic = "";

      // If user data is cached, use it; otherwise fetch it
      if (currentUserInfo) {
        userName = currentUserInfo.username || userName;
        profilePic = currentUserInfo.profilepic || "";
      } else {
        // Fetch current user data if not in cache
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          userName = userData.username || userName;
          profilePic = userData.profilepic || "";
          
          // Add to cache
          setCachedUsers(prev => new Map(prev).set(currentUser.uid, userData));
          setCurrentUserData(userData);
        }
      }

      const newComment: Comment = {
        id: `${post.id}-${Date.now()}`,
        userId: currentUser.uid,
        text: commentInput,
        userName: userName,
        profilePic: profilePic,
        timestamp: new Date(),
      };

      const updatedComments = post.comments
        ? [...post.comments, newComment]
        : [newComment];

      await updateDoc(postRef, {
        comments: updatedComments,
      });

      setPost((prev: Post | null) => prev ? ({
        ...prev,
        comments: updatedComments,
      }) : null);
      setCommentInput("");
      
      // Create comment notification
      if (post && post.userId) {
        await createCommentNotification(currentUser.uid, post.userId, post.id, commentInput);
      }
      
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <HashLoader size={50} color="#3b82f6" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Post not found</h1>
          <Button onClick={() => router.push("/feed")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  // Get current user profile picture for comment input
  const getCurrentUserProfilePic = () => {
    if (currentUserData?.profilepic) {
      return currentUserData.profilepic;
    }
    
    const username = currentUserData?.username || auth.currentUser?.displayName || "Anonymous";
    return getDefaultProfilePic(username);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64">
          <LeftSidebar />
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto max-h-[calc(100vh-120px)] no-scrollbar px-4 py-6 lg:mr-80">
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>

            {/* Main Post Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6"
            >
              {/* Post Header */}
              <div className="p-2 px-3 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${post.userId}`}>
                      <Avatar className="w-12 h-12 ring-2 ring-gray-100 dark:ring-gray-700">
                        <Image
                          src={
                            post.userProfilePic ||
                            getDefaultProfilePic(post.userName || "Anonymous")
                          }
                          height={48}
                          width={48}
                          alt={`${post.userName || "Anonymous"}'s avatar`}
                          className="rounded-full object-cover"
                        />
                      </Avatar>
                    </Link>
                    <div>
                      <Link href={`/profile/${post.userId}`}>
                        <h3 className="font-semibold text-gray-900 dark:text-white hover:underline">
                          {post.userName || "Anonymous"}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatTime(post.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-3 pb-2">
                <p className="text-gray-900 dark:text-white text-lg leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Image Gallery */}
              {post.images && post.images.length > 0 && (
                <div className="px-6 pb-2">
                  <div className={`grid gap-2 ${
                    post.images.length === 1 ? 'grid-cols-1' : 
                    post.images.length === 2 ? 'grid-cols-2' : 
                    'grid-cols-2'
                  }`}>
                    {post.images.map((image, index) => (
                      <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
                        <Image
                          src={image}
                          alt={`Post image ${index + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="px-6 py-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDislike(post.id)}
                        className={`flex items-center gap-2 ${
                          dislikedPosts.includes(post.id)
                            ? "text-red-500 hover:text-red-600"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span className="text-sm font-medium">{post.dislikes || 0}</span>
                      </Button>
                    </motion.div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleCommentBox}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {post.comments?.length || 0} Comments
                      </span>
                    </Button>

                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(post.id)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <Link2 className="h-4 w-4" />
                        <span className="text-sm font-medium">{post.shares || 0}</span>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Comments Section */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Comments ({post.comments?.length || 0})
                    </h3>

                    {/* Add Comment */}
                    <div className="mb-6">
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-gray-100 dark:ring-gray-700">
                          <Image
                            src={getCurrentUserProfilePic()}
                            height={40}
                            width={40}
                            alt="Your avatar"
                            className="rounded-full object-cover"
                          />
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            placeholder="Write a comment..."
                            className="min-h-[80px] border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                          />
                          <div className="flex justify-end mt-2">
                            <Button 
                              onClick={handlePostComment}
                              disabled={!commentInput.trim()}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Post
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments List */}
                    {post.comments && post.comments.length > 0 ? (
                      <div className="space-y-4">
                        {post.comments.map((comment: Comment, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <Avatar className="w-10 h-10 ring-2 ring-gray-100 dark:ring-gray-600">
                              <Image
                                src={
                                  comment.profilePic ||
                                  getDefaultProfilePic(comment.userName || "Anonymous")
                                }
                                height={40}
                                width={40}
                                alt={`${comment.userName || "Anonymous"}'s avatar`}
                                className="rounded-full object-cover"
                              />
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {comment.userName || "Anonymous"}
                                </h4>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(comment.timestamp)}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {comment.text}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No comments yet. Be the first to comment!
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block fixed right-0 top-0 h-full w-80">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
};

export default PostPage;