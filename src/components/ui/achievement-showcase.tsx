import React, { useState } from 'react';
import { Trophy, Lock, Star, Calendar, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Progress } from './progress';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { AchievementProgress } from '@/hooks/useGamification';

interface AchievementShowcaseProps {
  achievements: AchievementProgress[];
  className?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'productivity':
      return Zap;
    case 'consistency':
      return Calendar;
    case 'mastery':
      return Star;
    case 'social':
      return Users;
    default:
      return Trophy;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'productivity':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'consistency':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'mastery':
      return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    case 'social':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    default:
      return 'text-primary bg-primary/10 border-primary/20';
  }
};

export const AchievementShowcase: React.FC<AchievementShowcaseProps> = ({
  achievements,
  className
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const categories = ['all', 'productivity', 'consistency', 'mastery', 'social'];
  const categoryLabels = {
    all: 'الكل',
    productivity: 'الإنتاجية',
    consistency: 'الثبات',
    mastery: 'الإتقان',
    social: 'الاجتماعية'
  };

  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    const completionMatch = !showCompleted || achievement.completed;
    return categoryMatch && completionMatch;
  });

  const completedCount = achievements.filter(a => a.completed).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            الإنجازات
          </CardTitle>
          <Badge variant="secondary">
            {completedCount} من {totalCount}
          </Badge>
        </div>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>التقدم العام</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map(category => {
            const IconComponent = getCategoryIcon(category);
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs"
              >
                {category !== 'all' && <IconComponent className="h-3 w-3 mr-1" />}
                {categoryLabels[category as keyof typeof categoryLabels]}
              </Button>
            );
          })}
        </div>

        {/* Show Completed Filter */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className={cn(
              "text-xs",
              showCompleted && "bg-green-500/10 text-green-600 border-green-500/20"
            )}
          >
            {showCompleted ? 'إظهار الكل' : 'إظهار المكتملة فقط'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredAchievements.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد إنجازات في هذا التصنيف</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredAchievements.map((achievement) => {
              const IconComponent = getCategoryIcon(achievement.category);
              const progressPercentage = (achievement.progress / achievement.target) * 100;

              return (
                <Card
                  key={achievement.id}
                  className={cn(
                    "relative transition-all duration-200 hover:shadow-md",
                    achievement.completed
                      ? "bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20"
                      : "hover:border-primary/30",
                    getCategoryColor(achievement.category)
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Achievement Icon */}
                      <div className={cn(
                        "text-2xl p-2 rounded-full border",
                        achievement.completed
                          ? "bg-green-500/10 border-green-500/20 grayscale-0"
                          : "bg-muted/50 border-muted grayscale opacity-60"
                      )}>
                        {achievement.icon}
                      </div>

                      {/* Achievement Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn(
                            "font-semibold text-sm",
                            achievement.completed && "text-green-700 dark:text-green-400"
                          )}>
                            {achievement.name}
                          </h4>
                          <IconComponent className="h-3 w-3 opacity-60" />
                          {achievement.completed && (
                            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                              مكتمل
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mb-3">
                          {achievement.description}
                        </p>

                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {achievement.progress} / {achievement.target}
                            </span>
                            <span className={cn(
                              "font-medium",
                              achievement.completed && "text-green-600"
                            )}>
                              {Math.round(progressPercentage)}%
                            </span>
                          </div>
                          <Progress 
                            value={progressPercentage} 
                            className={cn(
                              "h-1.5",
                              achievement.completed && "bg-green-500/20"
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Lock Overlay for Incomplete */}
                    {!achievement.completed && achievement.progress === 0 && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};