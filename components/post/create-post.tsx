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

export function CreatePost() {
  const [postContent, setPostContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUserProfilePic, setCurrentUserProfilePic] = useState("");
  const [hovered, setHovered] = useState(false);
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

  const containerVariants = {
    initial: { 
      scale: 1,
      y: 0,
      rotateX: 0
    },
    hover: { 
      scale: 1.02,
      y: -5,
      rotateX: 2,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  const glowVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: [0.4, 0.2, 0.4],
      scale: [1, 1.1, 1],
      transition: {
        duration: 3,
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
      className="relative mb-5 p-0.5 rounded-2xl group/card"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-orange-500/30 rounded-2xl blur-xl"
        variants={glowVariants}
        initial="initial"
        animate="animate"
      />
      <div className="relative backdrop-blur-xl bg-black/20 rounded-2xl p-6 border border-white/10">
        <div className="relative z-10">
          <div className="flex gap-4">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/30 
                hover:ring-pink-500/50 transition-all duration-300"
            >
              <Image
                src={currentUserProfilePic}
                alt="User's avatar"
                width={48}
                height={48}
                className="object-cover"
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-pink-500/20"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
            </motion.div>
            <div className="flex-1 space-y-4">
              <motion.textarea
                whileFocus={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
                placeholder="Share your latest failure... We're here to support you!"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full min-h-[120px] p-4 rounded-xl bg-white/5 border border-white/10 
                  focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                  placeholder-gray-400/60 resize-none transition-all duration-300
                  hover:bg-white/[0.07] hover:border-white/20"
              />
              <motion.div 
                className="flex justify-between items-center gap-4"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex gap-2">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10
                      hover:from-purple-500/20 hover:to-pink-500/20 border border-white/10 
                      transition-all duration-300 text-sm flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 5.5.5 7.9 1.4 2.2 3.9 3.6 6.7 3.6h8.5c.9 0 1.7-.2 2.4-.5"/>
                      <path d="M15 9l-6 6"/>
                      <path d="M9 9l6 6"/>
                    </svg>
                    Add Proof
                  </motion.button>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10
                      hover:from-purple-500/20 hover:to-pink-500/20 border border-white/10 
                      transition-all duration-300 text-sm flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Rejection Letter
                  </motion.button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePostSubmit}
                  disabled={loading}
                  className="relative px-6 py-2.5 rounded-xl overflow-hidden
                    disabled:opacity-50 font-medium group/button"
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500"
                    animate={{
                      backgroundPosition: hovered ? ["0% 50%", "100% 50%"] : "0% 50%",
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                  <motion.div 
                    className="relative z-10 flex items-center gap-2"
                    animate={{
                      y: loading ? [0, -2, 0] : 0
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span>Sharing...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/>
                          <path d="M10 7c-.5 3-1 6-1.5 9"/>
                          <path d="M14 7c.5 3 1 6 1.5 9"/>
                        </svg>
                        <span>Confess</span>
                      </>
                    )}
                  </motion.div>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4"
          >
            <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-xl">
              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
