import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { Task } from '@/types/task';
import { Bell, BellOff, Settings, RefreshCw, AlertTriangle, Info, X, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  tasks: Task[];
  isTimerRunning?: boolean;
  isMusicPlaying?: boolean;
  onTimerControl?: (action: 'stop' | 'pause' | 'resume') => void;
  onMusicControl?: (action: 'stop' | 'pause' | 'play' | 'next' | 'restart') => void;
  currentTimerTitle?: string;
  currentMusicTitle?: string;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  tasks,
  isTimerRunning = false,
  isMusicPlaying = false,
  onTimerControl,
  onMusicControl,
  currentTimerTitle = '',
  currentMusicTitle = ''
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const {
    requestPermissions,
    sendPeriodicNotification,
    showMediaControlNotification,
    hideMediaControlNotification,
    startPeriodicNotifications,
    stopPeriodicNotifications,
    generateNotificationContent,
    isNotificationSupported,
    getPermissionStatus
  } = useEnhancedNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [periodicEnabled, setPeriodicEnabled] = useState(false);
  const [mediaControlsEnabled, setMediaControlsEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check permissions on mount and setup interval for checking
  useEffect(() => {
    const checkPermissions = () => {
      if (isNotificationSupported()) {
        const currentPermission = getPermissionStatus();
        setPermissionGranted(currentPermission === 'granted');
        setPermissionDenied(currentPermission === 'denied');
        
        // Load saved settings only if permission is granted
        if (currentPermission === 'granted') {
          const savedSettings = localStorage.getItem('notificationSettings');
          if (savedSettings) {
            try {
              const settings = JSON.parse(savedSettings);
              setNotificationsEnabled(settings.notificationsEnabled || false);
              setPeriodicEnabled(settings.periodicEnabled || false);
              setMediaControlsEnabled(settings.mediaControlsEnabled || false);
            } catch (error) {
              console.error('Error loading notification settings:', error);
            }
          }
        } else if (currentPermission === 'denied') {
          // Reset all notification settings if permission is denied
          setNotificationsEnabled(false);
          setPeriodicEnabled(false);
          setMediaControlsEnabled(false);
          stopPeriodicNotifications();
          hideMediaControlNotification();
        }
      } else {
        // Notifications not supported
        setPermissionGranted(false);
        setPermissionDenied(false);
        setNotificationsEnabled(false);
        setPeriodicEnabled(false);
        setMediaControlsEnabled(false);
      }
    };
    
    checkPermissions();
    
    // Check permission status every 5 seconds to detect manual changes
    const interval = setInterval(checkPermissions, 5000);
    
    return () => clearInterval(interval);
  }, [isNotificationSupported, getPermissionStatus, stopPeriodicNotifications, hideMediaControlNotification]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (permissionGranted) {
      const settings = {
        notificationsEnabled,
        periodicEnabled,
        mediaControlsEnabled
      };
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
    }
  }, [notificationsEnabled, periodicEnabled, mediaControlsEnabled, permissionGranted]);

  // Handle media control notifications
  useEffect(() => {
    if (!mediaControlsEnabled || !permissionGranted) {
      hideMediaControlNotification();
      return;
    }

    if (isTimerRunning && onTimerControl) {
      showMediaControlNotification({
        type: 'timer',
        title: currentTimerTitle || (isArabic ? 'المؤقت' : 'Timer'),
        actions: [
          {
            id: 'pause',
            title: isArabic ? 'إيقاف مؤقت' : 'Pause',
            action: () => onTimerControl('pause')
          },
          {
            id: 'stop',
            title: isArabic ? 'إيقاف' : 'Stop',
            action: () => onTimerControl('stop')
          },
          {
            id: 'restart',
            title: isArabic ? 'إعادة تشغيل' : 'Restart',
            action: () => onTimerControl('stop') // Restart by stopping
          }
        ]
      });
    } else if (isMusicPlaying && onMusicControl) {
      showMediaControlNotification({
        type: 'music',
        title: currentMusicTitle || (isArabic ? 'الموسيقى' : 'Music'),
        actions: [
          {
            id: 'pause',
            title: isArabic ? 'إيقاف مؤقت' : 'Pause',
            action: () => onMusicControl('pause')
          },
          {
            id: 'next',
            title: isArabic ? 'التالي' : 'Next',
            action: () => onMusicControl('next')
          },
          {
            id: 'stop',
            title: isArabic ? 'إيقاف' : 'Stop',
            action: () => onMusicControl('stop')
          }
        ]
      });
    } else {
      hideMediaControlNotification();
    }
  }, [
    isTimerRunning,
    isMusicPlaying,
    mediaControlsEnabled,
    permissionGranted,
    currentTimerTitle,
    currentMusicTitle,
    isArabic,
    onTimerControl,
    onMusicControl,
    showMediaControlNotification,
    hideMediaControlNotification
  ]);

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    setPermissionGranted(granted);
    setPermissionDenied(!granted);
    
    if (granted) {
      setNotificationsEnabled(true);
      toast.success(
        isArabic ? 'تم منح إذن الإشعارات بنجاح' : 'Notification permissions granted successfully'
      );
    } else {
      toast.error(
        isArabic ? 'تم رفض إذن الإشعارات' : 'Notification permissions denied'
      );
    }
  };

  const handleDisableNotifications = () => {
    setShowInstructions(true);
  };

  const handleResetSettings = () => {
    setPeriodicEnabled(false);
    setMediaControlsEnabled(false);
    stopPeriodicNotifications();
    hideMediaControlNotification();
    localStorage.removeItem('notificationSettings');
    toast.success(
      isArabic ? 'تم إعادة تعيين إعدادات الإشعارات' : 'Notification settings reset'
    );
  };

  const handlePeriodicToggle = (enabled: boolean) => {
    setPeriodicEnabled(enabled);
    
    if (enabled && permissionGranted) {
      startPeriodicNotifications(tasks);
    } else {
      stopPeriodicNotifications();
    }
  };

  const handleTestNotification = async (type: 'motivational' | 'stats' | 'reminders') => {
    if (!permissionGranted) {
      toast.error(isArabic ? 'يرجى السماح بالإشعارات أولاً' : 'Please enable notifications first');
      return;
    }
    
    await sendPeriodicNotification(tasks);
  };

  const getNotificationTypeTitle = (type: 'motivational' | 'stats' | 'reminders') => {
    if (isArabic) {
      switch (type) {
        case 'motivational': return 'عبارة تحفيزية';
        case 'stats': return 'إحصائيات المهام';
        case 'reminders': return 'تذكير بالمهام';
      }
    } else {
      switch (type) {
        case 'motivational': return 'Motivational Quote';
        case 'stats': return 'Task Statistics';
        case 'reminders': return 'Task Reminders';
      }
    }
  };

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsCollapsed(!isCollapsed)}>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {isArabic ? 'نظام الإشعارات المتكامل' : 'Enhanced Notification System'}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
          >
            {isCollapsed ? 
              <ChevronDown className="h-4 w-4 transition-transform" /> : 
              <ChevronUp className="h-4 w-4 transition-transform" />
            }
          </Button>
        </CardTitle>
        <CardDescription>
          {isArabic 
            ? 'إدارة الإشعارات الدورية وإشعارات التحكم بالوسائط'
            : 'Manage periodic notifications and media control notifications'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent 
        className={cn(
          "space-y-6 overflow-hidden transition-all duration-300 ease-in-out",
          isCollapsed ? "max-h-0 opacity-0 py-0" : "max-h-[2000px] opacity-100 py-6"
        )}
      >
        {/* Notification Support Check */}
        <div className={cn("animate-slide-down", isCollapsed && "animate-slide-up")}>
          {!isNotificationSupported() && (
            <Alert variant="destructive" className="animate-fade-in">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isArabic 
                  ? 'الإشعارات غير مدعومة في هذا المتصفح' 
                  : 'Notifications are not supported in this browser'
                }
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Permission Status */}
        {isNotificationSupported() && (
          <div className={cn("space-y-4 animate-slide-down", isCollapsed && "animate-slide-up")}>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <div className="flex items-center gap-2">
                {permissionGranted ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 text-destructive" />
                )}
                <span className="font-medium">
                  {isArabic ? 'حالة إذن الإشعارات' : 'Notification Permission Status'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={permissionGranted ? "default" : "destructive"} className="animate-scale-in">
                  {permissionGranted 
                    ? (isArabic ? 'مُفعّل' : 'Granted') 
                    : permissionDenied
                      ? (isArabic ? 'مُرفوض' : 'Denied')
                      : (isArabic ? 'غير مُحدد' : 'Not Set')
                  }
                </Badge>
                {!permissionGranted && !permissionDenied && (
                  <Button onClick={handleRequestPermissions} size="sm" className="hover-scale">
                    {isArabic ? 'طلب الإذن' : 'Request Permission'}
                  </Button>
                )}
                {permissionGranted && (
                  <Button onClick={handleDisableNotifications} variant="outline" size="sm" className="hover-scale">
                    <Settings className="h-3 w-3 mr-1" />
                    {isArabic ? 'إلغاء الإذن' : 'Revoke Permission'}
                  </Button>
                )}
                {(permissionGranted || permissionDenied) && (
                  <Button onClick={handleResetSettings} variant="outline" size="sm" className="hover-scale">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {isArabic ? 'إعادة تعيين' : 'Reset'}
                  </Button>
                )}
              </div>
            </div>

            {/* Permission Denied Alert */}
            {permissionDenied && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {isArabic 
                    ? 'تم رفض إذن الإشعارات. يرجى تفعيله من إعدادات المتصفح (🔒 أيقونة القفل في شريط العنوان)'
                    : 'Notification permission was denied. Please enable it in browser settings (🔒 lock icon in address bar)'
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Instructions Modal/Alert */}
            {showInstructions && (
              <Alert className="animate-slide-down">
                <Info className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {isArabic ? 'كيفية إلغاء إذن الإشعارات:' : 'How to revoke notification permissions:'}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowInstructions(false)}
                      className="h-6 w-6 p-0 hover-scale"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      {isArabic 
                        ? '1. انقر على أيقونة القفل 🔒 في شريط العنوان'
                        : '1. Click the lock icon 🔒 in the address bar'
                      }
                    </p>
                    <p>
                      {isArabic 
                        ? '2. اختر "الإشعارات" وغيّر الإعداد إلى "حظر"'
                        : '2. Find "Notifications" and change to "Block"'
                      }
                    </p>
                    <p>
                      {isArabic 
                        ? '3. أعد تحميل الصفحة'
                        : '3. Refresh the page'
                      }
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Periodic Notifications */}
        <div className={cn("space-y-4 animate-slide-down", isCollapsed && "animate-slide-up")}>
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors">
            <div>
              <Label htmlFor="periodic-notifications" className="text-base font-medium">
                {isArabic ? 'الإشعارات الدورية (كل ساعتين)' : 'Periodic Notifications (Every 2 hours)'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'إشعارات تحفيزية وإحصائيات وتذكيرات'
                  : 'Motivational quotes, statistics, and reminders'
                }
              </p>
            </div>
            <Switch
              id="periodic-notifications"
              checked={periodicEnabled}
              onCheckedChange={handlePeriodicToggle}
              disabled={!permissionGranted}
              className="hover-scale"
            />
          </div>

          {/* Test Notifications */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {(['motivational', 'stats', 'reminders'] as const).map((type, index) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => handleTestNotification(type)}
                disabled={!permissionGranted}
                className={cn(
                  "justify-start hover-scale animate-fade-in",
                  `animation-delay-${index * 100}`
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {getNotificationTypeTitle(type)}
              </Button>
            ))}
          </div>
        </div>

        {/* Media Control Notifications */}
        <div className={cn("space-y-4 animate-slide-down", isCollapsed && "animate-slide-up")}>
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors">
            <div>
              <Label htmlFor="media-controls" className="text-base font-medium">
                {isArabic ? 'إشعارات التحكم بالوسائط' : 'Media Control Notifications'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'التحكم بالمؤقت والموسيقى من الإشعارات'
                  : 'Control timer and music from notifications'
                }
              </p>
            </div>
            <Switch
              id="media-controls"
              checked={mediaControlsEnabled}
              onCheckedChange={setMediaControlsEnabled}
              disabled={!permissionGranted}
              className="hover-scale"
            />
          </div>

          {/* Media Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors animate-scale-in">
              <div className={`h-2 w-2 rounded-full transition-colors ${isTimerRunning ? 'bg-primary' : 'bg-muted-foreground'}`} />
              <span className="text-sm">
                {isArabic ? 'المؤقت:' : 'Timer:'} {isTimerRunning ? (isArabic ? 'قيد التشغيل' : 'Running') : (isArabic ? 'متوقف' : 'Stopped')}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className={`h-2 w-2 rounded-full transition-colors ${isMusicPlaying ? 'bg-secondary' : 'bg-muted-foreground'}`} />
              <span className="text-sm">
                {isArabic ? 'الموسيقى:' : 'Music:'} {isMusicPlaying ? (isArabic ? 'قيد التشغيل' : 'Playing') : (isArabic ? 'متوقفة' : 'Paused')}
              </span>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className={cn("p-4 bg-accent/50 rounded-lg border animate-slide-down", isCollapsed && "animate-slide-up")}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">
              {isArabic ? 'ملخص الحالة الحالية' : 'Current Status Summary'}
            </h4>
            <Badge variant="outline" className="text-xs animate-scale-in">
              {permissionGranted 
                ? (isArabic ? 'جاهز' : 'Ready') 
                : (isArabic ? 'غير جاهز' : 'Not Ready')
              }
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 animate-fade-in">
              <div className={`h-2 w-2 rounded-full transition-colors ${permissionGranted ? 'bg-primary' : 'bg-destructive'}`} />
              <span className="text-muted-foreground">
                {isArabic ? 'الإذن:' : 'Permission:'} 
                {permissionGranted ? (isArabic ? ' ممنوح' : ' Granted') : (isArabic ? ' مرفوض' : ' Denied')}
              </span>
            </div>
            <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className={`h-2 w-2 rounded-full transition-colors ${periodicEnabled ? 'bg-secondary' : 'bg-muted-foreground'}`} />
              <span className="text-muted-foreground">
                {isArabic ? 'إشعارات دورية:' : 'Periodic:'} 
                {periodicEnabled ? (isArabic ? ' نشطة' : ' Active') : (isArabic ? ' متوقفة' : ' Inactive')}
              </span>
            </div>
            <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className={`h-2 w-2 rounded-full transition-colors ${mediaControlsEnabled ? 'bg-accent' : 'bg-muted-foreground'}`} />
              <span className="text-muted-foreground">
                {isArabic ? 'تحكم وسائط:' : 'Media Controls:'} 
                {mediaControlsEnabled ? (isArabic ? ' مُفعّل' : ' Enabled') : (isArabic ? ' مُعطّل' : ' Disabled')}
              </span>
            </div>
          </div>
          
          {/* Additional Info */}
          {permissionGranted && (
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <p>
                {isArabic 
                  ? '💡 نصيحة: يتم فحص حالة الإذن تلقائياً كل 5 ثوانِ'
                  : '💡 Tip: Permission status is automatically checked every 5 seconds'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};