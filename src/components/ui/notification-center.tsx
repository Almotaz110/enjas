import React, { useState } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRemove: (id: string) => void;
  className?: string;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'info':
      return Info;
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return XCircle;
    default:
      return Info;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'info':
      return 'text-blue-500';
    case 'success':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemove,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} يوم`;
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-80 max-h-96 z-50 shadow-lg border-border/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">الإشعارات</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    قراءة الكل
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد إشعارات
                </p>
              ) : (
                notifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        !notification.read 
                          ? "bg-primary/5 border-primary/20" 
                          : "bg-muted/30 border-border/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent 
                          className={cn(
                            "h-4 w-4 mt-0.5 flex-shrink-0",
                            getNotificationColor(notification.type)
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            "text-sm font-medium",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(notification.timestamp)}
                            </span>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onMarkAsRead(notification.id)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemove(notification.id)}
                                className="h-6 px-2 text-xs hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};