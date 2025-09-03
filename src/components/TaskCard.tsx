
import { useState } from 'react';
import { Task } from '@/types/task';
import { Check, Clock, Trash, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskCard = ({ task, onComplete, onDelete, onEdit }: TaskCardProps) => {
  const [isHovering, setIsHovering] = useState(false);
  
  const difficultyClasses = {
    easy: 'bg-secondary/20 text-secondary-foreground border border-secondary/30',
    medium: 'bg-accent/20 text-accent-foreground border border-accent/30',
    hard: 'bg-destructive/20 text-destructive-foreground border border-destructive/30',
  };
  
  const categoryIcons = {
    daily: '☀️',
    weekly: '📅',
    personal: '👤',
    work: '💼',
    custom: '✨',
  };
  
  return (
    <div 
      className={cn(
        "task-card p-4 mb-4 border-r-4",
        task.completed ? "task-card-completed border-r-primary/50" : 
        task.difficulty === 'easy' ? 'border-r-secondary' : 
        task.difficulty === 'medium' ? 'border-r-accent' : 'border-r-destructive',
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-start justify-between">
        <div className={cn("flex-1", task.completed && "line-through opacity-70")}>
          <div className="flex items-center gap-2 mb-1 rtl">
            <span className="text-lg font-semibold">{task.title}</span>
            <span>{categoryIcons[task.category]}</span>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground rtl">{task.description}</p>
          )}
        </div>
        
        <Button
          variant={task.completed ? "secondary" : "default"}
          size="sm"
          className={cn(
            "h-8 w-8 rounded-full p-0 ml-2",
            task.completed && "bg-primary hover:bg-primary/90"
          )}
          onClick={() => onComplete(task.id)}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <span className={cn("text-xs px-2 py-0.5 rounded-full", difficultyClasses[task.difficulty])}>
            {task.difficulty === 'easy' ? 'سهل' : task.difficulty === 'medium' ? 'متوسط' : 'صعب'}
          </span>
          <span className="badge-points rtl">
            {task.points} نقطة
          </span>
          {task.deadline && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(task.deadline).toLocaleDateString('ar-SA')}
            </div>
          )}
        </div>
        
        {isHovering && (
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-full p-0"
              onClick={() => onEdit(task)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-full p-0 text-destructive hover:text-destructive/90"
              onClick={() => onDelete(task.id)}
            >
              <Trash className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
