
// app/api/posts/[id]/comment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin,adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    // Get user data for comment
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    const newComment = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: decodedToken.uid,
      userName: userData?.username || decodedToken.name || 'Anonymous',
      text: text.trim(),
      profilePic: userData?.profilepic || null,
      timestamp:Date.now(),
      replies: []
    };

    const postRef = adminDb.collection('posts').doc(params.id);
    await postRef.update({
      comments: FieldValue.arrayUnion(newComment)
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
