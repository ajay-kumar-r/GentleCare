import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { medicationAPI, mealAPI, appointmentAPI, healthAPI } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  private notificationListener: any;
  private responseListener: any;
  private checkInterval: any;

  // Register for push notifications
  async registerForPushNotifications() {
    if (!Constants.isDevice) {
      console.log('Push notifications work best on physical devices');
      // Continue anyway for simulator testing
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);

      // Store token locally
      await AsyncStorage.setItem('pushToken', token);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleIncomingNotification(notification);
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      this.handleNotificationTap(response);
    });
  }

  // Handle incoming notifications
  private async handleIncomingNotification(notification: Notifications.Notification) {
    const notif: SmartNotification = {
      id: notification.request.identifier,
      title: notification.request.content.title || 'Notification',
      message: notification.request.content.body || '',
      type: (notification.request.content.data?.type as any) || 'reminder',
      timestamp: new Date().toISOString(),
      isRead: false,
      data: notification.request.content.data,
    };

    // Save to local storage
    await this.saveNotification(notif);
  }

  // Handle notification tap
  private handleNotificationTap(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    // You can add navigation logic here based on data.type
    console.log('Navigate to:', data?.type);
  }

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

  // Generate smart medication notifications
  async checkMedicationReminders() {
    try {
      const response = await medicationAPI.getAll();
      const medications = response.medications || [];
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      for (const med of medications) {
        if (!med.is_active) continue;

        // Parse medication time
        const timeStr = med.time.toLowerCase().replace(/\s/g, '');
        let medHour = 0;
        let medMinute = 0;

        const timeMatch = timeStr.match(/(\d+):?(\d*)([ap]m)?/);
        if (timeMatch) {
          medHour = parseInt(timeMatch[1]);
          medMinute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          
          if (timeMatch[3] === 'pm' && medHour !== 12) medHour += 12;
          if (timeMatch[3] === 'am' && medHour === 12) medHour = 0;
        }

        const medTime = medHour * 60 + medMinute;
        const timeDiff = Math.abs(medTime - currentTime);

        // Send notification 15 minutes before medication time
        if (timeDiff <= 15 && timeDiff > 0) {
          await this.sendNotification({
            title: '💊 Medication Reminder',
            body: `Time to take ${med.name} (${med.dosage})`,
            data: { type: 'medication', medicationId: med.id, name: med.name },
          });
        }

        // Check if medication was missed (more than 2 hours past due)
        if (medTime < currentTime && (currentTime - medTime) > 120) {
          const lastTaken = med.last_taken ? new Date(med.last_taken) : null;
          const today = now.toDateString();
          
          if (!lastTaken || lastTaken.toDateString() !== today) {
            await this.sendNotification({
              title: '⚠️ Missed Medication',
              body: `You haven't taken ${med.name} today. Please take it soon.`,
              data: { type: 'medication', medicationId: med.id, urgent: true },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking medication reminders:', error);
    }
  }

  // Generate smart meal notifications
  async checkMealReminders() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await mealAPI.getMeals(today);
      const meals = response.meals || [];
      const now = new Date();
      const currentHour = now.getHours();

      const mealTimes = {
        breakfast: { hour: 8, name: 'Breakfast' },
        lunch: { hour: 13, name: 'Lunch' },
        snack: { hour: 16, name: 'Snack' },
        dinner: { hour: 19, name: 'Dinner' },
      };

      for (const [type, time] of Object.entries(mealTimes)) {
        const mealLogged = meals.some((m: any) => m.meal_type === type);
        
        // Remind if meal time has passed and not logged
        if (currentHour >= time.hour && !mealLogged) {
          await this.sendNotification({
            title: `🍽️ ${time.name} Time`,
            body: `Don't forget to log your ${type}!`,
            data: { type: 'meal', mealType: type },
          });
        }
      }

      // Check nutrition goals
      const totalCalories = meals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0);
      if (currentHour >= 20 && totalCalories < 1500) {
        await this.sendNotification({
          title: '📊 Nutrition Alert',
          body: `You've consumed ${totalCalories} calories today. Try to reach your daily goal!`,
          data: { type: 'health', subtype: 'nutrition' },
        });
      }
    } catch (error) {
      console.error('Error checking meal reminders:', error);
    }
  }

  // Generate appointment notifications
  async checkAppointmentReminders() {
    try {
      const response = await appointmentAPI.getAll();
      const appointments = response.appointments || [];
      const now = new Date();

      for (const apt of appointments) {
        if (apt.status !== 'scheduled') continue;

        const aptDate = new Date(apt.appointment_date);
        const hoursDiff = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Notify 24 hours before
        if (hoursDiff > 23 && hoursDiff <= 24) {
          await this.sendNotification({
            title: '📅 Upcoming Appointment',
            body: `Tomorrow: ${apt.title} at ${aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            data: { type: 'appointment', appointmentId: apt.id },
          });
        }

        // Notify 1 hour before
        if (hoursDiff > 0.5 && hoursDiff <= 1) {
          await this.sendNotification({
            title: '⏰ Appointment Soon',
            body: `${apt.title} is in 1 hour${apt.location ? ` at ${apt.location}` : ''}`,
            data: { type: 'appointment', appointmentId: apt.id, urgent: true },
          });
        }
      }
    } catch (error) {
      console.error('Error checking appointment reminders:', error);
    }
  }

  // Generate health tracking reminders
  async checkHealthReminders() {
    try {
      const response = await healthAPI.getRecords({ days: 1 });
      const records = response.records || [];
      const now = new Date();
      const currentHour = now.getHours();

      // Remind to log health data in the morning (8 AM) and evening (8 PM)
      if ((currentHour === 8 || currentHour === 20) && records.length === 0) {
        await this.sendNotification({
          title: '❤️ Health Check',
          body: 'Time to log your health vitals (blood pressure, heart rate, etc.)',
          data: { type: 'health', subtype: 'vitals' },
        });
      }
    } catch (error) {
      console.error('Error checking health reminders:', error);
    }
  }

  // Start periodic checks (every 15 minutes)
  startPeriodicChecks() {
    // Run immediately
    this.runAllChecks();

    // Then run every 15 minutes
    this.checkInterval = setInterval(() => {
      this.runAllChecks();
    }, 15 * 60 * 1000); // 15 minutes
  }

  // Stop periodic checks
  stopPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  // Run all checks
  private async runAllChecks() {
    console.log('Running smart notification checks...');
    await Promise.all([
      this.checkMedicationReminders(),
      this.checkMealReminders(),
      this.checkAppointmentReminders(),
      this.checkHealthReminders(),
    ]);
  }

  // Send notification
  async sendNotification(content: { title: string; body: string; data?: any }) {
    try {
      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: content.data,
        },
        trigger: null, // Send immediately
      });

      // Also save as in-app notification
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

  // Clean up listeners
  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    this.stopPeriodicChecks();
  }
}

export default new NotificationService();
