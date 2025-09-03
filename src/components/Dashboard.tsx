import React from 'react';
import { Task, UserStats } from '@/types/task';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle, Clock, Calendar, TrendingUp, Star, Zap, Quote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMotivationalQuotes } from '@/hooks/useMotivationalQuotes';

interface DashboardProps {
  tasks: Task[];
  stats: UserStats;
}

export const Dashboard = ({ tasks, stats }: DashboardProps) => {
  const { t } = useLanguage();
  const { currentQuote } = useMotivationalQuotes();
  const totalPoints = tasks.filter(task => task.completed).reduce((sum, task) => sum + task.points, 0);

  // Calculate dashboard statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime() || task.category === 'daily';
  });
  
  const completedToday = todayTasks.filter(task => task.completed).length;
  const urgentTasks = tasks.filter(task => task.priority === 'urgent' && !task.completed).length;
  const overdueTasks = tasks.filter(task => 
    task.deadline && 
    new Date(task.deadline) < new Date() && 
    !task.completed
  ).length;
  
  const completionRate = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;
  
  // Prepare chart data
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = date.toLocaleDateString('ar', { weekday: 'short' });
    
    const dayTasks = tasks.filter(task => {
      const taskDate = new Date(task.completedAt || task.createdAt);
      return taskDate.toDateString() === date.toDateString() && task.completed;
    });
    
    weeklyData.push({
      day: dayName,
      completed: dayTasks.length,
      points: dayTasks.reduce((sum, task) => sum + task.points, 0)
    });
  }
  
  const categoryData = [
    { name: t('personalCat') as string, value: tasks.filter(t => t.category === 'personal').length, color: '#4ECDC4' },
    { name: t('studyCat') as string, value: tasks.filter(t => t.category === 'study').length, color: '#45B7D1' },
    { name: t('dailyCat') as string, value: tasks.filter(t => t.category === 'daily').length, color: '#96CEB4' },
    { name: t('otherCat') as string, value: tasks.filter(t => ['weekly', 'monthly', 'custom'].includes(t.category)).length, color: '#FFEAA7' }
  ];

  const chartConfig = {
    completed: { label: t('completed') as string, color: 'hsl(var(--primary))' },
    points: { label: t('pointsEarned') as string, color: 'hsl(var(--secondary))' }
  };

  return (
    <div className="space-y-6">
      {/* Motivational Quote Section */}
      <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Quote className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('motivation') as string}</h3>
            </div>
            {currentQuote && currentQuote.text ? (
              <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                <p className="text-foreground text-base leading-relaxed font-medium">
                  "{currentQuote.text}"
                </p>
                {currentQuote.source && (
                  <div className="text-sm text-muted-foreground mt-2 text-center">
                    — {currentQuote.source}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                <p className="text-foreground text-base leading-relaxed font-medium text-center text-muted-foreground">
                  {t('motivationText') as string}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">نسبة الإنجاز اليوم</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{completionRate.toFixed(0)}%</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {completedToday} من {todayTasks.length} مهام
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">مهام عاجلة</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-destructive">{urgentTasks}</div>
            <p className="text-xs text-muted-foreground text-right">تحتاج انتباه فوري ⚠️</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">المستوى الحالي</CardTitle>
            <Star className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{stats.level}</div>
            <div className="text-xs text-muted-foreground text-right">
              {stats.experience} / {stats.experienceToNextLevel} XP
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">النقاط الإجمالية</CardTitle>
            <Zap className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{totalPoints}</div>
            <p className="text-xs text-muted-foreground text-right">نقاط مكتسبة ⚡</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-right flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              التقدم الأسبوعي
            </CardTitle>
            <CardDescription className="text-right text-sm">
              عدد المهام المكتملة والنقاط المكتسبة خلال الأسبوع
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] md:h-[300px]">
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="completed" 
                  fill="var(--color-completed)" 
                  radius={[2, 2, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-right flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              توزيع المهام حسب التصنيف
            </CardTitle>
            <CardDescription className="text-right text-sm">
              نسبة المهام في كل تصنيف
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] md:h-[300px]">
              <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                  className="sm:!w-[80px] sm:!h-[80px] md:!w-[100px] md:!h-[100px]"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 sm:gap-4 mt-4">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center gap-1 sm:gap-2">
                  <div 
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs sm:text-sm truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">مهام متأخرة</p>
                <p className="text-2xl font-bold text-destructive">{overdueTasks}</p>
              </div>
              <Calendar className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">سلسلة الإنجاز</p>
                <p className="text-2xl font-bold text-primary">{stats.streak} يوم</p>
              </div>
              <div className="text-2xl">🔥</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">إجمالي المهام</p>
                <p className="text-2xl font-bold text-primary">{stats.totalTasksCompleted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};