
import { useState } from 'react';
import { Task, Category } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onAddNew: () => void;
}

export const TaskList = ({ tasks, onComplete, onDelete, onEdit, onAddNew }: TaskListProps) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

  const filteredTasks = tasks.filter(task => {
    const statusMatch = 
      filter === 'all' ? true :
      filter === 'active' ? !task.completed :
      task.completed;
    
    const categoryMatch = 
      categoryFilter === 'all' ? true :
      task.category === categoryFilter;
    
    return statusMatch && categoryMatch;
  });

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold rtl">المهام</h2>
        <Button onClick={onAddNew} className="rtl">
          <PlusCircle className="h-4 w-4 ml-2" />
          مهمة جديدة
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 rtl">
          <TabsTrigger value="all" onClick={() => setFilter('all')}>الكل</TabsTrigger>
          <TabsTrigger value="active" onClick={() => setFilter('active')}>نشطة</TabsTrigger>
          <TabsTrigger value="completed" onClick={() => setFilter('completed')}>مكتملة</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto mb-6">
        <div className="flex space-x-2 rtl">
          <Button 
            variant={categoryFilter === 'all' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setCategoryFilter('all')}
            className="whitespace-nowrap"
          >
            الكل
          </Button>
          <Button 
            variant={categoryFilter === 'daily' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setCategoryFilter('daily')}
            className="whitespace-nowrap"
          >
            يومي ☀️
          </Button>
          <Button 
            variant={categoryFilter === 'weekly' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setCategoryFilter('weekly')}
            className="whitespace-nowrap"
          >
            أسبوعي 📅
          </Button>
          <Button 
            variant={categoryFilter === 'personal' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setCategoryFilter('personal')}
            className="whitespace-nowrap"
          >
            شخصي 👤
          </Button>
          <Button 
            variant={categoryFilter === 'study' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setCategoryFilter('study')}
            className="whitespace-nowrap"
          >
            دراسة 📚
          </Button>
          <Button 
            variant={categoryFilter === 'custom' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setCategoryFilter('custom')}
            className="whitespace-nowrap"
          >
            مخصص ✨
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground rtl">لا توجد مهام {filter === 'active' ? 'نشطة' : filter === 'completed' ? 'مكتملة' : ''}</p>
            <Button variant="ghost" onClick={onAddNew} className="mt-2 rtl">
              <PlusCircle className="h-4 w-4 ml-2" />
              إضافة مهمة جديدة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
