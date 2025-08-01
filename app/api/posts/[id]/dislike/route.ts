// app/api/posts/[id]/dislike/route.ts
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

    const decodedToken = await getAuth().verifyIdToken(token);
    const postRef = adminDb.collection('posts').doc(params.id);

    await adminDb.runTransaction(async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data();
      const dislikedBy = postData?.dislikedBy || [];
      const hasDisliked = dislikedBy.includes(decodedToken.uid);

      if (hasDisliked) {
        // Remove dislike
        transaction.update(postRef, {
          dislikes: Math.max((postData?.dislikes || 0) - 1, 0),
          dislikedBy: FieldValue.arrayRemove(decodedToken.uid)
        });
      } else {
        // Add dislike
        transaction.update(postRef, {
          dislikes: (postData?.dislikes || 0) + 1,
          dislikedBy: FieldValue.arrayUnion(decodedToken.uid)
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating dislike:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}