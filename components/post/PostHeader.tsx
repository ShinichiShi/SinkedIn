"use client";
import { motion } from "framer-motion";
import { UserPlus, UserMinus } from "lucide-react";
import Image from "next/image";
import { Post } from "@/types";
import { formatRelativeTime } from "@/utils/timeUtils";

const MotionButton = motion.button;

interface PostHeaderProps {
  post: Post;
  currentUser: any;
  userFollowing: string[];
  onFollow: (targetUserId: string, event: React.MouseEvent) => void;
  onUnfollow: (targetUserId: string, event: React.MouseEvent) => void;
}

export default function PostHeader({
  post,
  currentUser,
  userFollowing,
  onFollow,
  onUnfollow,
}: PostHeaderProps) {
  return (
    <div className="p-2 px-3 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {post.userProfilePic ? (
              <Image
                src={post.userProfilePic}
                alt={`${post.userName}'s profile`}
                height={40}
                width={40}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {post.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {post.userName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatRelativeTime(post.timestamp)}
            </p>
          </div>
        </div>

        {currentUser && post.userId !== currentUser.uid && (
          <MotionButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => 
              userFollowing.includes(post.userId) 
                ? onUnfollow(post.userId, e)
                : onFollow(post.userId, e)
            }
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 flex items-center gap-1 ${
              userFollowing.includes(post.userId)
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {userFollowing.includes(post.userId) ? (
              <>
                <UserMinus size={14} />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus size={14} />
                Follow
              </>
            )}
          </MotionButton>
        )}
      </div>
    </div>
  );
}
