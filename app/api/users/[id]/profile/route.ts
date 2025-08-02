// app/api/users/[id]/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let currentUserId: string;
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      currentUserId = decodedToken.uid;
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get both user data and current user data in parallel
    const [userDoc, currentUserDoc] = await Promise.all([
      adminDb.collection('users').doc(params.id).get(),
      adminDb.collection('users').doc(currentUserId).get()
    ]);

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentUserData = currentUserDoc.exists ? currentUserDoc.data() : null;
    
    // TODO: Add posts count once Firestore index is created
    // For now, we'll skip the posts count to avoid index requirement
    
    return NextResponse.json({ 
      user: userData,
      currentUser: currentUserData,
      postsCount: 0, // Temporary: will be populated once index is created
      isFollowing: currentUserData?.following?.includes(params.id) || false
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
