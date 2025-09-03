import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSyncManager } from '@/hooks/useSyncManager'
import { Task, Achievement, CustomReward, UserStats } from '@/types/task'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface SyncDataContextType {
  // Data
  tasks: Task[]
  achievements: Achievement[]
  customRewards: CustomReward[]
  userStats: UserStats | null
  
  // Loading states
  isLoading: boolean
  isInitialized: boolean
  
  // Data manipulation functions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  completeTask: (id: string) => Promise<void>
  
  addAchievement: (achievement: Omit<Achievement, 'id'>) => Promise<void>
  updateAchievement: (id: string, updates: Partial<Achievement>) => Promise<void>
  
  addCustomReward: (reward: Omit<CustomReward, 'id' | 'createdAt'>) => Promise<void>
  updateCustomReward: (id: string, updates: Partial<CustomReward>) => Promise<void>
  deleteCustomReward: (id: string) => Promise<void>
  claimReward: (id: string) => Promise<void>
  
  updateUserStats: (updates: Partial<UserStats>) => Promise<void>
  
  // Sync functions
  forceSyncAll: () => Promise<void>
}

const SyncDataContext = createContext<SyncDataContextType | undefined>(undefined)

interface SyncDataProviderProps {
  children: ReactNode
}

export const SyncDataProvider: React.FC<SyncDataProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const { syncAllData } = useSyncManager()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [customRewards, setCustomRewards] = useState<CustomReward[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize data when user is authenticated
  useEffect(() => {
    if (user) {
      initializeData()
    } else {
      // Clear data when user logs out
      setTasks([])
      setAchievements([])
      setCustomRewards([])
      setUserStats(null)
      setIsInitialized(false)
      setIsLoading(false)
    }
  }, [user])

  // Listen for sync events
  useEffect(() => {
    const handleTasksSynced = (event: CustomEvent) => {
      const syncedTasks = event.detail.map(transformSupabaseTask)
      setTasks(syncedTasks)
    }

    const handleAchievementsSynced = (event: CustomEvent) => {
      const syncedAchievements = event.detail
      setAchievements(syncedAchievements)
    }

    const handleCustomRewardsSynced = (event: CustomEvent) => {
      const syncedRewards = event.detail
      setCustomRewards(syncedRewards)
    }

    const handleUserStatsSynced = (event: CustomEvent) => {
      if (event.detail) {
        setUserStats(event.detail)
      }
    }

    const handleTaskSyncUpdate = (event: CustomEvent) => {
      const { task, eventType } = event.detail
      const transformedTask = transformSupabaseTask(task)
      
      setTasks(prev => {
        switch (eventType) {
          case 'INSERT':
            return [...prev, transformedTask]
          case 'UPDATE':
            return prev.map(t => t.id === transformedTask.id ? transformedTask : t)
          case 'DELETE':
            return prev.filter(t => t.id !== transformedTask.id)
          default:
            return prev
        }
      })
    }

    window.addEventListener('tasksSynced', handleTasksSynced as EventListener)
    window.addEventListener('achievementsSynced', handleAchievementsSynced as EventListener)
    window.addEventListener('customRewardsSynced', handleCustomRewardsSynced as EventListener)
    window.addEventListener('userStatsSynced', handleUserStatsSynced as EventListener)
    window.addEventListener('taskSyncUpdate', handleTaskSyncUpdate as EventListener)

    return () => {
      window.removeEventListener('tasksSynced', handleTasksSynced as EventListener)
      window.removeEventListener('achievementsSynced', handleAchievementsSynced as EventListener)
      window.removeEventListener('customRewardsSynced', handleCustomRewardsSynced as EventListener)
      window.removeEventListener('userStatsSynced', handleUserStatsSynced as EventListener)
      window.removeEventListener('taskSyncUpdate', handleTaskSyncUpdate as EventListener)
    }
  }, [])

  const initializeData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Load data from Supabase or fallback to localStorage
      await loadOrCreateInitialData()
      setIsInitialized(true)
    } catch (error) {
      console.error('Error initializing data:', error)
      toast.error('خطأ في تحميل البيانات')
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrCreateInitialData = async () => {
    // Load from localStorage only - database sync disabled
    loadFromLocalStorage()
  }

  const loadFromLocalStorage = () => {
    const localTasks = localStorage.getItem('tasks')
    const localAchievements = localStorage.getItem('achievements')
    const localRewards = localStorage.getItem('customRewards')
    const localStats = localStorage.getItem('userStats')

    if (localTasks) {
      setTasks(JSON.parse(localTasks))
    }
    if (localAchievements) {
      setAchievements(JSON.parse(localAchievements))
    }
    if (localRewards) {
      setCustomRewards(JSON.parse(localRewards))
    }
    if (localStats) {
      setUserStats(JSON.parse(localStats))
    }
  }

  // Transform Supabase task to our Task type
  const transformSupabaseTask = (dbTask: any): Task => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    difficulty: dbTask.difficulty,
    priority: dbTask.priority,
    completed: dbTask.completed,
    deadline: dbTask.deadline ? new Date(dbTask.deadline) : undefined,
    points: dbTask.points,
    category: dbTask.category,
    estimatedTime: dbTask.estimated_time,
    isRecurring: dbTask.is_recurring,
    recurringType: dbTask.recurring_type,
    createdAt: new Date(dbTask.created_at),
    completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : undefined,
    pomodoroSessions: dbTask.pomodoro_sessions
  })

  // Task functions - using localStorage only
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      completedAt: undefined
    }

    const updatedTasks = [...tasks, newTask]
    setTasks(updatedTasks)
    localStorage.setItem('tasks', JSON.stringify(updatedTasks))
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    )
    setTasks(updatedTasks)
    localStorage.setItem('tasks', JSON.stringify(updatedTasks))
  }

  const deleteTask = async (id: string) => {
    const filteredTasks = tasks.filter(task => task.id !== id)
    setTasks(filteredTasks)
    localStorage.setItem('tasks', JSON.stringify(filteredTasks))
  }

  const completeTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    await updateTask(id, {
      completed: !task.completed,
      completedAt: !task.completed ? new Date() : undefined
    })

    // Update user stats if completing a task
    if (!task.completed && userStats) {
      await updateUserStats({
        totalTasksCompleted: userStats.totalTasksCompleted + 1,
        experience: userStats.experience + task.points
      })
    }
  }

  // Other CRUD functions would be implemented similarly...
  const addAchievement = async (achievementData: Omit<Achievement, 'id'>) => {
    // Implementation similar to addTask
  }

  const updateAchievement = async (id: string, updates: Partial<Achievement>) => {
    // Implementation similar to updateTask
  }

  const addCustomReward = async (rewardData: Omit<CustomReward, 'id' | 'createdAt'>) => {
    // Implementation similar to addTask
  }

  const updateCustomReward = async (id: string, updates: Partial<CustomReward>) => {
    // Implementation similar to updateTask
  }

  const deleteCustomReward = async (id: string) => {
    // Implementation similar to deleteTask
  }

  const claimReward = async (id: string) => {
    await updateCustomReward(id, {
      isClaimed: true,
      claimedAt: new Date()
    })
  }

  const updateUserStats = async (updates: Partial<UserStats>) => {
    const newStats = userStats ? { ...userStats, ...updates } : updates as UserStats
    setUserStats(newStats)
    localStorage.setItem('userStats', JSON.stringify(newStats))
  }

  const forceSyncAll = async () => {
    // Sync disabled - using localStorage only
    console.log('Sync disabled, using localStorage only')
  }

  const contextValue: SyncDataContextType = {
    tasks,
    achievements,
    customRewards,
    userStats,
    isLoading,
    isInitialized,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    addAchievement,
    updateAchievement,
    addCustomReward,
    updateCustomReward,
    deleteCustomReward,
    claimReward,
    updateUserStats,
    forceSyncAll
  }

  return (
    <SyncDataContext.Provider value={contextValue}>
      {children}
    </SyncDataContext.Provider>
  )
}

export const useSyncData = () => {
  const context = useContext(SyncDataContext)
  if (context === undefined) {
    throw new Error('useSyncData must be used within a SyncDataProvider')
  }
  return context
}
