import { useState, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useUserCache = () => {
  const [cachedUsers, setCachedUsers] = useState<Map<string, any>>(new Map());

  const fetchUsers = useCallback(async (userIds: string[]) => {
    const uncachedUserIds = userIds.filter(userId => !cachedUsers.has(userId));
    
    if (uncachedUserIds.length === 0) return cachedUsers;

    console.log(`Fetching ${uncachedUserIds.length} uncached users`);
    
    let currentUserCache = new Map(cachedUsers);
    
    // Batch requests for Firestore 'in' query limit (10 items)
    const batches = [];
    for (let i = 0; i < uncachedUserIds.length; i += 10) {
      batches.push(uncachedUserIds.slice(i, i + 10));
    }
    
    for (const batch of batches) {
      const usersQuery = query(
        collection(db, "users"),
        where("__name__", "in", batch)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.docs.forEach(doc => {
        currentUserCache.set(doc.id, doc.data());
      });
    }
    
    setCachedUsers(currentUserCache);
    return currentUserCache;
  }, [cachedUsers]);

  const getUserFromCache = useCallback((userId: string) => {
    return cachedUsers.get(userId);
  }, [cachedUsers]);

  return { cachedUsers, setCachedUsers, fetchUsers, getUserFromCache };
};