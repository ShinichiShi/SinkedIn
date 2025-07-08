# How to Update Firestore Security Rules

## The Issue
You're getting a "Missing or insufficient permissions" error when trying to read notifications because the current Firestore security rules don't allow authenticated users to access the `notifications` collection.

## Solution
You need to update your Firestore security rules in the Firebase Console. Follow these steps:

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your SinkedIn project
3. In the left sidebar, click on "Firestore Database"
4. Click on the "Rules" tab at the top

### Step 2: Update the Rules
1. You'll see the current rules in the editor
2. Replace the entire content with the rules from the `firestore.rules` file in this project
3. Click "Publish" to deploy the new rules

### Step 3: Test the Application
After updating the rules, your notifications page should work without permission errors.

## What the New Rules Do

The updated rules include:

1. **Notifications**: Users can only read/write their own notifications (where `userId` matches their auth UID)
2. **Posts**: Anyone can read posts, authenticated users can create/update, only post authors can delete
3. **Comments**: Anyone can read, authenticated users can create, only comment authors can update/delete
4. **Likes/Shares**: Anyone can read (for counts), authenticated users can create/delete their own
5. **Follows**: Authenticated users can read all follows, create their own, and delete follows they created
6. **Users**: Users can only read/write their own user document

## Important Notes

- Make sure you're signed in to Firebase with the correct Google account that has access to your project
- The rules take effect immediately after publishing
- Test your app after updating to ensure everything works correctly
- If you get any other permission errors, check that your client-side code is properly authenticated

## Backup
Before updating, Firebase will show you the current rules. You can copy them as a backup in case you need to revert.
