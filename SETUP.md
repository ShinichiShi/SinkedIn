
1. Why We Use the Emulator
    The Firebase Emulator allows you to:

    Develop without touching production data.
    Test Firestore locally.

    Use mocked authentication (but with limitations).

    ⚠️ Current Limitation

    🔴 Google Sign-In does NOT work with the Firebase Auth Emulator.
    The emulator does not support real OAuth flows (Google, Facebook,   etc.).
    Popups will fail with auth/popup-closed-by-user.

    For this reason, the Auth Emulator is currently disabled in our     local setup.

    We use real Google login in dev mode until a mock/fake login flow   is implemented.

2. What is Enabled in Dev Mode
    Firestore Emulator ✅ (port 8080)
    Storage Emulator ✅ (if needed)
    Auth Emulator ❌ (disabled because Google OAuth cannot be used)

3. How to Run Locally
    Install Firebase CLI:
    ```
    bash
    npm install -g firebase-tools
    firebase emulators:start --only firestore,storage
    ```
    Run the Next.js dev server:
    ```
    bash
    npm run dev
    ```
4. Switching Between Emulator and Production
    We control emulator usage via .env.local:
    ```env
    NEXT_PUBLIC_FIREBASE_USE_EMULATOR=false
    ```
    false → Uses real Firebase (with Google login).

    true → Would connect to emulator, but Auth Emulator is skipped.

5. Firebase Config Behavior
If NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true → Firestore connects to local emulator.
Auth Emulator is intentionally not connected because Google login would fail.
You can still test other auth methods (email/password) by manually enabling it.

6. Adding Back Auth Emulator (Optional)
    If you later implement fake Google login for dev:
    Uncomment the connectAuthEmulator line in firebaseConfig.js.
    Use a mock Google credential for sign-in.

    Example:
    ```js
    import { GoogleAuthProvider, signInWithCredential } from "firebase/ auth";
    const fakeCredential = GoogleAuthProvider.credential(
      '{"sub":"1234567890","email":"testuser@gmail.com",    "email_verified":true}'
    );
    await signInWithCredential(auth, fakeCredential);
    ```