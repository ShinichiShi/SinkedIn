"use client";

import { CreatePost } from "@/components/post/create-post";
import { PostCard } from "@/components/post/post-card";

export default function Feed() {
  const samplePosts = [
    {
      id: 1,
      author: "Jane Doe",
      role: "Professional Dream Chaser",
      content: "Just got my 100th rejection email this year! 🎉 #MilestoneUnlocked #PersistentFailure",
      time: "2 hours ago",
    },
    {
      id: 2,
      author: "John Smith",
      role: "Ex-Everything",
      content: "Today I managed to spill coffee on my keyboard, delete the production database, and call my boss by my ex's name - all before lunch! #WinningAtFailing",
      time: "4 hours ago",
    },
    {
      id: 3,
      author: "Alice Johnson",
      role: "Chief Mistake Officer",
      content: "Just pitched my startup idea to investors. They laughed so hard they forgot to say no! #EntrepreneurialNightmare #StartupStruggles",
      time: "6 hours ago",
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <CreatePost />
        {samplePosts.map((post) => (
          <PostCard key={post.id} {...post} />
        ))}
      </div>
    </div>
  );
}