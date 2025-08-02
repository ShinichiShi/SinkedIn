export type Post = {
  id: string;
  content: string;
  userName: string;
  userProfilePic?: string;
  userId: string;
  timestamp: { seconds: number } | null;
  createdAt?: string;
  dislikes: number;
  dislikedBy: string[];
  shares: number;
  comments: Comment[];
  images?: string[];
  deleted?: boolean;
  deletedAt?: Date;
  category?: string;
  pinned?: boolean;
};
export type Comment = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  profilePic?: string;
  timestamp: Date;
  deleted?: boolean;
  deletedAt?: Date;
  replies?: Comment[];
  parentId?: string; 
};
export type UserData = {
  uid:string;
  username: string;
  email: string;
  location?: string;
  bio?: string;
  profilepic?: string;
  backgroundImage?: string;
  failedExperience?: string[];
  misEducation?: string[];
  failureHighlights?: string[];
  followers: string[];
  following: string[];
}
