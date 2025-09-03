-- إنشاء bucket للملفات
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', false);

-- إنشاء جدول تلخيص المحتوى
CREATE TABLE public.summaries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    original_file_path TEXT,
    original_file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'video', 'text', 'document', 'image')),
    content_type TEXT NOT NULL CHECK (content_type IN ('document', 'video', 'mindmap', 'text')),
    original_content TEXT,
    summary_text TEXT,
    summary_type TEXT NOT NULL CHECK (summary_type IN ('basic', 'detailed', 'mindmap', 'keypoints')),
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- تمكين RLS
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view their own summaries" 
ON public.summaries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries" 
ON public.summaries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" 
ON public.summaries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries" 
ON public.summaries 
FOR DELETE 
USING (auth.uid() = user_id);

-- سياسات التخزين
-- المستخدمون يمكنهم رفع ملفاتهم الخاصة
CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- المستخدمون يمكنهم عرض ملفاتهم الخاصة
CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- المستخدمون يمكنهم تحديث ملفاتهم الخاصة
CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- المستخدمون يمكنهم حذف ملفاتهم الخاصة
CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- دالة تحديث التوقيت
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- محفز تحديث التوقيت
CREATE TRIGGER update_summaries_updated_at
    BEFORE UPDATE ON public.summaries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- فهارس للأداء
CREATE INDEX idx_summaries_user_id ON public.summaries(user_id);
CREATE INDEX idx_summaries_created_at ON public.summaries(created_at DESC);
CREATE INDEX idx_summaries_file_type ON public.summaries(file_type);
CREATE INDEX idx_summaries_processing_status ON public.summaries(processing_status);