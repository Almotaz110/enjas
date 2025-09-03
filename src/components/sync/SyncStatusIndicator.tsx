import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'
import { useSyncManager } from '@/hooks/useSyncManager'
import { useDeviceManager } from '@/hooks/useDeviceManager'
import { cn } from '@/lib/utils'

interface SyncStatusIndicatorProps {
  className?: string
  showDetails?: boolean
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  className,
  showDetails = false 
}) => {
  const { syncStatus, forceSyncAll } = useSyncManager()
  const { currentDevice } = useDeviceManager()

  const getDeviceIcon = () => {
    if (!currentDevice) return <Monitor className="h-4 w-4" />
    
    switch (currentDevice.device_type) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getSyncStatusBadge = () => {
    if (syncStatus.isSyncing) {
      return (
        <Badge variant="secondary" className="gap-2">
          <RefreshCw className="h-3 w-3 animate-spin" />
          جاري المزامنة...
        </Badge>
      )
    }

    if (!syncStatus.isOnline) {
      return (
        <Badge variant="destructive" className="gap-2">
          <WifiOff className="h-3 w-3" />
          غير متصل
        </Badge>
      )
    }

    if (syncStatus.conflictCount > 0) {
      return (
        <Badge variant="destructive" className="gap-2">
          <AlertTriangle className="h-3 w-3" />
          {syncStatus.conflictCount} تعارض
        </Badge>
      )
    }

    if (syncStatus.hasChanges) {
      return (
        <Badge variant="outline" className="gap-2">
          <Clock className="h-3 w-3" />
          تغييرات معلقة
        </Badge>
      )
    }

    return (
      <Badge variant="default" className="gap-2 bg-green-500 hover:bg-green-600">
        <CheckCircle className="h-3 w-3" />
        متزامن
      </Badge>
    )
  }

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) return 'لم يتم المزامنة بعد'
    
    const now = new Date()
    const lastSync = syncStatus.lastSyncTime
    const diffMs = now.getTime() - lastSync.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    return `منذ ${diffDays} يوم`
  }

  if (!showDetails) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", className)}>
            {getDeviceIcon()}
            {syncStatus.isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            {getSyncStatusBadge()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          <div className="text-sm space-y-1">
            <p>آخر مزامنة: {formatLastSync()}</p>
            {currentDevice && (
              <p>الجهاز: {currentDevice.device_name}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getDeviceIcon()}
          <span className="text-sm font-medium">حالة المزامنة</span>
        </div>
        {getSyncStatusBadge()}
      </div>

      {syncStatus.isSyncing && (
        <div className="space-y-2">
          <Progress value={syncStatus.syncProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {syncStatus.syncProgress}% مكتمل
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
        <div>
          <p>آخر مزامنة:</p>
          <p className="font-medium">{formatLastSync()}</p>
        </div>
        <div>
          <p>الحالة:</p>
          <p className="font-medium">
            {syncStatus.isOnline ? 'متصل' : 'غير متصل'}
          </p>
        </div>
      </div>

      {syncStatus.isOnline && !syncStatus.isSyncing && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={forceSyncAll}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 ml-2" />
          مزامنة الآن
        </Button>
      )}

      {currentDevice && (
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>الجهاز الحالي: {currentDevice.device_name}</p>
          <p>المنصة: {currentDevice.platform}</p>
        </div>
      )}
    </div>
  )
}