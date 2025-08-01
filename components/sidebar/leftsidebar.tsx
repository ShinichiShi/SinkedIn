import React, { useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface UserData {
  username: string;
  email: string;
  location?: string;
  bio?: string;
  profilepic?: string;
  followers: string[];
  following: string[];
}

interface LeftSidebarProps {
  currentUser: any;
  userData: UserData | null;
  userFollowing: string[];
}

export function LeftSidebar({ currentUser, userData, userFollowing }: LeftSidebarProps) {
  // Use a data URL to avoid 404 errors for missing avatar files
  const defaultAvatarDataUrl = "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Ccircle cx='50' cy='35' r='15' fill='%239CA3AF'/%3E%3Cpath d='M50 55C35 55 25 65 25 75V85H75V75C75 65 65 55 50 55Z' fill='%239CA3AF'/%3E%3C/svg%3E";

  const dummyUserData = {
    username: "Anonymous User",
    email: currentUser?.email || "user@example.com",
    bio: "Embracing failures as stepping stones to success",
    profilepic: "/default-avatar.svg",
    followers: [],
    following: []
  };

  const displayData = userData || dummyUserData;
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const toggleBio = () => setIsBioExpanded(!isBioExpanded);

  return (
    <aside className="hidden md:block w-full md:w-[18%] lg:w-[16%] fixed top-16 left-0 h-[calc(100vh-4rem)] bg-background border-r border-border p-4 transition-colors z-10">
      <div className="space-y-6">
        {/* Profile Card */}
        <div className="p-4 rounded-lg border border-border bg-card shadow-md text-center">
          <Avatar className="w-16 h-16 mx-auto mb-4">
            <AvatarImage
              src={displayData.profilepic || defaultAvatarDataUrl}
              alt={`${displayData.username}'s avatar`}
              loading="lazy"
            />
            <AvatarFallback>
              {displayData.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg text-primary">
            {displayData.username || "Unknown User"}
          </h3>

          <p className="text-sm text-muted-foreground mt-2">
            {displayData.bio ? (
              <>
                {isBioExpanded
                  ? displayData.bio
                  : displayData.bio.slice(0, 80) + (displayData.bio.length > 80 ? "..." : "")}
                {displayData.bio.length > 80 && (
                  <button
                    className="ml-1 text-primary text-sm underline focus:outline-none"
                    onClick={toggleBio}
                  >
                    {isBioExpanded ? "See Less" : "See More"}
                  </button>
                )}
              </>
            ) : (
              "No bio available"
            )}
          </p>

          <Link
            href="/profile"
            className={buttonVariants({
              variant: "outline",
              className: "flex items-center justify-center w-full mt-4",
            })}
          >
            Edit Profile
          </Link>
        </div>

        {/* Network Stats */}
        <div className="p-4 rounded-lg border border-border bg-card/30 backdrop-blur-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Network Stats
          </h3>
          <nav className="space-y-2">
            <Link
              href="/profile"
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
                {displayData.followers?.length || 0}
              </span>
            </Link>

            <Link
              href="/profile"
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
                {userFollowing?.length || 0}
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}