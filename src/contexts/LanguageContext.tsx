import React, { createContext, useContext, useState } from 'react';

type Language = 'ar' | 'en';

interface QuoteWithSource {
  text: string;
  source: string;
}

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  ar: {
    appTitle: 'كويست المهام',
    appSubtitle: 'نظِّم مهامك في مغامرة شيقة',
    level: 'المستوى',
    experience: 'خبرة',
    
    tasks: 'المهام',
    achievements: 'الإنجازات',
    dashboard: 'لوحة التحكم',
    calendar: 'التقويم',
    studyMaterials: 'المواد الدراسية',
    pomodoro: 'مؤقت بومودورو',
    settings: 'الإعدادات',
    darkMode: 'الوضع الليلي',
    language: 'اللغة',
    resetStats: 'إعادة ضبط الإحصائيات',
    confirmReset: 'هل أنت متأكد من إعادة ضبط جميع الإحصائيات؟',
    statsReset: 'تم إعادة ضبط الإحصائيات بنجاح!',
    addTask: 'إضافة مهمة',
    editTask: 'تعديل المهمة',
    deleteTask: 'حذف المهمة',
    completeTask: 'إكمال المهمة',
    allTasks: 'جميع المهام',
    activeTasks: 'المهام النشطة',
    completedTasks: 'المهام المكتملة',
    daily: 'يومية',
    weekly: 'أسبوعية', 
    monthly: 'شهرية',
    personal: 'شخصية',
    study: 'دراسية',
    custom: 'مخصصة',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    urgent: 'عاجل',
    normal: 'عادي',
    low: 'منخفض',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    title: 'العنوان',
    description: 'الوصف',
    category: 'التصنيف',
    difficulty: 'الصعوبة',
    priority: 'الأولوية',
    deadline: 'الموعد النهائي',
    points: 'النقاط',
    estimatedTime: 'الوقت المقدر',
    taskAdded: 'تم إضافة المهمة',
    taskUpdated: 'تم تحديث المهمة',
    taskDeleted: 'تم حذف المهمة',
    taskCompleted: 'مهمة مكتملة!',
    // Dashboard translations
    dailyCompletionRate: 'نسبة الإنجاز اليوم',
    urgentTasks: 'مهام عاجلة',
    currentLevel: 'المستوى الحالي',
    
    categoryDistribution: 'توزيع المهام حسب التصنيف',
    overdueTasks: 'مهام متأخرة',
    achievementStreak: 'سلسلة الإنجاز',
    totalTasks: 'إجمالي المهام',
    tasksOf: 'من',
    needsAttention: 'تحتاج انتباه فوري',
    
    completedAndPoints: 'عدد المهام المكتملة والنقاط المكتسبة خلال الأسبوع',
    categoryRatio: 'نسبة المهام في كل تصنيف',
    days: 'يوم',
    // Calendar translations
    interactiveSchedule: 'الجدول الزمني التفاعلي',
    tasksForDay: 'مهام يوم',
    noTasksToday: 'لا توجد مهام في هذا اليوم',
    normalTasks: 'مهام عادية',
    deferableTasks: 'قابلة للتأجيل',
    minutes: 'د',
    // TaskForm translations
    taskTitle: 'عنوان المهمة',
    enterTaskTitle: 'أدخل عنوان المهمة',
    taskDescription: 'وصف المهمة (اختياري)',
    enterTaskDescription: 'أدخل وصفاً للمهمة',
    difficultyLevel: 'مستوى الصعوبة',
    chooseDifficulty: 'اختر مستوى الصعوبة',
    easyPoints: 'سهل (10 نقاط)',
    mediumPoints: 'متوسط (20 نقطة)',
    hardPoints: 'صعب (30 نقطة)',
    choosePriority: 'اختر الأولوية',
    chooseCategory: 'اختر تصنيف المهمة',
    estimatedTimeMinutes: 'الوقت المتوقع للإنجاز (دقيقة)',
    optionalDeadline: 'الموعد النهائي (اختياري)',
    chooseDate: 'اختر تاريخاً',
    updateTask: 'تحديث المهمة',
    work: 'عمل',
    // UserProgress translations  
    dailyStreak: 'السجل اليومي',
    // Music player translations
    musicPlayer: 'مشغل الموسيقى',
    addMusic: 'إضافة موسيقى',
    uploadAudio: 'ارفع ملف صوتي',
    yourPlaylist: 'قائمة التشغيل الخاصة بك',
    noMusicAdded: 'لم يتم إضافة أي موسيقى بعد',
    startByUploading: 'ابدأ برفع ملفاتك الصوتية المفضلة',
    deleteTrack: 'حذف المقطع',
    fileUploaded: 'تم رفع الملف بنجاح',
    fileDeleted: 'تم حذف الملف',
    uploadError: 'خطأ في رفع الملف. يرجى المحاولة مرة أخرى',
    // Additional general translations
    addNewTask: 'إضافة مهمة جديدة',
    
    // Missing translations for various components
    completedTasksCount: 'المهام المكتملة',
    signOut: 'تسجيل الخروج',
    
    // Study Materials translations
    studySubjects: 'المواد الدراسية',
    addSubject: 'إضافة مادة',
    addMaterial: 'إضافة مادة تعليمية',
    materialTitle: 'عنوان المادة',
    materialType: 'نوع المادة',
    classification: 'التصنيف',
    uploadFile: 'رفع الملف',
    dragFileHere: 'اسحب الملف هنا أو انقر للتصفح',
    browseFiles: 'تصفح الملفات',
    confirmDelete: 'تأكيد الحذف',
    deleteSubjectConfirm: 'هل أنت متأكد من حذف مادة',
    cannotUndoAction: 'لا يمكن التراجع عن هذا الإجراء',
    searchMaterials: 'البحث في المواد...',
    delete: 'حذف',
    
    // File types
    pdfFile: 'ملف PDF',
    videoFile: 'فيديو',
    imageFile: 'صورة',
    externalLink: 'رابط خارجي',
    documentFile: 'مستند',
    
    // Categories
    summaries: 'ملخصات',
    assignments: 'واجبات',
    personalCat: 'شخصي',
    studyCat: 'دراسة',
    dailyCat: 'يومي',
    otherCat: 'أخرى',
    
    // Dashboard specific
    completed: 'مكتملة',
    pointsEarned: 'نقاط',
    
    // Example materials
    exampleMaterial: 'مثال: ملخص الفصل الأول',
    
    // Additional missing translations
    subjectName: 'اسم المادة',
    enterSubjectName: 'أدخل اسم المادة',
    chooseColor: 'اختر لوناً للمادة',
    
    motivationalQuotes: [
       // آيات قرآنية
       { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "سورة الشرح: الآية 5" },
       { text: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ", source: "سورة يوسف: الآية 87" },
       { text: "مَنْ يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا", source: "سورة الطلاق: الآية 2" },
       { text: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنْتُمُ الْأَعْلَوْنَ", source: "سورة آل عمران: الآية 139" },
       { text: "إِنَّ مَعِيَ رَبِّي سَيَهْدِينِ", source: "سورة الشعراء: الآية 62" },
       { text: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى", source: "سورة المائدة: الآية 2" },
       { text: "إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّى يُغَيِّرُوا مَا بِأَنْفُسِهِمْ", source: "سورة الرعد: الآية 11" },
       { text: "وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ", source: "سورة هود: الآية 115" },
       { text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", source: "سورة البقرة: الآية 286" },
       { text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", source: "سورة الطلاق: الآية 3" }
     ],
    monday: 'الاثنين',
    tuesday: 'الثلاثاء', 
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
    sunday: 'الأحد',
    motivation: 'التحفيز',
    motivationText: 'العبارات التحفيزية تظهر تلقائياً لإبقائك متحمساً!'
  },
  en: {
    appTitle: 'Task Quest',
    appSubtitle: 'Organize your tasks in an exciting adventure',
    level: 'Level',
    experience: 'Experience',
    
    tasks: 'Tasks',
    achievements: 'Achievements',
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    studyMaterials: 'Study Materials',
    pomodoro: 'Pomodoro Timer',
    settings: 'Settings',
    darkMode: 'Dark Mode',
    language: 'Language',
    resetStats: 'Reset Statistics',
    confirmReset: 'Are you sure you want to reset all statistics?',
    statsReset: 'Statistics reset successfully!',
    addTask: 'Add Task',
    editTask: 'Edit Task',
    deleteTask: 'Delete Task',
    completeTask: 'Complete Task',
    allTasks: 'All Tasks',
    activeTasks: 'Active Tasks',
    completedTasks: 'Completed Tasks',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly', 
    personal: 'Personal',
    study: 'Study',
    custom: 'Custom',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    urgent: 'Urgent',
    normal: 'Normal',
    low: 'Low',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    title: 'Title',
    description: 'Description',
    category: 'Category',
    difficulty: 'Difficulty',
    priority: 'Priority',
    deadline: 'Deadline',
    points: 'Points',
    estimatedTime: 'Estimated Time',
    taskAdded: 'Task added',
    taskUpdated: 'Task updated',
    taskDeleted: 'Task deleted',
    taskCompleted: 'Task completed!',
    // Dashboard translations
    dailyCompletionRate: 'Daily Completion Rate',
    urgentTasks: 'Urgent Tasks',
    currentLevel: 'Current Level',
    
    categoryDistribution: 'Task Distribution by Category',
    overdueTasks: 'Overdue Tasks',
    achievementStreak: 'Achievement Streak',
    totalTasks: 'Total Tasks',
    tasksOf: 'of',
    needsAttention: 'Needs immediate attention',
    
    completedAndPoints: 'Number of completed tasks and points earned during the week',
    categoryRatio: 'Ratio of tasks in each category',
    days: 'days',
    // Calendar translations
    interactiveSchedule: 'Interactive Schedule',
    tasksForDay: 'Tasks for',
    noTasksToday: 'No tasks for this day',
    normalTasks: 'Normal Tasks',
    deferableTasks: 'Deferrable',
    minutes: 'min',
    // TaskForm translations
    taskTitle: 'Task Title',
    enterTaskTitle: 'Enter task title',
    taskDescription: 'Task Description (optional)',
    enterTaskDescription: 'Enter task description',
    difficultyLevel: 'Difficulty Level',
    chooseDifficulty: 'Choose difficulty level',
    easyPoints: 'Easy (10 points)',
    mediumPoints: 'Medium (20 points)',
    hardPoints: 'Hard (30 points)',
    choosePriority: 'Choose priority',
    chooseCategory: 'Choose task category',
    estimatedTimeMinutes: 'Estimated completion time (minutes)',
    optionalDeadline: 'Deadline (optional)',
    chooseDate: 'Choose a date',
    updateTask: 'Update Task',
    work: 'Work',
    // UserProgress translations  
    dailyStreak: 'Daily Streak',
    // Music player translations
    musicPlayer: 'Music Player',
    addMusic: 'Add Music',
    uploadAudio: 'Upload audio file',
    yourPlaylist: 'Your Playlist',
    noMusicAdded: 'No music added yet',
    startByUploading: 'Start by uploading your favorite audio files',
    deleteTrack: 'Delete Track',
    fileUploaded: 'File uploaded successfully',
    fileDeleted: 'File deleted',
    uploadError: 'Upload error. Please try again',
    // Additional general translations
    addNewTask: 'Add New Task',
    
    // Missing translations for various components
    completedTasksCount: 'Completed Tasks',
    signOut: 'Sign Out',
    
    // Study Materials translations
    studySubjects: 'Study Subjects',
    addSubject: 'Add Subject',
    addMaterial: 'Add Study Material',
    materialTitle: 'Material Title',
    materialType: 'Material Type',
    classification: 'Classification',
    uploadFile: 'Upload File',
    dragFileHere: 'Drag file here or click to browse',
    browseFiles: 'Browse Files',
    confirmDelete: 'Confirm Delete',
    deleteSubjectConfirm: 'Are you sure you want to delete subject',
    cannotUndoAction: 'This action cannot be undone',
    searchMaterials: 'Search materials...',
    delete: 'Delete',
    
    // File types
    pdfFile: 'PDF File',
    videoFile: 'Video',
    imageFile: 'Image',
    externalLink: 'External Link',
    documentFile: 'Document',
    
    // Categories
    summaries: 'Summaries',
    assignments: 'Assignments',
    personalCat: 'Personal',
    studyCat: 'Study',
    dailyCat: 'Daily',
    otherCat: 'Other',
    
    // Dashboard specific
    completed: 'Completed',
    pointsEarned: 'Points',
    
    // Example materials
    exampleMaterial: 'Example: Chapter 1 Summary',
    
    // Additional missing translations
    subjectName: 'Subject Name',
    enterSubjectName: 'Enter subject name',
    chooseColor: 'Choose a color for the subject',
    
    motivationalQuotes: [
       // Quranic verses (Arabic text preserved)
       { text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا", source: "Surah At-Talaq - Verse 2" },
       { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", source: "Surah Ash-Sharh - Verse 6" },
       { text: "وَاللَّهُ يُحِبُّ الصَّابِرِينَ", source: "Surah Al Imran - Verse 146" },
       { text: "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا", source: "Surah At-Tawbah - Verse 40" },
       { text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", source: "Surah At-Talaq - Verse 3" },
       
       // International proverbs and wisdom
       { text: "The journey of a thousand miles begins with one step", source: "Chinese Proverb - Lao Tzu" },
       { text: "Fall seven times, stand up eight", source: "Japanese Proverb - Japan" },
       { text: "A problem shared is a problem halved", source: "English Proverb - England" },
       { text: "When one door closes, another opens", source: "Spanish Proverb - Spain" },
       { text: "The best time to plant a tree was 20 years ago. The second best time is now", source: "Chinese Proverb - China" }
    ],
    monday: 'Mon',
    tuesday: 'Tue', 
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
    motivation: 'Motivation',
    motivationText: 'Motivational quotes appear automatically to keep you inspired!'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ar';
  });

  const toggleLanguage = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // Update document direction
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
  };

  const t = (key: string): any => {
    const value = translations[language][key as keyof typeof translations['ar']];
    if (value !== undefined) {
      return value;
    }
    return key;
  };

  // Set initial direction
  React.useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};