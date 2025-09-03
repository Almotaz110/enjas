import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Moon, 
  Sun, 
  Languages, 
  Volume2, 
  RefreshCcw,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingsPanelProps {
  onResetStats: () => void;
}

export const SettingsPanel = ({ onResetStats }: SettingsPanelProps) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  
  const { playSound } = useSoundEffects();
  const { requestPermissions, scheduleDailyReminder } = useNotifications();

  const handleResetStats = () => {
    onResetStats();
    toast.success(language === 'ar' ? 'تم إعادة ضبط الإحصائيات بنجاح!' : 'Statistics reset successfully!');
    playSound('notification');
  };

  const handleTestSound = () => {
    playSound('success');
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermissions();
    if (granted) {
      await scheduleDailyReminder();
      toast.success(language === 'ar' ? 'تم تفعيل الإشعارات' : 'Notifications enabled');
    } else {
      toast.error(language === 'ar' ? 'تم رفض إذن الإشعارات' : 'Notification permission denied');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <Label htmlFor="theme-toggle">{language === 'ar' ? 'الوضع الليلي' : 'Dark Mode'}</Label>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>

          {/* Language Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              <Label htmlFor="language-toggle">{language === 'ar' ? 'اللغة' : 'Language'}</Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="min-w-[60px]"
            >
              {language === 'ar' ? 'EN' : 'عر'}
            </Button>
          </div>

          {/* Sound Test */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <Label>{language === 'ar' ? 'اختبار المؤثرات الصوتية' : 'Test Sound Effects'}</Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestSound}
            >
              🔊 {language === 'ar' ? 'اختبار' : 'Test'}
            </Button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <Label>{language === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}</Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableNotifications}
            >
              🔔 {language === 'ar' ? 'تفعيل' : 'Enable'}
            </Button>
          </div>

          {/* Reset Stats */}
          <div className="pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  size="sm"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'إعادة ضبط الإحصائيات' : 'Reset Statistics'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{language === 'ar' ? 'إعادة ضبط الإحصائيات' : 'Reset Statistics'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === 'ar' ? 'هل أنت متأكد من إعادة ضبط جميع الإحصائيات؟' : 'Are you sure you want to reset all statistics?'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetStats}>
                    {language === 'ar' ? 'تأكيد' : 'Confirm'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};