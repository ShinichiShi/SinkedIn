"use client";
import { useEffect, useState, useRef } from "react";
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
  const [hasTriggeredInfiniteScroll, setHasTriggeredInfiniteScroll] = useState(false);
  const hasInitializedRef = useRef(false);
  const fetchInitialPostsRef = useRef<(() => Promise<void>) | null>(null);
  
  // Auth hook
  const { currentUser, userFollowing, setUserFollowing, loading: authLoading } = useAuth();
  
  // User cache hook
  const { cachedUsers, setCachedUsers, fetchUsers } = useUserCache();
  
  // Posts hook
  const {
    posts,
    setPosts,
    loading,
    loadingMore,
    hasMore,
    activeTab,
    fetchInitialPosts,
    loadMorePosts,
    handleTabChange
  } = usePosts(userFollowing, cachedUsers, fetchUsers);

  // Store fetchInitialPosts in ref to avoid dependency issues
  fetchInitialPostsRef.current = fetchInitialPosts;
  
  // Infinite scroll hook - only active after first manual load
  const { observerTarget } = useInfiniteScroll(
    loadMorePosts, 
    hasMore && hasTriggeredInfiniteScroll, // Only enable infinite scroll after first manual load
    loadingMore, 
    posts.length
  );
  
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
  
  // Handle manual load more and enable infinite scroll
  const handleManualLoadMore = async () => {
    await loadMorePosts();
    setHasTriggeredInfiniteScroll(true); // Enable infinite scroll after first manual load
  };

  // Reset infinite scroll state when tab changes
  const handleTabChangeWithReset = (tab: 'foryou' | 'following') => {
    setHasTriggeredInfiniteScroll(false); // Reset infinite scroll state
    handleTabChange(tab);
  };
  
  const lastCommentFetchRef = useRef<number>(0);
  


  // Initial data loading - only run once
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    const initializeFeed = async () => {
      try {
        const auth = getAuth(firebaseApp);
        const user = auth.currentUser;
        if (!user) {
          router.push("/login");
          return;
        } else {
          hasInitializedRef.current = true;
          if (fetchInitialPostsRef.current) {
            await fetchInitialPostsRef.current();
          }
        }
      } catch (error: any) {
        toast.error("Error fetching user data:" + error.message);
      } finally {
        setInitialLoading(false);
      }
    };

    initializeFeed();
  }, [router]); // Only depend on router to prevent infinite loops

  // Re-fetch posts when userFollowing changes and we're on following tab - but only after initial load
  useEffect(() => {
    if (hasInitializedRef.current && 
        userFollowing.length > 0 && 
        activeTab === 'following' && 
        !initialLoading) {
      
      if (fetchInitialPostsRef.current) {
        fetchInitialPostsRef.current();
      }
    }
  }, [userFollowing.length, activeTab, initialLoading]); // Use ref to avoid dependency issues

  // Fetch profile pics for comments
  useEffect(() => {
    const fetchAllCommentProfilePics = async () => {
      const now = Date.now();
      // Debounce: don't fetch if we've fetched within the last 2 seconds
      if (now - lastCommentFetchRef.current < 2000) {
        console.log("Skipping comment profile pic fetch - too soon since last fetch");
        return;
      }
      
      const allComments = posts.flatMap(post => post.comments || []);
      if (allComments.length > 0) {
        const commentUserIds = Array.from(new Set(allComments.map(comment => comment.userId)));
        console.log(`Fetching profile pics for ${commentUserIds.length} comment users`);
        
        lastCommentFetchRef.current = now;
        // Limit comment user fetching to 30 users at a time to avoid overwhelming the system
        await fetchUsers(commentUserIds, 30);
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
                      onClick={() => handleTabChangeWithReset('foryou')}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'foryou'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      For you
                    </button>
                    <button
                      onClick={() => handleTabChangeWithReset('following')}
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
                <div className="text-center py-8">
                  <Loader loading={true} size={30} color="#3b82f6" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                    Loading more posts...
                  </p>
                </div>
              )}

              {/* Manual Load More Button - Shows initially */}
              {hasMore && !loadingMore && posts.length > 0 && !hasTriggeredInfiniteScroll && (
                <div className="text-center py-8">
                  <button
                    onClick={handleManualLoadMore}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Load More Posts
                  </button>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-3">
                    After clicking, new posts will load automatically as you scroll
                  </p>
                </div>
              )}

              {/* Infinite Scroll Trigger - Shows after first manual load */}
              {hasMore && !loadingMore && posts.length > 0 && hasTriggeredInfiniteScroll && (
                <div ref={observerTarget} className="h-20 flex items-center justify-center">
                  <div className="text-gray-400 dark:text-gray-500 text-sm animate-pulse">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <span className="ml-2">Scroll for more posts...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* End of Feed Message */}
              {!loading && !hasMore && posts.length > 0 && (
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