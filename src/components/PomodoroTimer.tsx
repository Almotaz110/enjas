import { useState, useEffect, useRef } from 'react';
import { Task, PomodoroSession, PomodoroSettings } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Settings, 
  Timer, 
  Coffee,
  Target,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface PomodoroTimerProps {
  tasks: Task[];
  onSessionComplete?: (session: PomodoroSession) => void;
  onTaskUpdate?: (taskId: string, pomodoroSessions: number) => void;
  onTimerStateChange?: (isRunning: boolean, title: string) => void;
}

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  notifications: true
};

export const PomodoroTimer = ({ tasks, onSessionComplete, onTaskUpdate, onTimerStateChange }: PomodoroTimerProps) => {
  const { playSound } = useSoundEffects();
  // Load settings from localStorage
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    const saved = localStorage.getItem('pomodoroSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [sessionCount, setSessionCount] = useState(() => {
    const saved = localStorage.getItem('pomodoroSessionCount');
    return saved ? Number(saved) : 0;
  });
  
  // Load completed sessions from localStorage
  const [completedSessions, setCompletedSessions] = useState<PomodoroSession[]>(() => {
    const saved = localStorage.getItem('pomodoroSessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    if (!isRunning && !isPaused) {
      const duration = mode === 'work' 
        ? settings.workDuration 
        : mode === 'shortBreak' 
          ? settings.shortBreak 
          : settings.longBreak;
      setTimeLeft(duration * 60);
    }
  }, [settings, mode, isRunning, isPaused]);

  // Save session count to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroSessionCount', sessionCount.toString());
  }, [sessionCount]);

  // Save completed sessions to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroSessions', JSON.stringify(completedSessions));
  }, [completedSessions]);

  // Initialize audio for notifications
  useEffect(() => {
    if (settings.notifications) {
      // Create a simple beep sound using Web Audio API
      const createBeepSound = () => {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
          console.log('Audio not supported:', error);
        }
      };
      
      audioRef.current = { play: createBeepSound } as any;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, [settings.notifications]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Play notification sounds based on mode
    if (settings.notifications) {
      if (mode === 'work') {
        // Work session completed - success sound
        playSound('success');
      } else {
        // Break ended - notification sound
        playSound('notification');
      }
      
      // Also play the custom beep sound as backup
      if (audioRef.current) {
        try {
          audioRef.current.play();
        } catch (error) {
          console.log('Audio notification failed:', error);
        }
      }
    }

    if (mode === 'work') {
      // Complete work session
      const session: PomodoroSession = {
        id: uuidv4(),
        taskId: selectedTask?.id,
        duration: settings.workDuration,
        completed: true,
        startTime: new Date(Date.now() - settings.workDuration * 60 * 1000),
        endTime: new Date()
      };

      setCompletedSessions(prev => [...prev, session]);
      onSessionComplete?.(session);

      // Update task pomodoro count
      if (selectedTask) {
        const newCount = (selectedTask.pomodoroSessions || 0) + 1;
        onTaskUpdate?.(selectedTask.id, newCount);
      }

      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);

      // Determine next break type
      const isLongBreak = newSessionCount % settings.sessionsUntilLongBreak === 0;
      const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';
      const nextDuration = isLongBreak ? settings.longBreak : settings.shortBreak;

      setMode(nextMode);
      setTimeLeft(nextDuration * 60);

      toast.success(
        `تمت جلسة العمل! ${isLongBreak ? 'استراحة طويلة' : 'استراحة قصيرة'} الآن 🎉`,
        { duration: 5000 }
      );

      // Play special level up sound for long breaks
      if (isLongBreak && settings.notifications) {
        setTimeout(() => playSound('levelUp'), 500);
      }

      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        setIsRunning(true);
      }
    } else {
      // Complete break session
      setMode('work');
      setTimeLeft(settings.workDuration * 60);

      toast.success('انتهت الاستراحة! وقت العمل 💪', { duration: 3000 });

      // Auto-start work if enabled
      if (settings.autoStartPomodoros) {
        setIsRunning(true);
      }
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
    const title = selectedTask ? `${getModeTitle()} - ${selectedTask.title}` : getModeTitle();
    onTimerStateChange?.(true, title);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setIsPaused(true);
    const title = selectedTask ? `${getModeTitle()} - ${selectedTask.title}` : getModeTitle();
    onTimerStateChange?.(false, title);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    // Save incomplete session data if needed
    if (mode === 'work' && selectedTask && timeLeft < settings.workDuration * 60) {
      const duration = Math.floor((settings.workDuration * 60 - timeLeft) / 60);
      if (duration > 0) {
        toast.info(`توقف العمل على "${selectedTask.title}" بعد ${duration} دقيقة`);
      }
    }
    onTimerStateChange?.(false, '');
    resetTimer();
  };

  const resetTimer = () => {
    setIsPaused(false);
    const duration = mode === 'work' 
      ? settings.workDuration 
      : mode === 'shortBreak' 
        ? settings.shortBreak 
        : settings.longBreak;
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalTime = mode === 'work' 
      ? settings.workDuration * 60
      : mode === 'shortBreak' 
        ? settings.shortBreak * 60
        : settings.longBreak * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'work': return <Target className="h-5 w-5" />;
      case 'shortBreak': return <Coffee className="h-5 w-5" />;
      case 'longBreak': return <Coffee className="h-5 w-5" />;
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'work': return 'جلسة عمل';
      case 'shortBreak': return 'استراحة قصيرة';
      case 'longBreak': return 'استراحة طويلة';
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'work': return 'bg-primary text-primary-foreground';
      case 'shortBreak': return 'bg-secondary text-secondary-foreground';
      case 'longBreak': return 'bg-accent text-accent-foreground';
    }
  };

  // Filter today's sessions
  const todaySessions = completedSessions.filter(session => {
    const today = new Date();
    const sessionDate = new Date(session.startTime);
    return sessionDate.toDateString() === today.toDateString();
  });

  // Get week's sessions for weekly stats
  const weekSessions = completedSessions.filter(session => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sessionDate = new Date(session.startTime);
    return sessionDate >= weekAgo;
  });

  const incompleteTasks = tasks.filter(task => !task.completed);

  return (
    <div className="space-y-6">
      {/* Timer Card */}
      <Card className={getModeColor()}>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            {getModeIcon()}
            مؤقت بومودورو الذكي
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* Timer Display */}
          <div className="space-y-4">
            <Badge 
              variant="secondary" 
              className="text-lg px-4 py-2 bg-background/20 text-background-foreground border-border/30"
            >
              {getModeTitle()}
            </Badge>
            
            <div className="text-6xl md:text-8xl font-mono font-bold">
              {formatTime(timeLeft)}
            </div>
            
            <Progress 
              value={getProgress()} 
              className="h-3 bg-background/20" 
            />
          </div>

          {/* Selected Task */}
          {selectedTask && mode === 'work' && (
            <div className="bg-background/10 rounded-lg p-4">
              <h4 className="font-medium mb-2">المهمة المحددة:</h4>
              <p className="text-sm opacity-90">{selectedTask.title}</p>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                <span>🍅 {selectedTask.pomodoroSessions || 0} جلسة</span>
                {selectedTask.estimatedTime && (
                  <span>⏱️ {selectedTask.estimatedTime} دقيقة</span>
                )}
              </div>
            </div>
          )}

          {/* Timer Controls */}
          <div className="flex justify-center gap-3">
            {!isRunning ? (
              <Button
                size="lg"
                variant="secondary"
                onClick={startTimer}
                className="bg-background/20 hover:bg-background/30 border-border/30"
              >
                <Play className="h-5 w-5 mr-2" />
                بدء
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                onClick={pauseTimer}
                className="bg-background/20 hover:bg-background/30 border-border/30"
              >
                <Pause className="h-5 w-5 mr-2" />
                إيقاف مؤقت
              </Button>
            )}
            
            <Button
              size="lg"
              variant="outline"
              onClick={resetTimer}
              className="bg-background/20 hover:bg-background/30 border-border/30"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-sm">اختيار المهمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="taskSelect">ربط المؤقت بمهمة</Label>
              <Select 
                value={selectedTask?.id || ''} 
                onValueChange={(taskId) => {
                  if (taskId === "no-task") {
                    setSelectedTask(null);
                  } else {
                    const task = tasks.find(t => t.id === taskId);
                    setSelectedTask(task || null);
                  }
                }}
              >
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="اختر مهمة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-task">بدون مهمة محددة</SelectItem>
                  {incompleteTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <div className="text-right">
                        <div>{task.title}</div>
                        <div className="text-xs text-muted-foreground">
                          🍅 {task.pomodoroSessions || 0} جلسة
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              إحصائيات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {todaySessions.length}
              </div>
              <p className="text-sm text-muted-foreground">جلسة مكتملة</p>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold">
                {Math.floor(sessionCount / settings.sessionsUntilLongBreak)} دورة
              </div>
              <p className="text-xs text-muted-foreground">
                ({sessionCount % settings.sessionsUntilLongBreak}/{settings.sessionsUntilLongBreak} في الدورة الحالية)
              </p>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-secondary">
                {todaySessions.reduce((total, session) => total + session.duration, 0)} دقيقة
              </div>
              <p className="text-xs text-muted-foreground">وقت التركيز اليوم</p>
            </div>

            <div className="text-center">
              <div className="text-sm font-medium text-accent">
                {weekSessions.length} جلسة هذا الأسبوع
              </div>
              <p className="text-xs text-muted-foreground">
                {weekSessions.reduce((total, session) => total + session.duration, 0)} دقيقة إجمالي
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  تخصيص الإعدادات
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-right">إعدادات بومودورو</DialogTitle>
                  <DialogDescription className="text-right">
                    اضبط أوقات العمل والراحة والراحة الطويلة
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="workDuration">عمل (دقيقة)</Label>
                      <Input
                        id="workDuration"
                        type="number"
                        value={settings.workDuration}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          workDuration: Number(e.target.value) 
                        }))}
                        min="1"
                        max="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shortBreak">استراحة قصيرة</Label>
                      <Input
                        id="shortBreak"
                        type="number"
                        value={settings.shortBreak}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          shortBreak: Number(e.target.value) 
                        }))}
                        min="1"
                        max="30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longBreak">استراحة طويلة</Label>
                      <Input
                        id="longBreak"
                        type="number"
                        value={settings.longBreak}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          longBreak: Number(e.target.value) 
                        }))}
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionsUntilLongBreak">الجلسات قبل الاستراحة الطويلة</Label>
                    <Input
                      id="sessionsUntilLongBreak"
                      type="number"
                      value={settings.sessionsUntilLongBreak}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        sessionsUntilLongBreak: Number(e.target.value) 
                      }))}
                      min="2"
                      max="8"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoStartBreaks">بدء الاستراحات تلقائياً</Label>
                      <Switch
                        id="autoStartBreaks"
                        checked={settings.autoStartBreaks}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                          autoStartBreaks: checked 
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoStartPomodoros">بدء جلسات العمل تلقائياً</Label>
                      <Switch
                        id="autoStartPomodoros"
                        checked={settings.autoStartPomodoros}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                          autoStartPomodoros: checked 
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">التنبيهات الصوتية</Label>
                      <Switch
                        id="notifications"
                        checked={settings.notifications}
                        onCheckedChange={(checked) => setSettings(prev => ({ 
                          ...prev, 
                          notifications: checked 
                        }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={() => {
                      // Save settings to localStorage
                      localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
                      
                      // Apply settings and reset timer if needed
                      if (!isRunning) {
                        resetTimer();
                      }
                      setIsSettingsOpen(false);
                      toast.success('تم حفظ الإعدادات');
                    }}>
                      حفظ
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div>جلسة العمل: {settings.workDuration} دقيقة</div>
              <div>استراحة قصيرة: {settings.shortBreak} دقيقة</div>
              <div>استراحة طويلة: {settings.longBreak} دقيقة</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};