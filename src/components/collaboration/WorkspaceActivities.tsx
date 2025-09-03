import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, MessageCircle, UserPlus, FileText, Users, User } from "lucide-react";
import { WorkspaceActivity } from "@/hooks/useCollaboration";

interface WorkspaceActivitiesProps {
  workspaceId: string;
  activities: WorkspaceActivity[];
  onLoadActivities: (workspaceId: string, limit?: number) => Promise<WorkspaceActivity[]>;
}

export const WorkspaceActivities: React.FC<WorkspaceActivitiesProps> = ({
  workspaceId,
  activities: initialActivities,
  onLoadActivities
}) => {
  const [activities, setActivities] = useState<WorkspaceActivity[]>(initialActivities);

  useEffect(() => {
    const loadActivities = async () => {
      const loadedActivities = await onLoadActivities(workspaceId);
      setActivities(loadedActivities);
    };
    loadActivities();
  }, [workspaceId, onLoadActivities]);

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'task_created':
      case 'task_updated':
        return <FileText className="h-4 w-4" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'member_joined':
        return <UserPlus className="h-4 w-4" />;
      case 'comment_added':
        return <MessageCircle className="h-4 w-4" />;
      case 'workspace_created':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityMessage = (activity: WorkspaceActivity) => {
    const userName = activity.user_name || activity.user_email || 'مستخدم';
    const details = activity.details || {};

    switch (activity.activity_type) {
      case 'task_created':
        return `${userName} أنشأ مهمة جديدة: ${details.title || ''}`;
      case 'task_updated':
        return `${userName} حدث المهمة: ${details.title || ''}`;
      case 'task_completed':
        return `${userName} أتم المهمة: ${details.title || ''}`;
      case 'member_joined':
        return `${userName} انضم إلى مساحة العمل`;
      case 'comment_added':
        return `${userName} أضاف تعليقاً على المهمة: ${details.task_title || ''}`;
      case 'workspace_created':
        return `${userName} أنشأ مساحة العمل`;
      default:
        return `${userName} قام بنشاط: ${activity.activity_type}`;
    }
  };

  const getActivityVariant = (activityType: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (activityType) {
      case 'task_completed':
        return 'default';
      case 'task_created':
      case 'member_joined':
        return 'secondary';
      case 'comment_added':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          آخر الأنشطة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={getActivityVariant(activity.activity_type)} className="flex items-center gap-1 text-xs">
                    {getActivityIcon(activity.activity_type)}
                    {activity.activity_type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString('ar-SA')}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {getActivityMessage(activity)}
                </p>
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد أنشطة بعد</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};