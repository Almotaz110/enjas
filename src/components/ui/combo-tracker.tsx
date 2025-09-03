import React, { useState, useEffect } from 'react';
import { Flame, Timer, X } from 'lucide-react';
import { Card, CardContent } from './card';
import { Progress } from './progress';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { ComboTracker as ComboData } from '@/hooks/useGamification';

interface ComboTrackerProps {
  combo: ComboData;
  timeRemaining: number;
  onDismiss?: () => void;
  className?: string;
}

const formatTime = (milliseconds: number) => {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const ComboTracker: React.FC<ComboTrackerProps> = ({
  combo,
  timeRemaining,
  onDismiss,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    setIsVisible(combo.isActive && combo.count > 1);
  }, [combo.isActive, combo.count]);

  useEffect(() => {
    if (combo.count > 1) {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 600);
      return () => clearTimeout(timer);
    }
  }, [combo.count]);

  if (!isVisible) return null;

  const timeProgress = timeRemaining / (30 * 60 * 1000) * 100; // 30 minutes max
  const multiplierColor = combo.multiplier >= 3 ? 'text-red-500' :
                         combo.multiplier >= 2 ? 'text-orange-500' :
                         combo.multiplier >= 1.5 ? 'text-yellow-500' : 'text-blue-500';

  const bgGradient = combo.multiplier >= 3 ? 'from-red-500/10 to-red-600/10' :
                    combo.multiplier >= 2 ? 'from-orange-500/10 to-orange-600/10' :
                    combo.multiplier >= 1.5 ? 'from-yellow-500/10 to-yellow-600/10' : 
                    'from-blue-500/10 to-blue-600/10';

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 z-50 shadow-lg border-2 backdrop-blur-sm transition-all duration-300",
      `bg-gradient-to-br ${bgGradient}`,
      pulseAnimation && "animate-pulse",
      className
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-full animate-pulse",
              combo.multiplier >= 3 ? 'bg-red-500/20' :
              combo.multiplier >= 2 ? 'bg-orange-500/20' :
              combo.multiplier >= 1.5 ? 'bg-yellow-500/20' : 'bg-blue-500/20'
            )}>
              <Flame className={cn("h-5 w-5", multiplierColor)} />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                كومبو نشط!
              </h3>
              <p className="text-xs text-muted-foreground">
                استمر في الإنجاز
              </p>
            </div>
          </div>
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Combo Stats */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className={cn("text-2xl font-bold", multiplierColor)}>
              {combo.count}
            </div>
            <div className="text-xs text-muted-foreground">
              متتالية
            </div>
          </div>
          
          <div className="text-center">
            <div className={cn("text-lg font-bold", multiplierColor)}>
              x{combo.multiplier.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              مضاعف
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center gap-1 text-sm">
              <Timer className="h-3 w-3" />
              <span className="font-mono">
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              متبقي
            </div>
          </div>
        </div>

        {/* Time Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">الوقت المتبقي</span>
            <Badge variant="secondary" className="text-xs">
              {Math.ceil(timeRemaining / (1000 * 60))} دقيقة
            </Badge>
          </div>
          <Progress 
            value={timeProgress} 
            className="h-2"
          />
        </div>

        {/* Motivational Message */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {combo.count >= 5 ? '🔥 أنت في المنطقة!' :
             combo.count >= 3 ? '⚡ استمر هكذا!' :
             '🚀 ابدأ المتتالية!'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};