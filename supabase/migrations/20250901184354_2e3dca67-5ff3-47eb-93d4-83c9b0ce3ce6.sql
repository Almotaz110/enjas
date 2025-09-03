-- Create enum for collaboration roles
CREATE TYPE public.collaboration_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Create enum for invitation status
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Create shared workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#4F46E5',
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_public BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}'::jsonb
);

-- Create workspace members table
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.collaboration_role NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_by UUID,
  UNIQUE(workspace_id, user_id)
);

-- Create workspace invitations table
CREATE TABLE public.workspace_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.collaboration_role NOT NULL DEFAULT 'viewer',
  status public.invitation_status NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  UNIQUE(workspace_id, email)
);

-- Create shared tasks table (extends existing task functionality)
CREATE TABLE public.shared_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  created_by UUID NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_time INTEGER, -- in minutes
  actual_time INTEGER, -- in minutes
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.shared_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parent_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE,
  is_edited BOOLEAN DEFAULT false
);

-- Create activity log table
CREATE TABLE public.workspace_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'task_created', 'task_completed', 'member_added', etc.
  entity_type TEXT, -- 'task', 'member', 'comment', etc.
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'invitation', 'task_assignment', 'comment', 'mention', etc.
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspaces
CREATE POLICY "Users can view workspaces they are members of"
ON public.workspaces FOR SELECT
USING (
  id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  ) OR is_public = true
);

CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Workspace owners and admins can update workspaces"
ON public.workspaces FOR UPDATE
USING (
  id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Workspace owners can delete workspaces"
ON public.workspaces FOR DELETE
USING (owner_id = auth.uid());

-- Create RLS policies for workspace members
CREATE POLICY "Users can view members of workspaces they belong to"
ON public.workspace_members FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Workspace admins can manage members"
ON public.workspace_members FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Create RLS policies for workspace invitations
CREATE POLICY "Users can view invitations for workspaces they can manage"
ON public.workspace_invitations FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Workspace admins can create invitations"
ON public.workspace_invitations FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Create RLS policies for shared tasks
CREATE POLICY "Users can view tasks in workspaces they belong to"
ON public.shared_tasks FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tasks in workspaces they belong to"
ON public.shared_tasks FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  ) AND auth.uid() = created_by
);

CREATE POLICY "Users can update tasks they created or are assigned to"
ON public.shared_tasks FOR UPDATE
USING (
  (created_by = auth.uid() OR assigned_to = auth.uid()) OR
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Create RLS policies for task comments
CREATE POLICY "Users can view comments on tasks they can access"
ON public.task_comments FOR SELECT
USING (
  task_id IN (
    SELECT id FROM public.shared_tasks 
    WHERE workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create comments on tasks they can access"
ON public.task_comments FOR INSERT
WITH CHECK (
  task_id IN (
    SELECT id FROM public.shared_tasks 
    WHERE workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  ) AND auth.uid() = user_id
);

-- Create RLS policies for workspace activities
CREATE POLICY "Users can view activities in workspaces they belong to"
ON public.workspace_activities FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create activities in workspaces they belong to"
ON public.workspace_activities FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members 
    WHERE user_id = auth.uid()
  ) AND auth.uid() = user_id
);

-- Create RLS policies for user notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.user_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to automatically add workspace owner as member
CREATE OR REPLACE FUNCTION public.add_workspace_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add workspace owner as member
CREATE TRIGGER add_workspace_owner_as_member_trigger
  AFTER INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.add_workspace_owner_as_member();

-- Create function to log activities
CREATE OR REPLACE FUNCTION public.log_workspace_activity(
  p_workspace_id UUID,
  p_user_id UUID,
  p_activity_type TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.workspace_activities (
    workspace_id, user_id, activity_type, entity_type, entity_id, details
  ) VALUES (
    p_workspace_id, p_user_id, p_activity_type, p_entity_type, p_entity_id, p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send notification
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_workspace_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_notifications (
    user_id, workspace_id, title, message, type, action_url, metadata
  ) VALUES (
    p_user_id, p_workspace_id, p_title, p_message, p_type, p_action_url, p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check workspace permissions
CREATE OR REPLACE FUNCTION public.check_workspace_permission(
  p_workspace_id UUID,
  p_user_id UUID,
  p_required_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy INT;
  required_hierarchy INT;
BEGIN
  -- Get user's role in the workspace
  SELECT role INTO user_role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Define role hierarchy (higher number = more permissions)
  role_hierarchy := CASE user_role
    WHEN 'viewer' THEN 1
    WHEN 'editor' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'owner' THEN 4
    ELSE 0
  END;
  
  required_hierarchy := CASE p_required_role
    WHEN 'viewer' THEN 1
    WHEN 'editor' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'owner' THEN 4
    ELSE 0
  END;
  
  RETURN role_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_tasks_updated_at
  BEFORE UPDATE ON public.shared_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();