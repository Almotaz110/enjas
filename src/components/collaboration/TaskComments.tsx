import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, User } from "lucide-react";
import { TaskComment } from "@/hooks/useCollaboration";

interface TaskCommentsProps {
  taskId: string;
  comments: TaskComment[];
  onAddComment: (taskId: string, content: string, parentId?: string) => Promise<any>;
  onLoadComments: (taskId: string) => Promise<TaskComment[]>;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({
  taskId,
  comments: initialComments,
  onAddComment,
  onLoadComments
}) => {
  const [comments, setComments] = useState<TaskComment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadComments = async () => {
      const loadedComments = await onLoadComments(taskId);
      setComments(loadedComments);
    };
    loadComments();
  }, [taskId, onLoadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(taskId, newComment.trim());
      setNewComment('');
      // Reload comments
      const updatedComments = await onLoadComments(taskId);
      setComments(updatedComments);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          التعليقات ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {comment.user_name || comment.user_email || 'مستخدم'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString('ar-SA')}
                  </span>
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد تعليقات بعد</p>
            </div>
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="أضف تعليقاً..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!newComment.trim() || isSubmitting}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};