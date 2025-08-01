// lib/firebase-admin.ts (Firebase Admin SDK setup)
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

export const admin = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseAdminConfig);
export const adminDb = getFirestore(admin);