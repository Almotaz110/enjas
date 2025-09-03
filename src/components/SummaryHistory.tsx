import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription, 
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
  History, 
  FileText, 
  Video, 
  Image, 
  Brain,
  Trash2,
  Copy,
  Download,
  Clock,
  Sparkles
} from 'lucide-react';
import { useSummaryService } from '@/hooks/useSummaryService';
import { toast } from 'sonner';

interface Summary {
  id: string;
  original_file_name: string;
  file_type: string;
  content_type: string;
  summary_text: string;
  summary_type: string;
  processing_status: string;
  created_at: string;
  processed_at: string | null;
  metadata: any;
}

interface SummaryHistoryProps {
  refreshKey?: number;
}

export const SummaryHistory: React.FC<SummaryHistoryProps> = ({ refreshKey = 0 }) => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
  const { getSummaryHistory, deleteSummary } = useSummaryService();

  useEffect(() => {
    loadSummaryHistory();
  }, [refreshKey]);

  const loadSummaryHistory = async () => {
    try {
      setIsLoading(true);
      const history = await getSummaryHistory();
      setSummaries(history);
    } catch (error) {
      console.error('Error loading summary history:', error);
      toast.error('فشل في تحميل تاريخ التلخيصات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSummary = async (summaryId: string) => {
    try {
      await deleteSummary(summaryId);
      setSummaries(prev => prev.filter(s => s.id !== summaryId));
      if (selectedSummary?.id === summaryId) {
        setSelectedSummary(null);
      }
    } catch (error) {
      console.error('Error deleting summary:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('تم نسخ الملخص');
    } catch (error) {
      toast.error('فشل في نسخ الملخص');
    }
  };

  const downloadSummary = (summary: Summary) => {
    const blob = new Blob([summary.summary_text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ملخص_${summary.original_file_name}_${getSummaryTypeLabel(summary.summary_type)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('تم تحميل الملخص');
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSummaryTypeLabel = (type: string) => {
    switch (type) {
      case 'basic': return 'ملخص موجز';
      case 'detailed': return 'ملخص مفصل';
      case 'mindmap': return 'خريطة ذهنية';
      case 'keypoints': return 'النقاط الرئيسية';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="text-xs">مكتمل</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="text-xs">قيد المعالجة</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">فشل</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">في الانتظار</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
            <p className="text-sm text-muted-foreground">جاري تحميل التلخيصات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right flex items-center gap-2">
          <History className="h-5 w-5" />
          تاريخ التلخيصات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-base font-medium mb-2">لا توجد تلخيصات بعد</p>
            <p className="text-sm">ابدأ بتلخيص ملفاتك لتظهر هنا</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {summaries.map((summary) => (
              <div
                key={summary.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-right flex-1">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    {getFileIcon(summary.file_type)}
                    <h4 className="font-medium text-sm truncate">
                      {summary.original_file_name}
                    </h4>
                  </div>
                  <div className="flex gap-2 justify-end flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {getSummaryTypeLabel(summary.summary_type)}
                    </Badge>
                    {getStatusBadge(summary.processing_status)}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(summary.created_at)}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  {summary.processing_status === 'completed' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSummary(summary)}
                        >
                          عرض
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle className="text-right flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            {selectedSummary?.original_file_name}
                          </DialogTitle>
                          <DialogDescription className="text-right">
                            عرض تفاصيل التلخيص والمحتوى الأصلي
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedSummary && (
                          <div className="flex-1 overflow-hidden space-y-4">
                            <div className="flex items-center justify-between">
                              <Badge variant="default">
                                {getSummaryTypeLabel(selectedSummary.summary_type)}
                              </Badge>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(selectedSummary.summary_text)}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  نسخ
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadSummary(selectedSummary)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  تحميل
                                </Button>
                              </div>
                            </div>
                            
                            <ScrollArea className="flex-1 h-[400px] p-4 border rounded-lg bg-muted/30">
                              <div className="prose prose-sm max-w-none text-right" dir="rtl">
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                                  {selectedSummary.summary_text}
                                </pre>
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف هذا التلخيص؟ لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteSummary(summary.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          حذف
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};