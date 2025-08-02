// Test script to verify profile API endpoint
// Run this in the browser console or as a Node.js script

const testProfileAPI = async () => {
  try {
    // You'll need to replace this with an actual user ID and auth token
    const userId = 'your-user-id-here';
    const authToken = 'your-auth-token-here';
    
    const response = await fetch(`http://localhost:3000/api/users/${userId}/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Profile API Success:', data);
      
      // Check if all expected fields are present
      const expectedFields = ['user', 'currentUser', 'postsCount', 'isFollowing'];
      const hasAllFields = expectedFields.every(field => field in data);
      
      if (hasAllFields) {
        console.log('✅ All expected fields present');
        console.log('Posts count (temporary):', data.postsCount);
        console.log('Is following:', data.isFollowing);
      } else {
        console.log('❌ Missing fields:', expectedFields.filter(field => !(field in data)));
      }
    } else {
      console.error('❌ Profile API Error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
};

// Usage:
// testProfileAPI();

console.log(`
Profile API Test Script Ready!

To test:
1. Open browser console on your app
2. Get your auth token and user ID
3. Update the variables in testProfileAPI()
4. Run testProfileAPI()

Current server: http://localhost:3000
API endpoint: /api/users/[id]/profile
`);
