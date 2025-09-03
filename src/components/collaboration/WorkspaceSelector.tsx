import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Users, 
  Settings, 
  Crown, 
  Shield, 
  Edit, 
  Eye,
  Globe,
  Lock,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { useCollaboration, Workspace } from '@/hooks/useCollaboration';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface WorkspaceSelectorProps {
  onWorkspaceSelect: (workspace: Workspace) => void;
}

const WORKSPACE_COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#EA580C',
  '#D97706', '#65A30D', '#059669', '#0891B2', '#0284C7'
];

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({ onWorkspaceSelect }) => {
  const { workspaces, createWorkspace, isLoading } = useCollaboration();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
    color: '#4F46E5',
    isPublic: false
  });

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) {
      toast.error('يرجى إدخال اسم مساحة العمل');
      return;
    }

    try {
      const workspace = await createWorkspace(
        newWorkspace.name,
        newWorkspace.description,
        newWorkspace.color,
        newWorkspace.isPublic
      );
      
      if (workspace) {
        onWorkspaceSelect({
          ...workspace,
          settings: workspace.settings as Record<string, any> | null
        });
        setShowCreateDialog(false);
        setNewWorkspace({
          name: '',
          description: '',
          color: '#4F46E5',
          isPublic: false
        });
      }
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-green-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return null;
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
      case 'viewer':
        return 'مشاهد';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">مساحات العمل</h2>
          <p className="text-muted-foreground">اختر مساحة عمل للبدء في التعاون</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء مساحة عمل جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مساحة عمل جديدة</DialogTitle>
              <DialogDescription>
                أنشئ مساحة عمل جديدة للتعاون مع فريقك
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>اسم مساحة العمل</Label>
                <Input
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: مشروع الرياضيات"
                />
              </div>

              <div>
                <Label>الوصف (اختياري)</Label>
                <Textarea
                  value={newWorkspace.description}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف موجز لمساحة العمل..."
                  rows={3}
                />
              </div>

              <div>
                <Label>لون مساحة العمل</Label>
                <div className="flex gap-2 mt-2">
                  {WORKSPACE_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewWorkspace(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newWorkspace.color === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {newWorkspace.isPublic ? (
                    <Globe className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                  <Label>مساحة عمل عامة</Label>
                </div>
                <Switch
                  checked={newWorkspace.isPublic}
                  onCheckedChange={(checked) => setNewWorkspace(prev => ({ ...prev, isPublic: checked }))}
                />
              </div>
              {newWorkspace.isPublic && (
                <p className="text-sm text-muted-foreground">
                  المساحات العامة يمكن لأي شخص اكتشافها والانضمام إليها
                </p>
              )}

              <Button onClick={handleCreateWorkspace} className="w-full" disabled={isLoading}>
                إنشاء مساحة العمل
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-medium">لا توجد مساحات عمل</h3>
              <p className="text-muted-foreground">
                ابدأ بإنشاء مساحة عمل جديدة للتعاون مع الآخرين
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء أول مساحة عمل
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <Card 
              key={workspace.id} 
              className="group hover:shadow-lg transition-all cursor-pointer border-l-4"
              style={{ borderLeftColor: workspace.color }}
              onClick={() => onWorkspaceSelect(workspace)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10" style={{ backgroundColor: workspace.color }}>
                      <AvatarFallback className="font-semibold" style={{ color: 'white' }}>
                        {workspace.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{workspace.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleIcon(workspace.my_role || 'viewer')}
                        <Badge variant="outline" className="text-xs">
                          {getRoleLabel(workspace.my_role || 'viewer')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {workspace.is_public ? (
                      <Globe className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-500" />
                    )}
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {workspace.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workspace.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{workspace.member_count || 1} عضو</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(workspace.updated_at), 'PPP', { locale: ar })}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <Settings className="h-3 w-3" />
                    فتح مساحة العمل
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {workspaces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مساحات العمل</p>
                  <p className="text-2xl font-bold">{workspaces.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مالك</p>
                  <p className="text-2xl font-bold">
                    {workspaces.filter(w => w.my_role === 'owner').length}
                  </p>
                </div>
                <Crown className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">عامة</p>
                  <p className="text-2xl font-bold">
                    {workspaces.filter(w => w.is_public).length}
                  </p>
                </div>
                <Globe className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};