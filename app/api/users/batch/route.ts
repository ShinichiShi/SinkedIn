// app/api/users/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin,adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { FieldPath } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getAuth().verifyIdToken(token);
    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    const users: Record<string, any> = {};
    
    // Batch requests for Firestore 'in' query limit (10 items)
    const batches = [];
    for (let i = 0; i < userIds.length; i += 10) {
      batches.push(userIds.slice(i, i + 10));
    }
    
    for (const batch of batches) {
      const usersQuery = adminDb.collection('users').where(FieldPath.documentId(), 'in', batch);
      const usersSnapshot = await usersQuery.get();
      
      usersSnapshot.docs.forEach(doc => {
        users[doc.id] = doc.data();
      });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}