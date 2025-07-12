"use client";
import { useEffect, useState } from "react";
import { CreatePost } from "@/components/post/create-post";
import { LeftSidebar } from "@/components/sidebar/leftsidebar";
import { RightSidebar } from "@/components/sidebar/rightsidebar";
import { useRouter } from "next/navigation";
import { firebaseApp } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { HashLoader as Loader } from "react-spinners";
import { toast } from "react-toastify";
import ImageGallery from "@/components/post/ImageGallery";
import PostContent from "@/components/post/PostContent";
import PostHeader from "@/components/post/PostHeader";
import PostActions from "@/components/post/PostActions";
import CommentSection from "@/components/post/CommentSection";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactElement, FC } from 'react';

// Import custom hooks
import { useAuth } from "@/hooks/useAuth";
import { useUserCache } from "@/hooks/useUserCache";
import { usePosts } from "@/hooks/usePosts";
import { usePostActions } from "@/hooks/usePostActions";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

export default function Feed(): ReactElement {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Auth hook
  const { currentUser, userFollowing, setUserFollowing, loading: authLoading } = useAuth();
  
  // User cache hook
  const { cachedUsers, setCachedUsers, fetchUsers } = useUserCache();
  
  // Posts hook
  const {
    posts,
    setPosts,
    hasMore,
    loadingMore,
    activeTab,
    fetchInitialPosts,
    loadMorePosts,
    handleTabChange
  } = usePosts(userFollowing, cachedUsers, fetchUsers);
  
  // Post actions hook
  const {
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
  } = usePostActions(posts, setPosts, cachedUsers, setCachedUsers, setUserFollowing);
  
  // Infinite scroll hook
  const { observerTarget } = useInfiniteScroll(loadMorePosts, hasMore, loadingMore);

  // Initial data loading
  useEffect(() => {
    try {
      const auth = getAuth(firebaseApp);
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      } else {
        fetchInitialPosts().finally(() => setInitialLoading(false));
      }
    } catch (error: any) {
      toast.error("Error fetching user data:" + error.message);
      setInitialLoading(false);
    }
  }, [router, fetchInitialPosts]);

  // Re-fetch posts when userFollowing changes and we're on following tab
  useEffect(() => {
    if (userFollowing.length > 0 && activeTab === 'following' && !initialLoading) {
      fetchInitialPosts('following');
    }
  }, [userFollowing, activeTab, initialLoading, fetchInitialPosts]);

  // Fetch profile pics for comments
  useEffect(() => {
    const fetchAllCommentProfilePics = async () => {
      const allComments = posts.flatMap(post => post.comments || []);
      if (allComments.length > 0) {
        const commentUserIds = Array.from(new Set(allComments.map(comment => comment.userId)));
        await fetchUsers(commentUserIds);
      }
    };

    if (posts.length > 0) {
      fetchAllCommentProfilePics();
    }
  }, [posts, fetchUsers]);

  if (initialLoading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader loading={true} size={50} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <LeftSidebar />
          </div>
        </aside>
      
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-2xl mx-auto px-4 py-6">
              {/* Create Post */}
              <div className="mb-3">
                <CreatePost />
              </div>

              {/* Feed Tabs */}
              <div className="mb-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex">
                    <button
                      onClick={() => handleTabChange('foryou')}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'foryou'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      For you
                    </button>
                    <button
                      onClick={() => handleTabChange('following')}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'following'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      Following
                    </button>
                  </div>
                </div>
              </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              <AnimatePresence>
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
                   
                  >
                    {/* Post Header */}
                    <div onClick={() => handlePostClick(post.id)}>
                    <PostHeader 
                    post={post}
                    currentUser = {currentUser}
                    userFollowing = {userFollowing}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                    />
                    <PostContent content={post.content}/>
                    </div>
                    
                    {/* Image Gallery */}
                    <div className="px-4">
                      <ImageGallery images={post.images || []} postId={post.id} />
                    </div>

                    {/* Post Actions */}
                    <PostActions 
                    post={post}
                    currentUser={currentUser}
                    onDislike={handleDislike}
                    onDeletePost={handleDeletePost}
                    onShare={handleShare}
                    onToggleComment={toggleCommentBox}/>

                    {/* Comment Section */}
                     <CommentSection 
                      post={post}
                      currentUser={currentUser}
                      cachedUsers={cachedUsers}
                      onCommentInputChange={(setPostId: string, value: string) => {
                        setCommentInputs(prev => ({
                          ...prev,
                          [setPostId]: value
                        }));
                      }}
                      onPostComment={handlePostComment}
                      commentInput={commentInputs[post.id]}
                      commentBoxStates={commentBoxStates}
                     />         
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="flex justify-center py-8">
                  <Loader loading={loadingMore} size={30} color="#3b82f6" />
                </div>
              )}

              {/* Load More Trigger */}
              <div ref={observerTarget} className="h-10" />

              {/* End of Feed Message */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center pb-14">
                  <p className="text-gray-500 dark:text-gray-400">
                    You&apos;ve reached the end of your feed...How jobless can you be -_-
                  </p>
                </div>
              )}

              {/* No Posts Message */}
              {!initialLoading && posts.length === 0 && (
                <div className="text-center py-12">
                  {activeTab === 'following' ? (
                    <>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">
                        No posts from people you follow
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        Follow some users to see their posts here
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">
                        No posts to display
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        Follow some users or create your first post!
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <RightSidebar />
          </div>
        </aside>
      </div>
    </div>
  );
}