import { NextRequest, NextResponse } from 'next/server';
import { admin,adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const searchParams = request.nextUrl.searchParams;
    const tab = searchParams.get('tab') || 'foryou';
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');
    const following = searchParams.get('following')?.split(',') || [];

    let query = adminDb.collection('posts')
      .where('deleted', '!=', true)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(page * limit);

    if (tab === 'following' && following.length > 0) {
      // Firestore 'in' query limit is 10, so we need to batch if more users
      const followingBatch = following.slice(0, 10);
      query = adminDb.collection('posts')
        .where('userId', 'in', followingBatch)
        .where('deleted', '!=', true)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .offset(page * limit);
    }

    const snapshot = await query.get();
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ posts, hasMore: posts.length === limit });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
