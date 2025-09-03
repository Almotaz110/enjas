import { useState, useEffect } from 'react';
import { Task, UserStats, Achievement, Subject, PomodoroSession, CustomReward } from '@/types/task';
import { MusicTrack } from '@/types/music';
import { Header } from '@/components/Header';
import { TaskList } from '@/components/TaskList';
import { TaskForm } from '@/components/TaskForm';
import { AchievementList } from '@/components/AchievementList';
import { UserProgress } from '@/components/UserProgress';
import { Dashboard } from '@/components/Dashboard';
import { CalendarView } from '@/components/CalendarView';
import { StudyMaterials } from '@/components/StudyMaterials';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { MusicPlayer } from '@/components/MusicPlayer';
import { CustomRewards } from '@/components/CustomRewards';
import { EnhancedSettingsPanel } from '@/components/EnhancedSettingsPanel';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { NavigationProvider, useNavigation } from '@/components/navigation/NavigationContext';
import { ResponsiveNavigation } from '@/components/navigation/ResponsiveNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { v4 as uuidv4, calculateExperienceForLevel } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMotivationalQuotes } from '@/hooks/useMotivationalQuotes';
import { useSoundEffects } from '@/hooks/useSoundEffects';

// Sample initial data
const initialTasks: Task[] = [
  {
    id: uuidv4(),
    title: 'إنهاء تقرير العمل',
    description: 'إكمال التقرير الأسبوعي وإرساله للمدير',
    difficulty: 'medium',
    priority: 'urgent',
    category: 'study',
    completed: false,
    points: 20,
    deadline: new Date(Date.now() + 86400000), // tomorrow
    createdAt: new Date()
  },
  {
    id: uuidv4(),
    title: 'التمرين في الصباح',
    description: '30 دقيقة من التمارين الصباحية',
    difficulty: 'easy',
    priority: 'normal',
    category: 'daily',
    completed: true,
    points: 10,
    createdAt: new Date()
  },
  {
    id: uuidv4(),
    title: 'قراءة كتاب لمدة ساعة',
    description: 'استكمال قراءة الفصل الثالث من الكتاب',
    difficulty: 'easy',
    priority: 'low',
    category: 'personal',
    completed: false,
    points: 10,
    estimatedTime: 60,
    createdAt: new Date()
  },
  {
    id: uuidv4(),
    title: 'تنظيف المنزل',
    description: 'تنظيف غرفة المعيشة والمطبخ',
    difficulty: 'medium',
    priority: 'normal',
    category: 'weekly',
    completed: false,
    points: 20,
    estimatedTime: 120,
    createdAt: new Date()
  },
  {
    id: uuidv4(),
    title: 'تحضير العرض التقديمي',
    description: 'تجهيز عرض للاجتماع القادم',
    difficulty: 'hard',
    priority: 'urgent',
    category: 'study',
    completed: false,
    points: 30,
    estimatedTime: 180,
    deadline: new Date(Date.now() + 172800000), // day after tomorrow
    createdAt: new Date()
  }
];

const initialAchievements: Achievement[] = [
  {
    id: '1',
    title: 'بداية النجاح',
    description: 'أكمل 5 مهام',
    icon: '🏆',
    requirement: 5,
    currentProgress: 1,
    unlocked: false
  },
  {
    id: '2',
    title: 'المنجز النشط',
    description: 'أكمل 20 مهمة',
    icon: '🌟',
    requirement: 20,
    currentProgress: 1,
    unlocked: false
  },
  {
    id: '3',
    title: 'متسلق المستويات',
    description: 'وصول للمستوى 5',
    icon: '🚀',
    requirement: 5,
    currentProgress: 1,
    unlocked: false
  },
  {
    id: '4',
    title: 'سلسلة الإنجاز',
    description: 'حافظ على سلسلة من 7 أيام',
    icon: '🔥',
    requirement: 7,
    currentProgress: 1,
    unlocked: false
  },
  {
    id: '5',
    title: 'بطل المهام الصعبة',
    description: 'أكمل 10 مهام صعبة',
    icon: '💪',
    requirement: 10,
    currentProgress: 0,
    unlocked: false
  }
];

const initialStats: UserStats = {
  level: 1,
  experience: 30,
  experienceToNextLevel: calculateExperienceForLevel(1),
  totalTasksCompleted: 1,
  streak: 1
};

