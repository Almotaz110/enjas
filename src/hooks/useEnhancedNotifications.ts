import { useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMotivationalQuotes } from '@/hooks/useMotivationalQuotes';
import { Task } from '@/types/task';
import { toast } from 'sonner';

interface NotificationAction {
  id: string;
  title: string;
  action: () => void;
}

interface MediaNotificationData {
  type: 'timer' | 'music';
  title: string;
  actions: NotificationAction[];
}

export const useEnhancedNotifications = () => {
  const { language } = useLanguage();
  const { currentQuote, updateCurrentQuote } = useMotivationalQuotes();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaNotificationRef = useRef<Notification | null>(null);

  // Check if notifications are supported
  const isNotificationSupported = useCallback(() => {
    return 'Notification' in window;
  }, []);

  // Get current permission status
  const getPermissionStatus = useCallback(() => {
    if (!isNotificationSupported()) return 'unsupported';
    return Notification.permission;
  }, [isNotificationSupported]);

  const requestPermissions = useCallback(async () => {
    if (!isNotificationSupported()) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    try {
      if (!Capacitor.isNativePlatform()) {
        if (Notification.permission === 'granted') {
          return true;
        } else if (Notification.permission === 'denied') {
          console.warn('Notification permission previously denied');
          return false;
        }
        
        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';
        
        if (granted) {
          toast.success(
            language === 'ar' 
              ? 'تم منح إذن الإشعارات بنجاح!' 
              : 'Notification permissions granted!'
          );
        }
        
        return granted;
      }

      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      toast.error(
        language === 'ar' 
          ? 'حدث خطأ أثناء طلب إذن الإشعارات' 
          : 'Error requesting notification permissions'
      );
      return false;
    }
  }, [language, isNotificationSupported]);

  const getTaskStats = useCallback((tasks: Task[]) => {
    const completed = tasks.filter(task => task.completed).length;
    const remaining = tasks.length - completed;
    const urgent = tasks.filter(task => task.priority === 'urgent' && !task.completed).length;
    
    return { completed, remaining, urgent };
  }, []);

  const getUpcomingTasks = useCallback((tasks: Task[]) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      return deadline >= today && deadline <= tomorrow && !task.completed;
    });
  }, []);

  const generateNotificationContent = useCallback((type: 'motivational' | 'stats' | 'reminders', tasks: Task[] = []) => {
    const isArabic = language === 'ar';
    
    switch (type) {
      case 'motivational':
        updateCurrentQuote();
        return {
          title: isArabic ? '💡 عبارة تحفيزية' : '💡 Motivational Quote',
          body: currentQuote.text || (isArabic ? 'استمر في العمل الجيد!' : 'Keep up the great work!')
        };
        
      case 'stats':
        const stats = getTaskStats(tasks);
        return {
          title: isArabic ? '📊 إحصائيات المهام' : '📊 Task Statistics',
          body: isArabic 
            ? `مكتملة: ${stats.completed} | متبقية: ${stats.remaining} | عاجلة: ${stats.urgent}`
            : `Completed: ${stats.completed} | Remaining: ${stats.remaining} | Urgent: ${stats.urgent}`
        };
        
      case 'reminders':
        const upcoming = getUpcomingTasks(tasks);
        if (upcoming.length === 0) {
          return {
            title: isArabic ? '✅ لا توجد مهام عاجلة' : '✅ No Urgent Tasks',
            body: isArabic ? 'جميع مهامك تحت السيطرة!' : 'All your tasks are under control!'
          };
        }
        return {
          title: isArabic ? '⏰ تذكير بالمهام' : '⏰ Task Reminder',
          body: isArabic 
            ? `لديك ${upcoming.length} مهام قادمة: ${upcoming[0].title}`
            : `You have ${upcoming.length} upcoming tasks: ${upcoming[0].title}`
        };
        
      default:
        return {
          title: isArabic ? '📱 إشعار' : '📱 Notification',
          body: isArabic ? 'تذكير عام' : 'General reminder'
        };
    }
  }, [language, currentQuote, updateCurrentQuote, getTaskStats, getUpcomingTasks]);

  const sendPeriodicNotification = useCallback(async (tasks: Task[] = []) => {
    const currentPermission = getPermissionStatus();
    
    if (currentPermission !== 'granted') {
      console.warn('No notification permission for periodic notifications');
      return;
    }

    // Cycle through different notification types
    const types: ('motivational' | 'stats' | 'reminders')[] = ['motivational', 'stats', 'reminders'];
    const currentHour = new Date().getHours();
    const typeIndex = Math.floor(currentHour / 2) % types.length;
    const notificationType = types[typeIndex];

    const { title, body } = generateNotificationContent(notificationType, tasks);

    try {
      if (!Capacitor.isNativePlatform()) {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'periodic-notification',
          requireInteraction: false,
          silent: false
        });

        // Auto close notification after 10 seconds
        setTimeout(() => {
          if (notification) {
            notification.close();
          }
        }, 10000);
      } else {
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title,
            body,
            schedule: { at: new Date() },
            sound: undefined,
            attachments: undefined,
            actionTypeId: "",
            extra: { type: 'periodic' }
          }]
        });
      }

      console.log(`Periodic notification sent: ${notificationType}`);
    } catch (error) {
      console.error('Error sending periodic notification:', error);
      toast.error(
        language === 'ar' 
          ? 'حدث خطأ أثناء إرسال الإشعار' 
          : 'Error sending notification'
      );
    }
  }, [language, generateNotificationContent, getPermissionStatus]);

  const showMediaControlNotification = useCallback(async (data: MediaNotificationData) => {
    const currentPermission = getPermissionStatus();
    
    if (currentPermission !== 'granted') {
      console.warn('No notification permission for media controls');
      return;
    }

    const isArabic = language === 'ar';
    
    if (!Capacitor.isNativePlatform()) {
      // Close existing media notification
      if (mediaNotificationRef.current) {
        mediaNotificationRef.current.close();
      }

      // Create new media control notification
      const notification = new Notification(
        isArabic ? `🎵 ${data.title}` : `🎵 ${data.title}`,
        {
          body: isArabic 
            ? `${data.type === 'timer' ? 'المؤقت' : 'الموسيقى'} قيد التشغيل - انقر للتحكم`
            : `${data.type === 'timer' ? 'Timer' : 'Music'} is running - Click to control`,
          icon: '/favicon.ico',
          tag: 'media-control',
          requireInteraction: true,
          silent: true // Don't make sound for media controls
        }
      );

      notification.onclick = () => {
        // Execute first action as default
        if (data.actions.length > 0) {
          data.actions[0].action();
        }
        window.focus(); // Bring app to focus
      };

      mediaNotificationRef.current = notification;
    } else {
      await LocalNotifications.schedule({
        notifications: [{
          id: 888888,
          title: isArabic ? `🎵 ${data.title}` : `🎵 ${data.title}`,
          body: isArabic 
            ? `${data.type === 'timer' ? 'المؤقت' : 'الموسيقى'} قيد التشغيل`
            : `${data.type === 'timer' ? 'Timer' : 'Music'} is running`,
          schedule: { at: new Date() },
          sound: undefined,
          attachments: undefined,
          actionTypeId: "media-control",
          extra: { 
            type: 'media-control',
            mediaType: data.type,
            actions: data.actions.map(a => a.id)
          }
        }]
      });
    }
  }, [language, getPermissionStatus]);

  const hideMediaControlNotification = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      if (mediaNotificationRef.current) {
        mediaNotificationRef.current.close();
        mediaNotificationRef.current = null;
      }
    } else {
      try {
        await LocalNotifications.cancel({
          notifications: [{ id: 888888 }]
        });
      } catch (error) {
        console.error('Error hiding media notification:', error);
      }
    }
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }, []);

  const startPeriodicNotifications = useCallback(async (tasks: Task[] = []) => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Register service worker for background notifications
    const registration = await registerServiceWorker();
    
    if (registration && registration.active) {
      // Send message to service worker to start background notifications
      registration.active.postMessage({
        type: 'START_PERIODIC_NOTIFICATIONS',
        data: { tasks }
      });
    }

    // Start new interval for when app is active
    intervalRef.current = setInterval(() => {
      sendPeriodicNotification(tasks);
    }, 2 * 60 * 60 * 1000); // 2 hours

    // Send first notification after 5 seconds
    setTimeout(() => {
      sendPeriodicNotification(tasks);
    }, 5000);

    // Store notification preferences in localStorage
    localStorage.setItem('periodicNotificationsEnabled', 'true');
    localStorage.setItem('lastTasksData', JSON.stringify(tasks));
  }, [sendPeriodicNotification, registerServiceWorker]);

  const stopPeriodicNotifications = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Send message to service worker to stop background notifications
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STOP_PERIODIC_NOTIFICATIONS'
      });
    }
    
    // Remove notification preferences from localStorage
    localStorage.removeItem('periodicNotificationsEnabled');
    localStorage.removeItem('lastTasksData');
  }, []);

  const updateTasksInServiceWorker = useCallback(async (tasks: Task[]) => {
    // Update tasks data in service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_TASKS_DATA',
        data: { tasks }
      });
    }
    
    // Update localStorage
    localStorage.setItem('lastTasksData', JSON.stringify(tasks));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaNotificationRef.current) {
        mediaNotificationRef.current.close();
      }
    };
  }, []);

  return {
    requestPermissions,
    sendPeriodicNotification,
    showMediaControlNotification,
    hideMediaControlNotification,
    startPeriodicNotifications,
    stopPeriodicNotifications,
    generateNotificationContent,
    isNotificationSupported,
    getPermissionStatus,
    registerServiceWorker,
    updateTasksInServiceWorker,
  };
};