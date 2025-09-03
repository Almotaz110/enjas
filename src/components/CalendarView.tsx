import { useState } from 'react';
import { Task } from '@/types/task';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export const CalendarView = ({ tasks, onTaskClick }: CalendarViewProps) => {
  const { t, language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Get tasks for selected date
  const selectedDateTasks = tasks.filter(task => {
    if (task.deadline && isSameDay(new Date(task.deadline), selectedDate)) {
      return true;
    }
    if (task.category === 'daily') {
      return true;
    }
    return isSameDay(new Date(task.createdAt), selectedDate);
  });

  // Get all days in current month with task counts
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (task.deadline && isSameDay(new Date(task.deadline), date)) {
        return true;
      }
      if (task.category === 'daily') {
        return true;
      }
      return isSameDay(new Date(task.createdAt), date);
    });
  };

  const getDayIndicator = (date: Date) => {
    const dayTasks = getTasksForDay(date);
    const urgentTasks = dayTasks.filter(t => t.priority === 'urgent' && !t.completed);
    const overdueTasks = dayTasks.filter(t => 
      t.deadline && 
      new Date(t.deadline) < new Date() && 
      !t.completed
    );

    if (overdueTasks.length > 0) return { 
      color: 'bg-destructive text-destructive-foreground', 
      count: overdueTasks.length 
    };
    if (urgentTasks.length > 0) return { 
      color: 'bg-secondary text-secondary-foreground', 
      count: urgentTasks.length 
    };
    if (dayTasks.length > 0) return { 
      color: 'bg-primary text-primary-foreground', 
      count: dayTasks.length 
    };
    return null;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '⚠️';
      case 'normal': return '📋';
      case 'low': return '⏳';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'normal': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t('interactiveCalendar')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  {format(currentMonth, 'MMMM yyyy', { locale: language === 'ar' ? ar : undefined })}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={language === 'ar' ? ar : undefined}
                className="rounded-md border w-full"
                components={{
                  DayContent: ({ date }) => {
                    const indicator = getDayIndicator(date);
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span>{date.getDate()}</span>
                        {indicator && (
                          <div className={`absolute -top-1 -right-1 ${indicator.color} text-xs rounded-full w-4 h-4 flex items-center justify-center`}>
                            {indicator.count}
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />
            </div>

            {/* Selected Date Tasks */}
            <div className="space-y-4">
              <h4 className="font-medium text-right">
                {t('tasksForDate')} {format(selectedDate, 'dd MMMM', { locale: language === 'ar' ? ar : undefined })}
              </h4>
              
              {selectedDateTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t('noTasksForDate')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedDateTasks.map((task) => (
                    <Card 
                      key={task.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        task.completed ? 'opacity-60' : ''
                      }`}
                      onClick={() => onTaskClick?.(task)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-right flex-1">
                            <h5 className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                              {task.title}
                            </h5>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2 justify-end">
                              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                {getPriorityIcon(task.priority)} {task.priority === 'urgent' ? t('urgentPriority') : task.priority === 'normal' ? t('normalPriority') : t('lowPriority')}
                              </Badge>
                              {task.estimatedTime && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {task.estimatedTime} {t('minutes')}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {task.deadline && new Date(task.deadline) < new Date() && !task.completed && (
                            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {tasks.filter(t => t.priority === 'urgent' && !t.completed).length}
              </div>
              <p className="text-sm text-muted-foreground">{t('urgentTasksCard')} ⚠️</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {tasks.filter(t => t.priority === 'normal' && !t.completed).length}
              </div>
              <p className="text-sm text-muted-foreground">{t('normalTasksCard')} 📋</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {tasks.filter(t => t.priority === 'low' && !t.completed).length}
              </div>
              <p className="text-sm text-muted-foreground">{t('deferableTasksCard')} ⏳</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {tasks.filter(t => 
                  t.deadline && 
                  new Date(t.deadline) < new Date() && 
                  !t.completed
                ).length}
              </div>
              <p className="text-sm text-muted-foreground">{t('overdueTasksCard')} 🚨</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};