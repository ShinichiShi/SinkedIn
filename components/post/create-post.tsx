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

export function CreatePost() {
  const [postContent, setPostContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUserProfilePic, setCurrentUserProfilePic] = useState("");
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

  return (
    <div className="bg-card rounded-lg p-4 shadow-md">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUserProfilePic}
            alt="User's avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <textarea
            placeholder="Share your latest failure..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="w-full min-h-[100px] p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
          />
          <div className="justify-between items-center mt-4 md:flex">
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100"
              >
                Add Proof
              </button>
              <button
                type="button"
                className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 flex items-center"
              >
                <span className="w-4 h-4 mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </span>
                Rejection Letter
              </button>
            </div>
            <button
              onClick={handlePostSubmit}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 my-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Posting...</span>
                </span>
              ) : (
                "Confess"
              )}
            </button>
          </div>
        </div>
      </div>
      {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
    </div>
  );
}
