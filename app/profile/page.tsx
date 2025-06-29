"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsDown, MessageCircle, Link2, Pencil, LogOut } from "lucide-react";
import { doc, getDoc, collection, query, getDocs, updateDoc } from "firebase/firestore";
import Image from "next/image";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { firebaseApp, db } from "@/lib/firebase";
import { toast } from "react-toastify";
import { UserListItem } from "@/components/profile/user-list-item";
import { CloudinaryUploadWidget } from "@/components/ui/cloudinary-upload-widget";

interface UserData {
  username: string;
  email: string;
  location?: string;
  bio?: string;
  profilepic?: string;
  backgroundImage?: string;
  failedExperience?: string[];
  misEducation?: string[];
  failureHighlights?: string[];
  followers: string[];
  following: string[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  userId: string;
  timestamp: any;
  dislikes?: number;
  comments?: any[];
  shares?: number;
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const fetchUserData = useCallback(async () => {
    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;
    
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const userDoc = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDoc);
    
      if (docSnap.exists()) {
        const fetchedUserData = docSnap.data() as UserData;
        setUserData(fetchedUserData);
        
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
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = async () => {
    try {
      const auth = getAuth(firebaseApp);
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed");
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
    const auth = getAuth(firebaseApp);
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
      const auth = getAuth(firebaseApp);
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
          <div className="relative w-full h-64 sm:h-80 overflow-hidden">
            {/* Background Image or Gradient */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: userData?.backgroundImage 
                  ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${userData.backgroundImage})`
                  : 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                
              }}
            />
            
            {/* Profile Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-8">              {/* Mobile Layout */}
              <div className="block sm:hidden ">
                {/* Profile Picture - Centered on mobile */}
                <div className="flex justify-center mt-6">
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-200 mt-4">
                    {userData?.profilepic ? (
                      <img 
                        src={userData.profilepic} 
                        alt={userData.username || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600 bg-gray-100">
                        {userData?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Info - Centered on mobile */}
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {userData?.username || 'Unknown User'}
                  </h1>
                  {userData?.bio && (
                    <p className="text-gray-200 text-sm mb-3 px-2">
                      {userData.bio}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 items-center">
                    {userData?.location && (
                      <div className="flex items-center gap-1 text-gray-300 text-sm">
                        <span>📍</span>
                        <span>{userData.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-300">
                      <span className="font-medium">{userData?.followers?.length || 0} Followers</span>
                      <span className="font-medium">{userData?.following?.length || 0} Following</span>
                    </div>
                  </div>

                  {/* Action Buttons - Mobile */}
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      onClick={handleOpenModal}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm text-xs"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={handleLogout}
                      variant="destructive"
                      size="sm"
                      className="bg-red-600/80 hover:bg-red-700 border-none text-xs"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Logout
                    </Button>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex items-end gap-6">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-200">
                    {userData?.profilepic ? (
                      <img 
                        src={userData.profilepic} 
                        alt={userData.username || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-600 bg-gray-100">
                        {userData?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 pb-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <h1 className="text-4xl font-bold text-white mb-2">
                        {userData?.username || 'Unknown User'}
                      </h1>
                      {userData?.bio && (
                        <p className="text-gray-200 text-lg mb-3 max-w-md">
                          {userData.bio}
                        </p>
                      )}
                      <div className="flex items-center gap-6">
                        {userData?.location && (
                          <div className="flex items-center gap-1 text-gray-300">
                            <span>📍</span>
                            <span>{userData.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <span className="font-medium">{userData?.followers?.length || 0} Followers</span>
                          <span className="font-medium">{userData?.following?.length || 0} Following</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleOpenModal}
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="bg-red-600/80 hover:bg-red-700 border-none"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                    {(userData?.followers??[]).map((followerId) => (                    <div
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
                  {(userData?.following??[]).map((followingId) => (
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
                  {posts.map((post) => (
                    <Card
                      key={post.id}
                      onClick={() => router.push(`/post/${post.id}`)}
                      className="p-4 sm:p-6 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0">
                          {userData?.profilepic ? (
                            <img
                              src={userData.profilepic}
                              alt={userData.username || "Profile"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg sm:text-xl font-bold bg-gray-600 text-white">
                              {userData?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-base sm:text-lg">
                            {userData?.username || "Anonymous"}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400">
                            {post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : ""}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-gray-100 leading-relaxed whitespace-pre-wrap mb-4 p-3 sm:p-4 bg-slate-700/30 rounded-lg text-sm sm:text-base">
                        {post.content}
                      </div>

                      <div className="flex justify-between pt-3 sm:pt-4 border-t border-slate-700">
                        <div className="flex items-center space-x-1 sm:space-x-2 text-gray-400 hover:text-red-400 transition-colors">
                          <ThumbsDown className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-sm">{post.dislikes || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2 text-gray-400 hover:text-blue-400 transition-colors">
                          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-sm">{post.comments?.length || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                          <Link2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-sm">{post.shares || 0}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {posts.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <div className="text-4xl sm:text-6xl mb-4">📝</div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No posts yet</h3>
                      <p className="text-gray-400 text-sm sm:text-base">Share your first failure story!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-semibold text-white">Edit Profile</h2>
                      <button
                        onClick={handleCloseModal}
                        className="text-gray-400 hover:text-white transition-colors text-xl"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Background Image</label>
                        {edit.backgroundImage && (
                          <div className="relative h-24 sm:h-32 w-full rounded-lg border-2 border-dashed border-slate-600 overflow-hidden mb-2">
                            <img
                              src={edit.backgroundImage}
                              alt="Background"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CloudinaryUploadWidget 
                          onUploadSuccess={handleBackgroundImageUpload}
                          variant="background"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
                        {edit.profilepic && (
                          <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full border-2 border-dashed border-slate-600 overflow-hidden mx-auto mb-2">
                            <img
                              src={edit.profilepic}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CloudinaryUploadWidget
                          onUploadSuccess={handleProfileImageUpload}
                          variant="profile"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                        <input
                          type="text"
                          id="username"
                          value={edit.username}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                        <textarea
                          id="bio"
                          value={edit.bio}
                          onChange={handleEditChange}
                          rows={3}
                          className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                          placeholder="Write a short bio..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                        <input
                          type="text"
                          id="location"
                          value={edit.location}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                          placeholder="Where are you located?"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
                        <button
                          onClick={handleCloseModal}
                          className="px-4 py-2 text-sm font-medium rounded-md border border-slate-600 text-gray-300 hover:bg-slate-700 transition-all order-2 sm:order-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isUploading}
                          className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                        >
                          {isUploading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Saving...
                            </span>
                          ) : (
                            "Save Changes"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}