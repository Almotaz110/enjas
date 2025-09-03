import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Mail, Crown, Shield, Edit, Eye } from "lucide-react";
import { WorkspaceMember } from "@/hooks/useCollaboration";

interface WorkspaceMembersProps {
  workspaceId: string;
  members: WorkspaceMember[];
  onLoadMembers: (workspaceId: string) => Promise<WorkspaceMember[]>;
  onInviteUser: (workspaceId: string, email: string, role: 'admin' | 'editor' | 'viewer') => Promise<any>;
}

export const WorkspaceMembers: React.FC<WorkspaceMembersProps> = ({
  workspaceId,
  members: initialMembers,
  onLoadMembers,
  onInviteUser
}) => {
  const [members, setMembers] = useState<WorkspaceMember[]>(initialMembers);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      const loadedMembers = await onLoadMembers(workspaceId);
      setMembers(loadedMembers);
    };
    loadMembers();
  }, [workspaceId, onLoadMembers]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || isInviting) return;

    setIsInviting(true);
    try {
      await onInviteUser(workspaceId, newUserEmail.trim(), newUserRole);
      setNewUserEmail('');
      // Reload members
      const updatedMembers = await onLoadMembers(workspaceId);
      setMembers(updatedMembers);
    } catch (error) {
      console.error('Error inviting user:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'editor':
        return <Edit className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'مالك';
      case 'admin':
        return 'مدير';
      case 'editor':
        return 'محرر';
      default:
        return 'مشاهد';
    }
  };

  const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'owner':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'editor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          الأعضاء ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Members List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {(member.user_name || member.user_email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {member.user_name || member.user_email || 'مستخدم'}
                  </p>
                  {member.user_email && (
                    <p className="text-sm text-muted-foreground">{member.user_email}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    انضم في {new Date(member.joined_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
              <Badge variant={getRoleVariant(member.role)} className="flex items-center gap-1">
                {getRoleIcon(member.role)}
                {getRoleLabel(member.role)}
              </Badge>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا يوجد أعضاء بعد</p>
            </div>
          )}
        </div>

        {/* Invite New User Form */}
        <form onSubmit={handleInviteUser} className="space-y-3 pt-4 border-t">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="البريد الإلكتروني للمستخدم الجديد"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="flex-1"
              disabled={isInviting}
            />
            <Select
              value={newUserRole}
              onValueChange={(value: 'admin' | 'editor' | 'viewer') => setNewUserRole(value)}
              disabled={isInviting}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">مشاهد</SelectItem>
                <SelectItem value="editor">محرر</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              type="submit" 
              disabled={!newUserEmail.trim() || isInviting}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isInviting ? 'جاري الإرسال...' : 'دعوة'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};