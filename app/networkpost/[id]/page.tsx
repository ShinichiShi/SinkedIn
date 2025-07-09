'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

const db = getFirestore(firebaseApp);

interface User {
  username: string;
  email: string;
  profilepic: string; 
  bio: string;
}

interface Post {
  id: string;
  content: string;
  timestamp: string;
}

const NetworkPost = () => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', id as string);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);

          const postsQuery = query(
            collection(db, 'posts'),
            where('userId', '==', id)
          );
          const postsSnapshot = await getDocs(postsQuery);

          const fetchedPosts: Post[] = postsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              content: data.content,
              timestamp: data.timestamp?.toDate().toISOString() || '',
            };
          });

          setPosts(fetchedPosts);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchUserData();
  }, [id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div>Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* User Details */}
        <div className="mb-8 p-6 bg-black border border-white rounded-lg flex items-center gap-4">
          {user.profilepic ? (
            <img
              src={user.profilepic}
              alt={`${user.username}'s profile`}
              className="w-16 h-16 rounded-full border border-white"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-black border border-white flex items-center justify-center text-white">
              N/A
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold mb-2">{user.username}</h1>
            <p>Email: <span className="text-white">{user.email}</span></p>
            <p>Bio:<span className="text-white">{user.bio}</span></p>
          </div>
        </div>

        {/* User Posts */}
        <h2 className="text-xl font-semibold mb-4">User Posts</h2>
        {posts.length > 0 ? (
          <div className="grid gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-6 bg-black border border-white rounded-lg hover:bg-white hover:text-black transition duration-300"
              >
                <p className="mb-2">{post.content}</p>
                <small className="text-sm">
                  Posted on: {new Date(post.timestamp).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <p>No posts found for this user.</p>
        )}
      </div>
    </div>
  );
};

export default NetworkPost;
