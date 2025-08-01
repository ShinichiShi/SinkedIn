// app/api/posts/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin,adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const { content, imageUrl, hashtags } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
    }

    // Get user data for post
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    const newPost = {
      userId: decodedToken.uid,
      userName: userData?.username || decodedToken.name || 'Anonymous',
      userProfilePic: userData?.profilepic || null,
      content: content.trim(),
      images: imageUrl ? [imageUrl] : [],
      hashtags: hashtags || [],
      dislikes: 0,
      shares: 0,
      comments: [],
      dislikedBy: [],
      timestamp: FieldValue.serverTimestamp(),
      deleted: false
    };

    const postRef = await adminDb.collection('posts').add(newPost);

    return NextResponse.json({ 
      success: true, 
      postId: postRef.id,
      post: {
        id: postRef.id,
        ...newPost,
        timestamp: new Date() 
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
