
import { useState } from 'react';
import { Category, Difficulty, Priority, Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { v4 as uuidv4 } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaskFormProps {
  onSave: (task: Task) => void;
  onCancel: () => void;
  editTask?: Task;
}

export const TaskForm = ({ onSave, onCancel, editTask }: TaskFormProps) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState(editTask?.title || '');
  const [description, setDescription] = useState(editTask?.description || '');
  const [difficulty, setDifficulty] = useState<Difficulty>(editTask?.difficulty || 'medium');
  const [priority, setPriority] = useState<Priority>(editTask?.priority || 'normal');
  const [category, setCategory] = useState<Category>(editTask?.category || 'daily');
  const [deadline, setDeadline] = useState<Date | undefined>(editTask?.deadline);
  const [estimatedTime, setEstimatedTime] = useState<number>(editTask?.estimatedTime || 60);
  
  const difficultyPoints = {
    easy: 10,
    medium: 20,
    hard: 30
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error(t('enterTaskTitle'));
      return;
    }
    
    const task: Task = {
      id: editTask?.id || uuidv4(),
      title,
      description: description || undefined,
      difficulty,
      priority,
      category,
      points: difficultyPoints[difficulty],
      completed: editTask?.completed || false,
      deadline,
      estimatedTime,
      createdAt: editTask?.createdAt || new Date()
    };
    
    onSave(task);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 rtl">
      <div className="space-y-2">
        <Label htmlFor="title">{t('taskTitle')}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('enterTaskTitle')}
          dir="rtl"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">وصف المهمة (اختياري)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="أدخل وصفاً للمهمة"
          dir="rtl"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="difficulty">مستوى الصعوبة</Label>
          <Select
            defaultValue={difficulty}
            onValueChange={(value) => setDifficulty(value as Difficulty)}
          >
            <SelectTrigger id="difficulty" dir="rtl">
              <SelectValue placeholder="اختر مستوى الصعوبة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">سهل (10 نقاط)</SelectItem>
              <SelectItem value="medium">متوسط (20 نقطة)</SelectItem>
              <SelectItem value="hard">صعب (30 نقطة)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="priority">الأولوية</Label>
          <Select
            defaultValue={priority}
            onValueChange={(value) => setPriority(value as Priority)}
          >
            <SelectTrigger id="priority" dir="rtl">
              <SelectValue placeholder="اختر الأولوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">عاجل ⚠️</SelectItem>
              <SelectItem value="normal">عادي 📋</SelectItem>
              <SelectItem value="low">قابل للتأجيل ⏳</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">التصنيف</Label>
          <Select
            defaultValue={category}
            onValueChange={(value) => setCategory(value as Category)}
          >
            <SelectTrigger id="category" dir="rtl">
              <SelectValue placeholder="اختر تصنيف المهمة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">يومي ☀️</SelectItem>
              <SelectItem value="weekly">أسبوعي 📅</SelectItem>
              <SelectItem value="monthly">شهري 📊</SelectItem>
              <SelectItem value="personal">شخصي 👤</SelectItem>
              <SelectItem value="study">دراسة 📚</SelectItem>
              <SelectItem value="custom">مخصص ✨</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="estimatedTime">الوقت المتوقع للإنجاز (دقيقة)</Label>
        <Input
          id="estimatedTime"
          type="number"
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(Number(e.target.value))}
          placeholder="60"
          min="1"
          dir="rtl"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="deadline">الموعد النهائي (اختياري)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-right"
              id="deadline"
              dir="rtl"
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {deadline ? format(deadline, 'PPP') : "اختر تاريخاً"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={setDeadline}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit">
          {editTask ? 'تحديث المهمة' : 'إضافة المهمة'}
        </Button>
      </div>
    </form>
  );
};
