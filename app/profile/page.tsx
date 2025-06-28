"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, MapPin, Building2, GraduationCap, ThumbsDown, LogOut } from "lucide-react";
import { doc, getDoc, collection, query, getDocs, updateDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { firebaseApp, db } from "@/lib/firebase";
import { HashLoader } from "react-spinners";
import { toast } from "react-toastify";

interface UserData {
  username: string;
  email: string;
  location?: string;
  bio?: string;
  profilepic?: string;
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
}

export default function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<UserData>({
    username: "",
    email: "",
    location: "",
    bio: "",
    profilepic: "",
    failedExperience: [],
    misEducation: [],
    failureHighlights: [],
    followers: [],
    following: []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0] || null;
    setFile(uploadedFile);

    if (uploadedFile) {
      setPreview(URL.createObjectURL(uploadedFile));
    }
  };
  const uploadFile = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        const auth = getAuth(firebaseApp);
        const user = auth.currentUser;

        if (!user) {
          toast.error("No authenticated user found");
          return;
        }

        setEdit(prev => ({ ...prev, profilepic: data.url }));
        setPreview(null);
        setFile(null);
        toast.success("Profile picture uploaded successfully!");
      } else {
        throw new Error("Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;
  
    if (!user) {
      toast.error("No authenticated user found");
      return;
    }
  
    try {
      const userDoc = doc(db, "users", user.uid);
      await updateDoc(userDoc, {
        username: edit.username,
        bio: edit.bio,
        location: edit.location,
        profilepic: edit.profilepic || userData?.profilepic,
        failedExperience: edit.failedExperience,
        misEducation: edit.misEducation,
        failureHighlights: edit.failureHighlights,
        followers: edit.followers,
        following: edit.following
      });
  
      setUserData(prev => ({
        ...prev!,
        username: edit.username,
        bio: edit.bio,
        location: edit.location,
        profilepic: edit.profilepic || prev?.profilepic,
        failedExperience: edit.failedExperience,
        misEducation: edit.misEducation,
        failureHighlights: edit.failureHighlights,
        followers: edit.followers,
        following: edit.following
      }));
  
      toast.success("Profile successfully updated!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  // Default avatar if not provided
  const avatarSrc = userData?.profilepic || 
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <HashLoader color="white" />
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-0 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
        >
          <div className="flex items-start gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <Avatar className="w-24 h-24 border-2 border-purple-500/20">
                <Image
                  src={avatarSrc}
                  alt={userData?.username || "Profile"}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              </Avatar>
            </motion.div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">{userData?.username}</h1>
                  <p className="text-gray-400">{userData?.email}</p>
                  {userData?.location && (
                    <div className="flex items-center gap-2 text-gray-400 mt-2">
                      <MapPin size={16} />
                      <span>{userData.location}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">{userData?.followers?.length || 0}</div>
                    <div className="text-sm text-gray-400">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{userData?.following?.length || 0}</div>
                    <div className="text-sm text-gray-400">Following</div>
                  </div>
                </div>
              </div>

              {userData?.bio && (
                <p className="mt-4 text-gray-300">{userData.bio}</p>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Pencil size={20} />
          </motion.button>
        </motion.div>

        <AnimatePresence>
        {isModalOpen && (
  <motion.div
    className="fixed inset-0 bg-[rgba(0,0,0,0.83)] flex justify-center items-center z-50 p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    style={{ margin: 0, padding: 0 }}
  >
    <motion.div
      className="bg-background p-6 rounded-lg w-full max-w-5xl shadow-lg max-h-[90vh] overflow-y-auto"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-semibold mb-6">Edit Profile</h2>
      <form onSubmit={handleProfileUpdate} className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              id="username"
              className="block w-full p-2 border border-border rounded-lg"
              value={edit.username}
              onChange={handleEditChange}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              id="location"
              type="text"
              className="block w-full p-2 border border-border rounded-lg"
              value={edit.location}
              onChange={handleEditChange}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            className="block w-full p-2 border border-border rounded-lg no-scrollbar"
            value={edit.bio}
            onChange={handleEditChange}
          />
        </div>

        <div className="mb-4">
        <label htmlFor="profilepic" className="block text-sm font-medium mb-2">
                  Profile Picture
                </label>
                
                {preview && (
                  <Image
                    src={preview}
                    alt="Profile Preview"
                    width={5}
                    height={5}
                    loading="lazy"
                    className="mt-2 w-32 h-32 object-cover rounded-full"
                  />
                )}
                <input
                  id="profilepic"
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full p-2 border rounded-lg"
                />
                <Button 
                    variant="outline" 
                    type="button"
                    onClick={uploadFile} 
                    className="mt-2" 
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Upload Profile Picture"}
                  </Button>
             

        </div>
        </div>
          <div>
        <div className="mb-4">
        <label htmlFor="failedExperience" className="block text-sm font-medium text-gray-700">
          Failed Experience
        </label>
        {edit.failedExperience?.map((experience, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={experience}
              onChange={(e) => handleArrayEdit('failedExperience', index, e.target.value)}
              className="mt-1 block w-full p-2 border border-border rounded-lg"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveArrayItem('failedExperience', index)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddArrayItem('failedExperience')}
        >
          Add Experience
        </Button>
      </div>
      
      <div className="mb-4">
        <label htmlFor="misEducation" className="block text-sm font-medium text-gray-700">
          Mis-Education
        </label>
        {edit.misEducation?.map((education, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={education}
              onChange={(e) => handleArrayEdit('misEducation', index, e.target.value)}
              className="mt-1 block w-full p-2 border border-border rounded-lg"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveArrayItem('misEducation', index)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddArrayItem('misEducation')}
        >
          Add Education
        </Button>
      </div>
      
      <div className="mb-4">
        <label htmlFor="failureHighlights" className="block text-sm font-medium text-gray-700">
          Failure Highlights
        </label>
        {edit.failureHighlights?.map((highlight, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={highlight}
              onChange={(e) => handleArrayEdit('failureHighlights', index, e.target.value)}
              className="mt-1 block w-full p-2 border border-border rounded-lg"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveArrayItem('failureHighlights', index)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddArrayItem('failureHighlights')}
        >
          Add Highlight
        </Button>
      </div>
      </div>
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </div>
      </form>
    </motion.div>
  </motion.div>
)}
        </AnimatePresence>
      </div>
    </div>
  );
}
