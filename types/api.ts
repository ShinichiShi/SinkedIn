// types/api.ts (API Response Types)
import { Post, UserData, Comment } from './index';
export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  code?: string;
  data?: T;
}

export interface PostsResponse {
  posts: Post[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface UserResponse {
  user: UserData;
}

export interface UsersResponse {
  users: Record<string, UserData>;
}

export interface CreatePostRequest {
  content: string;
  imageUrl?: string;
  hashtags?: string[];
}

export interface CreatePostResponse {
  success: boolean;
  postId: string;
  post: Post;
}

export interface CommentRequest {
  text: string;
}

export interface CommentResponse {
  success: boolean;
  comment: Comment;
}