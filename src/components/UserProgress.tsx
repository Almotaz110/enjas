import { UserStats } from '@/types/task';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Award, CheckCircle } from 'lucide-react';
interface UserProgressProps {
  stats: UserStats;
}
export const UserProgress = ({
  stats
}: UserProgressProps) => {
  return <div className="bg-card rounded-lg shadow-md border border-border p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 rtl">تقدمك</h2>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="w-full sm:w-1/2">
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary">{stats.level}</span>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-muted rounded-full p-1 border-2 border-background">
                <Trophy className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <h3 className="text-lg font-bold mt-3 rtl">المستوى {stats.level}</h3>
          </div>
          
          <div className="w-full mb-4">
            <div className="flex justify-between items-center mb-2 rtl">
              <span className="text-sm">الخبرة</span>
              <span className="text-sm font-medium">{stats.experience}/{stats.experienceToNextLevel}</span>
            </div>
            <Progress value={stats.experience / stats.experienceToNextLevel * 100} />
          </div>
        </div>
        
        <div className="w-full sm:w-1/2 grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 flex items-center rtl">
            <div className="mr-4 p-2 bg-secondary/20 rounded-full">
              <Flame className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">السجل اليومي</div>
              <div className="text-xl font-bold">{stats.streak} 🔥</div>
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 flex items-center rtl">
            <div className="mr-4 p-2 bg-primary/20 rounded-full">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">المهام المكتملة</div>
              <div className="text-xl font-bold">{stats.totalTasksCompleted}</div>
            </div>
          </div>
          
          
        </div>
      </div>
    </div>;
};