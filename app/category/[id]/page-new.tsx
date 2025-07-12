"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post } from "@/types";
import { BookOpen, Briefcase, Building, Users, Heart, Activity, Gamepad2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from "@/utils/timeUtils";

const CATEGORY_CONFIG = {
  academic: {
    title: 'Academic Failures',
    description: 'Exam failures, thesis rejections, academic struggles and educational setbacks',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  jobhunt: {
    title: 'Job Hunt Struggles',
    description: 'Interview rejections, application failures and career search struggles',
    icon: Briefcase,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  workplace: {
    title: 'Workplace Issues',
    description: 'Office politics, promotion denials, work stress and professional challenges',
    icon: Building,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  startup: {
    title: 'Startup Failures',
    description: 'Failed launches, investor rejections, pivots and entrepreneurial setbacks',
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  personal: {
    title: 'Personal Struggles',
    description: 'Relationship issues, family problems, life setbacks and emotional challenges',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  health: {
    title: 'Health & Wellness',
    description: 'Mental health, fitness struggles, medical issues and wellness challenges',
    icon: Activity,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
    borderColor: 'border-pink-200 dark:border-pink-800'
  },
  hobby: {
    title: 'Hobby & Creative',
    description: 'Art blocks, sports failures, creative struggles and personal project setbacks',
    icon: Gamepad2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800'
  }
};

const CategoryBadge = ({ category }: { category?: string }) => {
  if (!category) return null;
  
  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
  if (!config) return null;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      {config.title}
    </span>
  );
};

export default function CategoryPage({ params }: { params: { id: string } }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const router = useRouter();
  
  const category = CATEGORY_CONFIG[params.id as keyof typeof CATEGORY_CONFIG];
  const POSTS_PER_PAGE = 7;

  const fetchCategoryPosts = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPosts([]);
        setLastDoc(null);
        setHasMore(true);
      }
      
      const postsRef = collection(db, "posts");
      
      console.log('Fetching posts for category:', params.id, isLoadMore ? '(load more)' : '(initial)');
      
      // Try different query approaches
      let querySnapshot;
      try {
        // Method 1: Direct query with where clause and pagination
        let q = query(
          postsRef,
          where("category", "==", params.id),
          orderBy("timestamp", "desc"),
          limit(POSTS_PER_PAGE)
        );
        
        if (isLoadMore && lastDoc) {
          q = query(
            postsRef,
            where("category", "==", params.id),
            orderBy("timestamp", "desc"),
            startAfter(lastDoc),
            limit(POSTS_PER_PAGE)
          );
        }
        
        querySnapshot = await getDocs(q);
        console.log('Direct query result:', querySnapshot.size, 'posts');
      } catch (indexError: any) {
        console.log('Index error, trying without orderBy:', indexError.message);
        // Method 2: Query without orderBy if index doesn't exist
        let q2 = query(
          postsRef,
          where("category", "==", params.id),
          limit(POSTS_PER_PAGE)
        );
        
        if (isLoadMore && lastDoc) {
          q2 = query(
            postsRef,
            where("category", "==", params.id),
            startAfter(lastDoc),
            limit(POSTS_PER_PAGE)
          );
        }
        
        querySnapshot = await getDocs(q2);
        console.log('Query without orderBy result:', querySnapshot.size, 'posts');
      }
      
      // If still no results on initial load, fetch all posts and filter manually for debugging
      if (querySnapshot.size === 0 && !isLoadMore) {
        console.log('No posts found with direct query, fetching all posts for debugging...');
        const allPostsQuery = query(postsRef);
        const allPosts = await getDocs(allPostsQuery);
        
        console.log('Total posts in database:', allPosts.size);
        
        // Log categories of all posts for debugging
        const categoryCounts: Record<string, number> = {};
        allPosts.forEach((doc) => {
          const data = doc.data();
          const category = data.category || 'undefined';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
        
        console.log('Category distribution:', categoryCounts);
        console.log('Looking for category:', params.id);
        
        // Filter manually and implement pagination
        const matchingPosts: any[] = [];
        allPosts.forEach((doc) => {
          const data = doc.data();
          if (data.category === params.id) {
            matchingPosts.push(doc);
          }
        });
        
        // Sort manually by timestamp
        matchingPosts.sort((a, b) => {
          const aTime = a.data().timestamp?.seconds || 0;
          const bTime = b.data().timestamp?.seconds || 0;
          return bTime - aTime;
        });
        
        // Take only first page for manual filtering
        const paginatedPosts = matchingPosts.slice(0, POSTS_PER_PAGE);
        
        console.log('Manually filtered posts:', paginatedPosts.length);
        
        // Create a fake querySnapshot for consistency
        querySnapshot = {
          size: paginatedPosts.length,
          docs: paginatedPosts,
          empty: paginatedPosts.length === 0
        };
        
        // Set hasMore based on whether there are more posts
        setHasMore(matchingPosts.length > POSTS_PER_PAGE);
      }
      
      const fetchedPosts: Post[] = [];
      
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        fetchedPosts.push({
          id: doc.id,
          ...data,
        } as Post);
      });
      
      // Sort manually if we didn't use orderBy
      fetchedPosts.sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0;
        const bTime = b.timestamp?.seconds || 0;
        return bTime - aTime;
      });
      
      console.log('Final fetched posts:', fetchedPosts.length);
      
      if (isLoadMore) {
        setPosts(prevPosts => [...prevPosts, ...fetchedPosts]);
      } else {
        setPosts(fetchedPosts);
      }
      
      // Update lastDoc for pagination
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      
      // Check if there are more posts
      setHasMore(querySnapshot.docs.length === POSTS_PER_PAGE);
      
    } catch (error) {
      console.error("Error fetching category posts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [params.id, lastDoc]);

  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchCategoryPosts(true);
    }
  }, [fetchCategoryPosts, loadingMore, hasMore]);

  // Initial load
  useEffect(() => {
    if (!category) {
      router.push('/feed');
      return;
    }
    
    fetchCategoryPosts();
  }, [params.id]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) {
        return;
      }
      loadMorePosts();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMorePosts, loadingMore, hasMore]);

  if (!category) {
    return null;
  }

  const IconComponent = category.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={`${category.bgColor} ${category.borderColor} border-b`}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/feed" className="p-2 hover:bg-background/20 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <IconComponent className={`w-8 h-8 ${category.color}`} />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{category.title}</h1>
              <p className="text-muted-foreground mt-1">{category.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
            <span>•</span>
            <span>Showing all failures in this category</span>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-muted rounded"></div>
                    <div className="w-24 h-3 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="w-full h-4 bg-muted rounded"></div>
                  <div className="w-3/4 h-4 bg-muted rounded"></div>
                </div>
                <div className="flex space-x-4">
                  <div className="w-16 h-8 bg-muted rounded"></div>
                  <div className="w-16 h-8 bg-muted rounded"></div>
                  <div className="w-16 h-8 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <IconComponent className={`w-16 h-16 ${category.color} mx-auto mb-4 opacity-50`} />
            <h3 className="text-lg font-semibold text-foreground mb-2">No failures yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to share a failure in this category!
            </p>
            <Link 
              href="/feed" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Share Your Failure
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-6">
                  {/* Simple Post Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {post.userName?.[0]?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{post.userName || 'Anonymous'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {post.timestamp ? formatRelativeTime(new Date(post.timestamp.seconds * 1000)) : 'Recently'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                  </div>
                  
                  {/* Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="mb-4 grid gap-2">
                      {post.images.map((image, index) => (
                        <img 
                          key={index}
                          src={image} 
                          alt={`Post image ${index + 1}`}
                          className="rounded-lg max-w-full h-auto"
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="flex items-center justify-between">
                    <CategoryBadge category={post.category} />
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{post.comments?.length || 0} comments</span>
                      <span>•</span>
                      <span>{post.shares || 0} shares</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Load more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more posts...</span>
            </div>
          </div>
        )}
        
        {/* End of posts indicator */}
        {!loading && !loadingMore && posts.length > 0 && !hasMore && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">You&apos;ve reached the end of this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
