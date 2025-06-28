"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { motion } from "framer-motion";

interface UserData {
  username: string;
  email: string;
  bio?: string;
  profilepic?: string;
  id: string;
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

  if (!user) return null;

  return (
    <Link href={`/networkpost/${user.id}`}>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Card className="p-4 bg-black/20 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 border-2 border-purple-500/20">
              <AvatarImage
                src={user.profilepic || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                alt={user.username}
              />
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{user.username}</h3>
              {user.bio && <p className="text-sm text-gray-400 line-clamp-1">{user.bio}</p>}
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
