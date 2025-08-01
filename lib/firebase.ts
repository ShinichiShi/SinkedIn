import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator, GoogleAuthProvider, signInWithCredential } from "firebase/auth";

const isDev = process.env.NODE_ENV === "development";
const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
if (isDev && useEmulator && typeof window !== "undefined" && location.hostname === "localhost") {
  connectFirestoreEmulator(db, "localhost", 8080);
  connectAuthEmulator(auth, "http://localhost:9099"); // Uncomment only if using fake login
  console.warn("🔥 Running Firestore on Emulator (Auth Emulator disabled due to Google login limitation)");
}

export async function devFakeGoogleLogin() {
  const fakeCredential = GoogleAuthProvider.credential(
    '{"sub":"1234567890","email":"devuser@example.com","email_verified":true}'
  );
  return signInWithCredential(auth, fakeCredential);
}

export { firebaseApp, db, auth };
