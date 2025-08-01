// app/api/users/[id]/follow/route.ts
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
    const targetUserId = params.id;

    if (decodedToken.uid === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    await adminDb.runTransaction(async (transaction) => {
      const currentUserRef = adminDb.collection('users').doc(decodedToken.uid);
      const targetUserRef = adminDb.collection('users').doc(targetUserId);

      // Check if target user exists
      const targetUserDoc = await transaction.get(targetUserRef);
      if (!targetUserDoc.exists) {
        throw new Error('Target user not found');
      }

      // Update following for current user
      transaction.update(currentUserRef, {
        following: FieldValue.arrayUnion(targetUserId)
      });

      // Update followers for target user
      transaction.update(targetUserRef, {
        followers: FieldValue.arrayUnion(decodedToken.uid)
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    const targetUserId = params.id;

    await adminDb.runTransaction(async (transaction) => {
      const currentUserRef = adminDb.collection('users').doc(decodedToken.uid);
      const targetUserRef = adminDb.collection('users').doc(targetUserId);

      // Update following for current user
      transaction.update(currentUserRef, {
        following: FieldValue.arrayRemove(targetUserId)
      });

      // Update followers for target user
      transaction.update(targetUserRef, {
        followers: FieldValue.arrayRemove(decodedToken.uid)
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
