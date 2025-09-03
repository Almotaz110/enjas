import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export const useMobileCapabilities = () => {
  const isNative = Capacitor.isNativePlatform()
  const platform = Capacitor.getPlatform()

  useEffect(() => {
    if (isNative) {
      // Request notification permissions on mobile
      initializeNotifications()
    }
  }, [isNative])

  const initializeNotifications = async () => {
    try {
      const permission = await LocalNotifications.requestPermissions()
      if (permission.display === 'granted') {
        console.log('Notifications permission granted')
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
  }

  const scheduleNotification = async (title: string, body: string, delay: number = 0) => {
    if (!isNative) {
      // Fallback for web - show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body })
      }
      return
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: delay > 0 ? { at: new Date(Date.now() + delay) } : undefined,
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: {}
          }
        ]
      })
    } catch (error) {
      console.error('Error scheduling notification:', error)
    }
  }

  const checkPlatformFeatures = () => {
    return {
      isNative,
      platform,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web',
      hasNotifications: isNative || ('Notification' in window)
    }
  }

  return {
    isNative,
    platform,
    scheduleNotification,
    checkPlatformFeatures
  }
}