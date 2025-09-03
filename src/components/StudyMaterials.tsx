import { useState, useRef, useCallback, useEffect } from 'react';
import { Subject, StudyMaterial } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Video, 
  Image, 
  Link as LinkIcon, 
  Folder,
  Download,
  ExternalLink,
  Search,
  Trash2,
  Upload,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SummaryButton } from '@/components/SummaryButton';
import { SummaryHistory } from '@/components/SummaryHistory';
import { supabase } from '@/integrations/supabase/client';

interface StudyMaterialsProps {
  subjects?: Subject[];
  onSubjectsChange?: (subjects: Subject[]) => void;
}

// Sample initial data
const initialSubjects: Subject[] = [
  {
    id: uuidv4(),
    name: 'الرياضيات',
    color: '#FF6B6B',
    createdAt: new Date(),
    materials: [
      {
        id: uuidv4(),
        title: 'ملخص الجبر الخطي',
        subject: 'الرياضيات',
        type: 'pdf',
        url: '/sample.pdf',
        category: 'summary',
        createdAt: new Date(),
        size: 2048
      }
    ]
  },
  {
    id: uuidv4(),
    name: 'الفيزياء',
    color: '#4ECDC4',
    createdAt: new Date(),
    materials: []
  }
];

export const StudyMaterials = ({ 
  subjects = initialSubjects, 
  onSubjectsChange 
}: StudyMaterialsProps) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New subject form
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#FF6B6B');
  
  // New material form
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialType, setNewMaterialType] = useState<StudyMaterial['type']>('pdf');
  const [newMaterialCategory, setNewMaterialCategory] = useState<StudyMaterial['category']>('summary');

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  // Initialize selectedSubject when subjects change
  useEffect(() => {
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0]);
    } else if (selectedSubject && !subjects.find(s => s.id === selectedSubject.id)) {
      // If current selected subject no longer exists, select the first one
      setSelectedSubject(subjects[0] || null);
    }
  }, [subjects, selectedSubject]);

  const uploadToSupabaseStorage = async (file: File, materialId: string): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('يجب تسجيل الدخول لرفع الملفات الكبيرة');
      }

      const fileName = `${user.id}/${materialId}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('study-materials')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage error:', error);
        throw new Error('فشل في رفع الملف إلى التخزين السحابي');
      }

      return `supabase://${data.path}`;
    } catch (error) {
      console.error('Upload to Supabase Storage failed:', error);
      throw error;
    }
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) {
      toast.error('يرجى إدخال اسم المادة');
      return;
    }

    const newSubject: Subject = {
      id: uuidv4(),
      name: newSubjectName,
      color: newSubjectColor,
      materials: [],
      createdAt: new Date()
    };

    const updatedSubjects = [...subjects, newSubject];
    onSubjectsChange?.(updatedSubjects);
    setSelectedSubject(newSubject);
    setNewSubjectName('');
    setIsAddSubjectOpen(false);
    toast.success('تمت إضافة المادة بنجاح');
  };

  // File upload handlers
  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file);
    
    // Determine file type
    const fileType = file.type;
    let materialType: StudyMaterial['type'] = 'document';
    
    if (fileType.includes('pdf')) materialType = 'pdf';
    else if (fileType.includes('video')) materialType = 'video';
    else if (fileType.includes('image')) materialType = 'image';
    
    setNewMaterialType(materialType);
    setNewMaterialTitle(file.name.split('.')[0]);
    
    // Create preview URL for images and PDFs
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    toast.success(`تم تحديد الملف: ${file.name}`);
  }, []);

  const saveFileToStorage = async (file: File, materialId: string): Promise<string> => {
    try {
      // Check file size limit (10GB)
      const maxSizeInBytes = 10 * 1024 * 1024 * 1024; // 10GB
      if (file.size > maxSizeInBytes) {
        throw new Error('حجم الملف كبير جداً. الحد الأقصى هو 10GB');
      }

      // For large files, we'll store them in Supabase Storage instead of localStorage
      if (file.size > 5 * 1024 * 1024) { // Files larger than 5MB go to Supabase Storage
        return await uploadToSupabaseStorage(file, materialId);
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const base64Data = reader.result as string;
            
            // Calculate current localStorage usage more safely
            let currentUsage = 0;
            try {
              for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                  currentUsage += localStorage.getItem(key)?.length || 0;
                }
              }
            } catch (e) {
              console.warn('تعذر حساب استخدام التخزين');
            }
            
            const estimatedSize = base64Data.length;
            const storageQuota = 4 * 1024 * 1024; // 4MB safe limit for localStorage
            
            if (currentUsage + estimatedSize > storageQuota) {
              reject(new Error('مساحة التخزين ممتلئة. احذف بعض الملفات لإضافة ملفات جديدة'));
              return;
            }
            
            // Test if we can actually store the data
            try {
              localStorage.setItem(`material_${materialId}`, base64Data);
              resolve(`stored://${materialId}`);
            } catch (storageError) {
              reject(new Error('فشل في حفظ الملف. مساحة التخزين غير كافية'));
            }
          } catch (error) {
            reject(new Error('فشل في معالجة الملف'));
          }
        };
        reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      throw error;
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterialTitle.trim() || !selectedSubject || !uploadedFile) {
      toast.error('يرجى ملء جميع الحقول المطلوبة وتحديد ملف');
      return;
    }

    try {
      const materialId = uuidv4();
      const storedUrl = await saveFileToStorage(uploadedFile, materialId);

      const newMaterial: StudyMaterial = {
        id: materialId,
        title: newMaterialTitle,
        subject: selectedSubject.name,
        type: newMaterialType,
        url: storedUrl,
        category: newMaterialCategory,
        createdAt: new Date(),
        size: uploadedFile.size
      };

      const updatedSubjects = subjects.map(subject => 
        subject.id === selectedSubject.id 
          ? { ...subject, materials: [...subject.materials, newMaterial] }
          : subject
      );

      onSubjectsChange?.(updatedSubjects);
      setNewMaterialTitle('');
      setUploadedFile(null);
      setPreviewUrl('');
      setIsAddMaterialOpen(false);
      toast.success('تمت إضافة المادة التعليمية بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'فشل في إضافة المادة التعليمية');
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const openStoredFile = async (url: string, type: StudyMaterial['type']) => {
    if (url.startsWith('stored://')) {
      const materialId = url.replace('stored://', '');
      const storedData = localStorage.getItem(`material_${materialId}`);
      if (storedData) {
        try {
          const link = document.createElement('a');
          link.href = storedData;
          link.target = '_blank';
          link.download = 'material'; // Add download attribute for better handling
          link.click();
        } catch (error) {
          toast.error('فشل في فتح الملف');
        }
      } else {
        toast.error('الملف غير موجود أو تم حذفه');
      }
    } else if (url.startsWith('supabase://')) {
      // Handle Supabase Storage files
      try {
        const filePath = url.replace('supabase://', '');
        const { data, error } = await supabase.storage
          .from('study-materials')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
          throw error;
        }

        window.open(data.signedUrl, '_blank');
      } catch (error) {
        console.error('Error opening Supabase file:', error);
        toast.error('فشل في فتح الملف من التخزين السحابي');
      }
    } else {
      try {
        window.open(url, '_blank');
      } catch (error) {
        toast.error('فشل في فتح الرابط');
      }
    }
  };

  const getStoredFileContent = (material: StudyMaterial): string | undefined => {
    if (material.url.startsWith('stored://')) {
      const materialId = material.url.replace('stored://', '');
      const storedData = localStorage.getItem(`material_${materialId}`);
      if (storedData && (material.type === 'document' || material.type === 'pdf')) {
        try {
          // For text files, try to extract the actual text content
          const base64Content = storedData.split(',')[1];
          return atob(base64Content);
        } catch (error) {
          console.log('Could not extract text content');
        }
      }
    }
    return undefined;
  };

  const determineFileTypeForSummary = (material: StudyMaterial): 'pdf' | 'video' | 'text' | 'document' | 'image' => {
    switch (material.type) {
      case 'pdf': return 'pdf';
      case 'video': return 'video';
      case 'image': return 'image';
      case 'document': return 'document';
      default: return 'text';
    }
  };

  const getStoredFile = async (material: StudyMaterial): Promise<File | undefined> => {
    if (material.url.startsWith('stored://')) {
      const materialId = material.url.replace('stored://', '');
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
          return new File([byteArray], material.title, { type: mimeType });
        } catch (error) {
          console.log('Could not reconstruct file');
        }
      }
    } else if (material.url.startsWith('supabase://')) {
      // Handle Supabase Storage files
      try {
        const filePath = material.url.replace('supabase://', '');
        const { data, error } = await supabase.storage
          .from('study-materials')
          .download(filePath);

        if (error) {
          throw error;
        }

        return new File([data], material.title, { type: data.type });
      } catch (error) {
        console.log('Could not download file from Supabase Storage');
      }
    }
    return undefined;
  };

  const getTypeIcon = (type: StudyMaterial['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryName = (category: StudyMaterial['category']) => {
    switch (category) {
      case 'summary': return 'ملخصات';
      case 'assignment': return 'واجبات';
      default: return 'ملخصات';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredMaterials = selectedSubject?.materials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.subject.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      // Clean up stored files for this subject
      const subjectToDelete = subjects.find(s => s.id === subjectId);
      if (subjectToDelete) {
        for (const material of subjectToDelete.materials) {
          if (material.url.startsWith('stored://')) {
            const materialId = material.url.replace('stored://', '');
            localStorage.removeItem(`material_${materialId}`);
          } else if (material.url.startsWith('supabase://')) {
            // Remove from Supabase Storage
            const filePath = material.url.replace('supabase://', '');
            const { error } = await supabase.storage
              .from('study-materials')
              .remove([filePath]);
            
            if (error) {
              console.error('Error deleting from Supabase Storage:', error);
            }
          }
        }
      }
      
      const updatedSubjects = subjects.filter(subject => subject.id !== subjectId);
      onSubjectsChange?.(updatedSubjects);
      
      // If we deleted the currently selected subject, reset selection
      if (selectedSubject?.id === subjectId) {
        setSelectedSubject(updatedSubjects[0] || null);
      }
      
      toast.success('تم حذف المادة بنجاح');
    } catch (error) {
      toast.error('فشل في حذف المادة');
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!selectedSubject) return;
    
    try {
      // Remove from storage based on storage type
      const material = selectedSubject.materials.find(m => m.id === materialId);
      if (material?.url.startsWith('stored://')) {
        const storageKey = `material_${materialId}`;
        localStorage.removeItem(storageKey);
      } else if (material?.url.startsWith('supabase://')) {
        // Remove from Supabase Storage
        const filePath = material.url.replace('supabase://', '');
        const { error } = await supabase.storage
          .from('study-materials')
          .remove([filePath]);
        
        if (error) {
          console.error('Error deleting from Supabase Storage:', error);
        }
      }
      
      const updatedSubjects = subjects.map(subject => 
        subject.id === selectedSubject.id 
          ? { ...subject, materials: subject.materials.filter(material => material.id !== materialId) }
          : subject
      );
      
      // Update selectedSubject state to reflect the change
      const updatedSelectedSubject = updatedSubjects.find(subject => subject.id === selectedSubject.id);
      if (updatedSelectedSubject) {
        setSelectedSubject(updatedSelectedSubject);
      }
      
      onSubjectsChange?.(updatedSubjects);
      toast.success('تم حذف المادة التعليمية بنجاح');
    } catch (error) {
      toast.error('فشل في حذف المادة التعليمية');
    }
  };

  const handleSummaryComplete = () => {
    setSummaryRefreshKey(prev => prev + 1);
  };

  const materialsByCategory = {
    summary: filteredMaterials.filter(m => m.category === 'summary'),
    assignment: filteredMaterials.filter(m => m.category === 'assignment')
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-right flex items-center gap-2 text-lg sm:text-xl">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            منصة المواد الدراسية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مادة
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-2 sm:mx-0 w-[calc(100vw-1rem)] sm:w-full max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-right text-base sm:text-lg">إضافة مادة دراسية جديدة</DialogTitle>
                    <DialogDescription className="text-right text-sm">
                      أدخل تفاصيل المادة الدراسية الجديدة
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subjectName" className="text-sm">اسم المادة</Label>
                      <Input
                        id="subjectName"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="مثال: الرياضيات"
                        dir="rtl"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">لون المادة</Label>
                      <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                        {colors.map((color) => (
                          <button
                            key={color}
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all ${
                              newSubjectColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewSubjectColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddSubjectOpen(false)} className="w-full sm:w-auto">
                        إلغاء
                      </Button>
                      <Button onClick={handleAddSubject} className="w-full sm:w-auto">
                        إضافة المادة
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {selectedSubject && (
                <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة مادة تعليمية
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="mx-2 sm:mx-0 w-[calc(100vw-1rem)] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-right text-base sm:text-lg">إضافة مادة تعليمية</DialogTitle>
                      <DialogDescription className="text-right text-sm">
                        ارفع ملف أو أدخل رابط للمادة التعليمية
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="materialTitle" className="text-sm">عنوان المادة</Label>
                        <Input
                          id="materialTitle"
                          value={newMaterialTitle}
                          onChange={(e) => setNewMaterialTitle(e.target.value)}
                          placeholder="مثال: ملخص الفصل الأول"
                          dir="rtl"
                          className="text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="materialType" className="text-sm">نوع المادة</Label>
                          <Select
                            value={newMaterialType}
                            onValueChange={(value) => setNewMaterialType(value as StudyMaterial['type'])}
                          >
                            <SelectTrigger dir="rtl" className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">ملف PDF</SelectItem>
                              <SelectItem value="video">فيديو</SelectItem>
                              <SelectItem value="image">صورة</SelectItem>
                              <SelectItem value="link">رابط خارجي</SelectItem>
                              <SelectItem value="document">مستند</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="materialCategory" className="text-sm">التصنيف</Label>
                          <Select
                            value={newMaterialCategory}
                            onValueChange={(value) => setNewMaterialCategory(value as StudyMaterial['category'])}
                          >
                            <SelectTrigger dir="rtl" className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="summary">ملخصات</SelectItem>
                              <SelectItem value="assignment">واجبات</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* File Upload Section */}
                      <div className="space-y-4">
                        <Label className="text-sm">رفع الملف</Label>
                        
                        {/* Drag and Drop Area */}
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
                            isDragOver 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                            اسحب الملف هنا أو انقر للتصفح
                          </p>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full sm:w-auto"
                          >
                            تصفح الملفات
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileInputChange}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                          />
                        </div>

                        {/* Selected File Preview */}
                        {uploadedFile && (
                          <div className="p-3 sm:p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              {getTypeIcon(newMaterialType)}
                              <div className="flex-1 text-right">
                                <p className="font-medium text-sm sm:text-base truncate">{uploadedFile.name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {formatFileSize(uploadedFile.size)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setIsAddMaterialOpen(false);
                          setUploadedFile(null);
                          setPreviewUrl('');
                          setNewMaterialTitle('');
                        }} className="w-full sm:w-auto">
                          إلغاء
                        </Button>
                        <Button onClick={handleAddMaterial} disabled={!uploadedFile} className="w-full sm:w-auto">
                          إضافة المادة
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-auto sm:min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث في المواد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full text-sm"
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Subjects Sidebar */}
        <div className="xl:col-span-1 order-2 xl:order-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-right text-sm sm:text-base">المواد الدراسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[400px] xl:max-h-[600px] overflow-y-auto">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className={`w-full p-2 sm:p-3 rounded-lg text-right transition-all cursor-pointer ${
                    selectedSubject?.id === subject.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => setSelectedSubject(subject)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rtl mx-2 sm:mx-0 w-[calc(100vw-1rem)] sm:w-full max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base">تأكيد الحذف</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              هل أنت متأكد من حذف مادة "{subject.name}"؟ سيتم حذف جميع المواد التعليمية المرتبطة بها أيضاً. لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteSubject(subject.id)}
                              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <div
                        className="w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="font-medium text-xs sm:text-sm truncate">{subject.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {subject.materials.length}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Materials Content */}
        <div className="xl:col-span-3 order-1 xl:order-2">
          {selectedSubject ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <Folder 
                    className="h-5 w-5" 
                    style={{ color: selectedSubject.color }} 
                  />
                  {selectedSubject.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm">
                    <TabsTrigger value="summary" className="px-2 sm:px-4">
                      <span className="hidden sm:inline">ملخصات </span>
                      <span className="sm:hidden">ملخصات</span>
                      ({materialsByCategory.summary.length})
                    </TabsTrigger>
                    <TabsTrigger value="assignment" className="px-2 sm:px-4">
                      <span className="hidden sm:inline">واجبات </span>
                      <span className="sm:hidden">واجبات</span>
                      ({materialsByCategory.assignment.length})
                    </TabsTrigger>
                  </TabsList>

                  {(['summary', 'assignment'] as const).map((category) => (
                    <TabsContent key={category} value={category} className="space-y-3 mt-4">
                      {materialsByCategory[category].length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm sm:text-base">لا توجد مواد في هذا التصنيف</p>
                        </div>
                      ) : (
                        materialsByCategory[category].map((material) => (
                          <Card key={material.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="text-right flex-1">
                                  <div className="flex items-center gap-2 justify-end mb-2">
                                    {getTypeIcon(material.type)}
                                    <h4 className="font-medium text-sm sm:text-base truncate">{material.title}</h4>
                                  </div>
                                  <div className="flex gap-2 justify-end flex-wrap">
                                    <Badge variant="outline" className="text-xs">
                                      {getCategoryName(material.category)}
                                    </Badge>
                                    {material.size && (
                                      <Badge variant="secondary" className="text-xs">
                                        {formatFileSize(material.size)}
                                      </Badge>
                                    )}
                                  </div>
                                  </div>
                                  <div className="flex gap-2 justify-end sm:justify-start shrink-0">
                                    {/* Summary Button */}
                                     <SummaryButton
                                        fileName={material.title}
                                        fileType={determineFileTypeForSummary(material)}
                                        fileContent={getStoredFileContent(material)}
                                        materialUrl={material.url}
                                        className=""
                                        onSummaryComplete={handleSummaryComplete}
                                      />
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="rtl mx-2 sm:mx-0 w-[calc(100vw-1rem)] sm:w-full max-w-md">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="text-base">تأكيد الحذف</AlertDialogTitle>
                                          <AlertDialogDescription className="text-sm">
                                            هل أنت متأكد من حذف المادة التعليمية "{material.title}"؟ لا يمكن التراجع عن هذا الإجراء.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                          <AlertDialogCancel className="w-full sm:w-auto">إلغاء</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleDeleteMaterial(material.id)}
                                            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                                          >
                                            حذف
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                    
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => openStoredFile(material.url, material.type)}
                                     >
                                       <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                     </Button>
                                  </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8 sm:py-16">
                <div className="text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-base sm:text-lg font-medium mb-2">اختر مادة دراسية</h3>
                  <p className="text-sm sm:text-base">اختر مادة من القائمة أو أضف مادة جديدة للبدء</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Summary History Section */}
      <SummaryHistory refreshKey={summaryRefreshKey} />
    </div>
  );
};