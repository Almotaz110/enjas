import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TabValue = 'dashboard' | 'tasks' | 'calendar' | 'rewards' | 'study' | 'pomodoro' | 'music';

interface NavigationContextType {
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');

  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};