
import { Achievement } from '@/types/task';
import { Progress } from '@/components/ui/progress';
import { Award, Lock } from 'lucide-react';

interface AchievementListProps {
  achievements: Achievement[];
}

export const AchievementList = ({ achievements }: AchievementListProps) => {
  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold mb-6 rtl">الإنجازات</h2>
      
      <div className="space-y-4">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id}
            className={`relative p-4 border rounded-lg ${
              achievement.unlocked 
                ? 'bg-accent/10 border-border' 
                : 'bg-muted border-border'
            }`}
          >
            <div className="flex items-center">
              <div className={`mr-3 p-3 rounded-full ${
                achievement.unlocked 
                  ? 'bg-accent/20 text-accent-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {achievement.unlocked ? (
                  <Award className="h-6 w-6" />
                ) : (
                  <Lock className="h-6 w-6" />
                )}
              </div>
              
              <div className="flex-1 rtl">
                <h3 className={`font-bold ${
                  achievement.unlocked ? 'text-amber-800 dark:text-amber-200' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {achievement.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {achievement.description}
                </p>
                
                <div className="mt-2">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span>{achievement.currentProgress} / {achievement.requirement}</span>
                    <span>{Math.floor((achievement.currentProgress / achievement.requirement) * 100)}%</span>
                  </div>
                  <Progress value={(achievement.currentProgress / achievement.requirement) * 100} />
                </div>
              </div>
            </div>
            
            {achievement.unlocked && (
              <div className="absolute top-0 right-0 transform -translate-y-2 translate-x-2">
                <span className="text-xl">🏆</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
