import { useState } from 'react';
import { UserStats } from '@/types/task';
import { Settings, User, Menu, List, Award, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface HeaderProps {
  stats: UserStats;
  onOpenTaskDrawer: () => void;
  onOpenAchievementsDrawer: () => void;
  onOpenSettings: () => void;
  user?: SupabaseUser | null;
  onSignOut?: () => void;
}
export const Header = ({
  stats,
  onOpenTaskDrawer,
  onOpenAchievementsDrawer,
  onOpenSettings,
  user,
  onSignOut
}: HeaderProps) => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { isNative, platform } = useMobileCapabilities();
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-10 py-4 px-6 shadow-md border-b border-border">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          {isMobile && <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)} className="mr-2">
              <Menu className="h-5 w-5" />
            </Button>}
          
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <div className="hidden md:flex items-center space-x-2 bg-muted/50 px-3 py-1 rounded-full">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          )}
          
          <div className="hidden md:flex items-center space-x-2 bg-muted/50 px-3 py-1 rounded-full">
            <div className="text-xs text-muted-foreground">{t('level') as string}</div>
            <div className="text-sm font-bold text-primary">{stats.level}</div>
          </div>
          
          <div className="hidden md:block relative h-6 w-36 bg-muted rounded-full overflow-hidden">
            <div className="absolute h-full bg-gradient-to-r from-secondary via-secondary to-secondary bg-[length:200%_100%] animate-shimmer" style={{
            width: `${stats.experience / stats.experienceToNextLevel * 100}%`
          }} />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
              {stats.experience}/{stats.experienceToNextLevel} {t('experience') as string}
            </div>
          </div>
          

          <Button variant="outline" size="icon" onClick={onOpenTaskDrawer} className="bg-background">
            <List className="h-5 w-5" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={onOpenAchievementsDrawer} className="bg-background">
            <Award className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <Settings className="h-5 w-5" />
          </Button>
          
          {user && onSignOut && (
            <Button variant="outline" size="icon" onClick={onSignOut} title={t('signOut') as string}>
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      {isMobile && menuOpen && <div className="absolute top-full left-0 right-0 bg-popover shadow-lg border-b border-border animate-fade-in">
          <div className="p-4 flex flex-col space-y-2">
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted transition-colors">
              <span className="text-sm font-medium">{t('level') as string} {stats.level}</span>
              <div className="w-24 h-4 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-secondary to-secondary" style={{
              width: `${stats.experience / stats.experienceToNextLevel * 100}%`
            }} />
              </div>
            </div>
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted transition-colors">
              <span className="text-sm font-medium">{t('dailyStreak') as string}</span>
              <span className="text-sm font-bold">{stats.streak} 🔥</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted transition-colors">
              <span className="text-sm font-medium">{t('completedTasksCount') as string}</span>
              <span className="text-sm font-bold">{stats.totalTasksCompleted} ✅</span>
            </div>
          </div>
        </div>}
    </header>;
};