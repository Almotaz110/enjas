import React, { useState } from 'react';
import { Task } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Target, 
  Star, 
  Clock,
  TrendingUp,
  Award,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnhancedGamificationPanelProps {
  tasks: Task[];
  userStats: any;
  className?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  completed: boolean;
  category: 'productivity' | 'consistency' | 'speed' | 'quality';
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  reward: string;
  type: 'tasks' | 'streak' | 'points' | 'time';
}

export const EnhancedGamificationPanel: React.FC<EnhancedGamificationPanelProps> = ({
  tasks,
  userStats,
  className
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate current stats
  const completedTasks = tasks.filter(task => task.completed);
  const currentLevel = Math.floor((userStats?.experience || 0) / 100) + 1;
  const experienceInLevel = (userStats?.experience || 0) % 100;
  const currentStreak = userStats?.currentStreak || 0;
  const totalPoints = userStats?.totalPoints || 0;

  // Sample achievements
  const achievements: Achievement[] = [
    {
      id: 'first_steps',
      name: 'الخطوات الأولى',
      description: 'أكمل 10 مهام',
      icon: '🚀',
      progress: Math.min(completedTasks.length, 10),
      target: 10,
      completed: completedTasks.length >= 10,
      category: 'productivity'
    },
    {
      id: 'streak_master',
      name: 'سيد التتابع',
      description: 'حافظ على سلسلة 7 أيام',
      icon: '🔥',
      progress: Math.min(currentStreak, 7),
      target: 7,
      completed: currentStreak >= 7,
      category: 'consistency'
    },
    {
      id: 'speed_runner',
      name: 'عداء السرعة',
      description: 'أكمل 5 مهام في يوم واحد',
      icon: '⚡',
      progress: 0, // Would need daily completion tracking
      target: 5,
      completed: false,
      category: 'speed'
    },
    {
      id: 'perfectionist',
      name: 'المثالي',
      description: 'أكمل 50 مهمة صعبة',
      icon: '💎',
      progress: completedTasks.filter(t => t.difficulty === 'hard').length,
      target: 50,
      completed: completedTasks.filter(t => t.difficulty === 'hard').length >= 50,
      category: 'quality'
    }
  ];

  // Sample milestones
  const milestones: Milestone[] = [
    {
      id: 'task_milestone_100',
      title: 'مئوية المهام',
      description: 'أكمل 100 مهمة لفتح مكافآت خاصة',
      targetValue: 100,
      currentValue: completedTasks.length,
      reward: 'نقطة خبرة مضاعفة لمدة أسبوع',
      type: 'tasks'
    },
    {
      id: 'streak_milestone_30',
      title: 'المثابر الشهري',
      description: 'حافظ على سلسلة إنجاز لمدة 30 يوم',
      targetValue: 30,
      currentValue: currentStreak,
      reward: 'لقب "المثابر" + 500 نقطة مكافأة',
      type: 'streak'
    },
    {
      id: 'points_milestone_1000',
      title: 'جامع الألف نقطة',
      description: 'اجمع 1000 نقطة خبرة',
      targetValue: 1000,
      currentValue: totalPoints,
      reward: 'تخصيص شخصي للواجهة',
      type: 'points'
    }
  ];

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'productivity': return Zap;
      case 'consistency': return Calendar;
      case 'speed': return Clock;
      case 'quality': return Star;
      default: return Trophy;
    }
  };

  const getCategoryColor = (category: Achievement['category']) => {
    switch (category) {
      case 'productivity': return 'text-blue-500 bg-blue-500/10';
      case 'consistency': return 'text-green-500 bg-green-500/10';
      case 'speed': return 'text-yellow-500 bg-yellow-500/10';
      case 'quality': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          نظام التحفيز المتقدم
        </h2>
        <p className="text-muted-foreground">
          تتبع إنجازاتك واكسب المكافآت!
        </p>
      </div>

      {/* Level Progress Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Star className="h-6 w-6 text-primary" />
            المستوى {currentLevel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              الخبرة: {experienceInLevel} / 100
            </div>
            <Progress value={experienceInLevel} className="h-3" />
            <div className="text-xs text-muted-foreground">
              {100 - experienceInLevel} نقطة حتى المستوى التالي
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {completedTasks.length}
              </div>
              <div className="text-xs text-muted-foreground">
                مهام مكتملة
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {currentStreak}
              </div>
              <div className="text-xs text-muted-foreground">
                سلسلة الأيام
              </div>
            </div>
            <div className="text-2xl font-bold text-green-500 text-center">
              {totalPoints}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements" className="text-sm">
            <Trophy className="h-4 w-4 mr-2" />
            الإنجازات
          </TabsTrigger>
          <TabsTrigger value="milestones" className="text-sm">
            <Target className="h-4 w-4 mr-2" />
            المعالم
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            الإحصائيات
          </TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              الكل
            </Button>
            {['productivity', 'consistency', 'speed', 'quality'].map(category => {
              const IconComponent = getCategoryIcon(category as Achievement['category']);
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs"
                >
                  <IconComponent className="h-3 w-3 mr-1" />
                  {category === 'productivity' ? 'الإنتاجية' :
                   category === 'consistency' ? 'الثبات' :
                   category === 'speed' ? 'السرعة' : 'الجودة'}
                </Button>
              );
            })}
          </div>

          {/* Achievements Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredAchievements.map(achievement => {
              const IconComponent = getCategoryIcon(achievement.category);
              const progressPercent = (achievement.progress / achievement.target) * 100;

              return (
                <Card 
                  key={achievement.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    achievement.completed && "ring-2 ring-green-500/20 bg-green-500/5"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "text-2xl p-2 rounded-full",
                        achievement.completed ? "grayscale-0" : "grayscale opacity-60"
                      )}>
                        {achievement.icon}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">
                            {achievement.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            <IconComponent className="h-3 w-3 opacity-60" />
                            {achievement.completed && (
                              <Badge className="bg-green-500/10 text-green-600 text-xs">
                                مكتمل
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {achievement.description}
                        </p>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{achievement.progress} / {achievement.target}</span>
                            <span className={achievement.completed ? "text-green-600" : ""}>
                              {Math.round(progressPercent)}%
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <div className="grid gap-4">
            {milestones.map(milestone => {
              const progressPercent = (milestone.currentValue / milestone.targetValue) * 100;
              const isCompleted = milestone.currentValue >= milestone.targetValue;

              return (
                <Card 
                  key={milestone.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    isCompleted && "ring-2 ring-yellow-500/20 bg-yellow-500/5"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          {milestone.title}
                          {isCompleted && <Award className="h-5 w-5 text-yellow-500" />}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                      </div>
                      <Badge 
                        variant={isCompleted ? "default" : "outline"}
                        className={isCompleted ? "bg-yellow-500/10 text-yellow-600" : ""}
                      >
                        {milestone.currentValue} / {milestone.targetValue}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <Progress value={progressPercent} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>التقدم: {Math.round(progressPercent)}%</span>
                        <span>متبقي: {milestone.targetValue - milestone.currentValue}</span>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        المكافأة:
                      </div>
                      <div className="text-sm">
                        {milestone.reward}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">إحصائيات يومية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">مهام مكتملة اليوم</span>
                  <Badge variant="secondary">
                    {tasks.filter(t => t.completed && t.completedAt && 
                      new Date(t.completedAt).toDateString() === new Date().toDateString()
                    ).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">النقاط المكتسبة اليوم</span>
                  <Badge variant="secondary">+50</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">متوسط وقت الإنجاز</span>
                  <Badge variant="secondary">25 دقيقة</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Overall Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">إحصائيات عامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">إجمالي المهام</span>
                  <Badge variant="secondary">{tasks.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">معدل الإكمال</span>
                  <Badge variant="secondary">
                    {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">أطول سلسلة</span>
                  <Badge variant="secondary">{userStats?.longestStreak || 0} يوم</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};