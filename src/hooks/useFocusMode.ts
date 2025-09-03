import { useState, useEffect, useCallback } from 'react';

export interface FocusModeConfig {
  hideHeader: boolean;
  hideNavigation: boolean;
  hideSidebar: boolean;
  hideNotifications: boolean;
  dimBackground: boolean;
  muteAudio: boolean;
  blockWebsites: string[];
  duration?: number; // in minutes
}

const defaultConfig: FocusModeConfig = {
  hideHeader: true,
  hideNavigation: false,
  hideSidebar: true,
  hideNotifications: true,
  dimBackground: true,
  muteAudio: false,
  blockWebsites: [],
  duration: 25 // Default Pomodoro duration
};

export const useFocusMode = (initialConfig: Partial<FocusModeConfig> = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [config, setConfig] = useState<FocusModeConfig>({ 
    ...defaultConfig, 
    ...initialConfig 
  });
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Focus mode timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && config.duration && timeRemaining !== null) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            exitFocusMode();
            return null;
          }
          return prev - 1;
        });
      }, 60000); // Update every minute
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, config.duration, timeRemaining]);

  // Apply focus mode styles
  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;

    if (isActive) {
      if (config.dimBackground) {
        body.classList.add('focus-mode-dim');
      }
      
      if (config.hideNotifications) {
        // Temporarily disable toast notifications
        body.classList.add('focus-mode-no-notifications');
      }

      // Apply custom CSS variables for focus mode
      root.style.setProperty('--focus-mode-opacity', config.dimBackground ? '0.3' : '1');
      
      // Apply backdrop filter for better focus
      body.classList.add('focus-mode-active');
      
    } else {
      body.classList.remove('focus-mode-dim', 'focus-mode-no-notifications', 'focus-mode-active');
      root.style.removeProperty('--focus-mode-opacity');
    }

    return () => {
      body.classList.remove('focus-mode-dim', 'focus-mode-no-notifications', 'focus-mode-active');
      root.style.removeProperty('--focus-mode-opacity');
    };
  }, [isActive, config]);

  // Prevent tab switching in focus mode
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isActive && document.hidden) {
        // Log focus break (optional)
        console.log('🚨 Focus mode interrupted - tab switched');
      }
    };

    if (isActive) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);

  // Keyboard shortcuts for focus mode
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Exit focus mode with Escape
      if (event.key === 'Escape' && isActive) {
        exitFocusMode();
      }
      
      // Toggle focus mode with F11
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFocusMode();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isActive]);

  const enterFocusMode = useCallback((customConfig?: Partial<FocusModeConfig>) => {
    const finalConfig = { ...config, ...customConfig };
    setConfig(finalConfig);
    setIsActive(true);
    setStartTime(new Date());
    
    if (finalConfig.duration) {
      setTimeRemaining(finalConfig.duration);
    }

    // Save to localStorage for persistence
    localStorage.setItem('focusModeConfig', JSON.stringify(finalConfig));
    
    // Optional: Show focus mode notification
    if (!finalConfig.hideNotifications) {
      // toast.success('🎯 وضع التركيز مُفعل', { duration: 2000 });
    }
  }, [config]);

  const exitFocusMode = useCallback(() => {
    setIsActive(false);
    setTimeRemaining(null);
    setStartTime(null);
    
    // Optional: Show exit notification
    // toast.info('🎯 تم إنهاء وضع التركيز', { duration: 2000 });
  }, []);

  const toggleFocusMode = useCallback(() => {
    if (isActive) {
      exitFocusMode();
    } else {
      enterFocusMode();
    }
  }, [isActive, enterFocusMode, exitFocusMode]);

  const updateConfig = useCallback((updates: Partial<FocusModeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    localStorage.setItem('focusModeConfig', JSON.stringify({ ...config, ...updates }));
  }, [config]);

  const getTimeRemaining = useCallback(() => {
    if (!timeRemaining || !startTime) return null;
    
    return {
      minutes: timeRemaining,
      percentage: config.duration ? ((config.duration - timeRemaining) / config.duration) * 100 : 0,
      elapsed: config.duration ? config.duration - timeRemaining : 0
    };
  }, [timeRemaining, startTime, config.duration]);

  // CSS classes for conditional hiding
  const getFocusClasses = () => ({
    header: config.hideHeader && isActive ? 'hidden' : '',
    navigation: config.hideNavigation && isActive ? 'hidden' : '',
    sidebar: config.hideSidebar && isActive ? 'hidden' : '',
    notifications: config.hideNotifications && isActive ? 'pointer-events-none opacity-0' : '',
    background: config.dimBackground && isActive ? 'focus-mode-dimmed' : ''
  });

  return {
    isActive,
    config,
    timeRemaining: getTimeRemaining(),
    startTime,
    enterFocusMode,
    exitFocusMode,
    toggleFocusMode,
    updateConfig,
    getFocusClasses
  };
};

export default useFocusMode;