// Main component that uses the Navigation context
const IndexContent = () => {
  const { t, language } = useLanguage();
  const { activeTab } = useNavigation();
  const isMobile = useIsMobile();
  const { user, loading, signOut } = useAuth();
  
  const { playSound } = useSoundEffects();
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('achievements');
    return saved ? JSON.parse(saved) : initialAchievements;
  });
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('userStats');
    return saved ? JSON.parse(saved) : initialStats;
  });
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('subjects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [isAchievementsDrawerOpen, setIsAchievementsDrawerOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [customRewards, setCustomRewards] = useState<CustomReward[]>(() => {
    const saved = localStorage.getItem('customRewards');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Timer and music player state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTimerTitle, setCurrentTimerTitle] = useState('');
  const [currentMusicTitle, setCurrentMusicTitle] = useState('');

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('userStats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('customRewards', JSON.stringify(customRewards));
  }, [customRewards]);

  // Load and save music tracks
  useEffect(() => {
    const savedTracks = localStorage.getItem('musicTracks');
    if (savedTracks) {
      try {
        const parsedTracks = JSON.parse(savedTracks);
        // Convert createdAt strings back to Date objects
        const tracksWithDates = parsedTracks.map((track: any) => ({
          ...track,
          createdAt: new Date(track.createdAt)
        }));
        setMusicTracks(tracksWithDates);
      } catch (error) {
        console.error('Error loading music tracks:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save tracks metadata but not the actual files (they're stored as URLs)
    const tracksToSave = musicTracks.map(track => ({
      ...track,
      file: undefined // Don't save the file object
    }));
    localStorage.setItem('musicTracks', JSON.stringify(tracksToSave));
  }, [musicTracks]);
  
  // Handle task completion
  const handleCompleteTask = (taskId: string) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === taskId) {
          const wasCompleted = task.completed;
          const newCompletedState = !task.completed;
          
          // Only update stats and achievements if the task is being marked as completed
          if (!wasCompleted && newCompletedState) {
            // Update stats
            updateStatsForCompletedTask(task);
            
            // Update achievements
            updateAchievementsForCompletedTask(task);
            
            toast.success('مهمة مكتملة! +' + task.points + ' نقطة 🎉');
          } else if (wasCompleted && !newCompletedState) {
            // If uncompleting a task, remove the points
            revertStatsForUncompletedTask(task);
            toast.info('Task completion cancelled');
          }
          
          return { ...task, completed: newCompletedState };
        }
        return task;
      });
      
      return updatedTasks;
    });
  };
  
  // Update user stats when a task is completed
  const updateStatsForCompletedTask = (task: Task) => {
    setStats(prevStats => {
      const newExperience = prevStats.experience + task.points;
      const newTotalTasksCompleted = prevStats.totalTasksCompleted + 1;
      let newLevel = prevStats.level;
      let newExperienceToNextLevel = prevStats.experienceToNextLevel;
      
      // Check if leveled up
      if (newExperience >= prevStats.experienceToNextLevel) {
        newLevel += 1;
        newExperienceToNextLevel = calculateExperienceForLevel(newLevel);
        
        playSound('levelUp');
        toast.success(`Congratulations! You reached level ${newLevel} 🎊`, { duration: 5000 });
        
        // Update level achievement
        updateLevelAchievement(newLevel);
      }
      
      return {
        ...prevStats,
        experience: newExperience,
        experienceToNextLevel: newExperienceToNextLevel,
        level: newLevel,
        totalTasksCompleted: newTotalTasksCompleted
      };
    });
  };
  
  // Revert stats when a task is uncompleted
  const revertStatsForUncompletedTask = (task: Task) => {
    setStats(prevStats => {
      const newExperience = Math.max(0, prevStats.experience - task.points);
      const newTotalTasksCompleted = Math.max(0, prevStats.totalTasksCompleted - 1);
      
      return {
        ...prevStats,
        experience: newExperience,
        totalTasksCompleted: newTotalTasksCompleted
      };
    });
  };
  
  // Update achievements
  const updateAchievementsForCompletedTask = (task: Task) => {
    setAchievements(prevAchievements => {
      return prevAchievements.map(achievement => {
        let updated = { ...achievement };
        
        // Update task completion achievements
        if (achievement.id === '1' || achievement.id === '2') {
          updated.currentProgress = Math.min(achievement.currentProgress + 1, achievement.requirement);
          if (updated.currentProgress >= achievement.requirement && !achievement.unlocked) {
            updated.unlocked = true;
            toast.success(`أنجزت: ${achievement.title} 🏆`, { duration: 5000 });
          }
        }
        
        // Update difficult tasks achievement
        if (achievement.id === '5' && task.difficulty === 'hard') {
          updated.currentProgress = Math.min(achievement.currentProgress + 1, achievement.requirement);
          if (updated.currentProgress >= achievement.requirement && !achievement.unlocked) {
            updated.unlocked = true;
            toast.success(`أنجزت: ${achievement.title} 🏆`, { duration: 5000 });
          }
        }
        
        return updated;
      });
    });
  };
  
  // Update level achievement
  const updateLevelAchievement = (newLevel: number) => {
    setAchievements(prevAchievements => {
      return prevAchievements.map(achievement => {
        if (achievement.id === '3') {
          const updated = { ...achievement, currentProgress: newLevel };
          if (updated.currentProgress >= achievement.requirement && !achievement.unlocked) {
            updated.unlocked = true;
            toast.success(`أنجزت: ${achievement.title} 🏆`, { duration: 5000 });
          }
          return updated;
        }
        return achievement;
      });
    });
  };
  
  // Handle task deletion
  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    toast.success('تم حذف المهمة');
  };
  
  // Handle task edit
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };
  
  // Handle saving a task (new or edited)
  const handleSaveTask = (task: Task) => {
    if (editingTask) {
      // Update existing task
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === task.id ? task : t)
      );
      toast.success('Task updated');
    } else {
      // Add new task
      setTasks(prevTasks => [...prevTasks, task]);
      toast.success('New task added');
    }
    
    setIsTaskFormOpen(false);
    setEditingTask(undefined);
  };

  const handleResetStats = () => {
    // Reset all stats to initial values
    setStats({
      level: 1,
      experience: 0,
      experienceToNextLevel: calculateExperienceForLevel(1),
      totalTasksCompleted: 0,
      streak: 0
    });
    setTasks([]);
    setAchievements(initialAchievements.map(achievement => ({ 
      ...achievement, 
      currentProgress: 0, 
      unlocked: false 
    })));
    setSubjects([]);
    setCustomRewards([]);
    
    // Clear localStorage
    localStorage.removeItem('tasks');
    localStorage.removeItem('userStats');
    localStorage.removeItem('achievements');
    localStorage.removeItem('subjects');
    localStorage.removeItem('musicTracks');
    localStorage.removeItem('customRewards');
    
    setMusicTracks([]);
    playSound('notification');
  };

  // Music player handlers
  const handleAddTrack = (track: MusicTrack) => {
    setMusicTracks(prev => [...prev, track]);
  };

  const handleDeleteTrack = (trackId: string) => {
    setMusicTracks(prev => {
      const track = prev.find(t => t.id === trackId);
      if (track?.url) {
        URL.revokeObjectURL(track.url);
      }
      return prev.filter(t => t.id !== trackId);
    });
  };

  // Timer control handlers
  const handleTimerControl = (action: 'stop' | 'pause' | 'resume') => {
    switch (action) {
      case 'stop':
        setIsTimerRunning(false);
        setCurrentTimerTitle('');
        break;
      case 'pause':
        setIsTimerRunning(false);
        break;
      case 'resume':
        setIsTimerRunning(true);
        break;
    }
  };

  // Music control handlers
  const handleMusicControl = (action: 'stop' | 'pause' | 'play' | 'next' | 'restart') => {
    switch (action) {
      case 'stop':
        setIsMusicPlaying(false);
        setCurrentMusicTitle('');
        break;
      case 'pause':
        setIsMusicPlaying(false);
        break;
      case 'play':
        setIsMusicPlaying(true);
        break;
      case 'next':
        // Logic for next track would go here
        break;
      case 'restart':
        // Logic for restart would go here
        break;
    }
  };

  // Custom rewards handlers
  const handleAddCustomReward = (reward: CustomReward) => {
    setCustomRewards(prev => [...prev, reward]);
  };

  const handleClaimReward = (rewardId: string) => {
    setCustomRewards(prev => 
      prev.map(reward => 
        reward.id === rewardId 
          ? { ...reward, isClaimed: true, claimedAt: new Date() }
          : reward
      )
    );
  };

  const handleDeleteReward = (rewardId: string) => {
    setCustomRewards(prev => prev.filter(reward => reward.id !== rewardId));
    toast.success('تم حذف المكافأة بنجاح');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('خطأ في تسجيل الخروج');
    }
  };

  // Update reward claimability based on current points
  useEffect(() => {
    setCustomRewards(prev => 
      prev.map(reward => ({
        ...reward,
        isClaimable: stats.experience >= reward.pointsRequired && !reward.isClaimed
      }))
    );
  }, [stats.experience]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show auth modal if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">مرحباً بك في تطبيق المهام</h1>
          <p className="text-muted-foreground">سجل الدخول للمتابعة</p>
          <Button onClick={() => setIsAuthModalOpen(true)} size="lg">
            تسجيل الدخول
          </Button>
        </div>
        <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
      </div>
    );
  }

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tasks={tasks} stats={stats} />;
      
      case 'tasks':
        return (
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <TaskList 
              tasks={tasks}
              onComplete={handleCompleteTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
              onAddNew={() => {
                setEditingTask(undefined);
                setIsTaskFormOpen(true);
              }}
            />
          </div>
        );
      
      case 'calendar':
        return <CalendarView tasks={tasks} onTaskClick={handleEditTask} />;
      
      case 'rewards':
        return (
          <div className="bg-card rounded-lg shadow-md border border-border p-6">
            <CustomRewards 
              rewards={customRewards}
              userStats={stats}
              onAddReward={handleAddCustomReward}
              onClaimReward={handleClaimReward}
              onDeleteReward={handleDeleteReward}
            />
          </div>
        );
      
      case 'study':
        return <StudyMaterials subjects={subjects} onSubjectsChange={setSubjects} />;
      
      case 'pomodoro':
        return (
          <PomodoroTimer 
            tasks={tasks} 
            onTaskUpdate={(taskId, sessions) => {
              setTasks(prev => prev.map(task => 
                task.id === taskId 
                  ? { ...task, pomodoroSessions: sessions }
                  : task
              ));
            }}
            onTimerStateChange={(isRunning, title) => {
              setIsTimerRunning(isRunning);
              setCurrentTimerTitle(title);
            }}
          />
        );
      
      case 'music':
        return (
          <MusicPlayer 
            tracks={musicTracks}
            onAddTrack={handleAddTrack}
            onDeleteTrack={handleDeleteTrack}
            onPlayStateChange={(isPlaying, title) => {
              setIsMusicPlaying(isPlaying);
              setCurrentMusicTitle(title);
            }}
          />
        );
      
      default:
        return <Dashboard tasks={tasks} stats={stats} />;
    }
  };
  
  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-20 pt-16' : ''}`}>
      {/* Show Header only on desktop */}
      {!isMobile && (
        <Header 
          stats={stats} 
          onOpenTaskDrawer={() => setIsTaskDrawerOpen(true)}
          onOpenAchievementsDrawer={() => setIsAchievementsDrawerOpen(true)}
          onOpenSettings={() => setIsSettingsDrawerOpen(true)}
          user={user}
          onSignOut={handleSignOut}
        />
      )}
      
      {/* Navigation */}
      <ResponsiveNavigation />
      
      <main className={`container max-w-7xl mx-auto px-4 ${isMobile ? 'py-4' : 'py-6'}`}>
        {!isMobile && <UserProgress stats={stats} />}
        
        <div className="space-y-6">
          {renderContent()}
        </div>
      </main>
      
      {/* Task Form Dialog */}
      <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="rtl">{editingTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</DialogTitle>
            <DialogDescription className="rtl">
              {editingTask 
                ? 'قم بتعديل تفاصيل المهمة ثم انقر على تحديث' 
                : 'أضف تفاصيل المهمة الجديدة ثم انقر على إضافة'}
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            onSave={handleSaveTask}
            onCancel={() => {
              setIsTaskFormOpen(false);
              setEditingTask(undefined);
            }}
            editTask={editingTask}
          />
        </DialogContent>
      </Dialog>
      
      {/* Tasks Drawer */}
      <Sheet open={isTaskDrawerOpen} onOpenChange={setIsTaskDrawerOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{language === 'ar' ? 'المهام' : 'Tasks'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
            <TaskList 
              tasks={tasks}
              onComplete={handleCompleteTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
              onAddNew={() => {
                setEditingTask(undefined);
                setIsTaskFormOpen(true);
                setIsTaskDrawerOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Achievements Drawer */}
      <Sheet open={isAchievementsDrawerOpen} onOpenChange={setIsAchievementsDrawerOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{language === 'ar' ? 'الإنجازات' : 'Achievements'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
            <AchievementList achievements={achievements} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Drawer */}
      <Sheet open={isSettingsDrawerOpen} onOpenChange={setIsSettingsDrawerOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{language === 'ar' ? 'الإعدادات' : 'Settings'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <EnhancedSettingsPanel 
              tasks={tasks}
              onResetStats={handleResetStats}
              isTimerRunning={isTimerRunning}
              isMusicPlaying={isMusicPlaying}
              onTimerControl={handleTimerControl}
              onMusicControl={handleMusicControl}
              currentTimerTitle={currentTimerTitle}
              currentMusicTitle={currentMusicTitle}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Main Index component with Navigation Provider
const Index = () => {
  return (
    <NavigationProvider>
      <IndexContent />
    </NavigationProvider>
  );
};

export default Index;