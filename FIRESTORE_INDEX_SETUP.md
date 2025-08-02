# Firestore Index Setup Instructions

## The profile loading is currently failing because Firestore requires a composite index for the query.

### Quick Fix (Immediate - Already Applied)
I've temporarily removed the posts count query from the profile API to make profile loading work immediately. This eliminates the index requirement for now.

### Permanent Fix (Recommended)

#### Option 1: Use the Direct Link (Easiest)
Click this link to automatically create the required index:
```
https://console.firebase.google.com/v1/r/project/sinkedin-1b41a/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9zaW5rZWRpbi0xYjQxYS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvcG9zdHMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaCwoHZGVsZXRlZBABGgwKCF9fbmFtZV9fEAE
```

#### Option 2: Manual Setup
1. Go to [Firebase Console](https://console.firebase.google.com/project/sinkedin-1b41a/firestore/indexes)
2. Click "Create Index"
3. Set Collection ID: `posts`
4. Add fields in this order:
   - `userId` (Ascending)
   - `deleted` (Ascending) 
   - `timestamp` (Descending)
5. Click "Create"

#### Option 3: Using Firebase CLI
```bash
# If you have Firebase CLI installed
firebase deploy --only firestore:indexes
```

### Re-enable Posts Count
Once the index is created, you can re-enable the posts count by updating the profile API:

```typescript
// Replace the TODO section in app/api/users/[id]/profile/route.ts
const postsCountQuery = adminDb.collection('posts')
  .where('userId', '==', params.id)
  .where('deleted', '!=', true);

const postsSnapshot = await postsCountQuery.get();
const postsCount = postsSnapshot.size;

// Update the return statement
return NextResponse.json({ 
  user: userData,
  currentUser: currentUserData,
  postsCount: postsCount, // Instead of 0
  isFollowing: currentUserData?.following?.includes(params.id) || false
});
```

### Current Status
✅ Profile loading now works without the index requirement
✅ User data and following status load properly  
⏳ Posts count temporarily shows 0 until index is created
⏳ Posts themselves load via separate endpoint (works fine)

### Index Creation Time
- Small dataset: ~1-2 minutes
- Medium dataset: ~5-15 minutes  
- Large dataset: ~30+ minutes

The profile should now load much faster! 🚀
