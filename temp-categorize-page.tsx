// Add this to a temporary page in your Next.js app
// Create: app/admin/categorize/page.tsx

"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CategorizePostsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, processed: 0, updated: 0, skipped: 0 });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const categorizeText = async (text: string, retries = 3): Promise<string> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch("/api/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.category;
        } else {
          throw new Error(`API responded with status: ${response.status}`);
        }
      } catch (error: any) {
        addLog(`❌ Attempt ${attempt}/${retries} failed: ${error.message}`);
        
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          addLog(`⏳ Waiting ${delay/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    addLog('❌ All retry attempts failed, using default category');
    return 'general';
  };

  const categorizeAllPosts = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setLogs([]);
    setStats({ total: 0, processed: 0, updated: 0, skipped: 0 });
    
    try {
      addLog('🚀 Starting to categorize existing posts...');
      
      // Fetch all posts from Firestore
      const postsRef = collection(db, 'posts');
      const querySnapshot = await getDocs(postsRef);
      
      const totalPosts = querySnapshot.size;
      addLog(`📊 Found ${totalPosts} posts to categorize`);
      setStats(prev => ({ ...prev, total: totalPosts }));
      
      let processedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      
      for (const docSnapshot of querySnapshot.docs) {
        const postData = docSnapshot.data();
        const postId = docSnapshot.id;
        
        processedCount++;
        setStats(prev => ({ ...prev, processed: processedCount }));
        
        // Check if post already has a category
        if (postData.category) {
          addLog(`⏭️  Post ${processedCount}/${totalPosts} already has category: ${postData.category}`);
          skippedCount++;
          setStats(prev => ({ ...prev, skipped: skippedCount }));
          continue;
        }
        
        // Check if post has content to categorize
        if (!postData.content || postData.content.trim() === '') {
          addLog(`⏭️  Post ${processedCount}/${totalPosts} has no content, setting to 'general'`);
          
          try {
            await updateDoc(doc(db, 'posts', postId), {
              category: 'general'
            });
            updatedCount++;
            setStats(prev => ({ ...prev, updated: updatedCount }));
          } catch (updateError: any) {
            addLog(`❌ Failed to update post ${postId}: ${updateError.message}`);
          }
          
          continue;
        }
        
        addLog(`🔄 Processing post ${processedCount}/${totalPosts}`);
        addLog(`📝 Content: "${postData.content.substring(0, 100)}${postData.content.length > 100 ? '...' : ''}"`);
        
        // Categorize the post content
        const category = await categorizeText(postData.content);
        addLog(`✓ Categorized as: ${category}`);
        
        // Update the post with the category
        try {
          await updateDoc(doc(db, 'posts', postId), {
            category: category
          });
          
          updatedCount++;
          setStats(prev => ({ ...prev, updated: updatedCount }));
          addLog(`✅ Updated post ${postId} with category: ${category}`);
        } catch (updateError: any) {
          addLog(`❌ Failed to update post ${postId}: ${updateError.message}`);
        }
        
        // Add delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      addLog('🎉 Categorization complete!');
      addLog(`📊 Summary: ${processedCount} processed, ${updatedCount} updated, ${skippedCount} skipped`);
      
    } catch (error: any) {
      addLog(`❌ Error during categorization: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Categorize Existing Posts</h1>
      
      <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
        <p className="text-sm">
          ⚠️ This will categorize all posts that don't already have a category field.
          Make sure you're logged in and have proper permissions.
        </p>
      </div>
      
      <div className="mb-4">
        <button
          onClick={categorizeAllPosts}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          {isRunning ? 'Running...' : 'Start Categorization'}
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          <div className="text-xl font-bold">{stats.total}</div>
        </div>
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Processed</div>
          <div className="text-xl font-bold">{stats.processed}</div>
        </div>
        <div className="p-3 bg-green-100 dark:bg-green-900 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Updated</div>
          <div className="text-xl font-bold">{stats.updated}</div>
        </div>
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Skipped</div>
          <div className="text-xl font-bold">{stats.skipped}</div>
        </div>
      </div>
      
      <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-500">Logs will appear here when you start the categorization...</div>
        )}
      </div>
    </div>
  );
}
