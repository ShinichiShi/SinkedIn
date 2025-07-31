"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  where,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer
} from "firebase/firestore";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { firebaseApp } from "@/lib/firebase";
import Link from "next/link";
import { getAuth } from "firebase/auth";
import { HashLoader } from "react-spinners";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

type User = {
  id: string;
  username: string;
  email: string;
  profilepic?: string;
  followers: string[];
  following: string[];
  createdAt?: any;
};

type Post = {
  id: string;
  content: string;
  userName: string;
  userId: string;
  userProfilePic?: string;
  timestamp: { seconds: number } | null;
  category?: string;
  images?: string[];
  deleted?: boolean;
};

type SearchResult = {
  type: 'user' | 'post';
  data: User | Post;
  matchType: 'username' | 'email' | 'content' | 'category';
};

const USERS_PER_PAGE = 10;

export default function NetworkPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  
  // Create refs to store functions and avoid dependency issues
  const fetchUsersRef = useRef<((isLoadMore?: boolean) => Promise<void>) | null>(null);
  const fetchTotalUserCountRef = useRef<(() => Promise<void>) | null>(null);
  
  const router = useRouter();
  // Use a data URL for fallback to avoid 404 errors
  const defaultAvatar = "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Ccircle cx='50' cy='35' r='15' fill='%239CA3AF'/%3E%3Cpath d='M50 55C35 55 25 65 25 75V85H75V75C75 65 65 55 50 55Z' fill='%239CA3AF'/%3E%3C/svg%3E";

  // Initialize auth and get current user
  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  // Fetch total user count
  const fetchTotalUserCount = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const countQuery = query(
        collection(db, "users"),
        where("__name__", "!=", currentUser.uid) // Exclude current user
      );
      
      const snapshot = await getCountFromServer(countQuery);
      setTotalUsersCount(snapshot.data().count);
    } catch (error) {
      console.error("Error fetching user count:", error);
      // Fallback: count from existing users array
      setTotalUsersCount(users.length);
    }
  }, [currentUser, users.length]);

  // Fetch users with pagination
  const fetchUsers = useCallback(async (isLoadMore = false) => {
    if (!currentUser) return;
    
    try {
      setLoadingMore(isLoadMore);
      if (!isLoadMore) setLoading(true);

      let usersQuery = query(
        collection(db, "users"),
        where("__name__", "!=", currentUser.uid), // Exclude current user
        orderBy("__name__"), // Order by document ID for consistent pagination
        limit(USERS_PER_PAGE)
      );

      // If loading more, start after the last document
      if (isLoadMore && lastDoc) {
        usersQuery = query(
          collection(db, "users"),
          where("__name__", "!=", currentUser.uid),
          orderBy("__name__"),
          startAfter(lastDoc),
          limit(USERS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(usersQuery);
      const userList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      // Update state
      if (isLoadMore) {
        setUsers(prev => [...prev, ...userList]);
      } else {
        setUsers(userList);
      }

      // Update pagination state
      setHasNextPage(querySnapshot.docs.length === USERS_PER_PAGE);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);

    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentUser, lastDoc]);

  // Store functions in refs to avoid dependency issues
  fetchUsersRef.current = fetchUsers;
  fetchTotalUserCountRef.current = fetchTotalUserCount;

  // Enhanced search function that searches both users and posts
  const searchUsers = useCallback(async (searchTerm: string) => {
    if (!currentUser || !searchTerm.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      setIsSearchMode(true);
      const searchTermLower = searchTerm.toLowerCase();
      const results: SearchResult[] = [];

      // Search Users
      try {
        const usernameQuery = query(
          collection(db, "users"),
          where("__name__", "!=", currentUser.uid),
          limit(200) // Increased from 20 to 100 users
        );

        const userSnapshot = await getDocs(usernameQuery);
        const userResults = userSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as User[];

        // Filter users by username and email
        userResults.forEach(user => {
          if (user.username.toLowerCase().includes(searchTermLower)) {
            results.push({
              type: 'user',
              data: user,
              matchType: 'username'
            });
          } else if (user.email.toLowerCase().includes(searchTermLower)) {
            results.push({
              type: 'user',
              data: user,
              matchType: 'email'
            });
          }
        });
      } catch (error) {
        console.error("Error searching users:", error);
      }

      // Search Posts
      try {
        const postsQuery = query(
          collection(db, "posts"),
          orderBy("timestamp", "desc"),
          limit(200) // Increased from 50 to 200 posts to search through
        );

        const postSnapshot = await getDocs(postsQuery);
        const postResults = postSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Post[];

        // Filter posts by content and category
        postResults.forEach(post => {
          if (post.deleted) return; // Skip deleted posts
          
          if (post.content.toLowerCase().includes(searchTermLower)) {
            results.push({
              type: 'post',
              data: post,
              matchType: 'content'
            });
          } else if (post.category && post.category.toLowerCase().includes(searchTermLower)) {
            results.push({
              type: 'post',
              data: post,
              matchType: 'category'
            });
          }
        });
      } catch (error) {
        console.error("Error searching posts:", error);
      }

      // Sort results: users first, then posts, then by relevance
      results.sort((a, b) => {
        if (a.type === 'user' && b.type === 'post') return -1;
        if (a.type === 'post' && b.type === 'user') return 1;
        return 0;
      });

      setSearchResults(results.slice(0, 50)); // Increased from 20 to 50 total results
    } catch (error) {
      console.error("Error in search:", error);
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  }, [currentUser]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        setIsSearchMode(false);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);
useEffect(() => {
  if (!hasNextPage || loadingMore) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && fetchUsersRef.current) {
        fetchUsersRef.current(true); // Load more users using ref
      }
    },
    {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    }
  );

  const currentLoaderRef = loaderRef.current; // Store ref in variable to avoid stale closure

  if (currentLoaderRef) {
    observer.observe(currentLoaderRef);
  }

  return () => {
    if (currentLoaderRef) {
      observer.unobserve(currentLoaderRef);
    }
  };
}, [hasNextPage, loadingMore]); // Remove fetchUsers from dependencies to prevent infinite loops
  // Initial load
  useEffect(() => {
    if (currentUser) {
      if (fetchUsersRef.current) {
        fetchUsersRef.current(false);
      }
      if (fetchTotalUserCountRef.current) {
        fetchTotalUserCountRef.current();
      }
    }
  }, [currentUser]); // Remove fetchUsers and fetchTotalUserCount from dependencies to prevent infinite loops

  const updateUserInState = useCallback((targetUserId: string, updateFn: (user: User) => User) => {
    setUsers(prev => prev.map(user => 
      user.id === targetUserId ? updateFn(user) : user
    ));
    
    if (isSearchMode) {
      setSearchResults(prev => prev.map(result => {
        if (result.type === 'user' && (result.data as User).id === targetUserId) {
          return {
            ...result,
            data: updateFn(result.data as User)
          };
        }
        return result;
      }));
    }
  }, [isSearchMode]);

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) {
      toast.error("Please log in to follow users");
      router.push("/login");
      return;
    }

    try {
      // Optimistic update
      updateUserInState(targetUserId, user => ({
        ...user,
        followers: [...(user.followers || []), currentUser.uid]
      }));

      // Update Firebase
      const batch = [
        updateDoc(doc(db, "users", currentUser.uid), {
          following: arrayUnion(targetUserId)
        }),
        updateDoc(doc(db, "users", targetUserId), {
          followers: arrayUnion(currentUser.uid)
        })
      ];

      await Promise.all(batch);
      toast.success("Successfully followed user!");
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
      
      // Revert optimistic update
      updateUserInState(targetUserId, user => ({
        ...user,
        followers: user.followers?.filter(id => id !== currentUser.uid) || []
      }));
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!currentUser) {
      toast.error("Please log in to unfollow users");
      router.push("/login");
      return;
    }

    try {
      // Optimistic update
      updateUserInState(targetUserId, user => ({
        ...user,
        followers: user.followers?.filter(id => id !== currentUser.uid) || []
      }));

      // Update Firebase
      const batch = [
        updateDoc(doc(db, "users", currentUser.uid), {
          following: arrayRemove(targetUserId)
        }),
        updateDoc(doc(db, "users", targetUserId), {
          followers: arrayRemove(currentUser.uid)
        })
      ];

      await Promise.all(batch);
      toast.success("Successfully unfollowed user!");
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
      
      // Revert optimistic update
      updateUserInState(targetUserId, user => ({
        ...user,
        followers: [...(user.followers || []), currentUser.uid]
      }));
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
        <HashLoader color="#8b5cf6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Network</h1>
        
        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users by name/email or posts by content/category..."
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-blue-500/50 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <HashLoader size={20} color="#3b82f6" />
            </div>
          )}
        </div>

        {/* Search Results Info */}
        {isSearchMode && (
          <div className="mb-4 text-gray-600 dark:text-gray-400">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            {searchResults.length > 0 && (
              <span className="ml-2">
                ({searchResults.filter(r => r.type === 'user').length} users, {searchResults.filter(r => r.type === 'post').length} posts)
              </span>
            )}
          </div>
        )}

        {/* Total Users Count - Only show when not in search mode */}
        {!isSearchMode && totalUsersCount > 0 && (
          <div className="mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalUsersCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600/80 dark:text-blue-400/80">
                    {totalUsersCount === 1 ? 'User' : 'Users'} in the network
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center">
            <HashLoader color="#3b82f6" />
          </div>
        ) : (
          <>
            {isSearchMode ? (
              // Search Results Display
              <div className="space-y-8">
                {/* User Results */}
                {searchResults.filter(result => result.type === 'user').length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Users ({searchResults.filter(result => result.type === 'user').length})
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {searchResults
                        .filter(result => result.type === 'user')
                        .map((result) => {
                          const user = result.data as User;
                          const isFollowing = currentUser && user.followers?.includes(currentUser.uid);
                          
                          return (
                            <motion.div
                              key={`user-${user.id}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-6 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm dark:shadow-none"
                            >
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <Link href={`/profile/${user.id}`} className="cursor-pointer">
                                  <Avatar className="w-16 h-16 border-2 border-blue-200 dark:border-blue-500/20 hover:border-blue-300 dark:hover:border-blue-400 transition-colors">
                                    <AvatarImage 
                                      src={user.profilepic || defaultAvatar}
                                      alt={user.username}
                                      className="object-cover"
                                    />
                                    <AvatarFallback className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                      {user.username?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>
                                <div className="flex-1">
                                  <Link href={`/profile/${user.id}`} className="cursor-pointer">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{user.username}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                                  </Link>
                                  <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{user.followers?.length || 0} followers</span>
                                    <span>{user.following?.length || 0} following</span>
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                                      Match: {result.matchType}
                                    </span>
                                  </div>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
                                  className={`px-6 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                                    isFollowing 
                                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                      : 'bg-blue-500 text-white hover:bg-blue-600'
                                  }`}
                                >
                                  {isFollowing ? 'Unfollow' : 'Follow'}
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Post Results */}
                {searchResults.filter(result => result.type === 'post').length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Posts ({searchResults.filter(result => result.type === 'post').length})
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {searchResults
                        .filter(result => result.type === 'post')
                        .map((result) => {
                          const post = result.data as Post;
                          
                          return (
                            <motion.div
                              key={`post-${post.id}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-6 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm dark:shadow-none"
                            >
                              <div className="flex items-start space-x-4">
                                <Link href={`/profile/${post.userId}`}>
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage
                                      src={post.userProfilePic || defaultAvatar}
                                      alt={post.userName}
                                    />
                                    <AvatarFallback>
                                      {post.userName?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <Link href={`/profile/${post.userId}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                      {post.userName}
                                    </Link>
                                    <div className="text-xs">
                                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                                        Match: {result.matchType}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <Link href={`/post/${post.id}`} className="block mt-2">
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed hover:text-gray-900 dark:hover:text-white transition-colors line-clamp-3">
                                      {post.content}
                                    </p>
                                  </Link>
                                  
                                  <div className="flex items-center gap-4 mt-3">
                                    {post.category && (
                                      <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                                        #{post.category}
                                      </span>
                                    )}
                                    
                                    {post.images && post.images.length > 0 && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        📸 {post.images.length} image{post.images.length > 1 ? 's' : ''}
                                      </span>
                                    )}
                                    
                                    {post.timestamp && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(post.timestamp.seconds * 1000).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* No Search Results */}
                {searchResults.length === 0 && !searching && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                    <p className="text-lg">No results found for &quot;{searchQuery}&quot;</p>
                    <p className="text-sm mt-2">Try searching for users by name/email or posts by content/category</p>
                  </div>
                )}
              </div>
            ) : (
              // Regular User List
              <>
                {/* Users Grid */}
                <div className="grid grid-cols-1 gap-6">
                  {users.map((user) => {
                    const isFollowing = currentUser && user.followers?.includes(currentUser.uid);

                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm dark:shadow-none"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <Link href={`/profile/${user.id}`} className="cursor-pointer">
                            <Avatar className="w-16 h-16 border-2 border-blue-200 dark:border-blue-500/20 hover:border-blue-300 dark:hover:border-blue-400 transition-colors">
                              <AvatarImage 
                                src={user.profilepic || defaultAvatar}
                                alt={user.username}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                {user.username?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1">
                            <Link href={`/profile/${user.id}`} className="cursor-pointer">
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{user.username}</h3>
                              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                            </Link>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>{user.followers?.length || 0} followers</span>
                              <span>{user.following?.length || 0} following</span>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
                            className={`px-6 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                              isFollowing 
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {isFollowing ? 'Unfollow' : 'Follow'}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {hasNextPage && (
                  <div ref={loaderRef} className="flex justify-center mt-8">
                    {loadingMore && <HashLoader size={20} color="#8b5cf6" />}
                  </div>
                )}

                {/* No Users */}
                {users.length === 0 && !loading && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                    No users found.
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}