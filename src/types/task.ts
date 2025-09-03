
export interface Task {
  id: string;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'urgent' | 'normal' | 'low';
  completed: boolean;
  deadline?: Date;
  points: number;
  category: 'daily' | 'weekly' | 'monthly' | 'personal' | 'study' | 'custom';
  estimatedTime?: number; // in minutes
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
  completedAt?: Date;
  pomodoroSessions?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  currentProgress: number;
  unlocked: boolean;
}

export interface UserStats {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  totalTasksCompleted: number;
  streak: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Priority = 'urgent' | 'normal' | 'low';
export type Category = 'daily' | 'weekly' | 'monthly' | 'personal' | 'study' | 'custom';

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  type: 'pdf' | 'video' | 'document' | 'link' | 'image';
  url: string;
  category: 'notes' | 'summary' | 'assignment';
  createdAt: Date;
  size?: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  materials: StudyMaterial[];
  createdAt: Date;
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  duration: number; // in minutes
  completed: boolean;
  startTime: Date;
  endTime?: Date;
}

export interface PomodoroSettings {
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  notifications: boolean;
}

export interface CustomReward {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  isClaimable: boolean;
  isClaimed: boolean;
  createdAt: Date;
  claimedAt?: Date;
}
