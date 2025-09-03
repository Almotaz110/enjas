import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface GameEvent {
  id: string;
  type: 'task_completed' | 'streak_achieved' | 'level_up' | 'achievement_unlocked' | 'combo_bonus';
  title: string;
  description: string;
  points: number;
  timestamp: Date;
  special?: boolean;
}

export interface ComboTracker {
  count: number;
  multiplier: number;
  lastCompletionTime: Date | null;
  isActive: boolean;
}

export interface AchievementProgress {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  icon: string;
  category: 'productivity' | 'consistency' | 'mastery' | 'social';
}

const COMBO_TIME_LIMIT = 30 * 60 * 1000; // 30 minutes
const COMBO_MULTIPLIERS = [1, 1.2, 1.5, 2, 2.5, 3]; // Based on combo count

export const useGamification = (tasks: Task[], userStats: any) => {
  const { t } = useLanguage();
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const [comboTracker, setComboTracker] = useState<ComboTracker>({
    count: 0,
    multiplier: 1,
    lastCompletionTime: null,
    isActive: false
  });
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);

  // Initialize achievements
  useEffect(() => {
    setAchievements([
      {
        id: 'first_steps',
        name: 'الخطوات الأولى',
        description: 'أكمل 10 مهام',
        progress: 0,
        target: 10,
        completed: false,
        icon: '🚀',
        category: 'productivity'
      },
      {
        id: 'streak_master',
        name: 'سيد التتابع',
        description: 'حافظ على سلسلة لمدة 7 أيام',
        progress: 0,
        target: 7,
        completed: false,
        icon: '🔥',
        category: 'consistency'
      },
      {
        id: 'speed_demon',
        name: 'شيطان السرعة',
        description: 'أكمل 5 مهام في 30 دقيقة',
        progress: 0,
        target: 5,
        completed: false,
        icon: '⚡',
        category: 'mastery'
      },
      {
        id: 'perfectionist',
        name: 'المثالي',
        description: 'أكمل 100% من المهام اليومية لمدة 3 أيام',
        progress: 0,
        target: 3,
        completed: false,
        icon: '💎',
        category: 'mastery'
      },
      {
        id: 'night_owl',
        name: 'بومة الليل',
        description: 'أكمل مهام بعد الساعة 10 مساءً',
        progress: 0,
        target: 20,
        completed: false,
        icon: '🦉',
        category: 'productivity'
      },
      {
        id: 'early_bird',
        name: 'الطائر المبكر',
        description: 'أكمل مهام قبل الساعة 6 صباحاً',
        progress: 0,
        target: 15,
        completed: false,
        icon: '🐦',
        category: 'productivity'
      }
    ]);
  }, []);

  // Update achievements progress
  const updateAchievements = useCallback(() => {
    const completedTasks = tasks.filter(task => task.completed);
    const currentStreak = userStats?.currentStreak || 0;

    setAchievements(prev => prev.map(achievement => {
      let newProgress = achievement.progress;
      
      switch (achievement.id) {
        case 'first_steps':
          newProgress = completedTasks.length;
          break;
        case 'streak_master':
          newProgress = currentStreak;
          break;
        case 'speed_demon':
          // Check for tasks completed in last 30 minutes
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
          const recentTasks = completedTasks.filter(task => 
            task.completedAt && new Date(task.completedAt) > thirtyMinutesAgo
          );
          newProgress = Math.max(newProgress, recentTasks.length);
          break;
        case 'night_owl':
          const nightTasks = completedTasks.filter(task => {
            if (!task.completedAt) return false;
            const hour = new Date(task.completedAt).getHours();
            return hour >= 22 || hour <= 6;
          });
          newProgress = nightTasks.length;
          break;
        case 'early_bird':
          const morningTasks = completedTasks.filter(task => {
            if (!task.completedAt) return false;
            const hour = new Date(task.completedAt).getHours();
            return hour >= 5 && hour <= 7;
          });
          newProgress = morningTasks.length;
          break;
      }

      const completed = newProgress >= achievement.target;
      
      // Trigger achievement unlock event
      if (completed && !achievement.completed) {
        const event: GameEvent = {
          id: `achievement_${achievement.id}_${Date.now()}`,
          type: 'achievement_unlocked',
          title: 'إنجاز جديد!',
          description: `تم فتح: ${achievement.name}`,
          points: 100,
          timestamp: new Date(),
          special: true
        };
        setRecentEvents(prev => [event, ...prev].slice(0, 10));
        toast.success(`🎉 إنجاز جديد: ${achievement.name}!`);
      }

      return {
        ...achievement,
        progress: Math.min(newProgress, achievement.target),
        completed
      };
    }));
  }, [tasks, userStats]);

  // Handle task completion with combo system
  const handleTaskCompletion = useCallback((task: Task) => {
    const now = new Date();
    const timeSinceLastCompletion = comboTracker.lastCompletionTime
      ? now.getTime() - comboTracker.lastCompletionTime.getTime()
      : COMBO_TIME_LIMIT + 1;

    let newCombo = comboTracker;
    
    if (timeSinceLastCompletion <= COMBO_TIME_LIMIT && comboTracker.isActive) {
      // Extend combo
      newCombo = {
        count: comboTracker.count + 1,
        multiplier: COMBO_MULTIPLIERS[Math.min(comboTracker.count, COMBO_MULTIPLIERS.length - 1)],
        lastCompletionTime: now,
        isActive: true
      };
    } else {
      // Start new combo
      newCombo = {
        count: 1,
        multiplier: 1,
        lastCompletionTime: now,
        isActive: true
      };
    }

    setComboTracker(newCombo);

    // Calculate bonus points
    const basePoints = task.difficulty === 'easy' ? 10 : task.difficulty === 'medium' ? 20 : 30;
    const bonusPoints = Math.floor(basePoints * (newCombo.multiplier - 1));
    
    // Create completion event
    const completionEvent: GameEvent = {
      id: `completion_${task.id}_${Date.now()}`,
      type: 'task_completed',
      title: 'مهمة مكتملة!',
      description: task.title,
      points: basePoints + bonusPoints,
      timestamp: now
    };

    // Create combo event if applicable
    if (newCombo.count > 1) {
      const comboEvent: GameEvent = {
        id: `combo_${Date.now()}`,
        type: 'combo_bonus',
        title: `كومبو x${newCombo.count}!`,
        description: `نقاط إضافية: +${bonusPoints}`,
        points: bonusPoints,
        timestamp: now,
        special: true
      };
      setRecentEvents(prev => [comboEvent, completionEvent, ...prev].slice(0, 10));
      toast.success(`🔥 كومبو x${newCombo.count}! +${bonusPoints} نقطة إضافية`);
    } else {
      setRecentEvents(prev => [completionEvent, ...prev].slice(0, 10));
    }

    // Update achievements
    setTimeout(updateAchievements, 100);
  }, [comboTracker, updateAchievements]);

  // Reset combo if inactive
  useEffect(() => {
    if (!comboTracker.isActive || !comboTracker.lastCompletionTime) return;

    const timer = setTimeout(() => {
      const now = new Date();
      const timeSinceLastCompletion = now.getTime() - comboTracker.lastCompletionTime!.getTime();
      
      if (timeSinceLastCompletion > COMBO_TIME_LIMIT) {
        setComboTracker(prev => ({ ...prev, isActive: false, count: 0, multiplier: 1 }));
      }
    }, COMBO_TIME_LIMIT);

    return () => clearTimeout(timer);
  }, [comboTracker.lastCompletionTime, comboTracker.isActive]);

  // Initial achievements update
  useEffect(() => {
    updateAchievements();
  }, [updateAchievements]);

  return {
    recentEvents,
    comboTracker,
    achievements,
    handleTaskCompletion,
    clearEvents: () => setRecentEvents([]),
    getComboTimeRemaining: () => {
      if (!comboTracker.isActive || !comboTracker.lastCompletionTime) return 0;
      const elapsed = Date.now() - comboTracker.lastCompletionTime.getTime();
      return Math.max(0, COMBO_TIME_LIMIT - elapsed);
    }
  };
};