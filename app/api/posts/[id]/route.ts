// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin,adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getAuth().verifyIdToken(token);
    
    const postDoc = await adminDb.collection('posts').doc(params.id).get();
    
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = postDoc.data();
    if (postData?.deleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      post: {
        id: postDoc.id,
        ...postData
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
