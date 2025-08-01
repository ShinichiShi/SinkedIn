// hooks/usePostActions.ts (Fixed typo and optimized)
import { useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
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

  const getAuthToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    return await currentUser.getIdToken();
  };

  const handleDeletePost = useCallback(async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete post');
      }

      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      toast.success("Post deleted successfully");
      
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete post");
    }
  }, [setPosts]);

  const handleDislike = useCallback(async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const token = await getAuthToken();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("You need to be logged in to dislike a post.");
        return;
      }

      const postIndex = posts.findIndex((post) => post.id === postId);
      const post = posts[postIndex];
      const userId = currentUser.uid;
      const hasDisliked = post.dislikedBy?.includes(userId);

      // Optimistic update
      if (hasDisliked) {
        const updatedDislikedBy = post.dislikedBy.filter((id: string) => id !== userId);
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

      const response = await fetch(`/api/posts/${postId}/dislike`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? post : p
          )
        );
        setDislikedPosts(hasDisliked ? [...dislikedPosts, postId] : dislikedPosts.filter((id) => id !== postId));
        
        const error = await response.json();
        throw new Error(error.error || 'Failed to update dislike');
      }

    } catch (error) {
      console.error("Error updating dislikes:", error);
      toast.error("Failed to update dislike.");
    }
  }, [posts, setPosts, dislikedPosts]);

  const handleShare = useCallback(async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const token = await getAuthToken();

      // Optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p
        )
      );

      const response = await fetch(`/api/posts/${postId}/share`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? { ...p, shares: Math.max((p.shares || 0) - 1, 0) } : p
          )
        );
        
        const error = await response.json();
        throw new Error(error.error || 'Failed to share post');
      }

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
      const token = await getAuthToken();
      const commentText = commentInputs[postId]; // Fixed typo here: was "consText"
      
      if (!commentText?.trim()) {
        toast.error("Comment cannot be empty");
        return;
      }

      const response = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add comment');
      }

      const { comment } = await response.json();

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { 
            ...p, 
            comments: [...(p.comments || []), comment] 
          } : p
        )
      );

      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      toast.success("Comment added successfully!");
      
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add comment");
    }
  }, [posts, setPosts, commentInputs]);

  const handlePostClick = useCallback((postId: string) => {
    router.push(`/post/${postId}`);
  }, [router]);

  const handleFollow = useCallback(async (targetUserId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const token = await getAuthToken();

      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to follow user');
      }

      setUserFollowing(prev => [...prev, targetUserId]);
      toast.success("Successfully followed user!");
      
    } catch (error) {
      console.error("Error following user:", error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        router.push("/login");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to follow user");
      }
    }
  }, [router, setUserFollowing]);

  const handleUnfollow = useCallback(async (targetUserId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const token = await getAuthToken();

      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unfollow user');
      }

      setUserFollowing(prev => prev.filter(id => id !== targetUserId));
      toast.success("Successfully unfollowed user!");
      
    } catch (error) {
      console.error("Error unfollowing user:", error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        router.push("/login");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to unfollow user");
      }
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