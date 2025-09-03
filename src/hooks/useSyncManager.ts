import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useDeviceManager } from './useDeviceManager'
import { toast } from 'sonner'
import { Task, Achievement, CustomReward, UserStats } from '@/types/task'

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: Date | null
  syncProgress: number
  hasChanges: boolean
  conflictCount: number
}

export interface ConflictResolution {
  strategy: 'local_wins' | 'remote_wins' | 'manual' | 'merged'
  manualData?: any
  mergeData?: any
}

export const useSyncManager = () => {
  const { user } = useAuth()
  const { getCurrentDevice } = useDeviceManager()
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    syncProgress: 0,
    hasChanges: false,
    conflictCount: 0
  })

  // Sync disabled - using localStorage only
  const syncAllData = async () => {
    console.log('Sync disabled - using localStorage only')
  }

  const syncTasks = async () => {
    console.log('Task sync disabled')
  }

  const forceSyncAll = async () => {
    console.log('Force sync disabled')
  }

  const handleConflict = async (conflictId: string, resolution: ConflictResolution) => {
    console.log('Conflict handling disabled')
  }

  const getConflicts = async () => {
    return []
  }

  // Only keep online status tracking
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    syncStatus,
    syncAllData,
    syncTasks,
    forceSyncAll,
    handleConflict,
    getConflicts
  }
}
