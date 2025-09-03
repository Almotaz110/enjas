import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Plus, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  ThumbsUp, 
  ThumbsDown, 
  Shuffle,
  Target,
  TrendingUp,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Zap,
  Trophy,
  BarChart3,
  Play
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Date;
  lastReviewed?: Date;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  masteryLevel: number; // 0-100
  nextReviewDate: Date;
  notes: string;
  isStarred: boolean;
}

interface StudySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  cardsStudied: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageResponseTime: number;
  masteryGained: number;
  completed: boolean;
}

interface SpacedRepetitionData {
  interval: number; // days
  easeFactor: number;
  repetitions: number;
}

const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30, 90];

export const SmartFlashcards: React.FC = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState<'review' | 'learn' | 'test'>('review');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [sessionStats, setSessionStats] = useState({
    cardsStudied: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    startTime: new Date()
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [responseStartTime, setResponseStartTime] = useState<number>(0);
  
  // New card form
  const [newCard, setNewCard] = useState({
    front: '',
    back: '',
    subject: '',
    difficulty: 'medium' as const,
    tags: [] as string[],
    notes: ''
  });

  // Study queue based on spaced repetition
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Generate study queue based on spaced repetition algorithm
  const generateStudyQueue = useCallback((cards: Flashcard[]) => {
    const now = new Date();
    
    // Cards due for review (based on spaced repetition)
    const dueCards = cards.filter(card => 
      !card.lastReviewed || card.nextReviewDate <= now
    );
    
    // New cards that haven't been studied
    const newCards = cards.filter(card => 
      card.reviewCount === 0
    );
    
    // Cards that need more practice (low mastery)
    const practiceCards = cards.filter(card => 
      card.masteryLevel < 70 && card.reviewCount > 0
    );
    
    // Combine and prioritize
    let queue: Flashcard[] = [];
    
    switch (studyMode) {
      case 'review':
        queue = [...dueCards, ...practiceCards.slice(0, 10)];
        break;
      case 'learn':
        queue = [...newCards.slice(0, 20), ...dueCards.slice(0, 10)];
        break;
      case 'test':
        queue = cards.filter(card => card.masteryLevel >= 50).slice(0, 30);
        break;
    }
    
    // Apply filters
    if (selectedSubjects.length > 0) {
      queue = queue.filter(card => selectedSubjects.includes(card.subject));
    }
    
    if (selectedDifficulty.length > 0) {
      queue = queue.filter(card => selectedDifficulty.includes(card.difficulty));
    }
    
    // Shuffle for variety
    return queue.sort(() => Math.random() - 0.5);
  }, [studyMode, selectedSubjects, selectedDifficulty]);

  // Update study queue when filters or cards change
  useEffect(() => {
    const queue = generateStudyQueue(flashcards);
    setStudyQueue(queue);
    setCurrentCardIndex(0);
    setCurrentCard(queue[0] || null);
  }, [flashcards, generateStudyQueue]);

  // Calculate next review date using spaced repetition
  const calculateNextReviewDate = (
    card: Flashcard, 
    quality: number // 0-3 (0: wrong, 1: hard, 2: good, 3: easy)
  ): { nextReviewDate: Date; interval: number; easeFactor: number } => {
    let interval = 1;
    let easeFactor = 2.5;
    let repetitions = card.reviewCount;
    
    // Simplified SM-2 algorithm
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
    
    if (quality < 2) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions++;
    }
    
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    
    return { nextReviewDate, interval, easeFactor };
  };

  // Handle card response
  const handleCardResponse = (quality: number, responseTime: number) => {
    if (!currentCard) return;
    
    const isCorrect = quality >= 2;
    const { nextReviewDate, interval } = calculateNextReviewDate(currentCard, quality);
    
    // Update card statistics
    const updatedCard: Flashcard = {
      ...currentCard,
      lastReviewed: new Date(),
      reviewCount: currentCard.reviewCount + 1,
      correctCount: isCorrect ? currentCard.correctCount + 1 : currentCard.correctCount,
      incorrectCount: !isCorrect ? currentCard.incorrectCount + 1 : currentCard.incorrectCount,
      masteryLevel: Math.min(100, Math.max(0, currentCard.masteryLevel + (isCorrect ? 10 : -5))),
      nextReviewDate
    };
    
    // Update flashcards
    setFlashcards(prev => 
      prev.map(card => card.id === currentCard.id ? updatedCard : card)
    );
    
    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      cardsStudied: prev.cardsStudied + 1,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      incorrectAnswers: !isCorrect ? prev.incorrectAnswers + 1 : prev.incorrectAnswers
    }));
    
    // Move to next card
    const nextIndex = currentCardIndex + 1;
    if (nextIndex < studyQueue.length) {
      setCurrentCardIndex(nextIndex);
      setCurrentCard(studyQueue[nextIndex]);
    } else {
      // Session complete
      toast.success('تهانينا! انتهيت من جلسة الدراسة');
      setCurrentCard(null);
    }
    
    setShowAnswer(false);
    setResponseStartTime(Date.now());
  };

  // Add new flashcard
  const addFlashcard = () => {
    if (!newCard.front.trim() || !newCard.back.trim()) {
      toast.error('يرجى ملء السؤال والإجابة');
      return;
    }
    
    const flashcard: Flashcard = {
      id: uuidv4(),
      ...newCard,
      createdAt: new Date(),
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      masteryLevel: 0,
      nextReviewDate: new Date(),
      isStarred: false
    };
    
    setFlashcards(prev => [...prev, flashcard]);
    setNewCard({
      front: '',
      back: '',
      subject: '',
      difficulty: 'medium',
      tags: [],
      notes: ''
    });
    setShowCreateDialog(false);
    toast.success('تم إضافة البطاقة بنجاح');
  };

  // Auto-generate flashcards from text (simplified)
  const generateFlashcardsFromText = (text: string, subject: string) => {
    // Simple extraction of questions and definitions
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const newCards: Flashcard[] = [];
    
    sentences.forEach((sentence, index) => {
      if (sentence.includes('هو') || sentence.includes('هي') || sentence.includes('يعني')) {
        const parts = sentence.split(/هو|هي|يعني/);
        if (parts.length >= 2) {
          const question = `ما ${parts[0].trim()}؟`;
          const answer = parts.slice(1).join(' ').trim();
          
          if (question.length > 5 && answer.length > 5) {
            newCards.push({
              id: uuidv4(),
              front: question,
              back: answer,
              subject,
              difficulty: 'medium',
              tags: ['مولد تلقائي'],
              createdAt: new Date(),
              reviewCount: 0,
              correctCount: 0,
              incorrectCount: 0,
              masteryLevel: 0,
              nextReviewDate: new Date(),
              notes: '',
              isStarred: false
            });
          }
        }
      }
    });
    
    return newCards;
  };

  // Start new study session
  const startStudySession = () => {
    const session: StudySession = {
      id: uuidv4(),
      startTime: new Date(),
      cardsStudied: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      averageResponseTime: 0,
      masteryGained: 0,
      completed: false
    };
    
    setStudySession(session);
    setSessionStats({
      cardsStudied: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      startTime: new Date()
    });
    setResponseStartTime(Date.now());
    
    // Generate fresh study queue
    const queue = generateStudyQueue(flashcards);
    setStudyQueue(queue);
    setCurrentCardIndex(0);
    setCurrentCard(queue[0] || null);
    
    toast.success('بدأت جلسة دراسة جديدة!');
  };

  // Get mastery level color
  const getMasteryColor = (level: number) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 60) return 'text-yellow-600';
    if (level >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-muted-foreground';
    }
  };

  const uniqueSubjects = [...new Set(flashcards.map(c => c.subject))].filter(Boolean);
  const totalCards = flashcards.length;
  const masteredCards = flashcards.filter(c => c.masteryLevel >= 80).length;
  const dueCards = flashcards.filter(c => c.nextReviewDate <= new Date()).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي البطاقات</p>
                <p className="text-2xl font-bold">{totalCards}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">بطاقات متقنة</p>
                <p className="text-2xl font-bold text-green-600">{masteredCards}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مستحقة للمراجعة</p>
                <p className="text-2xl font-bold text-orange-600">{dueCards}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نسبة الإتقان</p>
                <p className="text-2xl font-bold text-purple-600">
                  {totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Study Session */}
      {studySession && currentCard && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                جلسة دراسة نشطة
              </CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{sessionStats.correctAnswers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span>{sessionStats.incorrectAnswers}</span>
                </div>
                <div className="text-muted-foreground">
                  {currentCardIndex + 1} / {studyQueue.length}
                </div>
              </div>
            </div>
            <Progress 
              value={((currentCardIndex + 1) / studyQueue.length) * 100} 
              className="w-full"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Card */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge variant="outline">{currentCard.subject}</Badge>
                <div className={`w-2 h-2 rounded-full ${getDifficultyColor(currentCard.difficulty)}`} />
                <Badge variant="secondary" className={getMasteryColor(currentCard.masteryLevel)}>
                  إتقان: {currentCard.masteryLevel}%
                </Badge>
              </div>
              
              <Card className="p-6 min-h-[200px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-medium">{currentCard.front}</h3>
                  
                  {showAnswer && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-lg text-muted-foreground">{currentCard.back}</p>
                      {currentCard.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {currentCard.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
              
              {!showAnswer ? (
                <Button 
                  onClick={() => setShowAnswer(true)}
                  className="gap-2"
                  size="lg"
                >
                  <Eye className="h-4 w-4" />
                  إظهار الإجابة
                </Button>
              ) : (
                <div className="flex justify-center gap-2 flex-wrap">
                  <Button
                    onClick={() => handleCardResponse(0, Date.now() - responseStartTime)}
                    variant="destructive"
                    className="gap-2"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    خطأ
                  </Button>
                  <Button
                    onClick={() => handleCardResponse(1, Date.now() - responseStartTime)}
                    variant="outline"
                    className="gap-2"
                  >
                    صعب
                  </Button>
                  <Button
                    onClick={() => handleCardResponse(2, Date.now() - responseStartTime)}
                    variant="outline"
                    className="gap-2"
                  >
                    جيد
                  </Button>
                  <Button
                    onClick={() => handleCardResponse(3, Date.now() - responseStartTime)}
                    className="gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    سهل
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Controls */}
      <Tabs defaultValue="study" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="study">الدراسة</TabsTrigger>
          <TabsTrigger value="manage">إدارة البطاقات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="study" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الدراسة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>نمط الدراسة</Label>
                  <Select value={studyMode} onValueChange={(value: any) => setStudyMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="review">مراجعة</SelectItem>
                      <SelectItem value="learn">تعلم جديد</SelectItem>
                      <SelectItem value="test">اختبار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>المواد</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {uniqueSubjects.map(subject => (
                      <Badge
                        key={subject}
                        variant={selectedSubjects.includes(subject) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedSubjects(prev => 
                            prev.includes(subject)
                              ? prev.filter(s => s !== subject)
                              : [...prev, subject]
                          );
                        }}
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>مستوى الصعوبة</Label>
                  <div className="flex gap-2 mt-2">
                    {['easy', 'medium', 'hard'].map(difficulty => (
                      <Badge
                        key={difficulty}
                        variant={selectedDifficulty.includes(difficulty) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedDifficulty(prev => 
                            prev.includes(difficulty)
                              ? prev.filter(d => d !== difficulty)
                              : [...prev, difficulty]
                          );
                        }}
                      >
                        {difficulty === 'easy' ? 'سهل' : 
                         difficulty === 'medium' ? 'متوسط' : 'صعب'}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={startStudySession} 
                  className="w-full gap-2" 
                  size="lg"
                  disabled={studyQueue.length === 0}
                >
                  <Play className="h-4 w-4" />
                  بدء جلسة دراسة ({studyQueue.length} بطاقة)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>البطاقات القادمة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {studyQueue.slice(0, 10).map((card, index) => (
                    <div key={card.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{card.front}</p>
                        <p className="text-xs text-muted-foreground">{card.subject}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getDifficultyColor(card.difficulty)}`} />
                        <span className={`text-xs ${getMasteryColor(card.masteryLevel)}`}>
                          {card.masteryLevel}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">إدارة البطاقات</h3>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة بطاقة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء بطاقة جديدة</DialogTitle>
                  <DialogDescription>
                    أضف بطاقة تعليمية جديدة لتحسين مراجعتك
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>السؤال / الوجه الأمامي</Label>
                    <Textarea
                      value={newCard.front}
                      onChange={(e) => setNewCard(prev => ({ ...prev, front: e.target.value }))}
                      placeholder="اكتب السؤال هنا..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>الإجابة / الوجه الخلفي</Label>
                    <Textarea
                      value={newCard.back}
                      onChange={(e) => setNewCard(prev => ({ ...prev, back: e.target.value }))}
                      placeholder="اكتب الإجابة هنا..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>المادة</Label>
                      <Input
                        value={newCard.subject}
                        onChange={(e) => setNewCard(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="مثال: الرياضيات"
                      />
                    </div>

                    <div>
                      <Label>الصعوبة</Label>
                      <Select 
                        value={newCard.difficulty}
                        onValueChange={(value: any) => setNewCard(prev => ({ ...prev, difficulty: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">سهل</SelectItem>
                          <SelectItem value="medium">متوسط</SelectItem>
                          <SelectItem value="hard">صعب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>ملاحظات (اختياري)</Label>
                    <Textarea
                      value={newCard.notes}
                      onChange={(e) => setNewCard(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="ملاحظات إضافية أو نصائح..."
                      rows={2}
                    />
                  </div>

                  <Button onClick={addFlashcard} className="w-full">
                    إضافة البطاقة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {flashcards.map((card) => (
              <Card key={card.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{card.front}</h4>
                        <Badge variant="outline">{card.subject}</Badge>
                        <div className={`w-2 h-2 rounded-full ${getDifficultyColor(card.difficulty)}`} />
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{card.back}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span className={getMasteryColor(card.masteryLevel)}>
                            إتقان: {card.masteryLevel}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <RotateCcw className="h-3 w-3" />
                          <span>مراجعات: {card.reviewCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>صحيح: {card.correctCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>خطأ: {card.incorrectCount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFlashcards(prev => 
                            prev.map(c => 
                              c.id === card.id ? { ...c, isStarred: !c.isStarred } : c
                            )
                          );
                        }}
                        className={card.isStarred ? 'text-yellow-500' : ''}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع مستويات الإتقان</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'متقن (80-100%)', color: 'bg-green-500', count: flashcards.filter(c => c.masteryLevel >= 80).length },
                    { label: 'جيد (60-79%)', color: 'bg-yellow-500', count: flashcards.filter(c => c.masteryLevel >= 60 && c.masteryLevel < 80).length },
                    { label: 'متوسط (40-59%)', color: 'bg-orange-500', count: flashcards.filter(c => c.masteryLevel >= 40 && c.masteryLevel < 60).length },
                    { label: 'يحتاج تحسين (0-39%)', color: 'bg-red-500', count: flashcards.filter(c => c.masteryLevel < 40).length }
                  ].map(({ label, color, count }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`} />
                        <span className="text-sm">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-secondary rounded-full h-2">
                          <div 
                            className={`${color} h-2 rounded-full transition-all`}
                            style={{ width: `${totalCards > 0 ? (count / totalCards) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع المواد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uniqueSubjects.map(subject => {
                    const subjectCards = flashcards.filter(c => c.subject === subject);
                    const avgMastery = subjectCards.length > 0 
                      ? subjectCards.reduce((acc, c) => acc + c.masteryLevel, 0) / subjectCards.length
                      : 0;
                    
                    return (
                      <div key={subject} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                        <div>
                          <p className="font-medium">{subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {subjectCards.length} بطاقة • متوسط الإتقان: {avgMastery.toFixed(0)}%
                          </p>
                        </div>
                        <Progress value={avgMastery} className="w-20" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {flashcards.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-medium">لا توجد بطاقات تعليمية</h3>
              <p className="text-muted-foreground">
                ابدأ بإنشاء بطاقاتك الأولى لتسريع عملية التعلم والحفظ
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء أول بطاقة
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};