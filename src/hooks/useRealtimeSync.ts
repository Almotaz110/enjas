import { useEffect, useState, useCallback } from 'react';
import { Task, UserStats, Achievement } from '@/types/task';
import { toast } from 'sonner';

export interface SyncStatus {
  isConnected: boolean;
  lastSyncTime: Date | null;
  syncInProgress: boolean;
  error: string | null;
}

export const useRealtimeSync = (
  userId: string | null,
  localData: {
    tasks: Task[];
    stats: UserStats;
    achievements: Achievement[];
  },
  onDataUpdate: (data: {
    tasks?: Task[];
    stats?: UserStats;
    achievements?: Achievement[];
  }) => void,
  enabled: boolean = true
) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    lastSyncTime: null,
    syncInProgress: false,
    error: null
  });

  // Simulate connection for now (can be extended later with actual Supabase tables)
  useEffect(() => {
    if (!enabled || !userId) return;

    setSyncStatus(prev => ({ ...prev, isConnected: true }));
    
    // Simulate periodic sync
    const syncInterval = setInterval(() => {
      if (Math.random() > 0.95) { // 5% chance of sync event
        performBackgroundSync();
      }
    }, 5000);

    return () => {
      clearInterval(syncInterval);
      setSyncStatus(prev => ({ ...prev, isConnected: false }));
    };
  }, [enabled, userId]);

  const performBackgroundSync = useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        syncInProgress: false,
        error: null
      }));

      // Only show sync notification occasionally
      if (Math.random() > 0.7) {
        toast.success('🔄 تم تحديث البيانات', { duration: 1500 });
      }

    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  }, []);

  const syncToRemote = useCallback(async (data: {
    tasks?: Task[];
    stats?: UserStats;
    achievements?: Achievement[];
  }) => {
    if (!userId || !enabled) return;

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Simulate remote sync (replace with actual Supabase calls later)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Save to localStorage as backup
      if (data.tasks) localStorage.setItem('tasks-backup', JSON.stringify(data.tasks));
      if (data.stats) localStorage.setItem('stats-backup', JSON.stringify(data.stats));
      if (data.achievements) localStorage.setItem('achievements-backup', JSON.stringify(data.achievements));

      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        syncInProgress: false,
        error: null
      }));

    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        error: error instanceof Error ? error.message : 'Remote sync failed'
      }));
    }
  }, [userId, enabled]);

  const performInitialSync = useCallback(async () => {
    if (!userId) return;

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Try to restore from backup
      const tasksBackup = localStorage.getItem('tasks-backup');
      const statsBackup = localStorage.getItem('stats-backup');
      const achievementsBackup = localStorage.getItem('achievements-backup');

      const restoredData: any = {};
      
      if (tasksBackup) restoredData.tasks = JSON.parse(tasksBackup);
      if (statsBackup) restoredData.stats = JSON.parse(statsBackup);
      if (achievementsBackup) restoredData.achievements = JSON.parse(achievementsBackup);

      if (Object.keys(restoredData).length > 0) {
        onDataUpdate(restoredData);
        toast.success('📱 تم استرداد البيانات المحفوظة', { duration: 2000 });
      }

      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime: new Date(),
        syncInProgress: false,
        error: null
      }));

    } catch (error) {
      console.error('❌ Sync error:', error);
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  }, [userId, onDataUpdate]);

  return {
    syncStatus,
    syncToRemote,
    performInitialSync
  };
};

export default useRealtimeSync;