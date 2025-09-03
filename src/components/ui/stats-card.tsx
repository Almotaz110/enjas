import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  subtitle?: string;
  className?: string;
  gradient?: boolean;
  animated?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  className,
  gradient = false,
  animated = true
}) => {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      gradient && "bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20",
      animated && "hover:scale-105 hover:shadow-lg",
      className
    )}>
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
      )}
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground font-arabic">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn(
            "h-4 w-4 text-muted-foreground",
            animated && "animate-bounce-gentle"
          )} />
        )}
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold text-foreground mb-1 font-arabic">
          {value}
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground font-arabic">
            {subtitle}
          </p>
        )}
        
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <Badge 
              variant={trend.isPositive ? "default" : "destructive"}
              className="text-xs px-1.5 py-0.5"
            >
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </Badge>
            <span className="text-xs text-muted-foreground font-arabic">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;