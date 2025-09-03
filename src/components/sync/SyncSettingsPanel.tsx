import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Settings, Shield, CheckCircle, Trash2, Smartphone } from 'lucide-react'
import { useSyncManager } from '@/hooks/useSyncManager'
import { useDeviceManager } from '@/hooks/useDeviceManager'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface SyncSettingsPanelProps {
  className?: string
}

export const SyncSettingsPanel: React.FC<SyncSettingsPanelProps> = ({ className }) => {
  const { syncStatus, forceSyncAll, getConflicts, handleConflict } = useSyncManager()
  const { devices, removeDevice, isLoading } = useDeviceManager()
  const { user } = useAuth()

  const [conflicts, setConflicts] = useState([])
  const [syncSettings, setSyncSettings] = useState({
    frequency: 'manual' as const,
    autoSyncOnWifi: true,
    autoSyncOnMobile: false
  })

  const updateSyncSettings = (settings: any) => {
    setSyncSettings(prev => ({ ...prev, ...settings }))
    console.log('Sync settings update disabled')
  }

  const loadConflicts = async () => {
    const conflictData = await getConflicts()
    setConflicts(conflictData)
  }

  useEffect(() => {
    loadConflicts()
  }, [])

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>يجب تسجيل الدخول لإدارة إعدادات المزامنة</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إعدادات المزامنة
            </CardTitle>
            <CardDescription>المزامنة معطلة حاليا - يتم استخدام التخزين المحلي فقط</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={forceSyncAll} disabled={syncStatus.isSyncing} className="w-full">
              <RefreshCw className={cn("h-4 w-4 mr-2", syncStatus.isSyncing && "animate-spin")} />
              فرض المزامنة
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}