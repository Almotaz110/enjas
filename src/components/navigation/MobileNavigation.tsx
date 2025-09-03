import React from 'react';
import { LayoutDashboard, Calendar, BookOpen, Timer, Music, Gift, ListTodo } from 'lucide-react';
import { useNavigation, TabValue } from './NavigationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: TabValue;
  icon: React.ComponentType<{ className?: string }>;
  label: { ar: string; en: string };
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: { ar: 'الرئيسية', en: 'Home' }
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
    id: 'study',
    icon: BookOpen,
    label: { ar: 'المواد', en: 'Study' }
  },
  {
    id: 'pomodoro',
    icon: Timer,
    label: { ar: 'المؤقت', en: 'Timer' }
  }
];

const secondaryItems: NavigationItem[] = [
  {
    id: 'rewards',
    icon: Gift,
    label: { ar: 'المكافآت', en: 'Rewards' }
  },
  {
    id: 'music',
    icon: Music,
    label: { ar: 'الموسيقى', en: 'Music' }
  }
];

export const MobileNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useNavigation();
  const { language } = useLanguage();

  const NavButton = ({ item }: { item: NavigationItem }) => {
    const IconComponent = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        onClick={() => setActiveTab(item.id)}
        className={cn(
          "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 min-w-0",
          isActive
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <IconComponent className={cn("h-5 w-5 mb-1", isActive && "scale-110")} />
        <span className="text-xs font-medium truncate max-w-full">
          {language === 'ar' ? item.label.ar : item.label.en}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50">
        <div className="grid grid-cols-5 gap-1 px-2 py-2 pb-6 sm:pb-2">
          {navigationItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Top Secondary Navigation */}
      <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border z-40">
        <div className="flex justify-center items-center px-4 py-3 pt-6 sm:pt-3">
          <div className="flex gap-6">
            {secondaryItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <IconComponent className={cn("h-4 w-4", isActive && "scale-110")} />
                  <span className="text-sm font-medium">
                    {language === 'ar' ? item.label.ar : item.label.en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content spacer */}
      <div className="h-16 w-full" /> {/* Top spacer */}
      <div className="h-20 w-full" /> {/* Bottom spacer - will be placed at the end of content */}
    </>
  );
};