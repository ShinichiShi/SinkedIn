"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserData {
  username: string;
  email: string;
  bio?: string;
  profilepic?: string;
  id: string;
  followers?: string[];
  following?: string[];
}

export function UserListItem({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as UserData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, [userId]);

  if (!user) {
    return (
      <div className="p-4 bg-card/30 backdrop-blur-sm border border-border/40 rounded-lg">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/10" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-primary/10 rounded w-1/4" />
            <div className="h-3 bg-primary/5 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/profile/${user.id}`} className="block">
      <div className="p-4 bg-card/30 backdrop-blur-sm border border-border/40 rounded-lg hover:bg-card/50 hover:border-border transition-all duration-300">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12 border-2 border-primary/20 shadow-md flex-shrink-0">
            <AvatarImage
              src={user.profilepic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
              alt={user.username}
              className="object-cover"
            />
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base md:text-lg leading-tight truncate">
              {user.username}
            </h3>
            {user.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {user.bio}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{user.followers?.length || 0} followers</span>
              <span>{user.following?.length || 0} following</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
