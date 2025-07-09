"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsDown, MessageCircle, Link2, Trash2, MoreVertical } from "lucide-react";
import { Post } from "@/types";

const MotionButton = motion.button;

interface PostActionsProps {
  post: Post;
  currentUser: any;
  onDislike: (postId: string, event: React.MouseEvent) => void;
  onShare: (postId: string, event: React.MouseEvent) => void;
  onToggleComment: (postId: string, event: React.MouseEvent) => void;
  onDeletePost: (postId: string, event: React.MouseEvent) => void;
}

export default function PostActions({
  post,
  currentUser,
  onDislike,
  onShare,
  onToggleComment,
  onDeletePost,
}: PostActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = currentUser?.uid === post.userId;
const [pendingDeletePostId, setPendingDeletePostId] = useState<string | null>(null);
const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);
const handleSoftDelete = (postId: string, e: React.MouseEvent) => {
  e.stopPropagation();
  setPendingDeletePostId(postId);
  const timer = setTimeout(() => {
    onDeletePost(postId, e); 
    setPendingDeletePostId(null);
  }, 5000);

  setUndoTimer(timer);
};
const handleUndo = () => {
  if (undoTimer) clearTimeout(undoTimer);
  setPendingDeletePostId(null);
};

  return (
    <div className="px-2 py-1 border-t">
      <div className="flex items-center justify-between">
        <div className="flex justify-center items-center">
          <MotionButton
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => onDislike(post.id, e)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors duration-200 ${
              post.dislikedBy?.includes(currentUser?.uid || '')
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <ThumbsDown size={18} />
            <span className="text-sm font-medium">{post.dislikes || 0}</span>
          </MotionButton>

          <MotionButton
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => onToggleComment(post.id, e)}
            className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <MessageCircle size={18} />
            <span className="text-sm font-medium">{post.comments?.filter(c => !c.deleted).length || 0}</span>
          </MotionButton>
        </div>
        
        <div className="flex items-center space-x-2">
          <MotionButton
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => onShare(post.id, e)}
            className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Link2 size={18} />
            <span className="text-sm font-medium">{post.shares || 0}</span>
          </MotionButton>

       {isOwner && (
  <>
    {pendingDeletePostId !== post.id && (
      <MotionButton
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => handleSoftDelete(post.id, e)}
        className="flex items-center justify-center p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors duration-200"
      >
        <Trash2 size={18} />
      </MotionButton>
    )}

  {pendingDeletePostId === post.id&& (
  <div className="relative w-full max-w-md mx-auto px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm overflow-hidden shadow-md">
    <div className="flex items-center justify-between w-full sm:w-auto">
      <button
        onClick={handleUndo}
        className="sm:ml-0 font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        Undo
      </button>
    </div>

    {/* Animated progress bar */}
    <motion.div
      initial={{ width: '100%' }}
      animate={{ width: 0 }}
      transition={{ duration: 5, ease: 'linear' }}
      className="absolute bottom-0 left-0 h-1 bg-blue-500"
    />
  </div>
)}
  </>
)}
        </div>
      </div>
    </div>
  );
}