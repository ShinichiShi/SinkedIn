export type Post = {
  id: string;
  content: string;
  userName: string;
  userProfilePic?: string;
  userId: string;
  timestamp: { seconds: number } | null ;
  createdAt?: string;
  dislikes: number;
  dislikedBy: string[];
  shares: number;
  comments: Comment[];
  images?: string[];
};

export type Comment = {
  userId: string;
  userName: string;
  text: string;
  profilePic?: string;
  timestamp: Date;
};
export type UserData = {
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
