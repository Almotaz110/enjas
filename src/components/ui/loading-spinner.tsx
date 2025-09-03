import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {/* Outer ring */}
        <div className={cn(
          "animate-spin rounded-full border-2 border-transparent border-t-primary",
          sizeClasses[size]
        )}></div>
        
        {/* Inner ring */}
        <div className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          "animate-pulse rounded-full bg-primary/20",
          size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6'
        )}></div>
      </div>
      
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse font-arabic">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;