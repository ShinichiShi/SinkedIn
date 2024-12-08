"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useSearchParams } from "next/navigation"; // For extracting query params
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { HashLoader } from "react-spinners";

type Post = {
  id: string;
  title: string;
  content: string;
  timestamp: string;
};

type User = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
};

export default function NetworkPost() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("id"); // Renaming the query parameter to avoid conflict
  console.log("User ID from query params:", userId); // Debug log to check value

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      console.log("No user ID provided in the query.");
      return;
    }
    useEffect(() => {
      const queryParams = new URLSearchParams(window.location.search);
      console.log("Query Parameters:", queryParams.toString());
    }, []);
    

    const fetchUserAndPosts = async () => {
      try {
        // Fetch user details using the userId from query params
        const userQuery = query(collection(db, "users"), where("id", "==", userId));
        const userSnapshot = await getDocs(userQuery);

        // Check if user exists
        if (!userSnapshot.empty) {
          const userDetails = userSnapshot.docs[0].data() as User;
          setUser({ id: userSnapshot.docs[0].id, ...userDetails });
        } else {
          console.log("User not found.");
        }

        // Fetch user posts
        const postsQuery = query(collection(db, "posts"), where("userId", "==", userId));
        const postsSnapshot = await getDocs(postsQuery);

        // Fetch posts and set state
        const userPosts = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];
        setPosts(userPosts);
      } catch (error) {
        console.error("Error fetching user or posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPosts();
  }, [userId]); // Make sure to use the correct dependency (userId)

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <HashLoader color="white" />
      </div>
    );

  if (!user)
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">User not found. Please go back.</p>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* User Details */}
      <div className="flex flex-col items-center mb-8">
        <Avatar className="w-32 h-32 mb-6">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.username}'s avatar`}
              className="rounded-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
              <span className="text-gray-600 text-3xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Avatar>
        <h1 className="text-4xl font-bold">{user.username}</h1>
        <p className="text-lg text-muted-foreground">{user.email}</p>
      </div>

      {/* User Posts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id} className="p-4 shadow-md">
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {new Date(post.timestamp).toLocaleString()}
              </p>
              <p className="text-base">{post.content}</p>
            </Card>
          ))
        ) : (
          <div className="text-center col-span-full">
            <p className="text-gray-600">No posts found for this user.</p>
          </div>
        )}
      </div>
    </div>
  );
}