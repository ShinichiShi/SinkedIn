"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  getDocs, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment 
} from "firebase/firestore";
import Image from "next/image";
import { UserPlus, UserMinus } from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { firebaseApp, db } from "@/lib/firebase";
import { toast } from "react-toastify";
import { UserListItem } from "@/components/profile/user-list-item";
import { UserData, Post } from "@/types/index";
import CommentSection from "@/components/post/CommentSection";
import PostActions from "@/components/post/PostActions";
import ImageGallery from "@/components/post/ImageGallery";
import PostContent from "@/components/post/PostContent";
import { formatRelativeTime } from "@/utils/timeUtils";
import Hero from "@/components/profile/Hero";
import Editmodal from "@/components/profile/Editmodal";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { FaSailboat } from "react-icons/fa6";
const MotionButton = motion.button;

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentBoxStates, setCommentBoxStates] = useState<{[key: string]: boolean}>({});
  const [edit, setEdit] = useState<UserData>({
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [cachedUsers, setCachedUsers] = useState<Map<string, any>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dislikedPosts, setDislikedPosts] = useState<string[]>([]);
  const [userFollowing, setUserFollowing] = useState<string[]>([]);

  const router = useRouter();
  const auth = getAuth(firebaseApp);

  const toggleCommentBox = (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCommentBoxStates((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const fetchUserData = useCallback(async () => {
    const user = auth.currentUser;
    
    if (!user) {
      router.push("/login");
      return;
    }

    setCurrentUser(user);

    try {
      const userDoc = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDoc);
    
      if (docSnap.exists()) {
        const fetchedUserData = docSnap.data() as UserData;
        setUserData(fetchedUserData);
        setUserFollowing(fetchedUserData.following || []);
        
        setEdit({
          username: fetchedUserData.username || "",
          email: fetchedUserData.email || "",
          location: fetchedUserData.location || "",
          bio: fetchedUserData.bio || "",
          profilepic: fetchedUserData.profilepic || "",
          backgroundImage: fetchedUserData.backgroundImage || "",
          failedExperience: fetchedUserData.failedExperience || [],
          misEducation: fetchedUserData.misEducation || [],
          failureHighlights: fetchedUserData.failureHighlights || [],
          followers: fetchedUserData.followers || [],
          following: fetchedUserData.following || []
        });
      }
    
      const postsCollection = collection(db, "posts");
      const postsQuery = query(postsCollection);
      const querySnapshot = await getDocs(postsQuery);
      const fetchedPosts = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Post, "id">),
        }))
        .filter((post) => post.userId === user.uid);
    
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching user data or posts:", error);
      toast.error("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  }, [router, auth]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
const handleArrayFieldChange = (field: keyof UserData, values: string[]) => {
  setEdit(prev => ({ ...prev, [field]: values }));
};
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed");
    }
  };

  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleFollow = async (targetUserId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!currentUser) {
      toast.error("Please log in to follow users");
      router.push("/login");
      return;
    }

    try {
      // Update current user's following list
      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId)
      });

      // Update target user's followers list
      const targetUserRef = doc(db, "users", targetUserId);
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUser.uid)
      });

      // Update local state
      setUserFollowing(prev => [...prev, targetUserId]);
      toast.success("Successfully followed user!");
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
    }
  };

  const handleUnfollow = async (targetUserId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!currentUser) {
      toast.error("Please log in to unfollow users");
      router.push("/login");
      return;
    }

    try {
      // Update current user's following list
      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId)
      });

      // Update target user's followers list
      const targetUserRef = doc(db, "users", targetUserId);
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUser.uid)
      });

      // Update local state
      setUserFollowing(prev => prev.filter(id => id !== targetUserId));
      toast.success("Successfully unfollowed user!");
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    }
  };

  const handleDislike = async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      if (!currentUser) {
        toast.error("You need to be logged in to dislike a post.");
        return;
      }

      const postRef = doc(db, "posts", postId);
      const postIndex = posts.findIndex((post) => post.id === postId);
      const post = posts[postIndex];
      const userId = currentUser.uid;
      const hasDisliked = post.dislikedBy?.includes(userId);

      if (hasDisliked) {
        const updatedDislikedBy = post.dislikedBy.filter((id: string) => id !== userId);
        await updateDoc(postRef, {
          dislikes: Math.max((post.dislikes || 0) - 1, 0),
          dislikedBy: updatedDislikedBy,
        });

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
        await updateDoc(postRef, {
          dislikes: (post.dislikes || 0) + 1,
          dislikedBy: updatedDislikedBy,
        });

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
    } catch (error) {
      console.error("Error updating dislikes:", error);
      toast.error("Failed to update dislike.");
    }
  };

  const handlePostComment = async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      if (!currentUser) {
        toast.error("Please log in to comment");
        return;
      }

      const commentText = commentInputs[postId];
      if (!commentText?.trim()) {
        toast.error("Comment cannot be empty");
        return;
      }

      const postRef = doc(db, "posts", postId);
      const postIndex = posts.findIndex((post) => post.id === postId);
      const post = posts[postIndex];

      let userProfilePic = cachedUsers.get(currentUser.uid)?.profilepic;
      if (!userProfilePic) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userProfilePic = userData.profilepic;
          setCachedUsers(prev => new Map(prev).set(currentUser.uid, userData));
        }
      }

      const newComment = {
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        text: commentText,
        profilePic: userProfilePic || null,
        timestamp: new Date()
      };

      const updatedComments = [...(post.comments || []), newComment];
      
      await updateDoc(postRef, {
        comments: updatedComments,
      });

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, comments: updatedComments } : p
        )
      );

      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleShare = async (postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        shares: increment(1),
      });

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p
        )
      );

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
  };

  const handleOpenModal = () => {
    setEdit({
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

  const getTabClassName = (tab: 'posts' | 'followers' | 'following') => {
    return `${
      activeTab === tab
        ? 'border-b-2 border-white text-white'
        : 'text-gray-400 hover:text-white border-b-2 border-transparent hover:border-gray-600'
    } px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ">
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin -mt-6" />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <Hero 
            userData={userData}
            handleOpenModal={handleOpenModal}
            handleLogout={handleLogout}
          />
         
          {/* Tabs and Content */}
          <div className="bg-slate-900">
            {/* Tabs */}
            <div className="border-b border-gray-700">
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
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No followers yet</h3>
                      <p className="text-gray-400 text-sm sm:text-base">Keep sharing your failures!</p>
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
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Not following anyone</h3>
                      <p className="text-gray-400 text-sm sm:text-base">Find some fellow failures!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="space-y-4 sm:space-y-6">
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
                           <div className="p-2 px-3 pb-2">
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
                        <div className="px-4">
                          <ImageGallery images={post.images || []} postId={post.id} />
                        </div>
                    
                        {/* Post Actions */}
                        <PostActions 
                          post={post}
                          currentUser={currentUser}
                          onDislike={handleDislike}
                          onShare={handleShare}
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
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No posts yet</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Share your first failure story!</p>
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