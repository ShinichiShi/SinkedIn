// hooks/useUserCache.ts (Updated)
import { useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';

export const useUserCache = () => {
  const [cachedUsers, setCachedUsers] = useState<Map<string, any>>(new Map());

  const getAuthToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    return await currentUser.getIdToken();
  };

  const fetchUsers = useCallback(async (userIds: string[], maxUsers: number = 50) => {
    const uncachedUserIds = userIds.filter(userId => !cachedUsers.has(userId));
    
    if (uncachedUserIds.length === 0) return cachedUsers;

    const limitedUncachedUserIds = uncachedUserIds.slice(0, maxUsers);
    
    console.log(`Fetching ${limitedUncachedUserIds.length} uncached users (${uncachedUserIds.length} total uncached, limited to ${maxUsers})`);
    
    try {
      const token = await getAuthToken();
      
      const response = await fetch('/api/users/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: limitedUncachedUserIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }

      const { users } = await response.json();
      
      let currentUserCache = new Map(cachedUsers);
      Object.entries(users).forEach(([userId, userData]) => {
        currentUserCache.set(userId, userData);
      });
      
      setCachedUsers(currentUserCache);
      return currentUserCache;
      
    } catch (error) {
      console.error('Error fetching users:', error);
      return cachedUsers;
    }
  }, [cachedUsers]);

  const getUserFromCache = useCallback((userId: string) => {
    return cachedUsers.get(userId);
  }, [cachedUsers]);

  return { cachedUsers, setCachedUsers, fetchUsers, getUserFromCache };
};
