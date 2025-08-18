import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { dateUtils } from './dateUtils';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  },

  async scheduleNotification(title: string, body: string, trigger: Date): Promise<string | null> {
    if (Platform.OS === 'web') {
      // For web, we can show a browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return 'web-notification';
    }

    try {
      // Ensure the trigger date is in the future
      const now = new Date();
      if (trigger <= now) {
        console.warn('Notification trigger time is in the past, scheduling for 1 minute from now');
        trigger = new Date(now.getTime() + 60000); // 1 minute from now
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: {
            type: 'fasting',
            scheduledAt: trigger.toISOString(),
          },
        },
        trigger,
      });
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  },

  async cancelNotification(id: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  async cancelAllNotifications(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  },

  async scheduleRecurringReminder(title: string, body: string, intervalMinutes: number): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data: {
            type: 'reminder',
            interval: intervalMinutes,
          },
        },
        trigger: {
          seconds: intervalMinutes * 60,
          repeats: true,
        },
      });
      return id;
    } catch (error) {
      console.error('Error scheduling recurring reminder:', error);
      return null;
    }
  },

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    if (Platform.OS === 'web') {
      return [];
    }

    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },

  async requestWebNotificationPermission(): Promise<boolean> {
    if (Platform.OS !== 'web' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },
};