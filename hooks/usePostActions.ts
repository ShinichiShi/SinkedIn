import { useState, useCallback } from 'react';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { toast } from 'react-toastify';
import { Post, Comment } from '@/types';
import { useRouter } from 'next/navigation';

export const usePostActions = (
  posts: Post[], 
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>,
  cachedUsers: Map<string, any>,
  setCachedUsers: React.Dispatch<React.SetStateAction<Map<string, any>>>,
  setUserFollowing: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const [dislikedPosts, setDislikedPosts] = useState<string[]>([]);
  const [commentBoxStates, setCommentBoxStates] = useState<{[key: string]: boolean}>({});
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const router = useRouter();

  const handleDeletePost = useCallback(async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("You must be logged in to delete posts");
      return;
    }

    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        toast.error("Post not found");
        return;
      }
      
      const postData = postDoc.data() as Post;
      
      if (postData.userId !== currentUser.uid) {
        toast.error("You can only delete your own posts");
        return;
      }

        await updateDoc(postRef, {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: currentUser.uid
        });

        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        toast.success("Post deleted successfully");
      
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  }, [setPosts]);

  const handleDislike = useCallback(async (postId: string, event: React.MouseEvent) => {
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
  }, [posts, setPosts, dislikedPosts]);

  const handleShare = useCallback(async (postId: string, event: React.MouseEvent) => {
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
  }, [setPosts]);

  const toggleCommentBox = useCallback((postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCommentBoxStates((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  }, []);

  const handlePostComment = useCallback(async (postId: string, event: React.MouseEvent) => {
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

      const newComment: Comment = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        text: commentText,
        profilePic: userProfilePic || null,
        timestamp: new Date(),
        replies: []
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
  }, [posts, setPosts, commentInputs, cachedUsers, setCachedUsers]);

  const handlePostClick = useCallback((postId: string) => {
    router.push(`/post/${postId}`);
  }, [router]);

  const handleFollow = useCallback(async (targetUserId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Please log in to follow users");
      router.push("/login");
      return;
    }

    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId)
      });

      const targetUserRef = doc(db, "users", targetUserId);
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUser.uid)
      });

      setUserFollowing(prev => [...prev, targetUserId]);
      toast.success("Successfully followed user!");
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
    }
  }, [router, setUserFollowing]);

  const handleUnfollow = useCallback(async (targetUserId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Please log in to unfollow users");
      router.push("/login");
      return;
    }

    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId)
      });

      const targetUserRef = doc(db, "users", targetUserId);
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUser.uid)
      });

      setUserFollowing(prev => prev.filter(id => id !== targetUserId));
      toast.success("Successfully unfollowed user!");
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    }
  }, [router, setUserFollowing]);

  return {
    dislikedPosts,
    commentBoxStates,
    commentInputs,
    setCommentInputs,
    handleDeletePost,
    handleDislike,
    handleShare,
    toggleCommentBox,
    handlePostComment,
    handlePostClick,
    handleFollow,
    handleUnfollow
  };
};
