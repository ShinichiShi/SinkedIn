"use client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Post } from "@/types";
import { formatRelativeTime } from "@/utils/timeUtils";
import Link from "next/link";
const MotionButton = motion.button;

interface CommentSectionProps {
  post: Post;
  currentUser: any;
  cachedUsers: Map<string, any>;
  commentInput: string;
  onCommentInputChange: (postId: string, value: string) => void;
  onPostComment: (postId: string, event: React.MouseEvent) => void;
  commentBoxStates?: { [key: string]: boolean };
}
export default function CommentSection({
  post,
  currentUser,
  cachedUsers,
  commentInput,
  onCommentInputChange,
  onPostComment,
  commentBoxStates = {},
}: CommentSectionProps) {

  return (
    <AnimatePresence>
      {commentBoxStates[post.id] && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          {/* Existing Comments */}
          {post.comments?.length > 0 && (
            <div className="max-h-60 overflow-y-auto p-2 space-y-3">
              {post.comments.map((comment, index) => (
                <div key={index} className="flex items-start space-x-2">
                    {comment.profilePic || cachedUsers.get(comment.userId)?.profilepic ? (
                      <Image
                        src={
                          comment.profilePic ||
                          cachedUsers.get(comment.userId)?.profilepic
                        }
                        alt={`${comment.userName}'s profile`}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>
                    )}

                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2 flex flex-col">
                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                      <Link href={`/profile/${comment?.userId}`} className="hover:underline">
                      <p className="font-medium">{comment?.userName || "Anonymous"}</p>
                      </Link>
                      <span className="text-gray-500 dark:text-gray-400">·</span>
                      <p className="text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(comment.timestamp)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {currentUser?.profilepic ||
                cachedUsers.get(currentUser?.uid)?.profilepic ? (
                  <Image
                    src={
                      currentUser.profilepic ||
                      cachedUsers.get(currentUser.uid)?.profilepic
                    }
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

              <div className="flex-1 flex items-center space-x-2">
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
                  className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-full px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <MotionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => onPostComment(post.id, e as any)}
                  disabled={!commentInput?.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Post
                </MotionButton>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
