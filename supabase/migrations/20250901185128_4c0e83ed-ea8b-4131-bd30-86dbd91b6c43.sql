-- Add proper foreign key constraints for profiles table relationships

-- Add foreign key constraint for workspace_members -> profiles
ALTER TABLE public.workspace_members 
ADD CONSTRAINT workspace_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for shared_tasks assigned_to -> profiles  
ALTER TABLE public.shared_tasks 
ADD CONSTRAINT shared_tasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign key constraint for shared_tasks created_by -> profiles
ALTER TABLE public.shared_tasks 
ADD CONSTRAINT shared_tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for task_comments -> profiles
ALTER TABLE public.task_comments 
ADD CONSTRAINT task_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for workspace_activities -> profiles
ALTER TABLE public.workspace_activities 
ADD CONSTRAINT workspace_activities_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for user_notifications -> workspaces
ALTER TABLE public.user_notifications 
ADD CONSTRAINT user_notifications_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;