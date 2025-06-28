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
  DocumentData
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

const USERS_PER_PAGE = 10;

export default function NetworkPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  
  const router = useRouter();
  const defaultAvatar = "/default-avatar.png";

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

  // Search users (optimized)
  const searchUsers = useCallback(async (searchTerm: string) => {
    if (!currentUser || !searchTerm.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      setIsSearchMode(true);

      // Search by username (case-insensitive using range queries)
      const searchTermLower = searchTerm.toLowerCase();
      const usernameQuery = query(
        collection(db, "users"),
        where("__name__", "!=", currentUser.uid),
        where("username", ">=", searchTermLower),
        where("username", "<=", searchTermLower + '\uf8ff'),
        limit(20)
      );

      const querySnapshot = await getDocs(usernameQuery);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      // Filter results client-side for more flexible search
      const filteredResults = results.filter(user =>
        user.username.toLowerCase().includes(searchTermLower) ||
        user.email.toLowerCase().includes(searchTermLower)
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
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
      if (entry.isIntersecting) {
        fetchUsers(true); // Load more users
      }
    },
    {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    }
  );

  if (loaderRef.current) {
    observer.observe(loaderRef.current);
  }

  return () => {
    if (loaderRef.current) {
      observer.unobserve(loaderRef.current);
    }
  };
}, [hasNextPage, loadingMore, fetchUsers]);
  // Initial load
  useEffect(() => {
    if (currentUser) {
      fetchUsers(false);
    }
  }, [currentUser]);

  const updateUserInState = useCallback((targetUserId: string, updateFn: (user: User) => User) => {
    setUsers(prev => prev.map(user => 
      user.id === targetUserId ? updateFn(user) : user
    ));
    
    if (isSearchMode) {
      setSearchResults(prev => prev.map(user => 
        user.id === targetUserId ? updateFn(user) : user
      ));
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

  const displayUsers = isSearchMode ? searchResults : users;

  if (loading && !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <HashLoader color="white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Network</h1>
        
        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <HashLoader size={20} color="white" />
            </div>
          )}
        </div>

        {/* Search Results Info */}
        {isSearchMode && (
          <div className="mb-4 text-gray-400">
            {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center">
            <HashLoader color="white" />
          </div>
        ) : (
          <>
            {/* Users Grid */}
            <div className="grid grid-cols-1 gap-6">
              {displayUsers.map((user) => {
                const isFollowing = currentUser && user.followers?.includes(currentUser.uid);

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                      <Link href={`/profile/${user.id}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Avatar className="w-16 h-16 border-2 border-purple-500/20">
                        <AvatarImage 
                          src={user.profilepic || defaultAvatar}
                          alt={user.username}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-purple-500/20 text-purple-300">
                          {user.username?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{user.username}</h3>
                        <p className="text-gray-400">{user.email}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-400">
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
                            ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-500'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90'
                        }`}
                      >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </motion.button>
                      </div>
                      </Link>
                  </motion.div>
                );
              })}
            </div>

          {!isSearchMode && hasNextPage && (
            <div ref={loaderRef} className="flex justify-center mt-8">
              {loadingMore && <HashLoader size={20} color="white" />}
            </div>
          )}

            {/* No Results */}
            {displayUsers.length === 0 && !loading && (
              <div className="text-center text-gray-400 py-12">
                {isSearchMode ? 'No users found matching your search.' : 'No users found.'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}