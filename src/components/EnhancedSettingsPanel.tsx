import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationPanel } from '@/components/NotificationPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { Task } from '@/types/task';
import { Settings, Bell } from 'lucide-react';

interface EnhancedSettingsPanelProps {
  tasks: Task[];
  onResetStats: () => void;
  isTimerRunning?: boolean;
  isMusicPlaying?: boolean;
  onTimerControl?: (action: 'stop' | 'pause' | 'resume') => void;
  onMusicControl?: (action: 'stop' | 'pause' | 'play' | 'next' | 'restart') => void;
  currentTimerTitle?: string;
  currentMusicTitle?: string;
}

export const EnhancedSettingsPanel: React.FC<EnhancedSettingsPanelProps> = ({
  tasks,
  onResetStats,
  isTimerRunning,
  isMusicPlaying,
  onTimerControl,
  onMusicControl,
  currentTimerTitle,
  currentMusicTitle
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isArabic ? 'الإعدادات المتقدمة' : 'Advanced Settings'}
        </CardTitle>
        <CardDescription>
          {isArabic 
            ? 'إدارة إعدادات التطبيق والإشعارات'
            : 'Manage app settings and notifications'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {isArabic ? 'عام' : 'General'}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {isArabic ? 'الإشعارات' : 'Notifications'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6">
            <SettingsPanel onResetStats={onResetStats} />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <NotificationPanel
              tasks={tasks}
              isTimerRunning={isTimerRunning}
              isMusicPlaying={isMusicPlaying}
              onTimerControl={onTimerControl}
              onMusicControl={onMusicControl}
              currentTimerTitle={currentTimerTitle}
              currentMusicTitle={currentMusicTitle}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};