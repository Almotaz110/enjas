import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface UserDevice {
  id: string
  user_id: string
  device_name: string
  device_type: 'desktop' | 'mobile' | 'tablet' | 'web'
  platform: string
  browser: string | null
  device_id: string
  last_sync_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const useDeviceManager = () => {
  const { user } = useAuth()
  const [devices, setDevices] = useState<UserDevice[]>([])
  const [currentDevice, setCurrentDevice] = useState<UserDevice | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Device management disabled - using localStorage only
  const registerCurrentDevice = async () => {
    console.log('Device registration disabled')
  }

  const getCurrentDevice = () => currentDevice

  const updateDeviceActivity = async (deviceId: string, isActive: boolean) => {
    console.log('Device activity update disabled')
  }

  const getActiveDevices = () => devices.filter(d => d.is_active)

  const getAllDevices = () => devices

  const removeDevice = async (deviceId: string) => {
    console.log('Device removal disabled')
  }

  const syncDeviceData = async () => {
    console.log('Device sync disabled')
  }

  // Empty effects since we disabled database functionality
  useEffect(() => {
    // No device registration
  }, [user])

  return {
    devices,
    currentDevice,
    isLoading,
    registerCurrentDevice,
    getCurrentDevice,
    updateDeviceActivity,
    getActiveDevices,
    getAllDevices,
    removeDevice,
    syncDeviceData
  }
}