import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Target, Gift, X, Flame } from 'lucide-react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { GameEvent } from '@/hooks/useGamification';

interface GameEventsFeedProps {
  events: GameEvent[];
  onClearEvents?: () => void;
  className?: string;
  maxVisible?: number;
}

const getEventIcon = (type: GameEvent['type']) => {
  switch (type) {
    case 'task_completed':
      return Target;
    case 'streak_achieved':
      return Flame;
    case 'level_up':
      return Trophy;
    case 'achievement_unlocked':
      return Gift;
    case 'combo_bonus':
      return Zap;
    default:
      return Target;
  }
};

const getEventColor = (type: GameEvent['type']) => {
  switch (type) {
    case 'task_completed':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'streak_achieved':
      return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'level_up':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'achievement_unlocked':
      return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    case 'combo_bonus':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    default:
      return 'text-muted-foreground bg-muted/10 border-muted/20';
  }
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'الآن';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `منذ ${diffInDays} يوم`;
};

export const GameEventsFeed: React.FC<GameEventsFeedProps> = ({
  events,
  onClearEvents,
  className,
  maxVisible = 5
}) => {
  const [visibleEvents, setVisibleEvents] = useState<GameEvent[]>([]);
  const [removingEvents, setRemovingEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    setVisibleEvents(events.slice(0, maxVisible));
  }, [events, maxVisible]);

  const handleRemoveEvent = (eventId: string) => {
    setRemovingEvents(prev => new Set(prev).add(eventId));
    setTimeout(() => {
      setVisibleEvents(prev => prev.filter(event => event.id !== eventId));
      setRemovingEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }, 200);
  };

  if (visibleEvents.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6 text-center">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">
            لا توجد أحداث حديثة
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ابدأ بإنجاز مهامك لرؤية الأحداث هنا!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            الأحداث الأخيرة
          </h3>
          {onClearEvents && visibleEvents.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearEvents}
              className="text-xs"
            >
              مسح الكل
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {visibleEvents.map((event) => {
            const IconComponent = getEventIcon(event.type);
            const isRemoving = removingEvents.has(event.id);

            return (
              <div
                key={event.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                  getEventColor(event.type),
                  event.special && "ring-1 ring-primary/20 shadow-sm",
                  isRemoving && "opacity-0 scale-95"
                )}
              >
                {/* Event Icon */}
                <div className={cn(
                  "p-2 rounded-full border",
                  getEventColor(event.type)
                )}>
                  <IconComponent className="h-4 w-4" />
                </div>

                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">{event.title}</h4>
                    {event.points > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{event.points} نقطة
                      </Badge>
                    )}
                    {event.special && (
                      <Badge className="text-xs bg-gradient-to-r from-secondary to-accent text-secondary-foreground">
                        مميز!
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground truncate">
                    {event.description}
                  </p>
                  
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEvent(event.id)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>

        {events.length > maxVisible && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisibleEvents(events.slice(0, visibleEvents.length + 3))}
              className="text-xs"
            >
              عرض المزيد ({events.length - visibleEvents.length} متبقية)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};