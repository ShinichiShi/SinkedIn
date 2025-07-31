"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, UserPlus, UserMinus } from "lucide-react";
import Image from "next/image";
import { getAuth, signOut } from "firebase/auth";
import { doc,updateDoc } from "firebase/firestore";
import { firebaseApp,db } from "@/lib/firebase";
import { UserListItem } from "@/components/profile/user-list-item";
import { UserData } from "@/types/index";
import CommentSection from "@/components/post/CommentSection";
import PostActions from "@/components/post/PostActions";
import ImageGallery from "@/components/post/ImageGallery";
import PostContent from "@/components/post/PostContent";
import { formatRelativeTime } from "@/utils/timeUtils";
import Hero from "@/components/profile/Hero";
import Editmodal from "@/components/profile/Editmodal";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { FaSailboat } from "react-icons/fa6";
import { toast } from "react-toastify";

// Import custom hooks
import { useAuth } from "@/hooks/useAuth";
import { useUserCache } from "@/hooks/useUserCache";
import { usePostActions } from "@/hooks/usePostActions";
import { useUserProfile } from "@/hooks/useUserProfile";

const MotionButton = motion.button;

export default function UserProfile() {
  const router = useRouter();
  const auth = getAuth(firebaseApp);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [edit, setEdit] = useState<UserData>({
    uid: "",
    username: "",
    email: "",
    location: "",
    bio: "",
    profilepic: "",
    backgroundImage: "",
    failedExperience: [],
    misEducation: [],
    failureHighlights: [],
    followers: [],
    following: []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Auth hook
  const { currentUser, userFollowing, setUserFollowing, loading: authLoading } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  // User cache hook
  const { cachedUsers, setCachedUsers } = useUserCache();

  // User profile hook - only pass currentUser.uid if currentUser exists
  const { 
    userData, 
    posts, 
    loading: profileLoading,
    setPosts, 
    isFollowing, 
    setUserData
  } = useUserProfile(currentUser?.uid || null, currentUser, setUserFollowing);
    const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed");
    }
  };

  // Post actions hook
  const {
    commentBoxStates,
    commentInputs,
    setCommentInputs,
    handleDislike,
    handleShare,
    handleDeletePost,
    toggleCommentBox,
    handlePostComment,
    handlePostClick,
    handleFollow,
    handleUnfollow
  } = usePostActions(posts, setPosts, cachedUsers, setCachedUsers, setUserFollowing);
const handleArrayFieldChange = (field: keyof UserData, values: string[]) => {
  setEdit(prev => ({ ...prev, [field]: values }));
};
  // Combined loading state
  const loading = authLoading || profileLoading;
 const handleOpenModal = () => {
    setEdit({
      uid: currentUser?.uid || "",
      username: userData?.username || "",
      email: userData?.email || "",
      location: userData?.location || "",
      bio: userData?.bio || "",
      profilepic: userData?.profilepic || "",
      backgroundImage: userData?.backgroundImage || "",
      failedExperience: userData?.failedExperience || [],
      misEducation: userData?.misEducation || [],
      failureHighlights: userData?.failureHighlights || [],
      followers: userData?.followers || [],
      following: userData?.following || []
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEdit(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleArrayEdit = (key: keyof UserData, index: number, value: string) => {
    setEdit(prev => {
      const currentArray = prev[key] as string[] | undefined;
      const updatedArray = currentArray ? [...currentArray] : [];
      updatedArray[index] = value;
      return {
        ...prev,
        [key]: updatedArray
      };
    });
  };
  
  const handleAddArrayItem = (key: keyof UserData) => {
    setEdit(prev => {
      const currentArray = prev[key] as string[] | undefined;
      return {
        ...prev,
        [key]: [...(currentArray || []), ""]
      };
    });
  };
  
  const handleRemoveArrayItem = (key: keyof UserData, index: number) => {
    setEdit(prev => {
      const currentArray = prev[key] as string[] | undefined;
      if (!currentArray) return prev;

      const updatedArray = [...currentArray];
      updatedArray.splice(index, 1);
      return {
        ...prev,
        [key]: updatedArray
      };
    });
  };

  const handleProfileImageUpload = (url: string) => {
    setEdit(prev => ({ ...prev, profilepic: url }));
  };

  const handleBackgroundImageUpload = (url: string) => {
    setEdit(prev => ({ ...prev, backgroundImage: url }));
  };

  const handleImageUpload = async (url: string, type: 'profile' | 'background') => {
    const user = auth.currentUser;
    
    if (!user) {
      toast.error("You must be logged in to upload images");
      return;
    }

    try {
      const userDoc = doc(db, "users", user.uid);
      const updateData = type === 'profile' 
        ? { profilepic: url }
        : { backgroundImage: url };
        
      await updateDoc(userDoc, updateData);
      
      setUserData(prev => ({
        ...prev!,
        ...updateData
      }));
      
      toast.success(`${type === 'profile' ? 'Profile' : 'Background'} image updated successfully`);
    } catch (error) {
      console.error("Error updating image:", error);
      toast.error("Failed to update image");
    }
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      const user = auth.currentUser;
      
      if (!user) {
        toast.error("You must be logged in to edit your profile");
        return;
      }

      const userDoc = doc(db, "users", user.uid);
      
      // Create update data with explicit typing for Firestore
      const updateData: { [key: string]: any } = {
        username: edit.username,
        email: edit.email,
        location: edit.location || "",
        bio: edit.bio || "",
        profilepic: edit.profilepic || "",
        backgroundImage: edit.backgroundImage || "",
        failedExperience: edit.failedExperience || [],
        misEducation: edit.misEducation || [],
        failureHighlights: edit.failureHighlights || [],
        followers: edit.followers || [],
        following: edit.following || []
      };

      await updateDoc(userDoc, updateData);

      setUserData(prev => ({
        ...prev!,
        ...edit
      }));

      toast.success("Profile updated successfully");
      handleCloseModal();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUploading(false);
    }
  };

  // Default avatar if not provided
  const avatarSrc = userData?.profilepic || 
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";


  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, authLoading, router]);

  const getTabClassName = (tab: 'posts' | 'followers' | 'following') => {
    return `${
      activeTab === tab
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-500'
        : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
    } px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all cursor-pointer rounded-full border`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return null; 
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-white">User Not Found</h1>
          <p className="text-gray-400 mb-4">The user you&apos;re looking for doesn&apos;t exist.</p>
          <button 
            onClick={() => router.push("/")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      {loading ? (
        <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin -mt-6" />
        </div>
      ) : (
        <>
      <Hero 
            userData={userData}
            handleOpenModal={handleOpenModal}
            handleLogout={handleLogout}
        />
         
      {/* Tabs and Content */}
      <div className="bg-white dark:bg-slate-900">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="container max-w-6xl mx-auto px-4 sm:px-8">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('posts')}
                className={getTabClassName('posts')}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab('followers')}
                className={getTabClassName('followers')}
              >
                <span className="hidden sm:inline">Followers </span>
                <span className="sm:hidden">Followers </span>
                ({userData?.followers?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={getTabClassName('following')}
              >
                <span className="hidden sm:inline">Following </span>
                <span className="sm:hidden">Following </span>
                ({userData?.following?.length || 0})
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="container max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {activeTab === 'followers' && (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
              {(userData?.followers ?? []).map((followerId) => (
                <div
                  key={followerId}
                  className="transform transition-all duration-300 hover:scale-105"
                >
                  <UserListItem userId={followerId} />
                </div>
              ))}
              {!userData?.followers?.length && (
                <div className="col-span-full text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-4">👥</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">No followers yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Keep sharing your failures!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'following' && (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
              {(userData?.following ?? []).map((followingId) => (
                <div
                  key={followingId}
                  className="transform transition-all duration-300 hover:scale-105"
                >
                  <UserListItem userId={followingId} />
                </div>
              ))}
              {!userData?.following?.length && (
                <div className="col-span-full text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-4">🔍</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Not following anyone</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Find some fellow failures!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
              <AnimatePresence>
                {posts
                  .slice()
                  .sort((a, b) => {
                    const aTime = a.timestamp instanceof Date
                      ? a.timestamp.getTime()
                      : (a.timestamp?.seconds || 0) * 1000;
                  
                    const bTime = b.timestamp instanceof Date
                      ? b.timestamp.getTime()
                      : (b.timestamp?.seconds || 0) * 1000;
                  
                    return bTime - aTime; // latest first
                  })
                  .map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
                    >
                      <div onClick={() => handlePostClick(post.id)}>
                        <div className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                {userData?.profilepic ? (
                                  <Image
                                    src={userData.profilepic}
                                    alt={`${userData.username}'s profile`}
                                    height={40}
                                    width={40}
                                    className="w-10 h-10 rounded-full"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {(post.userName || 'Anonymous').charAt(0).toUpperCase()}
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
                                    ? handleUnfollow(post.userId, e)
                                    : handleFollow(post.userId, e)
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
                        <PostContent content={post.content}/>
                      </div>

                      {/* Image Gallery */}
                      <div className={`pb-2 ${(post.images || []).length === 1 ? '' : 'px-4'}`}>
                        <ImageGallery images={post.images || []} postId={post.id} />
                      </div>
                
                      {/* Post Actions */}
                      <PostActions 
                        post={post}
                        currentUser={currentUser}
                        onDislike={handleDislike}
                        onShare={handleShare}
                        onDeletePost={handleDeletePost}
                        onToggleComment={toggleCommentBox}
                      />
                
                      {/* Comment Section */}
                      <CommentSection 
                        post={post} 
                        currentUser={userData}
                        cachedUsers={cachedUsers}
                        onCommentInputChange={(postId: string, value: string) => {
                          setCommentInputs(prev => ({
                            ...prev,
                            [postId]: value
                          }));
                        }}
                        onPostComment={handlePostComment}
                        commentInput={commentInputs[post.id]}
                        commentBoxStates={commentBoxStates}
                      />  
                    </motion.div>
                  ))}
                {posts.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-4xl sm:text-6xl mb-4">📝</div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Share your first failure story!</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

          {/* Edit Profile Modal */}
          {isModalOpen && (
            <Editmodal 
              handleCloseModal={handleCloseModal}
              edit={edit}
              uploadToCloudinary={uploadToCloudinary}
              isUploading={isUploading}
              handleArrayFieldChange={handleArrayFieldChange}
              handleEditChange={handleEditChange}
              handleSave={handleSave}
            />
          )}
        </>
      )}    
      </div>
  );
}