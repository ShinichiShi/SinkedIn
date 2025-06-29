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
      whileHover={{ scale: 1.01 }}
      className="relative mb-8"
    >
      {/* Card */}
      <div className="relative bg-slate-900/50 border border-slate-700/60 backdrop-blur-lg rounded-2xl shadow-xl transition-all duration-300 overflow-hidden">

        {/* Top Light Line */}
        <motion.div
          layout
          className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
        />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex gap-4">
            <Image
              src={currentUserProfilePic}
              alt="User avatar"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-cover"
            />

            {/* Text Area */}
            <div className="flex-1 space-y-4">
              <motion.textarea
                placeholder="Where is my mind?"
                value={postContent}
                onChange={handleTextChange}
                className="w-full min-h-[100px] bg-slate-800/40 border border-slate-600/50 rounded-xl p-4 text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200"
              />

              {/* Char Counter */}
              <AnimatePresence>
                {postContent.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="text-right text-sm text-slate-400"
                  >
                    <span className={charCount > maxChars * 0.8 ? "text-orange-400" : ""}>
                      {maxChars - charCount} characters left
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Image Preview */}
              <AnimatePresence>
                {postImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative rounded-xl overflow-hidden border border-slate-700"
                  >
                    <Image
                      src={postImage}
                      alt="Post image"
                      width={600}
                      height={400}
                      className="w-full object-cover max-h-64"
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-red-500/70 text-white backdrop-blur"
                    >
                      <X size={14} />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Row */}
              <div className="flex justify-between items-center">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-slate-700/50 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-slate-100 transition-all"
                >
                  <Camera size={16} />
                  Photo
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handlePostSubmit}
                  disabled={loading || !postContent.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all
                    bg-blue-600 hover:bg-blue-500 text-white border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Send size={14} />
                      Post
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-4"
          >
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}