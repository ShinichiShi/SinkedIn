"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, MapPin, LogOut, ThumbsDown, MessageCircle, Link2 } from "lucide-react";
import { doc, getDoc, collection, query, getDocs, updateDoc } from "firebase/firestore";
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-primary">Loading...</div>
      </div>
    );
  }

  const getTabClassName = (tab: 'posts' | 'followers' | 'following') => {
    return activeTab === tab
      ? 'px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary'
      : 'px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background/80 to-background">
      {/* Hero Section */}
      <div className="relative w-full h-[300px]">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"
          style={{
            backgroundImage: userData?.backgroundImage ? `url(${userData.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
        </div>
        
        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <div className="relative group">
            <div className="h-32 w-32 rounded-full border-4 border-background bg-primary/10 shadow-xl overflow-hidden transition-transform duration-300 group-hover:scale-105">
              {userData?.profilepic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={userData.profilepic} 
                  alt={userData.username || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold">
                  {userData?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {userData?.username}
            </h1>
            <p className="text-muted-foreground max-w-md">
              {userData?.bio || "No bio yet"}
            </p>
            <div className="flex items-center gap-4">
              {userData?.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="inline-block w-4 h-4">📍</span>
                  <span>{userData.location}</span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 rounded-full bg-secondary/10 border border-border/50 backdrop-blur-sm">
                  <span className="text-sm font-medium">{userData?.followers?.length || 0} Followers</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-secondary/10 border border-border/50 backdrop-blur-sm">
                  <span className="text-sm font-medium">{userData?.following?.length || 0} Following</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4 ml-auto mr-8 flex gap-2">
            <Button
              onClick={handleOpenModal}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <CloudinaryUploadWidget
              onUploadSuccess={(url) => handleImageUpload(url, 'profile')}
              variant="profile"
            />
            <CloudinaryUploadWidget
              onUploadSuccess={(url) => handleImageUpload(url, 'background')}
              variant="background"
            />
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-24 px-4">
        <div className="flex gap-2 mb-6 border-b">
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
            Followers
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={getTabClassName('following')}
          >
            Following
          </button>
        </div>

        <div className="mt-6">
          {activeTab === 'posts' && (
            <div className="grid gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/post/${post.id}`)}
                  className="p-6 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/50 group cursor-pointer"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden relative ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                      {userData?.profilepic ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={userData.profilepic}
                          alt={userData.username || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-primary/10">
                          {userData?.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {userData?.username || "Anonymous"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap px-4 py-2 rounded-lg bg-accent/5">
                    {post.content}
                  </div>

                  <div className="flex justify-around pt-4 mt-4 border-t border-border/30">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <ThumbsDown className="h-5 w-5" />
                      <span>{post.dislikes || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MessageCircle className="h-5 w-5" />
                      <span>{post.comments?.length || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Link2 className="h-5 w-5" />
                      <span>{post.shares || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="text-center text-muted-foreground">
                  No posts yet. Share your first failure story!
                </div>
              )}
            </div>
          )}

          {activeTab === 'followers' && (
            <div className="grid gap-4">
              {userData?.followers.map((followerId) => (
                <UserListItem key={followerId} userId={followerId} />
              ))}
              {!userData?.followers.length && (
                <div className="text-center text-muted-foreground">
                  No followers yet. Keep sharing your failures!
                </div>
              )}
            </div>
          )}

          {activeTab === 'following' && (
            <div className="grid gap-4">
              {userData?.following.map((followingId) => (
                <UserListItem key={followingId} userId={followingId} />
              ))}
              {!userData?.following.length && (
                <div className="text-center text-muted-foreground">
                  You&apos;re not following anyone yet. Find some fellow failures!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg">
            <div className="bg-card border rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Profile</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Background Image</label>
                  {edit.backgroundImage ? (
                    <div className="relative h-32 w-full rounded-lg border-2 border-dashed border-border/50 overflow-hidden group">
                      <Image
                        src={edit.backgroundImage}
                        alt="Background"
                        fill
                        className="object-cover group-hover:opacity-75 transition-opacity"
                      />
                    </div>
                  ) : null}
                  <div className="mt-2">
                    <CloudinaryUploadWidget 
                      onUploadSuccess={handleBackgroundImageUpload}
                      variant="background"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Profile Picture</label>
                  {edit.profilepic ? (
                    <div className="relative h-32 w-32 rounded-full border-2 border-dashed border-border/50 overflow-hidden group mb-2">
                      <Image
                        src={edit.profilepic}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="mt-2">
                    <CloudinaryUploadWidget
                      onUploadSuccess={handleProfileImageUpload}
                      variant="profile"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={edit.username}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-md border bg-background"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    id="bio"
                    value={edit.bio}
                    onChange={handleEditChange}
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border bg-background resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    id="location"
                    value={edit.location}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-md border bg-background"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium rounded-md hover:bg-secondary/80 border border-border/50 transition-all hover:border-border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white/90 rounded-full animate-spin" />
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
      )}
    </div>
  );
}