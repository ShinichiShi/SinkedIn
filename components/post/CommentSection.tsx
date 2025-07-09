"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Post, Comment } from "@/types";
import { formatRelativeTime } from "@/utils/timeUtils";
import Link from "next/link";
import { Send, Reply, Trash2, MoreVertical, MessageCircle } from "lucide-react";
import { doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "react-toastify";

const MotionButton = motion.button;

interface CommentSectionProps {
  post: Post;
  currentUser: any;
  cachedUsers: Map<string, any>;
  commentInput: string;
  onCommentInputChange: (postId: string, value: string) => void;
  onPostComment: (postId: string, event: React.MouseEvent, parentId?: string) => void;
  commentBoxStates?: { [key: string]: boolean };
  onPostUpdate?: (updatedPost: Post) => void; 
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  currentUser: any;
  cachedUsers: Map<string, any>;
  onDeleteComment: (commentId: string) => void;
  onReply: (commentId: string) => void;
  replyInputs: { [key: string]: string };
  onReplyInputChange: (commentId: string, value: string) => void;
  onPostReply: (commentId: string) => void;
  showReplyInput: { [key: string]: boolean };
  depth?: number;
}

const CommentItem = ({
  comment,
  postId,
  currentUser,
  cachedUsers,
  onDeleteComment,
  onReply,
  replyInputs,
  onReplyInputChange,
  onPostReply,
  showReplyInput,
  depth = 0
}: CommentItemProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const isOwner = currentUser?.uid === comment.userId;

  // Don't render deleted comments at all
  if (comment.deleted) {
    return null;
  }

  // Filter out deleted replies
  const activeReplies = comment.replies?.filter(reply => !reply.deleted) || [];

  return (
    <div className={`${depth > 0 ? 'ml-12' : ''} py-2`}>
      <div className="flex items-start space-x-2">
        {comment.profilePic || cachedUsers.get(comment.userId)?.profilepic ? (
          <Image
            src={comment.profilePic || cachedUsers.get(comment.userId)?.profilepic}
            alt={`${comment.userName}'s profile`}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {comment.userName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                <Link href={`/profile/${comment?.userId}`} className="hover:underline">
                  <p className="font-medium">{comment?.userName || "Anonymous"}</p>
                </Link>
                <span className="text-gray-500 dark:text-gray-400">·</span>
                <p className="text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(comment.timestamp)}
                </p>
              </div>
              
              {isOwner && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10"
                      >
                        <button
                          onClick={() => {
                            onDeleteComment(comment.id);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 break-words mt-1">
              {comment.text}
            </p>
          </div>

          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
              >
                <Reply size={14} />
                <span>Reply</span>
              </button>
            
            {activeReplies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
              >
                <MessageCircle size={14} />
                <span>
                  {showReplies ? 'Hide' : 'Show'} {activeReplies.length} {activeReplies.length === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            )}
          </div>

          <AnimatePresence>
            {showReplyInput[comment.id] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3"
              >
                <div className="flex items-center space-x-2">
                  {currentUser?.profilepic || cachedUsers.get(currentUser?.uid)?.profilepic ? (
                    <Image
                      src={currentUser.profilepic || cachedUsers.get(currentUser.uid)?.profilepic}
                      alt="Your profile"
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {currentUser?.displayName?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder={`Reply to ${comment.userName}...`}
                    value={replyInputs[comment.id] || ''}
                    onChange={(e) => onReplyInputChange(comment.id, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onPostReply(comment.id);
                      }
                    }}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => onPostReply(comment.id)}
                    disabled={!replyInputs[comment.id]?.trim()}
                    className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showReplies && activeReplies.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3"
              >
                {activeReplies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    postId={postId}
                    currentUser={currentUser}
                    cachedUsers={cachedUsers}
                    onDeleteComment={onDeleteComment}
                    onReply={onReply}
                    replyInputs={replyInputs}
                    onReplyInputChange={onReplyInputChange}
                    onPostReply={onPostReply}
                    showReplyInput={showReplyInput}
                    depth={depth + 1}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default function CommentSection({
  post,
  currentUser,
  cachedUsers,
  commentInput,
  onCommentInputChange,
  onPostComment,
  commentBoxStates = {},
  onPostUpdate,
}: CommentSectionProps) {
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  const [showReplyInput, setShowReplyInput] = useState<{ [key: string]: boolean }>({});
  const [currentPost, setCurrentPost] = useState<Post>(post);

  // Listen for real-time updates to the post
  useEffect(() => {
    if (!post.id) return;

    const unsubscribe = onSnapshot(doc(db, "posts", post.id), (doc) => {
      if (doc.exists()) {
        const updatedPost = { id: doc.id, ...doc.data() } as Post;
        setCurrentPost(updatedPost);
        // Notify parent component of the update
        if (onPostUpdate) {
          onPostUpdate(updatedPost);
        }
      }
    });

    return () => unsubscribe();
  }, [post.id, onPostUpdate]);

  // Recursive function to mark comment and all its replies as deleted
const markCommentAndRepliesDeleted = (comments: Comment[], targetId: string): Comment[] => {
    return comments.map(comment => {
      if (comment.id === targetId) {
        return {
          ...comment,
          deleted: true,
          deletedAt: new Date(),
          replies: comment.replies ? markAllRepliesDeleted(comment.replies) : []
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: markCommentAndRepliesDeleted(comment.replies, targetId)
        };
      }
      return comment;
    });
  };

  // Helper function to mark all replies as deleted
  const markAllRepliesDeleted = (replies: Comment[]): Comment[] => {
    return replies.map(reply => ({
      ...reply,
      deleted: true,
      deletedAt: new Date(),
      replies: reply.replies ? markAllRepliesDeleted(reply.replies) : []
    }));
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const postRef = doc(db, "posts", post.id);
      
      // Mark the comment and all its replies as deleted
      const updatedComments = markCommentAndRepliesDeleted(currentPost.comments || [], commentId);

      // Clean the comments to remove any undefined values before updating
      const cleanedComments = cleanCommentsForFirebase(updatedComments);

      await updateDoc(postRef, {
        comments: cleanedComments
      });

      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };
// Helper function to clean comments and remove undefined values
  const cleanCommentsForFirebase = (comments: Comment[]): Comment[] => {
    return comments.map(comment => {
      const cleanedComment: any = {
        id: comment.id,
        userId: comment.userId,
        userName: comment.userName || "Anonymous",
        text: comment.text || "",
        timestamp: comment.timestamp,
        deleted: comment.deleted || false,
      };

      // Only add optional fields if they have valid values
      if (comment.profilePic) {
        cleanedComment.profilePic = comment.profilePic;
      }
      
      if (comment.parentId) {
        cleanedComment.parentId = comment.parentId;
      }
      
      if (comment.deletedAt) {
        cleanedComment.deletedAt = comment.deletedAt;
      }

      // Handle replies recursively
      if (comment.replies && comment.replies.length > 0) {
        cleanedComment.replies = cleanCommentsForFirebase(comment.replies);
      } else {
        cleanedComment.replies = [];
      }

      return cleanedComment;
    });
  };
  const handleReply = (commentId: string) => {
    setShowReplyInput(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleReplyInputChange = (commentId: string, value: string) => {
    setReplyInputs(prev => ({
      ...prev,
      [commentId]: value
    }));
  };

  const handlePostReply = async (parentCommentId: string) => {
    try {
      const replyText = replyInputs[parentCommentId];
      if (!replyText?.trim()) {
        toast.error("Reply cannot be empty");
        return;
      }

      const postRef = doc(db, "posts", post.id);
      
      // Get current user's profile pic properly
      let userProfilePic = currentUser?.profilepic || cachedUsers.get(currentUser?.uid)?.profilepic;
      if (!userProfilePic) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userProfilePic = userData.profilepic;
        }
      }

      const newReply: Comment = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        text: replyText,
        profilePic: userProfilePic || null,
        timestamp: new Date(),
        parentId: parentCommentId
      };

      // Add reply to the specific parent comment
      const updatedComments = addReplyToSpecificComment(currentPost.comments || [], parentCommentId, newReply);

      await updateDoc(postRef, {
        comments: updatedComments
      });

      // Clear reply input and hide reply box
      setReplyInputs(prev => ({ ...prev, [parentCommentId]: "" }));
      setShowReplyInput(prev => ({ ...prev, [parentCommentId]: false }));

      toast.success("Reply added successfully!");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    }
  };

  // Fixed function to add reply to specific comment only
  const addReplyToSpecificComment = (comments: Comment[], targetParentId: string, reply: Comment): Comment[] => {
    return comments.map(comment => {
      // If this is the target parent comment, add the reply
      if (comment.id === targetParentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply]
        };
      }
      // If this comment has replies, recursively search in them
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToSpecificComment(comment.replies, targetParentId, reply)
        };
      }
      // Return unchanged comment if it's not the target
      return comment;
    });
  };

  // Filter out deleted comments completely
  const activeComments = currentPost.comments?.filter(comment => !comment.deleted) || [];

  return (
    <AnimatePresence>
      {commentBoxStates[post.id] && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          {activeComments.length > 0 && (
            <div className="max-h-96 overflow-y-auto p-4 space-y-1">
              {activeComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  currentUser={currentUser}
                  cachedUsers={cachedUsers}
                  onDeleteComment={handleDeleteComment}
                  onReply={handleReply}
                  replyInputs={replyInputs}
                  onReplyInputChange={handleReplyInputChange}
                  onPostReply={handlePostReply}
                  showReplyInput={showReplyInput}
                />
              ))}
            </div>
          )}

          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {currentUser?.profilepic || cachedUsers.get(currentUser?.uid)?.profilepic ? (
                  <Image
                    src={currentUser.profilepic || cachedUsers.get(currentUser.uid)?.profilepic}
                    alt="Your profile"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {currentUser?.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <div className="flex-1 flex items-center space-x-1">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentInput}
                  onChange={(e) => onCommentInputChange(post.id, e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onPostComment(post.id, e as any);
                    }
                  }}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <MotionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => onPostComment(post.id, e as any)}
                  disabled={!commentInput?.trim()}
                  className="px-2 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Send size={18} />
                </MotionButton>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}