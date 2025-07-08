import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CreateNotificationParams {
  type: 'like' | 'comment' | 'follow' | 'share';
  actorId: string; // User performing the action
  targetUserId: string; // User receiving the notification
  postId?: string; // For post-related notifications
  commentText?: string; // For comment notifications
}

export const createNotification = async ({
  type,
  actorId,
  targetUserId,
  postId,
  commentText
}: CreateNotificationParams) => {
  // Don't create notification if user is acting on their own content
  if (actorId === targetUserId) {
    return;
  }

  try {
    // Get actor data
    const actorDoc = await getDoc(doc(db, 'users', actorId));
    if (!actorDoc.exists()) {
      console.error('Actor user not found');
      return;
    }
    const actorData = actorDoc.data();

    // Get post data if postId is provided
    let postTitle = '';
    if (postId) {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists()) {
        const postData = postDoc.data();
        // Create a short title from post content
        postTitle = postData.content?.substring(0, 50) + (postData.content?.length > 50 ? '...' : '') || 'a post';
      }
    }

    // For likes, check if notification already exists to avoid duplicates
    if (type === 'like') {
      const existingNotificationQuery = query(
        collection(db, 'notifications'),
        where('type', '==', 'like'),
        where('actorId', '==', actorId),
        where('targetUserId', '==', targetUserId),
        where('postId', '==', postId)
      );
      const existingNotifications = await getDocs(existingNotificationQuery);
      if (!existingNotifications.empty) {
        // Notification already exists, don't create duplicate
        return;
      }
    }

    // Create notification
    await addDoc(collection(db, 'notifications'), {
      type,
      actorId,
      actorName: actorData.username || 'Anonymous',
      actorProfilePic: actorData.profilepic || '',
      targetUserId,
      postId: postId || null,
      postTitle: postTitle || null,
      commentText: commentText || null,
      timestamp: serverTimestamp(),
      read: false,
      createdAt: serverTimestamp()
    });

    console.log(`Notification created: ${type} from ${actorData.username} to ${targetUserId}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Remove notification (e.g., when unlike a post)
export const removeNotification = async ({
  type,
  actorId,
  targetUserId,
  postId
}: {
  type: 'like';
  actorId: string;
  targetUserId: string;
  postId: string;
}) => {
  try {
    const notificationQuery = query(
      collection(db, 'notifications'),
      where('type', '==', type),
      where('actorId', '==', actorId),
      where('targetUserId', '==', targetUserId),
      where('postId', '==', postId)
    );

    const notifications = await getDocs(notificationQuery);
    notifications.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    console.log(`Notification removed: ${type} from ${actorId} to ${targetUserId}`);
  } catch (error) {
    console.error('Error removing notification:', error);
  }
};

// Create notification for new followers
export const createFollowNotification = async (followerId: string, followedUserId: string) => {
  await createNotification({
    type: 'follow',
    actorId: followerId,
    targetUserId: followedUserId
  });
};

// Create notification for post likes
export const createLikeNotification = async (likerId: string, postOwnerId: string, postId: string) => {
  await createNotification({
    type: 'like',
    actorId: likerId,
    targetUserId: postOwnerId,
    postId
  });
};

// Remove notification for post unlikes
export const removeLikeNotification = async (likerId: string, postOwnerId: string, postId: string) => {
  await removeNotification({
    type: 'like',
    actorId: likerId,
    targetUserId: postOwnerId,
    postId
  });
};

// Create notification for comments
export const createCommentNotification = async (
  commenterId: string, 
  postOwnerId: string, 
  postId: string, 
  commentText: string
) => {
  await createNotification({
    type: 'comment',
    actorId: commenterId,
    targetUserId: postOwnerId,
    postId,
    commentText
  });
};

// Create notification for shares
export const createShareNotification = async (sharerId: string, postOwnerId: string, postId: string) => {
  await createNotification({
    type: 'share',
    actorId: sharerId,
    targetUserId: postOwnerId,
    postId
  });
};
