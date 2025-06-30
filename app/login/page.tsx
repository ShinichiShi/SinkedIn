"use client";

import { Button } from "@/components/ui/button";
import { motion, HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";

interface UserData {
  username: string;
  email: string;
  location?: string;
  bio?: string;
  profilepic?: string;
  failedExperience?: string[];
  misEducation?: string[];
  failureHighlights?: string[];
  followers: string[];  // Array of user IDs who follow this user
  following: string[];  // Array of user IDs this user follows
}

const mergeUserData = async (user: any): Promise<UserData> => {
  const userDocRef = doc(db, "users", user.uid);
  
  try {
    const userDocSnap = await getDoc(userDocRef);
    const existingData = userDocSnap.exists() ? userDocSnap.data() : {};

    const updatedUserData: UserData = {
      username: user.displayName || existingData.username || "Anonymous",
      email: user.email || existingData.email,
      location: existingData.location || "",
      bio: existingData.bio || "",
      profilepic: existingData.profilepic || "",
      failedExperience: existingData.failedExperience || [],
      misEducation: existingData.misEducation || [],
      failureHighlights: existingData.failureHighlights || [],
      followers: existingData.followers || [],
      following: existingData.following || []
    };

    await setDoc(userDocRef, updatedUserData, { merge: true });

    return updatedUserData;
  } catch (error) {
    console.error("Error merging user data:", error);
    toast.error("Error processing user data");
    throw error;
  }
};

export default function Login() {
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await mergeUserData(user);
      router.push("/feed");
    } catch (err: any) {
      setError(err.message);
      toast.error("Google sign-in failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-50px)] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-6 space-y-3 bg-card rounded-lg shadow-lg border border-border/50 backdrop-blur-sm"
      >
        <div className="space-y-1.5 text-center">
          <h1 className="text-3xl font-bold text-white">Welcome to SinkedIn</h1>
          <p className="text-gray-400">Share your failures, embrace growth</p>
        </div>

        {error && (
          <div className="text-red-500 text-center bg-red-500/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        <Button 
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          className="w-full h-10 text-base font-medium bg-white text-gray-900 border border-gray-300"
        >
          <FcGoogle className="mr-2 h-5 w-5" />
          Continue with Google
        </Button>

        <p className="text-center text-sm text-gray-400">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}