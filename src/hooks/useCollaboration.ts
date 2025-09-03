import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  color: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_public: boolean | null;
  settings: Record<string, any> | null;
  member_count?: number;
  my_role?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
  invited_by?: string;
  user_email?: string;
  user_name?: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invited_by: string;
  created_at: string;
  expires_at: string;
  token: string;
  workspace_name?: string;
}

export interface SharedTask {
  id: string;
  workspace_id: string;
  title: string;
  description?: string | null;
  assigned_to?: string | null;
  created_by: string;
  priority: 'urgent' | 'normal' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  due_date?: string | null;
  completed_at?: string | null;
  estimated_time?: number | null;
  actual_time?: number | null;
  tags: string[];
  attachments: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
  creator_name?: string;
  comment_count?: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  is_edited: boolean;
  user_name?: string;
  user_email?: string;
  replies?: TaskComment[];
}

export interface WorkspaceActivity {
  id: string;
  workspace_id: string;
  user_id: string;
  activity_type: string;
  entity_type?: string | null;
  entity_id?: string | null;
  details: Record<string, any> | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  workspace_id?: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean | null;
  action_url?: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  workspace_name?: string;
}

export const useCollaboration = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [workspaceInvitations, setWorkspaceInvitations] = useState<WorkspaceInvitation[]>([]);
  const [sharedTasks, setSharedTasks] = useState<SharedTask[]>([]);
  const [activities, setActivities] = useState<WorkspaceActivity[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user's workspaces
  const loadWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workspacesData, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members!inner(role)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const enrichedWorkspaces = workspacesData?.map(workspace => ({
        ...workspace,
        settings: workspace.settings as Record<string, any> | null,
        my_role: workspace.workspace_members[0]?.role
      })) || [];

      setWorkspaces(enrichedWorkspaces);
    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      toast.error('فشل في تحميل مساحات العمل');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new workspace
  const createWorkspace = useCallback(async (
    name: string, 
    description?: string, 
    color: string = '#4F46E5',
    isPublic: boolean = false
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          description,
          color,
          owner_id: user.id,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) throw error;

      await loadWorkspaces();
      toast.success('تم إنشاء مساحة العمل بنجاح');
      return data;
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      toast.error('فشل في إنشاء مساحة العمل');
      throw error;
    }
  }, [loadWorkspaces]);

  // Load workspace members
  const loadWorkspaceMembers = useCallback(async (workspaceId: string) => {
    try {
      // Simple query without foreign key joins
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Manually fetch profile data for each member
      const membersWithProfiles = [];
      for (const member of data || []) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', member.user_id)
          .single();
        
        membersWithProfiles.push({
          ...member,
          user_email: profileData?.email,
          user_name: profileData?.full_name || profileData?.email
        });
      }

      setWorkspaceMembers(membersWithProfiles);
      return membersWithProfiles;
    } catch (error: any) {
      console.error('Error loading workspace members:', error);
      toast.error('فشل في تحميل أعضاء مساحة العمل');
      return [];
    }
  }, []);

  // Invite user to workspace
  const inviteToWorkspace = useCallback(async (
    workspaceId: string,
    email: string,
    role: 'admin' | 'editor' | 'viewer' = 'viewer'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: workspaceId,
          email,
          role,
          invited_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification (you could also send email here)
      await supabase.rpc('send_notification', {
        p_user_id: user.id,
        p_workspace_id: workspaceId,
        p_title: 'دعوة جديدة',
        p_message: `تم إرسال دعوة إلى ${email}`,
        p_type: 'invitation_sent'
      });

      toast.success(`تم إرسال دعوة إلى ${email}`);
      return data;
    } catch (error: any) {
      console.error('Error inviting to workspace:', error);
      if (error.code === '23505') {
        toast.error('تم إرسال دعوة لهذا البريد الإلكتروني مسبقاً');
      } else {
        toast.error('فشل في إرسال الدعوة');
      }
      throw error;
    }
  }, []);

  // Accept workspace invitation
  const acceptInvitation = useCallback(async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        throw new Error('دعوة غير صالحة أو منتهية الصلاحية');
      }

      // Check if invitation is for current user
      if (invitation.email !== user.email) {
        throw new Error('هذه الدعوة ليست موجهة إليك');
      }

      // Add user to workspace
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invitation.workspace_id,
          user_id: user.id,
          role: invitation.role,
          invited_by: invitation.invited_by
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('workspace_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase.rpc('log_workspace_activity', {
        p_workspace_id: invitation.workspace_id,
        p_user_id: user.id,
        p_activity_type: 'member_joined',
        p_entity_type: 'member',
        p_entity_id: user.id,
        p_details: { role: invitation.role }
      });

      await loadWorkspaces();
      toast.success('تم قبول الدعوة بنجاح');
      return invitation.workspace_id;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'فشل في قبول الدعوة');
      throw error;
    }
  }, [loadWorkspaces]);

  // Load shared tasks for workspace
  const loadSharedTasks = useCallback(async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('shared_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Manually fetch profile data for assignee and creator
      const tasksWithProfiles = [];
      for (const task of data || []) {
        let assigneeName = '';
        let creatorName = '';

        if (task.assigned_to) {
          const { data: assigneeData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', task.assigned_to)
            .single();
          assigneeName = assigneeData?.full_name || assigneeData?.email || '';
        }

        if (task.created_by) {
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', task.created_by)
            .single();
          creatorName = creatorData?.full_name || creatorData?.email || '';
        }

        tasksWithProfiles.push({
          ...task,
          attachments: (task.attachments as Record<string, any>) || {},
          tags: task.tags || [],
          priority: task.priority as 'urgent' | 'normal' | 'low',
          difficulty: task.difficulty as 'easy' | 'medium' | 'hard',
          status: task.status as 'todo' | 'in_progress' | 'review' | 'done',
          assignee_name: assigneeName,
          creator_name: creatorName
        });
      }

      setSharedTasks(tasksWithProfiles);
      return tasksWithProfiles;
    } catch (error: any) {
      console.error('Error loading shared tasks:', error);
      toast.error('فشل في تحميل المهام المشتركة');
      return [];
    }
  }, []);

  // Create shared task
  const createSharedTask = useCallback(async (
    workspaceId: string,
    taskData: Partial<SharedTask>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('shared_tasks')
        .insert({
          workspace_id: workspaceId,
          created_by: user.id,
          title: taskData.title || '',
          description: taskData.description,
          assigned_to: taskData.assigned_to,
          priority: taskData.priority || 'normal',
          difficulty: taskData.difficulty || 'medium',
          status: taskData.status || 'todo',
          due_date: taskData.due_date,
          estimated_time: taskData.estimated_time,
          tags: taskData.tags,
          attachments: taskData.attachments
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.rpc('log_workspace_activity', {
        p_workspace_id: workspaceId,
        p_user_id: user.id,
        p_activity_type: 'task_created',
        p_entity_type: 'task',
        p_entity_id: data.id,
        p_details: { title: data.title }
      });

      // Send notification to assigned user if different from creator
      if (data.assigned_to && data.assigned_to !== user.id) {
        await supabase.rpc('send_notification', {
          p_user_id: data.assigned_to,
          p_workspace_id: workspaceId,
          p_title: 'مهمة جديدة',
          p_message: `تم تكليفك بمهمة: ${data.title}`,
          p_type: 'task_assignment'
        });
      }

      await loadSharedTasks(workspaceId);
      toast.success('تم إنشاء المهمة بنجاح');
      return data;
    } catch (error: any) {
      console.error('Error creating shared task:', error);
      toast.error('فشل في إنشاء المهمة');
      throw error;
    }
  }, [loadSharedTasks]);

  // Update shared task
  const updateSharedTask = useCallback(async (
    taskId: string,
    updates: Partial<SharedTask>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('shared_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Log activity based on what was updated
      if (updates.status === 'done') {
        await supabase.rpc('log_workspace_activity', {
          p_workspace_id: data.workspace_id,
          p_user_id: user.id,
          p_activity_type: 'task_completed',
          p_entity_type: 'task',
          p_entity_id: taskId,
          p_details: { title: data.title }
        });
      } else {
        await supabase.rpc('log_workspace_activity', {
          p_workspace_id: data.workspace_id,
          p_user_id: user.id,
          p_activity_type: 'task_updated',
          p_entity_type: 'task',
          p_entity_id: taskId,
          p_details: { title: data.title, updates }
        });
      }

      await loadSharedTasks(data.workspace_id);
      toast.success('تم تحديث المهمة بنجاح');
      return data;
    } catch (error: any) {
      console.error('Error updating shared task:', error);
      toast.error('فشل في تحديث المهمة');
      throw error;
    }
  }, [loadSharedTasks]);

  // Load task comments
  const loadTaskComments = useCallback(async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Manually fetch profile data for each comment
      const commentsWithProfiles = [];
      for (const comment of data || []) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', comment.user_id)
          .single();

        commentsWithProfiles.push({
          ...comment,
          user_name: userData?.full_name || userData?.email,
          user_email: userData?.email
        });
      }

      return commentsWithProfiles;
    } catch (error: any) {
      console.error('Error loading task comments:', error);
      toast.error('فشل في تحميل التعليقات');
      return [];
    }
  }, []);

  // Add task comment
  const addTaskComment = useCallback(async (
    taskId: string,
    content: string,
    parentId?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          content,
          parent_id: parentId
        })
        .select()
        .single();

      if (error) throw error;

      // Get task details for notification
      const { data: task } = await supabase
        .from('shared_tasks')
        .select('workspace_id, title, created_by, assigned_to')
        .eq('id', taskId)
        .single();

      if (task) {
        // Log activity
        await supabase.rpc('log_workspace_activity', {
          p_workspace_id: task.workspace_id,
          p_user_id: user.id,
          p_activity_type: 'comment_added',
          p_entity_type: 'comment',
          p_entity_id: data.id,
          p_details: { task_title: task.title }
        });

        // Send notifications to task creator and assignee
        const recipients = [task.created_by, task.assigned_to].filter(
          (id, index, arr) => id && id !== user.id && arr.indexOf(id) === index
        );

        for (const recipientId of recipients) {
          await supabase.rpc('send_notification', {
            p_user_id: recipientId,
            p_workspace_id: task.workspace_id,
            p_title: 'تعليق جديد',
            p_message: `تعليق جديد على المهمة: ${task.title}`,
            p_type: 'comment'
          });
        }
      }

      toast.success('تم إضافة التعليق بنجاح');
      return data;
    } catch (error: any) {
      console.error('Error adding task comment:', error);
      toast.error('فشل في إضافة التعليق');
      throw error;
    }
  }, []);

  // Load workspace activities
  const loadWorkspaceActivities = useCallback(async (workspaceId: string, limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('workspace_activities')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Manually fetch profile data for each activity
      const activitiesWithProfiles = [];
      for (const activity of data || []) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', activity.user_id)
          .single();

        activitiesWithProfiles.push({
          ...activity,
          details: activity.details as Record<string, any> | null,
          user_name: userData?.full_name || userData?.email,
          user_email: userData?.email
        });
      }

      setActivities(activitiesWithProfiles);
      return activitiesWithProfiles;
    } catch (error: any) {
      console.error('Error loading workspace activities:', error);
      toast.error('فشل في تحميل الأنشطة');
      return [];
    }
  }, []);

  // Load user notifications
  const loadNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Manually fetch workspace data for each notification
      const notificationsWithWorkspaces = [];
      for (const notification of data || []) {
        let workspaceName = '';
        if (notification.workspace_id) {
          const { data: workspaceData } = await supabase
            .from('workspaces')
            .select('name')
            .eq('id', notification.workspace_id)
            .single();
          workspaceName = workspaceData?.name || '';
        }

        notificationsWithWorkspaces.push({
          ...notification,
          metadata: notification.metadata as Record<string, any> | null,
          workspace_name: workspaceName
        });
      }

      setNotifications(notificationsWithWorkspaces);
      return notificationsWithWorkspaces;
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      toast.error('فشل في تحميل الإشعارات');
      return [];
    }
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Setup realtime subscriptions
  const setupRealtimeSubscriptions = useCallback((workspaceId: string) => {
    // Subscribe to workspace activities
    const activitiesChannel = supabase
      .channel(`workspace_activities_${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_activities',
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          loadWorkspaceActivities(workspaceId);
        }
      )
      .subscribe();

    // Subscribe to shared tasks changes
    const tasksChannel = supabase
      .channel(`shared_tasks_${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_tasks',
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          loadSharedTasks(workspaceId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [loadWorkspaceActivities, loadSharedTasks]);

  // Initialize data on mount
  useEffect(() => {
    loadWorkspaces();
    loadNotifications();
  }, [loadWorkspaces, loadNotifications]);

  return {
    // State
    workspaces,
    currentWorkspace,
    workspaceMembers,
    workspaceInvitations,
    sharedTasks,
    activities,
    notifications,
    isLoading,

    // Actions
    setCurrentWorkspace,
    createWorkspace,
    loadWorkspaceMembers,
    inviteToWorkspace,
    acceptInvitation,
    loadSharedTasks,
    createSharedTask,
    updateSharedTask,
    loadTaskComments,
    addTaskComment,
    loadWorkspaceActivities,
    loadNotifications,
    markNotificationAsRead,
    setupRealtimeSubscriptions
  };
};