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
import { HTMLMotionProps } from "framer-motion";
import { Camera, X, Image as ImageIcon, Send, Sparkles } from "lucide-react";

export function CreatePost() {
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUserProfilePic, setCurrentUserProfilePic] = useState("");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const router = useRouter();

  const maxChars = 280;

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

  const handlePostSubmit = async () => {
    if (!postContent.trim()) {
      setErrorMessage("Post content is empty.");
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

      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: postContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze sentiment");
      }

      const data = await response.json();

      if (data.result === "1") {
        const postsRef = collection(db, "posts");
        await addDoc(postsRef, {
          content: postContent,
          image: postImage,
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
        setPostContent("");
        setPostImage("");
        setCharCount(0);
        window.location.reload();
      } else {
        toast.error("ooo nice...how informative");
      }
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

  const handleImageUpload = (url: string) => {
    setPostImage(url);
  };

  const removeImage = () => {
    setPostImage("");
  };

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
      variants={containerVariants}
      initial="rest"
      whileHover="hover"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative mb-6"
    >
      
      {/* Main container */}
      <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/60 
        hover:border-slate-600/70 transition-all duration-300 overflow-hidden ">
        
        {/* Subtle top accent */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-500/30 to-transparent"
          variants={borderVariants}
          initial="rest"
          animate={hovered ? "hover" : "rest"}
        />
        
        <div className="p-4">
          <div className="flex gap-3">
            {/* Profile Picture */}
            <motion.div   
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="relative w-12 h-12 rounded-xl overflow-hidden"
            >
              <Image
                src={currentUserProfilePic}
                alt="User's avatar"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </motion.div>

            <div className="flex-1 space-y-3">
              {/* Text Area */}
              <div className="relative">
                <motion.textarea
                  whileFocus={{ 
                    borderColor: "rgba(148, 163, 184, 0.5)"
                  }}
                  placeholder="What's on your mind?"
                  value={postContent}
                  onChange={handleTextChange}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  className="w-full min-h-[90px] p-3 rounded-xl bg-slate-700/30 border border-slate-600/40 
                    focus:outline-none focus:border-slate-400/60 placeholder-slate-400 resize-none 
                    transition-all duration-200 text-slate-100 hover:bg-slate-700/40"
                />
                
                {/* Character count */}
                <AnimatePresence>
                  {focused && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute -bottom-1 right-2 px-2 py-1 bg-slate-800/90 
                        border border-slate-600/40 rounded-lg text-xs"
                    >
                      <span className={charCount > maxChars * 0.8 ? "text-orange-400" : "text-slate-400"}>
                        {maxChars - charCount}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Image Preview */}
              <AnimatePresence>
                {postImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative rounded-xl overflow-hidden border border-slate-600/40"
                  >
                    <div className="relative max-h-64 overflow-hidden">
                      <Image
                        src={postImage}
                        alt="Post attachment"
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-red-500/80 
                        text-white transition-colors duration-200 backdrop-blur-sm"
                    >
                      <X size={14} />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Bar */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {/* Image upload button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700/40 
                      hover:bg-slate-600/50 border border-slate-600/40 hover:border-slate-500/60 
                      transition-all duration-200 text-slate-300 hover:text-slate-200"
                  >
                    <Camera size={16} />
                    <span className="text-sm font-medium">Photo</span>
                  </motion.button>

                  {/* Subtle indicator */}
                  {postContent.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1 text-slate-400"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles size={12} />
                      </motion.div>
                      <span className="text-xs">Ready</span>
                    </motion.div>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePostSubmit}
                  disabled={loading || !postContent.trim()}
                  className="relative overflow-hidden rounded-lg px-4 py-2 
                    disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white
                    bg-blue-600/80 hover:bg-blue-600 transition-all duration-200
                    border border-blue-500/40 hover:border-blue-400/60"
                >
                  <div className="flex items-center gap-1.5">
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span className="text-sm">Posting...</span>
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
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-3"
          >
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-red-300 text-sm">{errorMessage}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}