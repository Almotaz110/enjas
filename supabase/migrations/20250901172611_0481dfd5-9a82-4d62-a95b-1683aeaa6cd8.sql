-- Create RLS policies for study-materials storage bucket

-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload files to study-materials bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'study-materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view/download their own files
CREATE POLICY "Users can view their own files in study-materials bucket" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'study-materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files in study-materials bucket" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'study-materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files in study-materials bucket" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'study-materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);