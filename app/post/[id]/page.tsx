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
import { motion } from "framer-motion";
import { MessageCircle, ThumbsDown, Link2 } from "lucide-react";
import { LeftSidebar } from "@/components/sidebar/leftsidebar";
import { RightSidebar } from "@/components/sidebar/rightsidebar";

// TypeScript interfaces
interface Comment {
  userId: string;
  text: string;
  userName: string;
  profilePic: string;
  timestamp: any; // Firebase Timestamp or Date
}

interface Post {
  id: string;
  userId: string;
  content: string;
  userName?: string;
  userProfilePic?: string;
  timestamp?: any; // Firebase Timestamp
  dislikes?: number;
  dislikedBy?: string[];
  shares?: number;
  comments?: Comment[];
}

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

  const toggleCommentBox = (postId: string) => {
    // This function can be used to toggle comment visibility if needed
    console.log("Toggle comment box for post:", postId);
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
      const currentUserData = cachedUsers.get(currentUser.uid);
      let userName = currentUser.displayName || "Anonymous";
      let profilePic = "";

      // If user data is cached, use it; otherwise fetch it
      if (currentUserData) {
        userName = currentUserData.username || userName;
        profilePic = currentUserData.profilepic || "";
      } else {
        // Fetch current user data if not in cache
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          userName = userData.username || userName;
          profilePic = userData.profilepic || "";
          
          // Add to cache
          setCachedUsers(prev => new Map(prev).set(currentUser.uid, userData));
        }
      }

      const newComment: Comment = {
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
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <HashLoader size={50} color="#ffffff" />
      </div>
    );
  }

  if (!post) {
    return <p>Post not found.</p>;
  }

  return (
    <div className="p-4">
      <LeftSidebar/>
      <div className="w-full max-w-2xl mx-auto">
        <Card className="p-4 mb-4">
          <div className="flex gap-4">
            <Link href={`/profile/${post.userId}`}>
            <Avatar className="w-12 h-12">
              <Image
                src={
                  post.userProfilePic ||
                  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                }
                height={48}
                width={48}
                alt={`${post.userName || "Anonymous"}'s avatar`}
                className="rounded-full"
              />
            </Avatar>
            <div className="flex-1">
              <p className="font-bold">{post.userName || "Anonymous"}</p>
              <p className="text-sm text-gray-600">
                {post.timestamp
                  ? new Date(post.timestamp.seconds * 1000).toLocaleString()
                  : "No timestamp available"}
              </p>
              <p className="mt-2">{post.content}</p>
            </div>
            </Link>
          </div>
          <hr className="my-4 border-secondary" /> 
          <div className="flex justify-around text-sm text-gray-500">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDislike(post.id)}
                className="flex items-center gap-2"
              >
                <ThumbsDown
                  className={`h-4 w-4 ${
                    dislikedPosts.includes(post.id)
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                />
                {post.dislikes || 0} Dislike
              </Button>
            </motion.div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCommentBox(post.id)}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Comment
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare(post.id)}
              className="flex items-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              {post.shares || 0} Shares
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Comments</h3>
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-4">
              {post.comments.map((comment: Comment, index: number) => (
                <div key={index} className="flex gap-4">
                  <Avatar className="w-10 h-10">
                    <Image
                      src={
                        comment.profilePic ||
                        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                      }
                      height={40}
                      width={40}
                      alt={`${comment.userName || "Anonymous"}'s avatar`}
                      className="rounded-full"
                    />
                  </Avatar>
                  <div>
                    <p className="font-bold">{comment.userName || "Anonymous"}</p>
                    <p className="text-sm text-gray-600">
                      {comment.timestamp && comment.timestamp.seconds 
                        ? new Date(comment.timestamp.seconds * 1000).toLocaleString()
                        : comment.timestamp 
                        ? new Date(comment.timestamp).toLocaleString()
                        : "No timestamp"}
                    </p>
                    <p className="mt-1">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No comments yet.</p>
          )}

          <div className="mt-4">
            <Textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add a comment..."
            />
            <Button onClick={handlePostComment} className="mt-2">
              Post Comment
            </Button>
          </div>
        </Card>
      </div>
      <RightSidebar/>
    </div>
  );
};

export default PostPage;