import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export const useCreatePost = (maxChars: number) => {
  const [postContent, setPostContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const router = useRouter();

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setPostContent(text);
      setCharCount(text.length);
    }
  }, [maxChars]);

  const handlePostSubmit = useCallback(async (content: string, imageUrls: string[]) => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Please log in to post");
        router.push("/login");
        return;
      }

      // Validate content if there's text
      if (content.trim()) {
        const response = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: content }),
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
      let postCategory = 'personal'; // default category
      if (postContent.trim()) {
        try {
          const categoryResponse = await fetch("/api/categorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: postContent }),
          });

          if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json();
            postCategory = categoryData.category;
          }
        } catch (error) {
          console.warn("Error categorizing post, using default category:", error);
        }
      }
      const postsRef = collection(db, "posts");
      await addDoc(postsRef, {
        content,
        images: imageUrls,
        timestamp: serverTimestamp(),
        userName: currentUser.displayName || "Anonymous",
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        dislikes: 0,
        dislikedBy: [],
        shares: 0,
        comments: [],
        deleted: false,
        category: postCategory,
      });

      toast.success("Your voice shall be heard");
      setPostContent("");
      setCharCount(0);
      window.location.reload();

    } catch (error) {
      console.error("Error processing post:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  return {
    postContent,
    setPostContent,
    loading,
    charCount,
    handleTextChange,
    handlePostSubmit
  };
};