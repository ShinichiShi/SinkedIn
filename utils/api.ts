// utils/api.ts (Helper functions for frontend)
import { auth } from '@/lib/firebase';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const getAuthToken = async (): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new ApiError('User not authenticated', 401, 'UNAUTHENTICATED');
  }
  return await currentUser.getIdToken();
};

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(
        error.error || `HTTP ${response.status}`,
        response.status,
        error.code
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, 'NETWORK_ERROR');
  }
};
