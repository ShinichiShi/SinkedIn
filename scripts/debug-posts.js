const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhc7IxPTCNH_B8vBUXjFsKxJqrFXLtRJY",
  authDomain: "linkedinclone-9a8a4.firebaseapp.com",
  projectId: "linkedinclone-9a8a4",
  storageBucket: "linkedinclone-9a8a4.appspot.com",
  messagingSenderId: "1062976509510",
  appId: "1:1062976509510:web:1d8b5d66a1c2b3a5c2b3a5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugPosts() {
  try {
    console.log('🔍 Fetching posts to debug...');
    
    const postsRef = collection(db, 'posts');
    const querySnapshot = await getDocs(postsRef);
    
    console.log(`📊 Total posts found: ${querySnapshot.size}`);
    
    let withCategory = 0;
    let withoutCategory = 0;
    let withContent = 0;
    let withoutContent = 0;
    
    const categories = {};
    
    querySnapshot.docs.forEach((doc) => {
      const postData = doc.data();
      
      // Count categories
      if (postData.category) {
        withCategory++;
        categories[postData.category] = (categories[postData.category] || 0) + 1;
      } else {
        withoutCategory++;
      }
      
      // Count content
      if (postData.content && postData.content.trim() !== '') {
        withContent++;
      } else {
        withoutContent++;
      }
      
      // Show first few posts for debugging
      if (Object.keys(categories).length < 10) {
        console.log(`📄 Post ${doc.id}:`);
        console.log(`   Category: ${postData.category || 'NONE'}`);
        console.log(`   Content: ${postData.content ? postData.content.substring(0, 50) + '...' : 'NONE'}`);
        console.log(`   Created: ${postData.createdAt ? new Date(postData.createdAt.seconds * 1000).toISOString() : 'NONE'}`);
        console.log('');
      }
    });
    
    console.log('\n📈 SUMMARY:');
    console.log(`Total posts: ${querySnapshot.size}`);
    console.log(`With category: ${withCategory}`);
    console.log(`Without category: ${withoutCategory}`);
    console.log(`With content: ${withContent}`);
    console.log(`Without content: ${withoutContent}`);
    console.log('\n🏷️  Category distribution:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging posts:', error);
  }
}

debugPosts();
