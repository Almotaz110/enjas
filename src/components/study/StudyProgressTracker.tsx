import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar as CalendarIcon,
  BookOpen,
  Award,
  Star,
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer,
  Brain,
  Zap,
  Trophy,
  CheckCircle,
  Circle,
  BarChart3
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface StudyGoal {
  id: string;
  title: string;
  description: string;
  targetHours: number;
  currentHours: number;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  category: string;
  completed: boolean;
  createdAt: Date;
}

interface StudyStreakData {
  currentStreak: number;
  longestStreak: number;
  studyDays: Date[];
  lastStudyDate?: Date;
}

interface FocusSession {
  id: string;
  materialId?: string;
  materialTitle: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  breakTime: number;
  completed: boolean;
  productivity: number; // 1-5 scale
  notes: string;
  mood: 'excellent' | 'good' | 'neutral' | 'poor';
}

interface WeeklyStats {
  totalStudyTime: number;
  completedSessions: number;
  averageProductivity: number;
  goalsCompleted: number;
  streakDays: number;
}

export const StudyProgressTracker: React.FC = () => {
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [streakData, setStreakData] = useState<StudyStreakData>({
    currentStreak: 0,
    longestStreak: 0,
    studyDays: []
  });
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalStudyTime: 0,
    completedSessions: 0,
    averageProductivity: 0,
    goalsCompleted: 0,
    streakDays: 0
  });

  // New goal form state
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetHours: 10,
    deadline: new Date(),
    priority: 'medium' as const,
    category: 'دراسة عامة'
  });

  // Timer effect for active sessions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSessionRunning && activeSession) {
      interval = setInterval(() => {
        if (isOnBreak) {
          setBreakTime(prev => prev + 1);
        } else {
          setSessionTime(prev => prev + 1);
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isSessionRunning, activeSession, isOnBreak]);

  // Calculate weekly stats
  useEffect(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 6 }); // Saturday start
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 6 });
    
    const thisWeekSessions = focusSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= weekStart && sessionDate <= weekEnd && session.completed;
    });

    const thisWeekGoals = goals.filter(goal => {
      return goal.completed && new Date(goal.createdAt) >= weekStart;
    });

    const totalTime = thisWeekSessions.reduce((acc, session) => acc + session.duration, 0);
    const avgProductivity = thisWeekSessions.length > 0 
      ? thisWeekSessions.reduce((acc, session) => acc + session.productivity, 0) / thisWeekSessions.length
      : 0;

    setWeeklyStats({
      totalStudyTime: totalTime,
      completedSessions: thisWeekSessions.length,
      averageProductivity: avgProductivity,
      goalsCompleted: thisWeekGoals.length,
      streakDays: streakData.currentStreak
    });
  }, [focusSessions, goals, streakData]);

  const startFocusSession = (materialTitle: string = 'جلسة دراسة عامة') => {
    const session: FocusSession = {
      id: uuidv4(),
      materialTitle,
      startTime: new Date(),
      duration: 0,
      breakTime: 0,
      completed: false,
      productivity: 3,
      notes: '',
      mood: 'neutral'
    };

    setActiveSession(session);
    setIsSessionRunning(true);
    setSessionTime(0);
    setBreakTime(0);
    setIsOnBreak(false);
    toast.success(`بدأت جلسة دراسة: ${materialTitle}`);
  };

  const pauseSession = () => {
    setIsSessionRunning(false);
    toast.info('تم إيقاف الجلسة مؤقتاً');
  };

  const resumeSession = () => {
    setIsSessionRunning(true);
    toast.info('تم استئناف الجلسة');
  };

  const takeBreak = () => {
    setIsOnBreak(true);
    toast.info('بدء فترة الراحة');
  };

  const endBreak = () => {
    setIsOnBreak(false);
    toast.info('انتهت فترة الراحة');
  };

  const endSession = (productivity: number, mood: FocusSession['mood'], notes: string) => {
    if (!activeSession) return;

    const completedSession: FocusSession = {
      ...activeSession,
      endTime: new Date(),
      duration: Math.floor(sessionTime / 60), // Convert to minutes
      breakTime: Math.floor(breakTime / 60),
      completed: true,
      productivity,
      mood,
      notes
    };

    setFocusSessions(prev => [...prev, completedSession]);
    setActiveSession(null);
    setIsSessionRunning(false);
    setSessionTime(0);
    setBreakTime(0);
    setIsOnBreak(false);

    // Update streak
    const today = new Date();
    const lastStudy = streakData.lastStudyDate;
    if (!lastStudy || !isSameDay(today, lastStudy)) {
      const newStudyDays = [...streakData.studyDays, today];
      const newStreak = !lastStudy || 
        (today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24) <= 1
        ? streakData.currentStreak + 1 
        : 1;

      setStreakData(prev => ({
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        studyDays: newStudyDays,
        lastStudyDate: today
      }));
    }

    toast.success(`تم إنهاء الجلسة! مدة الدراسة: ${Math.floor(sessionTime / 60)} دقيقة`);
  };

  const addGoal = () => {
    if (!newGoal.title.trim()) {
      toast.error('يرجى إدخال عنوان الهدف');
      return;
    }

    const goal: StudyGoal = {
      id: uuidv4(),
      ...newGoal,
      currentHours: 0,
      completed: false,
      createdAt: new Date()
    };

    setGoals(prev => [...prev, goal]);
    setNewGoal({
      title: '',
      description: '',
      targetHours: 10,
      deadline: new Date(),
      priority: 'medium',
      category: 'دراسة عامة'
    });
    setShowAddGoal(false);
    toast.success('تم إضافة الهدف بنجاح');
  };

  const updateGoalProgress = (goalId: string, additionalHours: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const newHours = goal.currentHours + additionalHours;
        const completed = newHours >= goal.targetHours;
        
        if (completed && !goal.completed) {
          toast.success(`تهانينا! تم إنجاز الهدف: ${goal.title}`);
        }
        
        return {
          ...goal,
          currentHours: newHours,
          completed
        };
      }
      return goal;
    }));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted-foreground';
    }
  };

  const getMoodEmoji = (mood: FocusSession['mood']) => {
    switch (mood) {
      case 'excellent': return '😄';
      case 'good': return '😊';
      case 'neutral': return '😐';
      case 'poor': return '😞';
      default: return '😐';
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Session Panel */}
      {activeSession && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                <span>جلسة دراسة نشطة</span>
                {isOnBreak && <Badge variant="secondary">فترة راحة</Badge>}
              </div>
              <div className="text-2xl font-mono">
                {formatTime(isOnBreak ? breakTime : sessionTime)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">{activeSession.materialTitle}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Clock className="h-4 w-4" />
                <span>بدأت في {format(activeSession.startTime, 'HH:mm', { locale: ar })}</span>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {!isSessionRunning ? (
                <Button onClick={resumeSession} className="gap-2">
                  <Play className="h-4 w-4" />
                  استئناف
                </Button>
              ) : (
                <Button onClick={pauseSession} variant="outline" className="gap-2">
                  <Pause className="h-4 w-4" />
                  إيقاف مؤقت
                </Button>
              )}
              
              {!isOnBreak ? (
                <Button onClick={takeBreak} variant="outline" className="gap-2">
                  <Timer className="h-4 w-4" />
                  فترة راحة
                </Button>
              ) : (
                <Button onClick={endBreak} className="gap-2">
                  <Play className="h-4 w-4" />
                  انتهاء الراحة
                </Button>
              )}
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Square className="h-4 w-4" />
                    إنهاء الجلسة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إنهاء جلسة الدراسة</DialogTitle>
                    <DialogDescription>
                      قم بتقييم جلسة الدراسة وحفظ تقدمك
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>تقييم الإنتاجية (1-5)</Label>
                      <Select onValueChange={(value) => {}}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التقييم" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">ممتاز (5)</SelectItem>
                          <SelectItem value="4">جيد جداً (4)</SelectItem>
                          <SelectItem value="3">متوسط (3)</SelectItem>
                          <SelectItem value="2">ضعيف (2)</SelectItem>
                          <SelectItem value="1">سيء جداً (1)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>الحالة المزاجية</Label>
                      <Select onValueChange={(value) => {}}>
                        <SelectTrigger>
                          <SelectValue placeholder="كيف تشعر؟" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">ممتاز 😄</SelectItem>
                          <SelectItem value="good">جيد 😊</SelectItem>
                          <SelectItem value="neutral">عادي 😐</SelectItem>
                          <SelectItem value="poor">سيء 😞</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>ملاحظات</Label>
                      <Textarea placeholder="اكتب ملاحظاتك عن الجلسة..." />
                    </div>
                    
                    <Button 
                      onClick={() => endSession(3, 'neutral', '')} 
                      className="w-full"
                    >
                      إنهاء الجلسة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">سلسلة الدراسة</p>
                <p className="text-2xl font-bold">{streakData.currentStreak}</p>
                <p className="text-xs text-muted-foreground">يوم متتالي</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">هذا الأسبوع</p>
                <p className="text-2xl font-bold">{Math.floor(weeklyStats.totalStudyTime / 60)}</p>
                <p className="text-xs text-muted-foreground">ساعة دراسة</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">جلسات مكتملة</p>
                <p className="text-2xl font-bold">{weeklyStats.completedSessions}</p>
                <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوسط الإنتاجية</p>
                <p className="text-2xl font-bold">{weeklyStats.averageProductivity.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">من 5</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="goals">الأهداف</TabsTrigger>
          <TabsTrigger value="sessions">الجلسات</TabsTrigger>
          <TabsTrigger value="calendar">التقويم</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">أهداف الدراسة</h3>
            <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Target className="h-4 w-4" />
                  إضافة هدف جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة هدف دراسة جديد</DialogTitle>
                  <DialogDescription>
                    حدد هدفاً جديداً لتتبع تقدمك الدراسي
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>عنوان الهدف</Label>
                    <Input
                      value={newGoal.title}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="مثال: إنهاء كتاب الرياضيات"
                    />
                  </div>
                  
                  <div>
                    <Label>الوصف</Label>
                    <Textarea
                      value={newGoal.description}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="وصف تفصيلي للهدف..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>الساعات المطلوبة</Label>
                      <Input
                        type="number"
                        value={newGoal.targetHours}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, targetHours: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div>
                      <Label>الأولوية</Label>
                      <Select 
                        value={newGoal.priority}
                        onValueChange={(value: any) => setNewGoal(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">عالية</SelectItem>
                          <SelectItem value="medium">متوسطة</SelectItem>
                          <SelectItem value="low">منخفضة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>التصنيف</Label>
                    <Input
                      value={newGoal.category}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="مثال: الرياضيات، الفيزياء، اللغة العربية"
                    />
                  </div>
                  
                  <Button onClick={addGoal} className="w-full">
                    إضافة الهدف
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {goals.map((goal) => (
              <Card key={goal.id} className={goal.completed ? 'bg-green-50 border-green-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium flex items-center gap-2">
                          {goal.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                          {goal.title}
                        </h4>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(goal.priority)}`} />
                        <Badge variant="outline">{goal.category}</Badge>
                      </div>
                      
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>التقدم: {goal.currentHours} / {goal.targetHours} ساعة</span>
                          <span>{Math.round((goal.currentHours / goal.targetHours) * 100)}%</span>
                        </div>
                        <Progress value={(goal.currentHours / goal.targetHours) * 100} />
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>الموعد النهائي: {format(goal.deadline, 'PPP', { locale: ar })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {!goal.completed && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => startFocusSession(`العمل على: ${goal.title}`)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">جلسات الدراسة</h3>
            <Button onClick={() => startFocusSession()} className="gap-2">
              <Play className="h-4 w-4" />
              بدء جلسة جديدة
            </Button>
          </div>

          <div className="grid gap-4">
            {focusSessions
              .filter(session => session.completed)
              .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
              .slice(0, 10)
              .map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{session.materialTitle}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{session.duration} دقيقة</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{format(session.startTime, 'PPP', { locale: ar })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            <span>{session.productivity}/5</span>
                          </div>
                          <span>{getMoodEmoji(session.mood)}</span>
                        </div>
                        {session.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>تقويم الدراسة</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ar}
                  className="rounded-md border"
                  modifiers={{
                    studyDay: streakData.studyDays
                  }}
                  modifiersStyles={{
                    studyDay: { backgroundColor: '#22c55e', color: 'white' }
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات السلسلة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg border">
                  <div>
                    <p className="text-sm text-muted-foreground">السلسلة الحالية</p>
                    <p className="text-3xl font-bold text-orange-600">{streakData.currentStreak}</p>
                    <p className="text-sm text-muted-foreground">يوم متتالي</p>
                  </div>
                  <Zap className="h-12 w-12 text-orange-500" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border">
                  <div>
                    <p className="text-sm text-muted-foreground">أطول سلسلة</p>
                    <p className="text-3xl font-bold text-purple-600">{streakData.longestStreak}</p>
                    <p className="text-sm text-muted-foreground">يوم</p>
                  </div>
                  <Trophy className="h-12 w-12 text-purple-500" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي أيام الدراسة</p>
                    <p className="text-3xl font-bold text-blue-600">{streakData.studyDays.length}</p>
                    <p className="text-sm text-muted-foreground">يوم</p>
                  </div>
                  <Award className="h-12 w-12 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  إحصائيات الأسبوع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.floor(weeklyStats.totalStudyTime / 60)}
                    </p>
                    <p className="text-sm text-muted-foreground">ساعات الدراسة</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {weeklyStats.completedSessions}
                    </p>
                    <p className="text-sm text-muted-foreground">جلسات مكتملة</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {weeklyStats.averageProductivity.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">متوسط الإنتاجية</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {weeklyStats.goalsCompleted}
                    </p>
                    <p className="text-sm text-muted-foreground">أهداف مكتملة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الأنشطة الأخيرة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {focusSessions
                    .filter(session => session.completed)
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .slice(0, 5)
                    .map((session) => (
                      <div key={session.id} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{session.materialTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.duration} دقيقة • {format(session.startTime, 'HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs">{session.productivity}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};