import { useState } from 'react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { Task, UserStats, Achievement, PomodoroSession } from '@/types/task';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export interface ExportData {
  tasks: Task[];
  stats: UserStats;
  achievements: Achievement[];
  sessions?: PomodoroSession[];
}

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async (data: ExportData, language: 'ar' | 'en' = 'ar') => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.height;
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text(language === 'ar' ? 'تقرير المهام الشامل' : 'Complete Tasks Report', 20, yPosition);
      yPosition += 15;

      // Date
      pdf.setFontSize(12);
      const currentDate = format(new Date(), 'PPP', { locale: language === 'ar' ? ar : undefined });
      pdf.text(currentDate, 20, yPosition);
      yPosition += 20;

      // Stats Section
      pdf.setFontSize(16);
      pdf.text(language === 'ar' ? 'الإحصائيات العامة' : 'General Statistics', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      const statsText = [
        `${language === 'ar' ? 'المستوى:' : 'Level:'} ${data.stats.level}`,
        `${language === 'ar' ? 'النقاط:' : 'Points:'} ${data.stats.experience}`,
        `${language === 'ar' ? 'المهام المكتملة:' : 'Completed Tasks:'} ${data.stats.totalTasksCompleted}`,
        `${language === 'ar' ? 'السلسلة:' : 'Streak:'} ${data.stats.streak} ${language === 'ar' ? 'يوم' : 'days'}`
      ];

      statsText.forEach(text => {
        pdf.text(text, 20, yPosition);
        yPosition += 8;
      });

      yPosition += 10;

      // Tasks Section
      pdf.setFontSize(16);
      pdf.text(language === 'ar' ? 'قائمة المهام' : 'Tasks List', 20, yPosition);
      yPosition += 10;

      data.tasks.forEach((task, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        pdf.text(`${index + 1}. ${task.title}`, 20, yPosition);
        yPosition += 6;

        if (task.description) {
          pdf.setFontSize(10);
          pdf.text(`   ${task.description}`, 20, yPosition);
          yPosition += 6;
        }

        pdf.setFontSize(10);
        const taskDetails = [
          `   ${language === 'ar' ? 'الحالة:' : 'Status:'} ${task.completed ? (language === 'ar' ? 'مكتملة' : 'Completed') : (language === 'ar' ? 'غير مكتملة' : 'Pending')}`,
          `   ${language === 'ar' ? 'الصعوبة:' : 'Difficulty:'} ${task.difficulty}`,
          `   ${language === 'ar' ? 'الأولوية:' : 'Priority:'} ${task.priority}`,
          `   ${language === 'ar' ? 'النقاط:' : 'Points:'} ${task.points}`
        ];

        taskDetails.forEach(detail => {
          pdf.text(detail, 20, yPosition);
          yPosition += 5;
        });

        yPosition += 5;
      });

      // Achievements Section
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.text(language === 'ar' ? 'الإنجازات' : 'Achievements', 20, yPosition);
      yPosition += 10;

      data.achievements.forEach((achievement, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        const status = achievement.unlocked ? (language === 'ar' ? '✅ مُحقق' : '✅ Unlocked') : (language === 'ar' ? '⏳ قيد التقدم' : '⏳ In Progress');
        pdf.text(`${achievement.icon} ${achievement.title} - ${status}`, 20, yPosition);
        yPosition += 6;

        pdf.setFontSize(10);
        pdf.text(`   ${achievement.description}`, 20, yPosition);
        yPosition += 6;

        pdf.text(`   ${language === 'ar' ? 'التقدم:' : 'Progress:'} ${achievement.currentProgress}/${achievement.requirement}`, 20, yPosition);
        yPosition += 10;
      });

      const fileName = `tasks-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      return fileName;
    } catch (error) {
      console.error('PDF Export Error:', error);
      throw new Error(language === 'ar' ? 'فشل في تصدير PDF' : 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async (data: ExportData, language: 'ar' | 'en' = 'ar') => {
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Tasks Sheet
      const tasksData = data.tasks.map(task => ({
        [language === 'ar' ? 'العنوان' : 'Title']: task.title,
        [language === 'ar' ? 'الوصف' : 'Description']: task.description || '',
        [language === 'ar' ? 'الحالة' : 'Status']: task.completed ? (language === 'ar' ? 'مكتملة' : 'Completed') : (language === 'ar' ? 'غير مكتملة' : 'Pending'),
        [language === 'ar' ? 'الصعوبة' : 'Difficulty']: task.difficulty,
        [language === 'ar' ? 'الأولوية' : 'Priority']: task.priority,
        [language === 'ar' ? 'التصنيف' : 'Category']: task.category,
        [language === 'ar' ? 'النقاط' : 'Points']: task.points,
        [language === 'ar' ? 'الوقت المقدر' : 'Estimated Time']: task.estimatedTime || '',
        [language === 'ar' ? 'الموعد النهائي' : 'Deadline']: task.deadline ? format(new Date(task.deadline), 'PPP') : '',
        [language === 'ar' ? 'تاريخ الإنشاء' : 'Created At']: format(new Date(task.createdAt), 'PPP')
      }));

      const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
      XLSX.utils.book_append_sheet(workbook, tasksSheet, language === 'ar' ? 'المهام' : 'Tasks');

      // Stats Sheet
      const statsData = [
        { [language === 'ar' ? 'المؤشر' : 'Metric']: language === 'ar' ? 'المستوى' : 'Level', [language === 'ar' ? 'القيمة' : 'Value']: data.stats.level },
        { [language === 'ar' ? 'المؤشر' : 'Metric']: language === 'ar' ? 'النقاط' : 'Experience', [language === 'ar' ? 'القيمة' : 'Value']: data.stats.experience },
        { [language === 'ar' ? 'المؤشر' : 'Metric']: language === 'ar' ? 'المهام المكتملة' : 'Tasks Completed', [language === 'ar' ? 'القيمة' : 'Value']: data.stats.totalTasksCompleted },
        { [language === 'ar' ? 'المؤشر' : 'Metric']: language === 'ar' ? 'السلسلة' : 'Streak', [language === 'ar' ? 'القيمة' : 'Value']: `${data.stats.streak} ${language === 'ar' ? 'يوم' : 'days'}` }
      ];

      const statsSheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, language === 'ar' ? 'الإحصائيات' : 'Statistics');

      // Achievements Sheet
      const achievementsData = data.achievements.map(achievement => ({
        [language === 'ar' ? 'الاسم' : 'Name']: achievement.title,
        [language === 'ar' ? 'الوصف' : 'Description']: achievement.description,
        [language === 'ar' ? 'الحالة' : 'Status']: achievement.unlocked ? (language === 'ar' ? 'مُحقق' : 'Unlocked') : (language === 'ar' ? 'قيد التقدم' : 'In Progress'),
        [language === 'ar' ? 'التقدم' : 'Progress']: `${achievement.currentProgress}/${achievement.requirement}`,
        [language === 'ar' ? 'النسبة' : 'Percentage']: `${Math.round((achievement.currentProgress / achievement.requirement) * 100)}%`
      }));

      const achievementsSheet = XLSX.utils.json_to_sheet(achievementsData);
      XLSX.utils.book_append_sheet(workbook, achievementsSheet, language === 'ar' ? 'الإنجازات' : 'Achievements');

      // Pomodoro Sessions (if available)
      if (data.sessions && data.sessions.length > 0) {
        const sessionsData = data.sessions.map(session => ({
          [language === 'ar' ? 'المهمة' : 'Task']: session.taskId || (language === 'ar' ? 'غير محدد' : 'Not specified'),
          [language === 'ar' ? 'المدة' : 'Duration']: `${session.duration} ${language === 'ar' ? 'دقيقة' : 'minutes'}`,
          [language === 'ar' ? 'الحالة' : 'Status']: session.completed ? (language === 'ar' ? 'مكتملة' : 'Completed') : (language === 'ar' ? 'غير مكتملة' : 'Incomplete'),
          [language === 'ar' ? 'وقت البداية' : 'Start Time']: format(new Date(session.startTime), 'PPp'),
          [language === 'ar' ? 'وقت الانتهاء' : 'End Time']: session.endTime ? format(new Date(session.endTime), 'PPp') : ''
        }));

        const sessionsSheet = XLSX.utils.json_to_sheet(sessionsData);
        XLSX.utils.book_append_sheet(workbook, sessionsSheet, language === 'ar' ? 'جلسات البومودورو' : 'Pomodoro Sessions');
      }

      const fileName = `tasks-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      return fileName;
    } catch (error) {
      console.error('Excel Export Error:', error);
      throw new Error(language === 'ar' ? 'فشل في تصدير Excel' : 'Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const exportChartAsImage = async (chartElementId: string, fileName: string = 'chart') => {
    setIsExporting(true);
    try {
      const element = document.getElementById(chartElementId);
      if (!element) {
        throw new Error('Chart element not found');
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `${fileName}-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL();
      link.click();

      return link.download;
    } catch (error) {
      console.error('Chart Export Error:', error);
      throw new Error('Failed to export chart');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToPDF,
    exportToExcel,
    exportChartAsImage,
    isExporting
  };
};

export default useDataExport;