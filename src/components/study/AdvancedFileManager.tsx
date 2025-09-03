import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  BookmarkIcon, 
  Clock, 
  TrendingUp, 
  FileText, 
  Video, 
  Image, 
  LinkIcon,
  Star,
  Calendar as CalendarIcon,
  Tag,
  Target,
  BarChart3,
  Lightbulb,
  Upload,
  Eye,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAdvancedFileManager, EnhancedStudyMaterial } from '@/hooks/useAdvancedFileManager';
import { StudyMaterial } from '@/types/task';
import { toast } from 'sonner';

interface AdvancedFileManagerProps {
  className?: string;
}

export const AdvancedFileManager: React.FC<AdvancedFileManagerProps> = ({ className }) => {
  const {
    enhancedMaterials,
    searchFiles,
    toggleBookmark,
    getFileAnalytics,
    getSmartRecommendations,
    startStudySession,
    searchHistory
  } = useAdvancedFileManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedView, setSelectedView] = useState<'grid' | 'list' | 'analytics'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'progress' | 'rating'>('recent');
  
  // Filter states
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<StudyMaterial['type'][]>([]);
  const [selectedCategories, setSelectedCategories] = useState<StudyMaterial['category'][]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [progressRange, setProgressRange] = useState([0, 100]);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  const analytics = getFileAnalytics();

  const filteredMaterials = searchFiles(searchQuery, {
    subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    difficulty: selectedDifficulty.length > 0 ? selectedDifficulty as any : undefined,
    minProgress: progressRange[0],
    maxProgress: progressRange[1],
    isBookmarked: showBookmarkedOnly || undefined,
    dateRange: dateRange.start && dateRange.end ? dateRange : undefined
  });

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.title.localeCompare(b.title, 'ar');
      case 'progress':
        return b.metadata.studyProgress - a.metadata.studyProgress;
      case 'rating':
        return (b.metadata.accessCount || 0) - (a.metadata.accessCount || 0);
      case 'recent':
      default:
        return new Date(b.metadata.lastAccessed).getTime() - new Date(a.metadata.lastAccessed).getTime();
    }
  });

  const getTypeIcon = (type: StudyMaterial['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-muted-foreground';
    }
  };

  const handleStartStudy = (material: EnhancedStudyMaterial) => {
    const sessionId = startStudySession(material.id);
    toast.success(`بدأت جلسة دراسة: ${material.title}`);
  };

  const clearFilters = () => {
    setSelectedSubjects([]);
    setSelectedTypes([]);
    setSelectedCategories([]);
    setSelectedDifficulty([]);
    setProgressRange([0, 100]);
    setShowBookmarkedOnly(false);
    setDateRange({});
    setSearchQuery('');
  };

  const uniqueSubjects = [...new Set(enhancedMaterials.map(m => m.subject))];
  const allTags = [...new Set(enhancedMaterials.flatMap(m => m.metadata.tags))];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث في الملفات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchHistory.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {searchHistory.slice(0, 5).map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery(query)}
                  className="text-xs"
                >
                  {query}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            الفلاتر
          </Button>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">الأحدث</SelectItem>
              <SelectItem value="alphabetical">أبجدي</SelectItem>
              <SelectItem value="progress">التقدم</SelectItem>
              <SelectItem value="rating">التقييم</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <TabsList>
              <TabsTrigger value="grid">شبكة</TabsTrigger>
              <TabsTrigger value="list">قائمة</TabsTrigger>
              <TabsTrigger value="analytics">إحصائيات</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>الفلاتر المتقدمة</span>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                مسح الكل
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Subjects Filter */}
              <div className="space-y-2">
                <Label>المواد</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uniqueSubjects.map(subject => (
                    <div key={subject} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`subject-${subject}`}
                        checked={selectedSubjects.includes(subject)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSubjects([...selectedSubjects, subject]);
                          } else {
                            setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                          }
                        }}
                      />
                      <Label htmlFor={`subject-${subject}`} className="text-sm">
                        {subject}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Types Filter */}
              <div className="space-y-2">
                <Label>نوع الملف</Label>
                <div className="space-y-2">
                  {['pdf', 'video', 'image', 'document', 'link'].map(type => (
                    <div key={type} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type as any)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTypes([...selectedTypes, type as any]);
                          } else {
                            setSelectedTypes(selectedTypes.filter(t => t !== type));
                          }
                        }}
                      />
                      <Label htmlFor={`type-${type}`} className="text-sm flex items-center gap-2">
                        {getTypeIcon(type as any)}
                        {type === 'pdf' ? 'PDF' : 
                         type === 'video' ? 'فيديو' :
                         type === 'image' ? 'صورة' :
                         type === 'document' ? 'مستند' : 'رابط'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="space-y-2">
                <Label>مستوى الصعوبة</Label>
                <div className="space-y-2">
                  {['beginner', 'intermediate', 'advanced'].map(difficulty => (
                    <div key={difficulty} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`difficulty-${difficulty}`}
                        checked={selectedDifficulty.includes(difficulty)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDifficulty([...selectedDifficulty, difficulty]);
                          } else {
                            setSelectedDifficulty(selectedDifficulty.filter(d => d !== difficulty));
                          }
                        }}
                      />
                      <Label htmlFor={`difficulty-${difficulty}`} className="text-sm flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getDifficultyColor(difficulty)}`} />
                        {difficulty === 'beginner' ? 'مبتدئ' :
                         difficulty === 'intermediate' ? 'متوسط' : 'متقدم'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress Range */}
            <div className="space-y-2">
              <Label>نطاق التقدم ({progressRange[0]}% - {progressRange[1]}%)</Label>
              <Slider
                value={progressRange}
                onValueChange={setProgressRange}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Additional Options */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="bookmarked-only"
                  checked={showBookmarkedOnly}
                  onCheckedChange={(checked) => setShowBookmarkedOnly(!!checked)}
                />
                <Label htmlFor="bookmarked-only">المحفوظات فقط</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>عرض {sortedMaterials.length} من {enhancedMaterials.length} ملف</span>
        {(selectedSubjects.length > 0 || selectedTypes.length > 0 || selectedCategories.length > 0 || 
          selectedDifficulty.length > 0 || showBookmarkedOnly || searchQuery) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            مسح الفلاتر
          </Button>
        )}
      </div>

      {/* Content Views */}
      <TabsContent value="grid" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedMaterials.map((material) => (
            <Card key={material.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(material.type)}
                    <span className="text-sm text-muted-foreground">{material.type.toUpperCase()}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleBookmark(material.id)}
                    className={material.metadata.isBookmarked ? 'text-yellow-500' : ''}
                  >
                    <BookmarkIcon className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-base line-clamp-2">{material.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{material.subject}</span>
                  <div className={`w-2 h-2 rounded-full ${getDifficultyColor(material.metadata.difficulty)}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>التقدم</span>
                    <span>{material.metadata.studyProgress}%</span>
                  </div>
                  <Progress value={material.metadata.studyProgress} className="h-2" />
                </div>

                <div className="flex flex-wrap gap-1">
                  {material.metadata.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {material.metadata.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{material.metadata.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{material.metadata.estimatedReadTime} دقيقة</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{material.metadata.accessCount}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleStartStudy(material)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    دراسة
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="list" className="space-y-2">
        {sortedMaterials.map((material) => (
          <Card key={material.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  {getTypeIcon(material.type)}
                  <div className={`w-2 h-2 rounded-full ${getDifficultyColor(material.metadata.difficulty)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{material.title}</h3>
                  <p className="text-sm text-muted-foreground">{material.subject}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{material.metadata.estimatedReadTime}د</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{material.metadata.accessCount}</span>
                  </div>
                  <div className="w-24">
                    <Progress value={material.metadata.studyProgress} className="h-2" />
                  </div>
                  <span>{material.metadata.studyProgress}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleBookmark(material.id)}
                  className={material.metadata.isBookmarked ? 'text-yellow-500' : ''}
                >
                  <BookmarkIcon className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => handleStartStudy(material)}>
                  <Play className="h-3 w-3 mr-1" />
                  دراسة
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الملفات</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalFiles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">وقت الدراسة</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.studyTime}</div>
              <p className="text-xs text-muted-foreground">دقيقة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل الإنجاز</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أشهر العلامات</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.popularTags.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* File Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع أنواع الملفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.filesByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(type as any)}
                    <span className="capitalize">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(count / analytics.totalFiles) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Tags */}
        <Card>
          <CardHeader>
            <CardTitle>العلامات الأكثر استخداماً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.popularTags.map(({ tag, count }) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <span className="text-xs opacity-70">({count})</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Empty State */}
      {sortedMaterials.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-medium">لم يتم العثور على ملفات</h3>
              <p className="text-muted-foreground">
                {searchQuery || showFilters ? 
                  'جرب تغيير فلاتر البحث أو إضافة ملفات جديدة' : 
                  'ابدأ بإضافة ملفات الدراسة الخاصة بك'
                }
              </p>
            </div>
            {(searchQuery || showFilters) && (
              <Button onClick={clearFilters}>مسح الفلاتر</Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};