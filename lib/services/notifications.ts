// Notification service for Stoneclough Community PWA
// Handles push notifications, email notifications, and SMS alerts

import { createClient } from '@/lib/supabase/client';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  digest_frequency: 'immediate' | 'daily' | 'weekly' | 'none';
  categories: {
    events: boolean;
    community_posts: boolean;
    marketplace: boolean;
    faith_content: boolean;
    emergency_alerts: boolean;
    volunteer_requests: boolean;
  };
}

export interface NotificationData {
  title: string;
  body: string;
  type: 'event' | 'post' | 'marketplace' | 'faith' | 'emergency' | 'volunteer' | 'general';
  urgent?: boolean;
  url?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class NotificationService {
  private supabase = createClient();

  // Request notification permission
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Register for push notifications
  static async registerPushNotifications(): Promise<PushSubscription | null> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }

      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.warn('VAPID public key not configured');
          return null;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });
      }

      return subscription;
    } catch (error) {
      console.error('Error registering push notifications:', error);
      return null;
    }
  }

  // Save push subscription to database
  async savePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await this.supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscription.toJSON(),
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      console.log('Push subscription saved successfully');
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  // Get user's notification preferences
  async getNotificationPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await this.supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      return profile?.notification_preferences || {
        email: true,
        push: true,
        sms: false,
        digest_frequency: 'daily',
        categories: {
          events: true,
          community_posts: true,
          marketplace: true,
          faith_content: true,
          emergency_alerts: true,
          volunteer_requests: true,
        }
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await this.supabase
        .from('profiles')
        .update({
          notification_preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      console.log('Notification preferences updated successfully');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Send local notification (for immediate display)
  static async sendLocalNotification(data: NotificationData): Promise<void> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Cannot send notification: permission not granted');
        return;
      }

      const options: NotificationOptions = {
        body: data.body,
        icon: '/icon-192.jpg',
        badge: '/icon-192.jpg',
        tag: data.type,
        data: { url: data.url, ...data.data },
        requireInteraction: data.urgent || false,
        silent: false,
      };

      // Add action buttons for supported notifications
      if (data.actions && data.actions.length > 0) {
        options.actions = data.actions;
      }

      // Add vibration for urgent notifications
      if (data.urgent) {
        options.vibrate = [200, 100, 200];
      }

      new Notification(data.title, options);
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Queue notification for background sending
  async queueNotification(
    recipientId: string, 
    data: NotificationData,
    scheduledFor?: Date
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notification_queue')
        .insert({
          recipient_id: recipientId,
          type: data.type,
          title: data.title,
          body: data.body,
          data: data.data || {},
          urgent: data.urgent || false,
          scheduled_for: scheduledFor?.toISOString() || new Date().toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      console.log('Notification queued successfully');
    } catch (error) {
      console.error('Error queueing notification:', error);
      throw error;
    }
  }

  // Send emergency alert to all users
  async sendEmergencyAlert(data: NotificationData): Promise<void> {
    try {
      // Get all users with emergency alert preferences enabled
      const { data: users } = await this.supabase
        .from('profiles')
        .select('id, notification_preferences')
        .neq('notification_preferences->categories->emergency_alerts', false);

      if (!users || users.length === 0) {
        console.warn('No users found for emergency alert');
        return;
      }

      // Queue emergency notifications for all eligible users
      const notifications = users.map(user => ({
        recipient_id: user.id,
        type: 'emergency',
        title: data.title,
        body: data.body,
        data: data.data || {},
        urgent: true,
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
      }));

      const { error } = await this.supabase
        .from('notification_queue')
        .insert(notifications);

      if (error) throw error;
      console.log(`Emergency alert queued for ${users.length} users`);
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      throw error;
    }
  }

  // Get notification history for user
  async getNotificationHistory(limit = 50): Promise<any[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await this.supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Setup notification listeners
  static setupNotificationListeners(): void {
    // Listen for notification clicks
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          const { url } = event.data;
          if (url) {
            window.location.href = url;
          }
        }
      });
    }

    // Listen for push messages when app is in foreground
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_RECEIVED') {
          // Handle push notification received while app is active
          console.log('Push notification received:', event.data);
        }
      });
    }
  }

  // Initialize notification service
  static async initialize(): Promise<void> {
    try {
      // Setup listeners
      this.setupNotificationListeners();

      // Register for push notifications if permission granted
      if (Notification.permission === 'granted') {
        const subscription = await this.registerPushNotifications();
        if (subscription) {
          const service = new NotificationService();
          await service.savePushSubscription(subscription);
        }
      }

      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }
}
