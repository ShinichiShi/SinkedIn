import { useState, useCallback } from "react";

interface PostImage {
  file: File;
  preview: string;
  id: string;
}

export const usePostValidation = () => {
  const [errorMessage, setErrorMessage] = useState("");

  const validatePost = useCallback((content: string, images: PostImage[]) => {
    if (!content.trim() && images.length === 0) {
      setErrorMessage("Post content or image is required.");
      return false;
    }

    setErrorMessage("");
    return true;
  }, []);

  return {
    errorMessage,
    setErrorMessage,
    validatePost
  };
};
