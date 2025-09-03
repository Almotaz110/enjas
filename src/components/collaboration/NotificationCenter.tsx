import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Check, X, ExternalLink } from "lucide-react";
import { UserNotification } from "@/hooks/useCollaboration";

interface NotificationCenterProps {
  notifications: UserNotification[];
  onLoadNotifications: () => Promise<UserNotification[]>;
  onMarkAsRead: (notificationId: string) => Promise<void>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications: initialNotifications,
  onLoadNotifications,
  onMarkAsRead
}) => {
  const [notifications, setNotifications] = useState<UserNotification[]>(initialNotifications);

  useEffect(() => {
    const loadNotifications = async () => {
      const loadedNotifications = await onLoadNotifications();
      setNotifications(loadedNotifications);
    };
    loadNotifications();
  }, [onLoadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await onMarkAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assignment':
        return '📋';
      case 'comment':
        return '💬';
      case 'invitation_sent':
        return '📧';
      case 'member_joined':
        return '👥';
      default:
        return '🔔';
    }
  };

  const getNotificationVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'task_assignment':
        return 'default';
      case 'comment':
        return 'secondary';
      case 'invitation_sent':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            الإشعارات
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 border rounded-lg transition-colors ${
                notification.is_read ? 'bg-background' : 'bg-muted/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <Badge variant={getNotificationVariant(notification.type)} className="text-xs">
                      {notification.type}
                    </Badge>
                    {notification.workspace_name && (
                      <span className="text-xs text-muted-foreground">
                        في {notification.workspace_name}
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString('ar-SA')}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {notification.action_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          asChild
                        >
                          <a href={notification.action_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            عرض
                          </a>
                        </Button>
                      )}
                      
                      {!notification.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          قرأت
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {notifications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد إشعارات</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};