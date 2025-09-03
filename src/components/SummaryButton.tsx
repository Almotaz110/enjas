import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription, 
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  FileText, 
  Video, 
  Image,
  Sparkles,
  Copy,
  Download,
  Loader2
} from 'lucide-react';
import { useSummaryService, SummaryRequest } from '@/hooks/useSummaryService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SummaryButtonProps {
  fileName: string;
  fileType: 'pdf' | 'video' | 'text' | 'document' | 'image';
  fileContent?: string;
  file?: File;
  materialUrl?: string;
  className?: string;
  onSummaryComplete?: () => void;
}

export const SummaryButton: React.FC<SummaryButtonProps> = ({
  fileName,
  fileType,
  fileContent,
  file,
  materialUrl,
  className = '',
  onSummaryComplete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [summaryType, setSummaryType] = useState<'basic' | 'detailed' | 'mindmap' | 'keypoints'>('basic');
  const [summaryResult, setSummaryResult] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  
  const { generateSummary, isProcessing, progress } = useSummaryService();

  const getFileIcon = () => {
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

  const handleSummarize = async () => {
    try {
      let fileToProcess = file;
      
      // If no file provided but we have a materialUrl, try to fetch it
      if (!fileToProcess && materialUrl) {
        fileToProcess = await getFileFromUrl(materialUrl);
      }

      const request: SummaryRequest = {
        fileName,
        fileType,
        summaryType,
        text: fileContent,
        file: fileToProcess
      };

      const result = await generateSummary(request);
      setSummaryResult(result.summary);
      setShowResult(true);
      onSummaryComplete?.(); // Trigger refresh of summary history
    } catch (error) {
      console.error('Summarization failed:', error);
    }
  };

  const getFileFromUrl = async (url: string): Promise<File | undefined> => {
    if (url.startsWith('stored://')) {
      const materialId = url.replace('stored://', '');
      const storedData = localStorage.getItem(`material_${materialId}`);
      if (storedData) {
        try {
          // Convert base64 back to File
          const base64Content = storedData.split(',')[1];
          const mimeType = storedData.split(',')[0].split(':')[1].split(';')[0];
          const byteCharacters = atob(base64Content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          return new File([byteArray], fileName, { type: mimeType });
        } catch (error) {
          console.log('Could not reconstruct file');
        }
      }
    } else if (url.startsWith('supabase://')) {
      // Handle Supabase Storage files
      try {
        const filePath = url.replace('supabase://', '');
        const { data, error } = await supabase.storage
          .from('study-materials')
          .download(filePath);

        if (error) {
          throw error;
        }

        return new File([data], fileName, { type: data.type });
      } catch (error) {
        console.log('Could not download file from Supabase Storage');
        toast.error('فشل في تحميل الملف من التخزين السحابي');
      }
    }
    return undefined;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summaryResult);
      toast.success('تم نسخ الملخص');
    } catch (error) {
      toast.error('فشل في نسخ الملخص');
    }
  };

  const downloadSummary = () => {
    const blob = new Blob([summaryResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ملخص_${fileName}_${getSummaryTypeLabel(summaryType)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('تم تحميل الملخص');
  };

  const resetDialog = () => {
    setShowResult(false);
    setSummaryResult('');
    setSummaryType('basic');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${className}`}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Brain className="h-4 w-4" />
              {getFileIcon()}
            </>
          )}
          تلخيص ذكي
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            تلخيص ذكي للمحتوى
          </DialogTitle>
          <DialogDescription className="text-right">
            قم برفع ملف أو أدخل نص لتلخيصه تلقائياً باستخدام الذكاء الاصطناعي
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!showResult ? (
            <div className="space-y-6 p-2">
              {/* File Info */}
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                {getFileIcon()}
                <div className="text-right flex-1">
                  <h4 className="font-medium text-sm">{fileName}</h4>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {fileType.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Summary Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">نوع التلخيص:</label>
                <Select 
                  value={summaryType} 
                  onValueChange={(value) => setSummaryType(value as 'basic' | 'detailed' | 'mindmap' | 'keypoints')}
                >
                  <SelectTrigger dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      <div className="text-right">
                        <div className="font-medium">ملخص موجز</div>
                        <div className="text-xs text-muted-foreground">نقاط سريعة ومختصرة</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="detailed">
                      <div className="text-right">
                        <div className="font-medium">ملخص مفصل</div>
                        <div className="text-xs text-muted-foreground">تحليل شامل ومفصل</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="keypoints">
                      <div className="text-right">
                        <div className="font-medium">النقاط الرئيسية</div>
                        <div className="text-xs text-muted-foreground">أهم المفاهيم والنقاط</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="mindmap">
                      <div className="text-right">
                        <div className="font-medium">خريطة ذهنية</div>
                        <div className="text-xs text-muted-foreground">تنظيم هرمي للمحتوى</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Processing Progress */}
              {isProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">جاري المعالجة...</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSummarize}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4" />
                  )}
                  {isProcessing ? 'جاري التلخيص...' : 'ابدأ التلخيص'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col space-y-4">
              {/* Result Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    {getSummaryTypeLabel(summaryType)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {fileName}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    نسخ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSummary}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    تحميل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetDialog}
                  >
                    تلخيص جديد
                  </Button>
                </div>
              </div>

              {/* Summary Content */}
              <ScrollArea className="flex-1 h-[400px] p-4 border rounded-lg bg-muted/30">
                <div className="prose prose-sm max-w-none text-right" dir="rtl">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                    {summaryResult}
                  </pre>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};