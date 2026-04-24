import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  type: 'medication' | 'meal' | 'appointment' | 'health' | 'reminder';
  timestamp: string;
  isRead: boolean;
  data?: any;
}

class NotificationService {
  async registerForPushNotifications() {
    return null;
  }

  setupNotificationListeners() {}

  // Save notification to local storage
  private async saveNotification(notif: SmartNotification) {
    try {
      const stored = await AsyncStorage.getItem('smart_notifications');
      const notifications: SmartNotification[] = stored ? JSON.parse(stored) : [];
      notifications.unshift(notif);
      
      // Keep only last 50 notifications
      const trimmed = notifications.slice(0, 50);
      await AsyncStorage.setItem('smart_notifications', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  // Get all notifications
  async getNotifications(): Promise<SmartNotification[]> {
    try {
      const stored = await AsyncStorage.getItem('smart_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notifId: string) {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map(n => 
        n.id === notifId ? { ...n, isRead: true } : n
      );
      await AsyncStorage.setItem('smart_notifications', JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Clear all notifications
  async clearAll() {
    try {
      await AsyncStorage.removeItem('smart_notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  startPeriodicChecks() {}

  async sendNotification(content: { title: string; body: string; data?: any }) {
    try {
      const notif: SmartNotification = {
        id: Date.now().toString(),
        title: content.title,
        message: content.body,
        type: content.data?.type || 'reminder',
        timestamp: new Date().toISOString(),
        isRead: false,
        data: content.data,
      };
      await this.saveNotification(notif);

      console.log('Notification sent:', content.title);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  cleanup() {}
}

export default new NotificationService();
