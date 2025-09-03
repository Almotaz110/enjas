import { useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Task } from '@/types/task';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export const useNotifications = () => {
  const { t, language } = useLanguage();

  const requestPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      // Web notifications fallback
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }, []);

  const scheduleTaskReminder = useCallback(async (task: Task, reminderTime: Date) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      toast.error(language === 'ar' ? 'يرجى السماح بالإشعارات' : 'Please allow notifications');
      return;
    }

    try {
      if (!Capacitor.isNativePlatform()) {
        // Web notification fallback
        const timeUntilReminder = reminderTime.getTime() - Date.now();
        if (timeUntilReminder > 0) {
          setTimeout(() => {
            new Notification(
              language === 'ar' ? 'تذكير بالمهمة' : 'Task Reminder',
              {
                body: language === 'ar' 
                  ? `حان وقت المهمة: ${task.title}`
                  : `Time for task: ${task.title}`,
                icon: '/favicon.ico',
                badge: '/favicon.ico'
              }
            );
          }, timeUntilReminder);
        }
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: language === 'ar' ? 'تذكير بالمهمة ⏰' : 'Task Reminder ⏰',
            body: language === 'ar' 
              ? `حان وقت المهمة: ${task.title}`
              : `Time for task: ${task.title}`,
            id: parseInt(task.id.replace(/\D/g, '').slice(0, 8)) || Math.floor(Math.random() * 100000),
            schedule: { at: reminderTime },
            sound: undefined,
            attachments: undefined,
            actionTypeId: "",
            extra: {
              taskId: task.id,
              taskTitle: task.title
            }
          }
        ]
      });

      toast.success(
        language === 'ar' 
          ? 'تم جدولة التذكير بنجاح' 
          : 'Reminder scheduled successfully'
      );
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast.error(
        language === 'ar' 
          ? 'خطأ في جدولة التذكير' 
          : 'Error scheduling reminder'
      );
    }
  }, [language, requestPermissions]);

  const scheduleTaskDeadlineReminder = useCallback(async (task: Task) => {
    if (!task.deadline) return;

    const dueDate = new Date(task.deadline);
    const now = new Date();
    
    // Schedule reminder 1 hour before due date
    const reminderTime = new Date(dueDate.getTime() - 60 * 60 * 1000);
    
    if (reminderTime > now) {
      await scheduleTaskReminder(task, reminderTime);
    }

    // Schedule reminder at due date
    if (dueDate > now) {
      await scheduleTaskReminder(task, dueDate);
    }
  }, [scheduleTaskReminder]);

  const cancelTaskReminders = useCallback(async (taskId: string) => {
    if (!Capacitor.isNativePlatform()) {
      return; // Can't cancel web notifications easily
    }

    try {
      const notificationId = parseInt(taskId.replace(/\D/g, '').slice(0, 8)) || Math.floor(Math.random() * 100000);
      await LocalNotifications.cancel({
        notifications: [{ id: notificationId }]
      });
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }, []);

  const scheduleDailyReminder = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM reminder

      if (!Capacitor.isNativePlatform()) {
        // Web notification fallback
        const timeUntilReminder = tomorrow.getTime() - Date.now();
        setTimeout(() => {
          new Notification(
            language === 'ar' ? 'تذكير يومي' : 'Daily Reminder',
            {
              body: language === 'ar' 
                ? 'لا تنس مراجعة مهامك اليوم!' 
                : "Don't forget to check your tasks today!",
              icon: '/favicon.ico'
            }
          );
        }, timeUntilReminder);
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: language === 'ar' ? 'تذكير يومي 📅' : 'Daily Reminder 📅',
            body: language === 'ar' 
              ? 'لا تنس مراجعة مهامك اليوم!' 
              : "Don't forget to check your tasks today!",
            id: 999999,
            schedule: { at: tomorrow, repeats: true },
            sound: undefined,
            attachments: undefined,
            actionTypeId: "",
            extra: null
          }
        ]
      });

      toast.success(
        language === 'ar' 
          ? 'تم تفعيل التذكير اليومي' 
          : 'Daily reminder activated'
      );
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }, [language, requestPermissions]);

  return {
    requestPermissions,
    scheduleTaskReminder,
    scheduleTaskDeadlineReminder,
    cancelTaskReminders,
    scheduleDailyReminder
  };
};