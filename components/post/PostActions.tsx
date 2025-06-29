"use client";
import { motion } from "framer-motion";
import { ThumbsDown, MessageCircle, Link2 } from "lucide-react";
import { Post } from "@/types";

const MotionButton = motion.button;

interface PostActionsProps {
  post: Post;
  currentUser: any;
  onDislike: (postId: string, event: React.MouseEvent) => void;
  onShare: (postId: string, event: React.MouseEvent) => void;
  onToggleComment: (postId: string, event: React.MouseEvent) => void;
}

export default function PostActions({
  post,
  currentUser,
  onDislike,
  onShare,
  onToggleComment,
}: PostActionsProps) {
  return (
    <div className="px-2 py-1 border-t ">
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
            <span className="text-sm font-medium">{post.comments?.length || 0}</span>
          </MotionButton>
          </div>
          
            <div>
            <MotionButton
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => onShare(post.id, e)}
            className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Link2 size={18} />
            <span className="text-sm font-medium">{post.shares || 0}</span>
          </MotionButton>
            </div>
         
        </div>
    </div>
  );
}
