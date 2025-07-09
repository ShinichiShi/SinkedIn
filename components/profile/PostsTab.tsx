import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Post } from '@/types/index';
import PostHeader from '@/components/post/PostHeader';
import PostContent from '@/components/post/PostContent';
import ImageGallery from '@/components/post/ImageGallery';
import PostActions from '@/components/post/PostActions';
import CommentSection from '@/components/post/CommentSection';

interface PostsTabProps {
  posts: Post[];
  currentUser: any;
  userFollowing: string[];
  commentBoxStates: {[key: string]: boolean};
  commentInputs: {[key: string]: string};
  cachedUsers: Map<string, any>;
  onPostClick: (postId: string) => void;
  onFollow: (targetUserId: string, event: React.MouseEvent) => void;
  onUnfollow: (targetUserId: string, event: React.MouseEvent) => void;
  onDislike: (postId: string, event: React.MouseEvent) => void;
  onShare: (postId: string, event: React.MouseEvent) => void;
  onToggleComment: (postId: string, event: React.MouseEvent) => void;
  onCommentInputChange: (postId: string, value: string) => void;
  onPostComment: (postId: string, event: React.MouseEvent) => void;
}

export const PostsTab: React.FC<PostsTabProps> = ({
  posts,
  currentUser,
  userFollowing,
  commentBoxStates,
  commentInputs,
  cachedUsers,
  onPostClick,
  onFollow,
  onUnfollow,
  onDislike,
  onShare,
  onToggleComment,
  onCommentInputChange,
  onPostComment
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <AnimatePresence>
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
          >
            <div onClick={() => onPostClick(post.id)}>
              <PostHeader 
                post={post}
                currentUser={currentUser}
                userFollowing={userFollowing}
                onFollow={onFollow}
                onUnfollow={onUnfollow}
              />
              <PostContent content={post.content} />
            </div>

            {/* Image Gallery */}
            <div className="px-4">
              <ImageGallery images={post.images || []} postId={post.id} />
            </div>
          
            {/* <PostActions 
              post={post}

              currentUser={currentUser}
              onDislike={onDislike}
              onShare={onShare}
              onToggleComment={onToggleComment}
            /> */}
          
            {/* Comment Section */}
            <CommentSection 
              post={post}
              currentUser={currentUser}
              cachedUsers={cachedUsers}
              onCommentInputChange={onCommentInputChange}
              onPostComment={onPostComment}
              commentInput={commentInputs[post.id]}
              commentBoxStates={commentBoxStates}
            />  
          </motion.div>
        ))}
        {posts.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-6xl mb-4">📝</div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-gray-400 text-sm sm:text-base">Share your first failure story!</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};