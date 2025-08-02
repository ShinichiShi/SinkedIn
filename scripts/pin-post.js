// scripts/pin-post.js
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvWC-jKH0SIuYrErWKk3eSPs3sJUq9Vuk",
  authDomain: "sinkedin-1b41a.firebaseapp.com",
  projectId: "sinkedin-1b41a",
  storageBucket: "sinkedin-1b41a.firebasestorage.app",
  messagingSenderId: "700266003118",
  appId: "1:700266003118:web:d38c325b9df143de520b3f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function pinPost() {
  const postId = '4MTHuFu0m70FgRBaju2k';
  
  try {
    console.log(`Pinning post: ${postId}`);
    
    // Update the post to add pinned field
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      pinned: true
    });
    
    console.log(`✅ Successfully pinned post: ${postId}`);
    
    // Verify the update
    const updatedPost = await getDoc(postRef);
    if (updatedPost.exists()) {
      const data = updatedPost.data();
      console.log(`Post data:`, {
        id: postId,
        content: data.content?.substring(0, 50) + '...',
        pinned: data.pinned,
        userName: data.userName
      });
    } else {
      console.log('❌ Post not found after update');
    }
    
  } catch (error) {
    console.error('❌ Error pinning post:', error);
  } finally {
    process.exit(0);
  }
}

pinPost();
