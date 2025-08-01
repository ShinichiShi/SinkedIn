
// app/api/posts/[id]/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin,adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getAuth().verifyIdToken(token);
    const postRef = adminDb.collection('posts').doc(params.id);
    
    await postRef.update({
      shares: FieldValue.increment(1)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating share count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}