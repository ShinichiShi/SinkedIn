comment likes
login issues...see without loggin in
tags adding display in posts
redis 
db migrate to postgres
add subcollection in comments instead of arrays
feed generation system for following tab : 
    Long-term Recommendation
    For a production app with many users following many people, consider implementing a feed generation system:

    Pre-generate feeds when users post content
    Store individual user feeds in a separate collection
    Update feeds asynchronously using Cloud Functions
    Query the pre-generated feed instead of real-time aggregation

    This approach scales much better than real-time aggregation queries and reduces the number of required indexes.
---
P0: 
ratelimiter
secure api routes
db cached - indexdb
context api
firebase migration
add firebase emulator

Routes : 
- app/category/{id}
- app/network
- app/post/{id}
- app/login
- components/post commentSection.tsx
- components/profile user-list-item.tsx
- leftsidebar.tsx components/sidebar
- hooks.useAuth
- hooks/usePostactions
- hooks/usePosts
- hooks.useUserCache
- hooks/useUserProfile

Posts API:

GET /api/posts - Fetch posts with pagination and filtering
POST /api/posts/create - Create new posts
GET /api/posts/[postId] - Get individual post
PATCH /api/posts/[postId]/delete - Soft delete posts
PATCH /api/posts/[postId]/like - Like/unlike posts
PATCH /api/posts/[postId]/dislike - Dislike/undislike posts
PATCH /api/posts/[postId]/share - Update share count
POST /api/posts/[postId]/comment - Add comments

Users API:

GET /api/users/[userId] - Get user profile
GET /api/users/[userId]/posts - Get user's posts
POST /api/users/[userId]/follow - Follow user
DELETE /api/users/[userId]/follow - Unfollow user
POST /api/users/batch - Batch fetch multiple users

---      
1. Structure Your Collections Smartly
Current (simple)
```
posts/{postId}
   userId: string
   content: string
   timestamp: ...
   comments: [...]
```
Problem: Querying posts loads many fields you may not need.
Comments inside posts make the doc heavy → every read costs more bandwidth.

Optimized Structure
```
posts/{postId}
   userId: string
   content: string
   timestamp: ...
   likeCount: number  // pre-aggregated to avoid extra reads
   commentCount: number
   isSad: boolean     // preprocessed by Gemini

comments/{commentId}
   postId: string
   userId: string
   text: string
   timestamp: ...
```
Why this helps?
Keeping comments in a separate collection prevents unnecessary reads of the whole post when only comments change.
Using aggregated fields (likeCount, commentCount) avoids expensive queries to count likes/comments.

2. Reduce Reads with Pagination & Caching
Use Firestore queries with limit() (e.g., load 10 posts at a time).
Cache the last document (startAfter(lastDoc)) to paginate instead of re-reading from the start.
Avoid real-time listeners on the whole posts collection—listen only to the newest posts.

3. Minimize Repeated Reads
Client-side caching (e.g., keep posts in Zustand/Redux so you don’t re-fetch on navigation).
Use IndexedDB (Firebase SDK supports persistence) so returning users don’t re-read everything.

4. Rate-Limit and Aggregate Expensive Updates
For things like views, likes, sadness reactions, don’t write on every single interaction.
Instead, queue updates (using Cloud Functions + Redis or batching) and write aggregated results periodically.

5. Use a Backend API Layer (Your Plan)
Calls go through your API (Next.js API or Go service).
API layer can:
Cache responses (Redis).
Aggregate metrics before writing to Firestore.
Return pre-fetched data (saving reads).

6. Cost Tricks for Feeds
Store only minimal fields in the posts collection (for feed display).
When user clicks a post, fetch the full details (1 extra read).
This prevents paying for huge reads when just listing posts.

