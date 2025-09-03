import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SummaryRequest {
  text?: string;
  file?: File;
  fileName: string;
  fileType: 'pdf' | 'video' | 'text' | 'document' | 'image';
  summaryType: 'basic' | 'detailed' | 'mindmap' | 'keypoints';
}

export interface SummaryResult {
  id: string;
  summary: string;
  fileName: string;
  summaryType: string;
  success: boolean;
}

export const useSummaryService = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data, error } = await supabase.functions.invoke('extract-text-from-pdf', {
      body: formData,
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'فشل في استخراج النص من PDF');

    return data.extractedText;
  };

  const transcribeVideo = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data, error } = await supabase.functions.invoke('transcribe-video', {
      body: formData,
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'فشل في تحويل الفيديو إلى نص');

    return data.transcribedText;
  };

  const generateSummary = async (request: SummaryRequest): Promise<SummaryResult> => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      let extractedText = request.text || '';

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('يجب تسجيل الدخول لاستخدام هذه الميزة');
      }

      // Step 1: Extract text if needed
      if (request.file && !extractedText) {
        setProgress(25);
        
        if (request.fileType === 'pdf') {
          toast.info('جاري استخراج النص من ملف PDF...');
          extractedText = await extractTextFromPDF(request.file);
        } else if (request.fileType === 'video') {
          toast.info('جاري تحويل الفيديو إلى نص...');
          extractedText = await transcribeVideo(request.file);
        } else {
          // For other file types, try to read as text
          extractedText = await request.file.text();
        }
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('لم يتم العثور على نص لتلخيصه');
      }

      setProgress(50);
      toast.info('جاري إنشاء الملخص...');

      // Step 2: Generate summary
      const { data, error } = await supabase.functions.invoke('summarize-content', {
        body: {
          text: extractedText,
          summaryType: request.summaryType,
          fileName: request.fileName,
          fileType: request.fileType,
          userId: user.id
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'فشل في إنشاء الملخص');

      setProgress(100);
      toast.success('تم إنشاء الملخص بنجاح');

      return {
        id: data.summaryId,
        summary: data.summary,
        fileName: data.fileName,
        summaryType: data.summaryType,
        success: true
      };

    } catch (error: any) {
      console.error('Summary generation error:', error);
      toast.error(error.message || 'حدث خطأ في إنشاء الملخص');
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const getSummaryHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching summary history:', error);
      return [];
    }
  };

  const deleteSummary = async (summaryId: string) => {
    try {
      const { error } = await supabase
        .from('summaries')
        .delete()
        .eq('id', summaryId);

      if (error) throw error;
      toast.success('تم حذف الملخص بنجاح');
    } catch (error: any) {
      console.error('Error deleting summary:', error);
      toast.error('فشل في حذف الملخص');
      throw error;
    }
  };

  return {
    generateSummary,
    getSummaryHistory,
    deleteSummary,
    isProcessing,
    progress
  };
};