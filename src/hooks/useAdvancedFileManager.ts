import { useState, useCallback, useEffect } from 'react';
import { Subject, StudyMaterial } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export interface FileMetadata {
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  lastAccessed: Date;
  accessCount: number;
  studyProgress: number;
  isBookmarked: boolean;
  notes: string;
  version: number;
  parentFileId?: string;
}

export interface EnhancedStudyMaterial extends StudyMaterial {
  metadata: FileMetadata;
  relatedFiles: string[];
  smartTags: string[];
}

export interface StudySession {
  id: string;
  materialId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  progressMade: number;
  notes: string;
  rating: number;
}

export interface FileAnalytics {
  totalFiles: number;
  filesByType: Record<string, number>;
  studyTime: number;
  completionRate: number;
  popularTags: Array<{ tag: string; count: number }>;
  recentActivity: StudySession[];
}

export const useAdvancedFileManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enhancedMaterials, setEnhancedMaterials] = useState<Map<string, EnhancedStudyMaterial>>(new Map());
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [bookmarkedFiles, setBookmarkedFiles] = useState<Set<string>>(new Set());

  // Smart file categorization based on content analysis
  const analyzeFileContent = useCallback(async (file: File): Promise<{ tags: string[], difficulty: string, estimatedTime: number }> => {
    try {
      // Simulated AI analysis - in real implementation, this would use ML models
      const fileName = file.name.toLowerCase();
      const fileType = file.type;
      
      let tags: string[] = [];
      let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
      let estimatedTime = Math.ceil(file.size / (1024 * 100)); // Basic estimation

      // Smart tag detection based on filename and content
      if (fileName.includes('intro') || fileName.includes('basic')) {
        tags.push('مقدمة', 'أساسيات');
        difficulty = 'beginner';
      }
      if (fileName.includes('advanced') || fileName.includes('expert')) {
        tags.push('متقدم', 'خبراء');
        difficulty = 'advanced';
      }
      if (fileName.includes('exam') || fileName.includes('test')) {
        tags.push('امتحان', 'اختبار');
      }
      if (fileName.includes('summary') || fileName.includes('notes')) {
        tags.push('ملخص', 'ملاحظات');
      }
      if (fileType.includes('video')) {
        tags.push('فيديو', 'مرئي');
        estimatedTime *= 2; // Videos take longer to process
      }
      if (fileType.includes('pdf')) {
        tags.push('نص', 'قراءة');
      }

      return { tags, difficulty, estimatedTime };
    } catch (error) {
      console.error('Error analyzing file content:', error);
      return { tags: [], difficulty: 'intermediate', estimatedTime: 10 };
    }
  }, []);

  // Enhanced file upload with smart analysis
  const uploadFileWithAnalysis = useCallback(async (
    file: File, 
    subject: Subject, 
    category: StudyMaterial['category']
  ): Promise<EnhancedStudyMaterial> => {
    setIsLoading(true);
    
    try {
      const analysis = await analyzeFileContent(file);
      const materialId = uuidv4();
      
      // Save file to storage (localStorage or Supabase based on size)
      let storedUrl: string;
      if (file.size > 5 * 1024 * 1024) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('يجب تسجيل الدخول');
        
        const fileName = `${user.id}/${materialId}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('study-materials')
          .upload(fileName, file);
        
        if (error) throw error;
        storedUrl = `supabase://${data.path}`;
      } else {
        // Store in localStorage for smaller files
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        localStorage.setItem(`material_${materialId}`, base64Data);
        storedUrl = `stored://${materialId}`;
      }

      const enhancedMaterial: EnhancedStudyMaterial = {
        id: materialId,
        title: file.name.split('.')[0],
        subject: subject.name,
        type: file.type.includes('pdf') ? 'pdf' : 
              file.type.includes('video') ? 'video' :
              file.type.includes('image') ? 'image' : 'document',
        url: storedUrl,
        category,
        createdAt: new Date(),
        size: file.size,
        metadata: {
          tags: analysis.tags,
          difficulty: analysis.difficulty as any,
          estimatedReadTime: analysis.estimatedTime,
          lastAccessed: new Date(),
          accessCount: 0,
          studyProgress: 0,
          isBookmarked: false,
          notes: '',
          version: 1
        },
        relatedFiles: [],
        smartTags: analysis.tags
      };

      setEnhancedMaterials(prev => new Map(prev).set(materialId, enhancedMaterial));
      toast.success('تم رفع الملف وتحليله بنجاح');
      
      return enhancedMaterial;
    } catch (error: any) {
      toast.error(error.message || 'فشل في رفع الملف');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [analyzeFileContent]);

  // Advanced search with filters
  const searchFiles = useCallback((
    query: string,
    filters: {
      subjects?: string[];
      types?: StudyMaterial['type'][];
      categories?: StudyMaterial['category'][];
      difficulty?: FileMetadata['difficulty'][];
      tags?: string[];
      dateRange?: { start?: Date; end?: Date };
      minProgress?: number;
      maxProgress?: number;
      isBookmarked?: boolean;
    } = {}
  ) => {
    const results: EnhancedStudyMaterial[] = [];
    
    enhancedMaterials.forEach(material => {
      // Text search
      const matchesQuery = !query || 
        material.title.toLowerCase().includes(query.toLowerCase()) ||
        material.subject.toLowerCase().includes(query.toLowerCase()) ||
        material.metadata.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      
      // Apply filters
      const matchesSubject = !filters.subjects?.length || filters.subjects.includes(material.subject);
      const matchesType = !filters.types?.length || filters.types.includes(material.type);
      const matchesCategory = !filters.categories?.length || filters.categories.includes(material.category);
      const matchesDifficulty = !filters.difficulty?.length || filters.difficulty.includes(material.metadata.difficulty);
      const matchesTags = !filters.tags?.length || filters.tags.some(tag => material.metadata.tags.includes(tag));
      const matchesProgress = (filters.minProgress === undefined || material.metadata.studyProgress >= filters.minProgress) &&
                             (filters.maxProgress === undefined || material.metadata.studyProgress <= filters.maxProgress);
      const matchesBookmark = filters.isBookmarked === undefined || material.metadata.isBookmarked === filters.isBookmarked;
      
      let matchesDate = true;
      if (filters.dateRange?.start && filters.dateRange?.end) {
        const createdAt = new Date(material.createdAt);
        matchesDate = createdAt >= filters.dateRange.start && createdAt <= filters.dateRange.end;
      }
      
      if (matchesQuery && matchesSubject && matchesType && matchesCategory && 
          matchesDifficulty && matchesTags && matchesProgress && matchesBookmark && matchesDate) {
        results.push(material);
      }
    });
    
    // Update search history
    if (query.trim()) {
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, 10);
        return newHistory;
      });
    }
    
    return results;
  }, [enhancedMaterials]);

  // File relationship management
  const linkRelatedFiles = useCallback((fileId1: string, fileId2: string) => {
    setEnhancedMaterials(prev => {
      const newMap = new Map(prev);
      const file1 = newMap.get(fileId1);
      const file2 = newMap.get(fileId2);
      
      if (file1 && file2) {
        file1.relatedFiles = [...new Set([...file1.relatedFiles, fileId2])];
        file2.relatedFiles = [...new Set([...file2.relatedFiles, fileId1])];
        newMap.set(fileId1, file1);
        newMap.set(fileId2, file2);
      }
      
      return newMap;
    });
  }, []);

  // Study session tracking
  const startStudySession = useCallback((materialId: string) => {
    const session: StudySession = {
      id: uuidv4(),
      materialId,
      startTime: new Date(),
      duration: 0,
      progressMade: 0,
      notes: '',
      rating: 0
    };
    
    setStudySessions(prev => [...prev, session]);
    
    // Update access count and last accessed
    setEnhancedMaterials(prev => {
      const newMap = new Map(prev);
      const material = newMap.get(materialId);
      if (material) {
        material.metadata.accessCount += 1;
        material.metadata.lastAccessed = new Date();
        newMap.set(materialId, material);
      }
      return newMap;
    });
    
    return session.id;
  }, []);

  const endStudySession = useCallback((sessionId: string, progressMade: number, notes: string, rating: number) => {
    setStudySessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000 / 60); // minutes
        
        return {
          ...session,
          endTime,
          duration,
          progressMade,
          notes,
          rating
        };
      }
      return session;
    }));
    
    // Update material progress
    const session = studySessions.find(s => s.id === sessionId);
    if (session) {
      setEnhancedMaterials(prev => {
        const newMap = new Map(prev);
        const material = newMap.get(session.materialId);
        if (material) {
          material.metadata.studyProgress = Math.min(100, material.metadata.studyProgress + progressMade);
          newMap.set(session.materialId, material);
        }
        return newMap;
      });
    }
  }, [studySessions]);

  // Bookmark management
  const toggleBookmark = useCallback((materialId: string) => {
    setEnhancedMaterials(prev => {
      const newMap = new Map(prev);
      const material = newMap.get(materialId);
      if (material) {
        material.metadata.isBookmarked = !material.metadata.isBookmarked;
        newMap.set(materialId, material);
        
        if (material.metadata.isBookmarked) {
          setBookmarkedFiles(prev => new Set([...prev, materialId]));
        } else {
          setBookmarkedFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(materialId);
            return newSet;
          });
        }
      }
      return newMap;
    });
  }, []);

  // Analytics calculation
  const getFileAnalytics = useCallback((): FileAnalytics => {
    const materials = Array.from(enhancedMaterials.values());
    
    const filesByType = materials.reduce((acc, material) => {
      acc[material.type] = (acc[material.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalStudyTime = studySessions.reduce((acc, session) => acc + session.duration, 0);
    const completedFiles = materials.filter(m => m.metadata.studyProgress >= 100).length;
    const completionRate = materials.length > 0 ? (completedFiles / materials.length) * 100 : 0;
    
    const tagCounts = materials.reduce((acc, material) => {
      material.metadata.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const recentActivity = studySessions
      .filter(session => session.endTime)
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime())
      .slice(0, 10);
    
    return {
      totalFiles: materials.length,
      filesByType,
      studyTime: totalStudyTime,
      completionRate,
      popularTags,
      recentActivity
    };
  }, [enhancedMaterials, studySessions]);

  // Get smart recommendations
  const getSmartRecommendations = useCallback((materialId?: string) => {
    const materials = Array.from(enhancedMaterials.values());
    
    if (materialId) {
      const currentMaterial = enhancedMaterials.get(materialId);
      if (!currentMaterial) return [];
      
      // Find similar materials based on tags, subject, and difficulty
      return materials
        .filter(m => m.id !== materialId)
        .map(material => {
          let similarity = 0;
          
          // Subject similarity
          if (material.subject === currentMaterial.subject) similarity += 30;
          
          // Tag similarity
          const commonTags = material.metadata.tags.filter(tag => 
            currentMaterial.metadata.tags.includes(tag)
          ).length;
          similarity += commonTags * 10;
          
          // Difficulty similarity
          if (material.metadata.difficulty === currentMaterial.metadata.difficulty) similarity += 20;
          
          // Type similarity
          if (material.type === currentMaterial.type) similarity += 15;
          
          return { material, similarity };
        })
        .filter(item => item.similarity > 20)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .map(item => item.material);
    }
    
    // General recommendations based on study patterns
    return materials
      .filter(material => material.metadata.studyProgress < 100)
      .sort((a, b) => {
        // Prioritize recently accessed but not completed files
        const aScore = a.metadata.accessCount * 0.3 + (100 - a.metadata.studyProgress) * 0.7;
        const bScore = b.metadata.accessCount * 0.3 + (100 - b.metadata.studyProgress) * 0.7;
        return bScore - aScore;
      })
      .slice(0, 5);
  }, [enhancedMaterials]);

  return {
    subjects,
    enhancedMaterials: Array.from(enhancedMaterials.values()),
    studySessions,
    isLoading,
    searchHistory,
    bookmarkedFiles,
    uploadFileWithAnalysis,
    searchFiles,
    linkRelatedFiles,
    startStudySession,
    endStudySession,
    toggleBookmark,
    getFileAnalytics,
    getSmartRecommendations,
    analyzeFileContent
  };
};