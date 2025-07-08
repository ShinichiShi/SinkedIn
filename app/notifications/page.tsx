"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { formatRelativeTime } from '@/utils/timeUtils';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  getDocs,
  writeBatch,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { HashLoader } from 'react-spinners';
import { toast } from 'react-toastify';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'share';
  actorId: string; // User who performed the action
  actorName: string;
  actorProfilePic?: string;
  targetUserId: string; // User receiving the notification
  postId?: string; // For post-related notifications
  postTitle?: string; // For post-related notifications
  commentText?: string; // For comment notifications
  timestamp: Timestamp;
  read: boolean;
  createdAt: Timestamp;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Set up real-time listener for notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('targetUserId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData: Notification[] = [];
      
      snapshot.forEach((doc) => {
        notificationsData.push({
          id: doc.id,
          ...doc.data()
        } as Notification);
      });

      setNotifications(notificationsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      const batch = writeBatch(db);
      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });

      await batch.commit();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
        router.push(`/profile/${notification.actorId}`);
        break;
      case 'like':
      case 'comment':
      case 'share':
        if (notification.postId) {
          router.push(`/post/${notification.postId}`);
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'share':
        return '↗️';
      default:
        return '🔔';
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return `liked your post`;
      case 'comment':
        return `commented on your post`;
      case 'follow':
        return 'started following you';
      case 'share':
        return `shared your post`;
      default:
        return 'sent you a notification';
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <HashLoader color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto pt-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🔔
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="text-sm"
              >
                Mark all as read
              </Button>
            )}
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              All ({notifications.length})
            </Button>
            <Button
              onClick={() => setFilter('unread')}
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
            >
              Unread ({unreadCount})
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'unread' 
                  ? 'All caught up! No unread notifications.' 
                  : 'When people interact with your posts or follow you, you\'ll see notifications here.'
                }
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    !notification.read 
                      ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={notification.actorProfilePic} />
                        <AvatarFallback>
                          {notification.actorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1">
                        <span className="text-sm">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {notification.actorName}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 ml-1">
                              {getNotificationText(notification)}
                            </span>
                            {notification.postTitle && (
                              <span className="text-gray-600 dark:text-gray-400">
                                {' "' + notification.postTitle + '"'}
                              </span>
                            )}
                          </p>

                          {/* Comment content */}
                          {notification.commentText && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                              &quot;{notification.commentText}&quot;
                            </p>
                          )}

                          {/* Timestamp */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(notification.timestamp.toDate())}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
