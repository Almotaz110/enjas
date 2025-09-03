import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  Users, 
  CheckSquare, 
  MessageSquare, 
  Activity,
  Plus,
  Settings,
  Bell,
  Calendar,
  TrendingUp,
  Target,
  Clock,
  User,
  Filter,
  Search
} from 'lucide-react';
import { useCollaboration, Workspace } from '@/hooks/useCollaboration';
import { SharedTasksList } from './SharedTasksList';
import { WorkspaceMembers } from './WorkspaceMembers';
import { WorkspaceActivities } from './WorkspaceActivities';
import { NotificationCenter } from './NotificationCenter';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface WorkspaceDashboardProps {
  workspace: Workspace;
  onBack: () => void;
}

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({ 
  workspace, 
  onBack 
}) => {
  const {
    workspaceMembers,
    sharedTasks,
    activities,
    notifications,
    loadWorkspaceMembers,
    loadSharedTasks,
    loadWorkspaceActivities,
    loadNotifications,
    markNotificationAsRead,
    inviteToWorkspace,
    setupRealtimeSubscriptions
  } = useCollaboration();

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (workspace?.id) {
      loadWorkspaceMembers(workspace.id);
      loadSharedTasks(workspace.id);
      loadWorkspaceActivities(workspace.id);
      
      // Setup realtime subscriptions
      const cleanup = setupRealtimeSubscriptions(workspace.id);
      return cleanup;
    }
  }, [workspace?.id, loadWorkspaceMembers, loadSharedTasks, loadWorkspaceActivities, setupRealtimeSubscriptions]);

  // Calculate workspace statistics
  const stats = {
    totalTasks: sharedTasks.length,
    completedTasks: sharedTasks.filter(task => task.status === 'done').length,
    inProgressTasks: sharedTasks.filter(task => task.status === 'in_progress').length,
    totalMembers: workspaceMembers.length,
    recentActivities: activities.slice(0, 5).length,
    completionRate: sharedTasks.length > 0 
      ? Math.round((sharedTasks.filter(task => task.status === 'done').length / sharedTasks.length) * 100)
      : 0
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            العودة
          </Button>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12" style={{ backgroundColor: workspace.color }}>
                      <AvatarFallback className="font-semibold text-lg" style={{ color: 'white' }}>
                        {workspace.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{workspace.name}</h1>
              <p className="text-muted-foreground">{workspace.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 relative">
            <Bell className="h-4 w-4" />
            الإشعارات
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            إعدادات
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المهام</p>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المهام المكتملة</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgressTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الأعضاء</p>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            نظرة عامة على التقدم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">معدل الإنجاز</span>
            <span className="text-sm text-muted-foreground">{stats.completionRate}%</span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium text-blue-600">{stats.totalTasks - stats.completedTasks}</p>
              <p className="text-muted-foreground">مهام متبقية</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-orange-600">{stats.inProgressTasks}</p>
              <p className="text-muted-foreground">قيد التنفيذ</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-green-600">{stats.completedTasks}</p>
              <p className="text-muted-foreground">مكتملة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="tasks">المهام</TabsTrigger>
          <TabsTrigger value="members">الأعضاء</TabsTrigger>
          <TabsTrigger value="activity">النشاط</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    المهام الأخيرة
                  </span>
                  <Button variant="ghost" size="sm">
                    عرض الكل
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sharedTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={task.status === 'done' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {task.status === 'done' ? 'مكتملة' :
                             task.status === 'in_progress' ? 'قيد التنفيذ' : 
                             task.status === 'review' ? 'مراجعة' : 'جديدة'}
                          </Badge>
                          {task.assignee_name && (
                            <span className="text-xs text-muted-foreground">
                              {task.assignee_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(task.updated_at), 'dd/MM', { locale: ar })}
                      </div>
                    </div>
                  ))}
                  {sharedTasks.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      لا توجد مهام بعد
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    النشاط الأخير
                  </span>
                  <Button variant="ghost" size="sm">
                    عرض الكل
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {activity.user_name?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user_name}</span>
                          {' '}
                          {activity.activity_type === 'task_created' && 'أنشأ مهمة جديدة'}
                          {activity.activity_type === 'task_completed' && 'أكمل مهمة'}
                          {activity.activity_type === 'comment_added' && 'أضاف تعليق'}
                          {activity.activity_type === 'member_joined' && 'انضم إلى مساحة العمل'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), 'PPp', { locale: ar })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      لا توجد أنشطة بعد
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  أعضاء الفريق
                </span>
                <Button variant="ghost" size="sm">
                  إدارة الأعضاء
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {workspaceMembers.slice(0, 8).map((member) => (
                  <div key={member.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {member.user_name?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.user_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                ))}
                {workspaceMembers.length > 8 && (
                  <div className="flex items-center justify-center p-2 bg-secondary/50 rounded-lg min-w-[60px]">
                    <span className="text-sm text-muted-foreground">
                      +{workspaceMembers.length - 8}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <SharedTasksList workspaceId={workspace.id} />
        </TabsContent>

        <TabsContent value="members">
          <WorkspaceMembers 
            workspaceId={workspace.id}
            members={workspaceMembers}
            onLoadMembers={loadWorkspaceMembers}
            onInviteUser={inviteToWorkspace}
          />
        </TabsContent>

        <TabsContent value="activity">
          <WorkspaceActivities 
            workspaceId={workspace.id}
            activities={activities}
            onLoadActivities={loadWorkspaceActivities}
          />
          
          <div className="mt-6">
            <NotificationCenter 
              notifications={notifications}
              onLoadNotifications={loadNotifications}
              onMarkAsRead={markNotificationAsRead}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};