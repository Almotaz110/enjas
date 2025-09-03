-- Fix security warnings by setting search_path for all functions

-- Update add_workspace_owner_as_member function
CREATE OR REPLACE FUNCTION public.add_workspace_owner_as_member()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

-- Update log_workspace_activity function
CREATE OR REPLACE FUNCTION public.log_workspace_activity(
  p_workspace_id UUID,
  p_user_id UUID,
  p_activity_type TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_activities (
    workspace_id, user_id, activity_type, entity_type, entity_id, details
  ) VALUES (
    p_workspace_id, p_user_id, p_activity_type, p_entity_type, p_entity_id, p_details
  );
END;
$$;

-- Update send_notification function
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_workspace_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_notifications (
    user_id, workspace_id, title, message, type, action_url, metadata
  ) VALUES (
    p_user_id, p_workspace_id, p_title, p_message, p_type, p_action_url, p_metadata
  );
END;
$$;

-- Update check_workspace_permission function
CREATE OR REPLACE FUNCTION public.check_workspace_permission(
  p_workspace_id UUID,
  p_user_id UUID,
  p_required_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;