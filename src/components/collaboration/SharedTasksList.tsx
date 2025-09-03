import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Clock,
  User,
  MessageSquare,
  Edit,
  Trash2,
  ChevronDown,
  CheckCircle,
  Circle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { useCollaboration, SharedTask, WorkspaceMember } from '@/hooks/useCollaboration';
import { TaskComments } from './TaskComments';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface SharedTasksListProps {
  workspaceId: string;
}

export const SharedTasksList: React.FC<SharedTasksListProps> = ({ workspaceId }) => {
  const {
    sharedTasks,
    workspaceMembers,
    loadSharedTasks,
    loadWorkspaceMembers,
    createSharedTask,
    updateSharedTask,
    addTaskComment,
    loadTaskComments
  } = useCollaboration();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<SharedTask | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'due_date' | 'priority'>('updated_at');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'normal' as const,
    difficulty: 'medium' as const,
    due_date: undefined as Date | undefined,
    estimated_time: 60,
    tags: [] as string[]
  });

  useEffect(() => {
    if (workspaceId) {
      loadSharedTasks(workspaceId);
      loadWorkspaceMembers(workspaceId);
    }
  }, [workspaceId, loadSharedTasks, loadWorkspaceMembers]);

  // Filter and sort tasks
  const filteredTasks = sharedTasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesAssignee = filterAssignee === 'all' || task.assigned_to === filterAssignee;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesAssignee && matchesPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority':
          const priorityOrder = { urgent: 3, normal: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated_at':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('يرجى إدخال عنوان المهمة');
      return;
    }

    try {
      await createSharedTask(workspaceId, {
        ...newTask,
        due_date: newTask.due_date?.toISOString()
      });
      
      setShowCreateDialog(false);
      setNewTask({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'normal',
        difficulty: 'medium',
        due_date: undefined,
        estimated_time: 60,
        tags: []
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<SharedTask>) => {
    try {
      await updateSharedTask(taskId, updates);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'review':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'todo':
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done': return 'مكتملة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'review': return 'مراجعة';
      case 'todo': return 'جديدة';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'normal': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'normal': return 'عادي';
      case 'low': return 'منخفض';
      default: return priority;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const taskStats = {
    total: sharedTasks.length,
    todo: sharedTasks.filter(t => t.status === 'todo').length,
    inProgress: sharedTasks.filter(t => t.status === 'in_progress').length,
    review: sharedTasks.filter(t => t.status === 'review').length,
    done: sharedTasks.filter(t => t.status === 'done').length
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">المهام المشتركة</h3>
          <p className="text-sm text-muted-foreground">
            إدارة وتتبع مهام الفريق
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة مهمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة مهمة جديدة</DialogTitle>
              <DialogDescription>
                أضف مهمة جديدة للمشاركة مع فريق العمل
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>عنوان المهمة</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="اكتب عنوان المهمة..."
                />
              </div>

              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف تفصيلي للمهمة..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>المكلف بالمهمة</Label>
                  <Select 
                    value={newTask.assigned_to} 
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, assigned_to: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عضو..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">غير محدد</SelectItem>
                      {workspaceMembers.map(member => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.user_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>الأولوية</Label>
                  <Select 
                    value={newTask.priority} 
                    onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">عاجل</SelectItem>
                      <SelectItem value="normal">عادي</SelectItem>
                      <SelectItem value="low">منخفض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الصعوبة</Label>
                  <Select 
                    value={newTask.difficulty} 
                    onValueChange={(value: any) => setNewTask(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">سهل</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="hard">صعب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>الوقت المقدر (دقيقة)</Label>
                  <Input
                    type="number"
                    value={newTask.estimated_time}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimated_time: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label>الموعد النهائي</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.due_date ? format(newTask.due_date, 'PPP', { locale: ar }) : 'اختر تاريخ...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newTask.due_date}
                      onSelect={(date) => setNewTask(prev => ({ ...prev, due_date: date }))}
                      locale={ar}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={handleCreateTask} className="w-full">
                إضافة المهمة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{taskStats.total}</p>
            <p className="text-sm text-muted-foreground">إجمالي المهام</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{taskStats.todo}</p>
            <p className="text-sm text-muted-foreground">جديدة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
            <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{taskStats.review}</p>
            <p className="text-sm text-muted-foreground">مراجعة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{taskStats.done}</p>
            <p className="text-sm text-muted-foreground">مكتملة</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في المهام..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="todo">جديدة</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="review">مراجعة</SelectItem>
                  <SelectItem value="done">مكتملة</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="المكلف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأعضاء</SelectItem>
                  {workspaceMembers.map(member => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="ترتيب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_at">آخر تحديث</SelectItem>
                  <SelectItem value="created_at">تاريخ الإنشاء</SelectItem>
                  <SelectItem value="due_date">الموعد النهائي</SelectItem>
                  <SelectItem value="priority">الأولوية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => handleUpdateTask(task.id, {
                        status: task.status === 'done' ? 'todo' : 'done',
                        completed_at: task.status === 'done' ? undefined : new Date().toISOString()
                      })}
                    >
                      {getStatusIcon(task.status)}
                    </button>
                    
                    <h4 
                      className={`font-medium cursor-pointer hover:text-primary ${
                        task.status === 'done' ? 'line-through text-muted-foreground' : ''
                      }`}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskDialog(true);
                      }}
                    >
                      {task.title}
                    </h4>
                    
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                  </div>

                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {getStatusLabel(task.status)}
                      </Badge>
                    </div>

                    {task.assignee_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{task.assignee_name}</span>
                      </div>
                    )}

                    {task.due_date && (
                      <div className={`flex items-center gap-1 ${
                        isOverdue(task.due_date) ? 'text-red-500' : ''
                      }`}>
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(new Date(task.due_date), 'PPP', { locale: ar })}</span>
                      </div>
                    )}

                    {task.estimated_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimated_time} دقيقة</span>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowCommentsDialog(true);
                      }}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>{task.comment_count || 0}</span>
                    </button>
                  </div>

                  {task.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {task.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {task.assigned_to && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {task.assignee_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-medium">لا توجد مهام</h3>
                <p className="text-muted-foreground">
                  {sharedTasks.length === 0 ? 
                    'ابدأ بإضافة أول مهمة لفريقك' : 
                    'لا توجد مهام تطابق الفلاتر المحددة'
                  }
                </p>
              </div>
              {sharedTasks.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة أول مهمة
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Task Comments Dialog */}
      {selectedTask && (
        <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                تعليقات المهمة: {selectedTask.title}
              </DialogTitle>
              <DialogDescription>
                عرض ومناقشة المهمة مع أعضاء الفريق
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
          <TaskComments 
            taskId={selectedTask.id}
            comments={[]}
            onAddComment={addTaskComment}
            onLoadComments={loadTaskComments}
          />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};