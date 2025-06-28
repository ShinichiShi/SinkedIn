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
import { Camera, X, Image as ImageIcon } from "lucide-react";

export function CreatePost() {
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUserProfilePic, setCurrentUserProfilePic] = useState("");
  const [hovered, setHovered] = useState(false);
  const [imagePreview, setImagePreview] = useState(false);
  const router = useRouter();

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
          image: postImage, // New field for image
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
        window.location.reload(); // Refresh to show new post
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

  const handleImageUpload = (url: string) => {
    setPostImage(url);
  };

  const removeImage = () => {
    setPostImage("");
  };

  const containerVariants = {
    initial: { 
      scale: 1,
      y: 0,
      rotateX: 0
    },
    hover: { 
      scale: 1.01,
      y: -3,
      rotateX: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  const glowVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { 
      opacity: [0.3, 0.1, 0.3],
      scale: [1, 1.05, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      whileHover="hover"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative mb-6 p-0.5 rounded-3xl group/card"
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-3xl blur-xl"
        variants={glowVariants}
        initial="initial"
        animate="animate"
      />
      
      {/* Neon border effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/30 via-blue-500/30 to-indigo-500/30 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
      
      <div className="relative backdrop-blur-xl bg-slate-900/80 rounded-3xl p-4  border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500">
        <div className="relative z-10">
          <div className="flex gap-5">
            {/* Profile Picture */}
            <motion.div   
              whileHover={{ scale: 1.1, rotate: 2 }}
              className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-cyan-500/40 
                hover:ring-cyan-400/60 transition-all duration-300 shadow-lg shadow-cyan-500/20"
            >
              <Image
                src={currentUserProfilePic}
                alt="User's avatar"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
            </motion.div>

            <div className="flex-1 space-y-5">
              {/* Text Area */}
              <motion.textarea
                whileFocus={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
                placeholder="Share your latest failure... We're here to support you! 💫"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full min-h-[80px] p-2 rounded-2xl bg-slate-800/50 border border-cyan-500/20 
                  focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 
                  placeholder-slate-400/70 resize-none transition-all duration-300
                  hover:bg-slate-800/70 hover:border-cyan-500/30 text-slate-100
                  shadow-inner shadow-slate-900/20"
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6'
                }}
              />

              {/* Image Preview */}
              <AnimatePresence>
                {postImage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="relative rounded-2xl overflow-hidden border border-cyan-500/20 shadow-lg"
                  >
                    <div className="relative max-h-80 overflow-hidden">
                      <Image
                        src={postImage}
                        alt="Post attachment"
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={removeImage}
                      className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-red-500/80 
                        text-white transition-all duration-200 backdrop-blur-sm"
                    >
                      <X size={16} />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Bar */}
              <motion.div 
                className="flex justify-between items-center gap-4"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* <div className="flex">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Trigger Cloudinary upload widget
                      const widget = window.cloudinary?.createUploadWidget(
                        {
                          cloudName: 'your-cloud-name',
                          uploadPreset: 'your-upload-preset',
                          multiple: false,
                          resourceType: 'image'
                        },
                        (error: any, result: any) => {
                          if (!error && result && result.event === "success") {
                            handleImageUpload(result.info.secure_url);
                          }
                        }
                      );
                      widget?.open();
                    }}
                    className="px-2 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10
                      hover:from-cyan-500/20 hover:via-blue-500/20 hover:to-indigo-500/20 border border-cyan-500/20 
                      hover:border-cyan-400/40 transition-all duration-300 text-sm flex items-center gap-2
                      text-cyan-100 hover:text-cyan-50 shadow-lg shadow-cyan-500/10"
                  >
                    <Camera size={16} />
                    Proof ?
                  </motion.button>
                 </div> */}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePostSubmit}
                  disabled={loading}
                  className="relative px-2 py-1 rounded-xl overflow-hidden
                    disabled:opacity-50 font-semibold group/button shadow-lg"
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"
                    animate={{
                      backgroundPosition: hovered ? ["0% 50%", "100% 50%", "0% 50%"] : "0% 50%",
                    }}
                    transition={{ duration: 2, ease: "easeInOut", repeat: hovered ? Infinity : 0 }}
                  />
                  <motion.div 
                    className="relative z-10 flex items-center gap-2 text-white"
                    animate={{
                      y: loading ? [0, -1, 0] : 0
                    }}
                    transition={{ duration: 0.5, repeat: loading ? Infinity : 0 }}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span>Sharing...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-base">Confess</span>
                      </>
                    )}
                  </motion.div>
                  
                  {/* Button glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400/50 via-blue-400/50 to-indigo-400/50 rounded-xl blur-xl opacity-0 group-hover/button:opacity-70 transition-opacity duration-300"
                    style={{ zIndex: -1 }}
                  />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mt-4"
          >
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                </div>
                {errorMessage}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}