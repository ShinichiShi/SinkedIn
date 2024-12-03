import React from "react";
// import { Header } from "../../components/layout/header"; // Ensure correct path
import { Header } from "../../components/layout/header"; 
import { LeftSidebar } from "../../components/sidebar/leftsidebar";
import { RightSidebar } from "../../components/sidebar/rightsidebar";
import { CreatePost } from "@/components/post/create-post";


function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* <Header /> */}
      <div className="pt-16 grid grid-cols-1 lg:grid-cols-[250px,1fr,250px] gap-4">
        {/* Left Sidebar */}
        <div className="lg:block">
          <LeftSidebar />
        </div>
        
        {/* Main Content (Feed)
        <main className="lg:col-span-1 p-6 bg-white dark:bg-gray-800 dark:text-gray-100 shadow rounded-lg">
         <CreatePost />
          {samplePosts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </main>
         */}
        {/* Right Sidebar */}
        <div className="lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}

export default App;
