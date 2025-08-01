// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await getAuth().verifyIdToken(token);
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDoc = await adminDb.collection('users').doc(params.id).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user: userDoc.data() });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
