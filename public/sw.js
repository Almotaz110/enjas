const CACHE_NAME = 'task-quest-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// Periodic notification timer
let periodicNotificationTimer = null;
let isPeriodicNotificationsEnabled = false;
let lastTasksData = [];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Handle offline functionality
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Check if periodic notifications should be restored
  self.clients.matchAll().then(clients => {
    if (clients.length === 0) {
      // App is closed, check localStorage for notification preferences
      const notificationsEnabled = self.localStorage?.getItem('periodicNotificationsEnabled');
      const tasksData = self.localStorage?.getItem('lastTasksData');
      
      if (notificationsEnabled === 'true') {
        startBackgroundNotifications(tasksData ? JSON.parse(tasksData) : []);
      }
    }
  });
});

// Handle messages from main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'START_PERIODIC_NOTIFICATIONS':
      isPeriodicNotificationsEnabled = true;
      lastTasksData = data.tasks || [];
      startBackgroundNotifications(lastTasksData);
      break;
      
    case 'STOP_PERIODIC_NOTIFICATIONS':
      isPeriodicNotificationsEnabled = false;
      stopBackgroundNotifications();
      break;
      
    case 'UPDATE_TASKS_DATA':
      lastTasksData = data.tasks || [];
      break;
  }
});

// Background notification functions
function startBackgroundNotifications(tasks = []) {
  if (periodicNotificationTimer) {
    clearInterval(periodicNotificationTimer);
  }
  
  periodicNotificationTimer = setInterval(() => {
    if (isPeriodicNotificationsEnabled) {
      sendBackgroundNotification(tasks);
    }
  }, 2 * 60 * 60 * 1000); // 2 hours
  
  // Send first notification after 5 seconds
  setTimeout(() => {
    if (isPeriodicNotificationsEnabled) {
      sendBackgroundNotification(tasks);
    }
  }, 5000);
}

function stopBackgroundNotifications() {
  if (periodicNotificationTimer) {
    clearInterval(periodicNotificationTimer);
    periodicNotificationTimer = null;
  }
}

function sendBackgroundNotification(tasks = []) {
  const types = ['motivational', 'stats', 'reminders'];
  const currentHour = new Date().getHours();
  const typeIndex = Math.floor(currentHour / 2) % types.length;
  const notificationType = types[typeIndex];

  const { title, body } = generateNotificationContent(notificationType, tasks);

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'periodic-notification-bg',
    requireInteraction: false,
    silent: false,
    data: {
      type: 'periodic',
      notificationType
    }
  });
}

function generateNotificationContent(type, tasks = []) {
  const isArabic = self.navigator.language?.includes('ar') || false;
  
  switch (type) {
    case 'motivational':
      return {
        title: isArabic ? '💡 عبارة تحفيزية' : '💡 Motivational Quote',
        body: isArabic ? 'استمر في العمل الجيد!' : 'Keep up the great work!'
      };
      
    case 'stats':
      const completed = tasks.filter(task => task.completed).length;
      const remaining = tasks.length - completed;
      const urgent = tasks.filter(task => task.priority === 'urgent' && !task.completed).length;
      
      return {
        title: isArabic ? '📊 إحصائيات المهام' : '📊 Task Statistics',
        body: isArabic 
          ? `مكتملة: ${completed} | متبقية: ${remaining} | عاجلة: ${urgent}`
          : `Completed: ${completed} | Remaining: ${remaining} | Urgent: ${urgent}`
      };
      
    case 'reminders':
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const upcoming = tasks.filter(task => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        return deadline >= today && deadline <= tomorrow && !task.completed;
      });
      
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
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Focus or open app window
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Check if app is already open
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      // Open new window if app is not open
      return self.clients.openWindow('/');
    })
  );
});