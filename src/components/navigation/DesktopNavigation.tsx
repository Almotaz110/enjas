import React from 'react';
import { LayoutDashboard, Calendar, BookOpen, Timer, Music, Gift, ListTodo } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigation, TabValue } from './NavigationContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavigationItem {
  id: TabValue;
  icon: React.ComponentType<{ className?: string }>;
  label: { ar: string; en: string };
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: { ar: 'لوحة التحكم', en: 'Dashboard' }
  },
  {
    id: 'tasks',
    icon: ListTodo,
    label: { ar: 'المهام', en: 'Tasks' }
  },
  {
    id: 'calendar',
    icon: Calendar,
    label: { ar: 'التقويم', en: 'Calendar' }
  },
  {
    id: 'rewards',
    icon: Gift,
    label: { ar: 'المكافآت', en: 'Rewards' }
  },
  {
    id: 'study',
    icon: BookOpen,
    label: { ar: 'المواد الدراسية', en: 'Study Materials' }
  },
  {
    id: 'pomodoro',
    icon: Timer,
    label: { ar: 'مؤقت بومودورو', en: 'Pomodoro' }
  },
  {
    id: 'music',
    icon: Music,
    label: { ar: 'الموسيقى', en: 'Music' }
  }
];

export const DesktopNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useNavigation();
  const { language } = useLanguage();

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
      <TabsList className="grid w-full grid-cols-7 max-w-4xl mx-auto">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <TabsTrigger 
              key={item.id} 
              value={item.id} 
              className="flex items-center gap-2 px-2 sm:px-4"
            >
              <IconComponent className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'ar' ? item.label.ar : item.label.en}
              </span>
              <span className="sm:hidden text-xs">
                {language === 'ar' ? item.label.ar.split(' ')[0] : item.label.en.split(' ')[0]}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
};