// app/api/users/[id]/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
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
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    const postsQuery = adminDb.collection('posts')
      .where('userId', '==', params.id)
      .where('deleted', '!=', true)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(page * limit);

    const snapshot = await postsQuery.get();
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ 
      posts, 
      hasMore: posts.length === limit 
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
