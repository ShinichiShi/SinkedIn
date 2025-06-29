import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseApp, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface UserData {
  username: string;
  email: string;
  location?: string;
  bio?: string;
  profilepic?: string;
  followers: string[];
  following: string[];
}

export function LeftSidebar() {
  const [userData, setUserData] = useState<UserData | null>(null);
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
        setUserData(docSnap.data() as UserData);
      } else {
        setUserData({
          username: "Anonymous User",
          email: user.email || "user@example.com",
          bio: "Embracing failures as stepping stones to success",
          profilepic: "/default-avatar.png",
          location: "Unknown",
          followers: [],
          following: []
        });
      }   
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData({
        username: "Anonymous User",
        email: user?.email || "user@example.com",
        bio: "Embracing failures as stepping stones to success",
        profilepic: "/default-avatar.png",
        location: "Unknown",
        followers: [],
        following: []
      });
    } 
  }, [router]);
    
  useEffect(() => {
    fetchUserData();   
  }, [fetchUserData])

  const dummyUserData = {
    username: "Anonymous User",
    email: "user@example.com",
    bio: "Embracing failures as stepping stones to success",
    profilepic: "/default-avatar.png"
  };

  const displayData = userData || dummyUserData;

  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const toggleBio = () => setIsBioExpanded(!isBioExpanded);

  return (
    <div className="hidden w-[16%] absolute left-0 top-16 h-[calc(100vh-70px)] bg-background border-r border-border p-4 transition-colors md:block">
      <div className="space-y-6">
      <div className="p-4 rounded-lg border border-border bg-card shadow-md text-center">
        <Avatar className="w-16 h-16 mx-auto mb-4">
          <AvatarImage 
            src={displayData.profilepic || "/default-avatar.png"} 
            alt={`${displayData.username}'s avatar`} 
            loading="lazy"
          />
          <AvatarFallback>{displayData.username.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-lg text-primary">
          {displayData.username}
        </h3>
        <p className="text-sm text-muted-foreground">
          {    displayData.bio && displayData.bio?.length > 80 ? (
            <>
              {isBioExpanded
                ? displayData.bio
                : displayData.bio?.slice(0, 80) + "..."}
              <button
                className="ml-1 text-primary text-sm focus:outline-none"
                onClick={toggleBio}
              >
                {isBioExpanded ? "See Less" : "See More"}
              </button>
            </>
          ) : (
            displayData.bio || "No bio available"
          )}
        </p>
        <Link
            href="/profile"
            className={buttonVariants({
              variant: "outline",
              className: "flex items-center w-full p-3 my-1",
            })}
          >
            <span>Edit Profile
            </span>
          </Link>
      </div>        <div className="p-4 rounded-lg border border-border bg-card/30 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Network Stats</h3>
          <nav className="space-y-2">
            <Link
              href={`/profile`}
              className={buttonVariants({
                variant: "ghost",
                className: "flex items-center justify-between w-full p-3 hover:bg-accent/50",
              })}
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-primary" />
                <span>Followers</span>
              </div>
              <span className="text-sm bg-primary/10 px-2 py-1 rounded-full text-primary">
                {userData?.followers?.length || 0}
              </span>
            </Link>
            <Link
              href={`/profile`}
              className={buttonVariants({
                variant: "ghost",
                className: "flex items-center justify-between w-full p-3 hover:bg-accent/50",
              })}
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-primary" />
                <span>Following</span>
              </div>
              <span className="text-sm bg-primary/10 px-2 py-1 rounded-full text-primary">
                {userData?.following?.length || 0}
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}