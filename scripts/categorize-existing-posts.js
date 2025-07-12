const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, connectFirestoreEmulator } = require('firebase/firestore');
const axios = require('axios');

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

// OpenRouter API configuration
const MISTRAL_API_KEY = 'kYcOkNpzSMQI33VGfx70qBNHrCUiYwlr';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function categorizeText(text, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const prompt = `You are a strict classifier that assigns short personal or professional posts into exactly one category based on the *type and context of failure or struggle*. Choose only from the following 7 categories:

1. academic  — Anything related to school, college, university, exams, grades, research, thesis, courses, assignments, or professors
2. jobhunt   — Internship hunting, job applications, interview rejections, resume issues, campus placements, or LinkedIn outreach struggles
3. workplace — Issues in a current job: promotions, deadlines, feedback, burnout at work, office politics, coworkers, performance reviews, or project failures
4. startup   — Starting a company, failed launches, investor rejections, pitch deck problems, product-market fit issues, or co-founder disagreements
5. personal  — Life issues like relationships, family stress, isolation, lack of motivation, social anxiety, emotional setbacks, or confidence issues
6. health    — Physical or mental health concerns: anxiety, depression, burnout, injury, insomnia, fatigue, or illness
7. hobby     — Struggles in hobbies or personal goals: art, music, writing, fitness, sports, reading, creative side-projects, or challenges like #100DaysOfCode

⚠️ Rules:
- Match the **main topic of the struggle**, even if tone is casual or meme-like.
- Use **jobhunt** for internship rejections or early career hunting even if informal.
- Use **workplace** only for problems **in an active job** (not applications).
- Use **startup** only if they are building/launching/raising for their own product.
- Do NOT default to "personal" unless it clearly fits social/emotional/human context unrelated to jobs/school/health/hobbies.
- Output only **one word**, lowercase — exactly as listed above.

Examples:
- "11th internship nahi mil rahi lagta h khudki company kholni hogi" → jobhunt  
- "Rejected by my 7th company this week, maybe I need a new resume" → jobhunt  
- "Promotion denied. Feedback said I’m not 'visible' enough. Frustrating." → workplace  
- "Startup pitch got torn apart in demo day. Back to drawing board." → startup  
- "I’ve not created any art in months. Feeling blocked." → hobby  
- "Missed my best friend’s wedding due to family drama." → personal  
- "Slept 3 hours again. My brain’s not cooperating anymore." → health  
- "Couldn’t crack the GATE exam for the third time." → academic  
- "I was dropped from the research paper co-authorship. Hurts." → academic  
- "Startup failed. We didn’t reach product-market fit." → startup  
- "Cried after messing up my violin recital again." → hobby  
- "Didn’t get shortlisted for Google internship. Again." → jobhunt  
- "Getting negative feedback from team despite pulling 14-hour days." → workplace  
- "Family doesn’t support my decision to study abroad." → personal  
- "Every workout feels harder now. Progress is stalling." → health

Classify the following text:

"${text}"
      
      Return ONLY one word from: academic, jobhunt, workplace, startup, personal, health, hobby
      No explanations, no additional text, just the category word.`;

      const response = await axios.post(MISTRAL_API_URL, {
        model: 'mistral-small-latest', // Using smaller, faster model with potentially higher limits
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      const category = response.data.choices[0].message.content.trim().toLowerCase();
      
      // Validate the response is one of our expected categories
      const validCategories = ['academic', 'jobhunt', 'workplace', 'startup', 'personal', 'health', 'hobby'];
      const finalCategory = validCategories.includes(category) ? category : 'personal';
      
      console.log(`✓ Categorized as: ${finalCategory}`);
      return finalCategory;
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 2000; // Exponential backoff: 4s, 8s, 16s
        console.log(`⏳ Waiting ${delay/1000}s before retry...`);
        await sleep(delay);
      } else {
        console.error('❌ All retry attempts failed, using default category');
        return 'personal';
      }
    }
  }
  return 'personal';
}

async function categorizeExistingPosts() {
  try {
    console.log('🚀 Starting to categorize existing posts...');
    
    // Fetch all posts from Firestore
    const postsRef = collection(db, 'posts');
    const querySnapshot = await getDocs(postsRef);
    
    console.log(`📊 Found ${querySnapshot.size} posts to categorize`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      const postData = docSnapshot.data();
      const postId = docSnapshot.id;
      
      processedCount++;
      
      // Skip the category check - process ALL posts
      // if (postData.category) {
      //   console.log(`⏭️  Post ${processedCount}/${querySnapshot.size} (${postId}) already has category: ${postData.category}`);
      //   skippedCount++;
      //   continue;
      // }
      
      // Check if post has content to categorize
      if (!postData.content || postData.content.trim() === '') {
        console.log(`⏭️  Post ${processedCount}/${querySnapshot.size} (${postId}) has no content, setting to 'personal'`);
        
        // Update post with default category
        try {
          await updateDoc(doc(db, 'posts', postId), {
            category: 'personal'
          });
          updatedCount++;
        } catch (updateError) {
          console.error(`❌ Failed to update post ${postId}:`, updateError.message);
        }
        
        continue;
      }
      
      console.log(`🔄 Processing post ${processedCount}/${querySnapshot.size} (${postId})`);
      console.log(`📝 Content: "${postData.content.substring(0, 100)}${postData.content.length > 100 ? '...' : ''}"`);
      
      // Categorize the post content
      const category = await categorizeText(postData.content);
      
      // Update the post with the category
      try {
        await updateDoc(doc(db, 'posts', postId), {
          category: category
        });
        
        updatedCount++;
        console.log(`✅ Updated post ${postId} with category: ${category}`);
      } catch (updateError) {
        console.error(`❌ Failed to update post ${postId}:`, updateError.message);
        console.log(`⚠️  Skipping this post and continuing...`);
      }
      
      // Add a longer delay to avoid overwhelming the API
      await sleep(5000); // 5 second delay between requests
    }
    
    console.log('\n🎉 Categorization complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Total posts processed: ${processedCount}`);
    console.log(`   - Posts updated: ${updatedCount}`);
    console.log(`   - Posts skipped (already had category): ${skippedCount}`);
    
  } catch (error) {
    console.error('❌ Error during categorization:', error);
  }
}

// Run the script
categorizeExistingPosts()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
