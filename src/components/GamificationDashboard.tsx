import React from 'react';
import { Task } from '@/types/task';
import { useGamification } from '@/hooks/useGamification';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { AchievementShowcase } from '@/components/ui/achievement-showcase';
import { GameEventsFeed } from '@/components/ui/game-events-feed';
import { ComboTracker } from '@/components/ui/combo-tracker';
import { NotificationCenter } from '@/components/ui/notification-center';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Trophy, Zap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GamificationDashboardProps {
  tasks: Task[];
  userStats: any;
  onTaskComplete?: (task: Task) => void;
  className?: string;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  tasks,
  userStats,
  onTaskComplete,
  className
}) => {
  const {
    recentEvents,
    comboTracker,
    achievements,
    handleTaskCompletion,
    clearEvents,
    getComboTimeRemaining
  } = useGamification(tasks, userStats);

  // For now, we'll use a simple state for notifications until we integrate the enhanced system
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const markAsRead = (id: string) => {};
  const markAllAsRead = () => {};
  const removeNotification = (id: string) => {};
  const notifyTaskCompletion = (task: Task) => {};

  // Enhanced task completion handler
  const handleEnhancedTaskCompletion = React.useCallback((task: Task) => {
    handleTaskCompletion(task);
    notifyTaskCompletion(task);
    onTaskComplete?.(task);
  }, [handleTaskCompletion, notifyTaskCompletion, onTaskComplete]);

  const completedTasksToday = tasks.filter(task => {
    if (!task.completed || !task.completedAt) return false;
    const today = new Date();
    const completedDate = new Date(task.completedAt);
    return completedDate.toDateString() === today.toDateString();
  }).length;

  const currentLevel = Math.floor(userStats?.experience / 100) + 1 || 1;
  const experienceInCurrentLevel = userStats?.experience % 100 || 0;
  const experienceNeeded = 100 - experienceInCurrentLevel;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Notifications */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            التحفيز والإنجازات
          </h2>
          <p className="text-muted-foreground">
            تتبع تقدمك وحافظ على حماسك!
          </p>
        </div>
        
        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onRemove={removeNotification}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {completedTasksToday}
            </div>
            <div className="text-xs text-muted-foreground">
              مهام اليوم
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {currentLevel}
            </div>
            <div className="text-xs text-muted-foreground">
              المستوى الحالي
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {userStats?.currentStreak || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              سلسلة الأيام
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {userStats?.totalPoints || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              إجمالي النقاط
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>تقدم المستوى</span>
            <Badge variant="secondary">
              المستوى {currentLevel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>الخبرة الحالية</span>
            <span>{experienceInCurrentLevel} / 100</span>
          </div>
          <Progress value={experienceInCurrentLevel} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            تحتاج {experienceNeeded} نقطة خبرة للمستوى التالي
          </p>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Events Feed */}
        <div className="lg:col-span-1">
          <GameEventsFeed
            events={recentEvents}
            onClearEvents={clearEvents}
            maxVisible={8}
          />
        </div>

        {/* Achievements */}
        <div className="lg:col-span-2">
          <AchievementShowcase achievements={achievements} />
        </div>
      </div>

      {/* Combo Tracker - Floating */}
      <ComboTracker
        combo={comboTracker}
        timeRemaining={getComboTimeRemaining()}
      />
    </div>
  );
};