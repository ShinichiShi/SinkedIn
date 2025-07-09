import { useState, useCallback, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Camera, X, Send, Sparkles, Plus, ImageIcon } from "lucide-react";
import ErrorMsg from "./ErrorMsg";
import ImagePreview from "./ImagePreview";
interface PostImage {
  file: File;
  preview: string;
  id: string;
}

export function CreatePost() {
  const [postContent, setPostContent] = useState("");
  const [postImages, setPostImages] = useState<PostImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUserProfilePic, setCurrentUserProfilePic] = useState("");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const router = useRouter();

  const maxChars = 280;
  const maxImages = 2;

  const fetchCurrentUserProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push("/login");
      return;
    }

    try {
      const userDoc = await getDocs(collection(db, "users"));
      const userData = userDoc.docs
        .find((doc) => doc.id === currentUser.uid)
        ?.data();

      setCurrentUserProfilePic(
        userData?.profilepic || 
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
      );
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setCurrentUserProfilePic(
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
      );
    }
  }, [router]);

  useEffect(() => {
    fetchCurrentUserProfile();
  }, [fetchCurrentUserProfile]);

  // Upload images to Cloudinary when submitting
  const uploadImagesToCloudinary = async (): Promise<string[]> => {
    if (postImages.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const image of postImages) {
        const url = await uploadToCloudinary(image.file);
        uploadedUrls.push(url);
      }
      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw new Error("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim()) {
      setErrorMessage("Post content is required.");
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Please log in to post");
        router.push("/login");
        return;
      }

      // Only validate text if there's content
      if (postContent.trim()) {
        const response = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: postContent }),
        });

        if (!response.ok) {
          throw new Error("Failed to analyze sentiment");
        }

        const data = await response.json();

        if (data.result !== "1") {
          toast.error("ooo nice...how informative");
          return;
        }
      }

      // Upload images to Cloudinary only when posting
      const imageUrls = await uploadImagesToCloudinary();

      const postsRef = collection(db, "posts");
      await addDoc(postsRef, {
        content: postContent,
        images: imageUrls,
        timestamp: serverTimestamp(),
        userName: currentUser.displayName || "Anonymous",
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        dislikes: 0,
        dislikedBy: [],
        shares: 0,
        comments: [],
      });

      toast.success("Your voice shall be heard");
      
      // Clean up preview URLs
      postImages.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
      
      setPostContent("");
      setPostImages([]);
      setCharCount(0);
      window.location.reload();

    } catch (error) {
      console.error("Error processing post:", error);
      setErrorMessage("An error occurred while posting.");
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setPostContent(text);
      setCharCount(text.length);
      setErrorMessage("");
    }
  };

  // Handle file selection and create local previews
  const handleFileSelect = (files: FileList) => {
    const newImages: PostImage[] = [];
    
    Array.from(files).forEach((file) => {
      if (postImages.length + newImages.length >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image size should be less than 10MB');
        return;
      }

      const preview = URL.createObjectURL(file);
      const newImage: PostImage = {
        file,
        preview,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };

      newImages.push(newImage);
    });

    if (newImages.length > 0) {
      setPostImages(prev => [...prev, ...newImages]);
      // toast.success(`${newImages.length} image(s) added for preview`);
    }
  };

  const removeImage = (imageId: string) => {
    setPostImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      postImages.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, []);

  const containerVariants = {
    rest: { 
      scale: 1,
      y: 0
    },
    hover: { 
      scale: 1.005,
      y: -1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const borderVariants = {
    rest: { 
      opacity: 0.2
    },
    hover: { 
      opacity: 0.4,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="relative mb-4"
    >
      
      {/* Main container */}
      <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 
        hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden">
        
        {/* Subtle top accent */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"
          variants={borderVariants}
          initial="rest"
          animate={hovered ? "hover" : "rest"}
        />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex gap-4">
            <Image
              src={currentUserProfilePic}
              alt="User avatar"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-cover"
            />

            {/* Text Area */}
            <div className="flex-1 space-y-4">
              <motion.textarea
                placeholder="Where is my mind?"
                value={postContent}
                onChange={handleTextChange}
                className="w-full min-h-[100px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 dark:text-gray-100 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200"
              />

              {/* Char Counter */}
              <AnimatePresence>
                {postContent.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="text-right text-sm text-gray-500 dark:text-gray-400"
                  >
                    <span className={charCount > maxChars * 0.8 ? "text-orange-400" : ""}>
                      {maxChars - charCount} characters left
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Images Preview - Instagram Style Horizontal Scroll */}
              <ImagePreview postImages={postImages} removeImage={removeImage} maxImages={maxImages} handleFileSelect={handleFileSelect} />
 
              {/* Action Bar */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {/* Image upload button */}
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 
                      hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 
                      transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {postImages.length === 0 ? (
                      <>
                        <Camera size={16} />
                        <span className="text-sm font-medium">Photo</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={16} />
                        <span className="text-sm font-medium">
                          {postImages.length}/{maxImages}
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                      className="hidden"
                      disabled={postImages.length >= maxImages}
                    />
                  </motion.label>

                  {/* Content indicator */}
                  {(postContent.length > 0 || postImages.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1 text-gray-500 dark:text-gray-400"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles size={12} />
                      </motion.div>
                      <span className="text-xs">
                        {postImages.length > 0 ? "Ready to upload" : "Ready"}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handlePostSubmit}
                  disabled={loading || uploadingImages || (!postContent.trim() && postImages.length === 0)}
                  className="relative overflow-hidden rounded-lg px-4 py-2 
                    disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white
                    bg-blue-600/80 hover:bg-blue-600 transition-all duration-200
                    border border-blue-500/40 hover:border-blue-400/60"
                >
                  <div className="flex items-center gap-1.5">
                    {(loading || uploadingImages) ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span className="text-sm">
                          {uploadingImages ? "Uploading..." : "Posting..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ x: hovered ? [0, 2, 0] : 0 }}
                          transition={{ duration: 0.6, repeat: hovered ? Infinity : 0 }}
                        >
                          <Send size={14} />
                        </motion.div>
                        <span className="text-sm">Post</span>
                      </>
                    )}
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <ErrorMsg errorMessage={errorMessage}/>
    </motion.div>
  );
}