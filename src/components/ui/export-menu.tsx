import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,  
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDataExport, ExportData } from '@/hooks/useDataExport';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

interface ExportMenuProps {
  data: ExportData;
  className?: string;
  chartElementId?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  data,
  className,
  chartElementId
}) => {
  const { t, language } = useLanguage();
  const { exportToPDF, exportToExcel, exportChartAsImage, isExporting } = useDataExport();
  const [exportHistory, setExportHistory] = useState<Array<{
    type: string;
    fileName: string;
    timestamp: Date;
    success: boolean;
  }>>([]);

  const handleExportPDF = async () => {
    try {
      const fileName = await exportToPDF(data, language);
      setExportHistory(prev => [...prev, {
        type: 'PDF',
        fileName,
        timestamp: new Date(),
        success: true
      }]);
      toast.success(language === 'ar' ? 'تم تصدير PDF بنجاح' : 'PDF exported successfully');
    } catch (error) {
      setExportHistory(prev => [...prev, {
        type: 'PDF',
        fileName: 'Failed',
        timestamp: new Date(),
        success: false
      }]);
      toast.error(error instanceof Error ? error.message : 'Export failed');
    }
  };

  const handleExportExcel = async () => {
    try {
      const fileName = await exportToExcel(data, language);
      setExportHistory(prev => [...prev, {
        type: 'Excel',
        fileName,
        timestamp: new Date(),
        success: true
      }]);
      toast.success(language === 'ar' ? 'تم تصدير Excel بنجاح' : 'Excel exported successfully');
    } catch (error) {
      setExportHistory(prev => [...prev, {
        type: 'Excel', 
        fileName: 'Failed',
        timestamp: new Date(),
        success: false
      }]);
      toast.error(error instanceof Error ? error.message : 'Export failed');
    }
  };

  const handleExportChart = async () => {
    if (!chartElementId) {
      toast.error(language === 'ar' ? 'لا يوجد رسم بياني للتصدير' : 'No chart available for export');
      return;
    }

    try {
      const fileName = await exportChartAsImage(chartElementId);
      setExportHistory(prev => [...prev, {
        type: 'Chart',
        fileName,
        timestamp: new Date(),
        success: true
      }]);
      toast.success(language === 'ar' ? 'تم تصدير الرسم البياني بنجاح' : 'Chart exported successfully');
    } catch (error) {
      setExportHistory(prev => [...prev, {
        type: 'Chart',
        fileName: 'Failed', 
        timestamp: new Date(),
        success: false
      }]);
      toast.error(error instanceof Error ? error.message : 'Export failed');
    }
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            disabled={isExporting}
            className="font-arabic"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {language === 'ar' ? 'تصدير البيانات' : 'Export Data'}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <div className="p-2">
            <h4 className="font-medium text-sm mb-2 font-arabic">
              {language === 'ar' ? 'خيارات التصدير' : 'Export Options'}
            </h4>
          </div>
          
          <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
            <FileText className="h-4 w-4 mr-2" />
            <div className="flex-1">
              <div className="font-arabic">{language === 'ar' ? 'تقرير PDF' : 'PDF Report'}</div>
              <div className="text-xs text-muted-foreground font-arabic">
                {language === 'ar' ? 'تقرير شامل بصيغة PDF' : 'Complete report in PDF format'}
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            <div className="flex-1">
              <div className="font-arabic">{language === 'ar' ? 'جدول Excel' : 'Excel Spreadsheet'}</div>
              <div className="text-xs text-muted-foreground font-arabic">
                {language === 'ar' ? 'بيانات قابلة للتحليل' : 'Analyzable data format'}
              </div>
            </div>
          </DropdownMenuItem>

          {chartElementId && (
            <DropdownMenuItem onClick={handleExportChart} disabled={isExporting}>
              <ImageIcon className="h-4 w-4 mr-2" />
              <div className="flex-1">
                <div className="font-arabic">{language === 'ar' ? 'صورة الرسم البياني' : 'Chart Image'}</div>
                <div className="text-xs text-muted-foreground font-arabic">
                  {language === 'ar' ? 'حفظ الرسم البياني كصورة' : 'Save chart as image'}
                </div>
              </div>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center justify-between w-full font-arabic">
                  {language === 'ar' ? 'سجل التصدير' : 'Export History'}
                  <Badge variant="secondary">{exportHistory.length}</Badge>
                </div>
              </DropdownMenuItem>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-arabic">
                  {language === 'ar' ? 'سجل التصدير' : 'Export History'}
                </DialogTitle>
                <DialogDescription className="font-arabic">
                  {language === 'ar' ? 'قائمة عمليات التصدير الأخيرة' : 'Recent export operations'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {exportHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 font-arabic">
                    {language === 'ar' ? 'لا توجد عمليات تصدير سابقة' : 'No previous exports'}
                  </p>
                ) : (
                  exportHistory.reverse().map((export_, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {export_.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium text-sm font-arabic">
                              {export_.type} {export_.success ? (language === 'ar' ? 'نجح' : 'Success') : (language === 'ar' ? 'فشل' : 'Failed')}
                            </div>
                            <div className="text-xs text-muted-foreground font-arabic">
                              {export_.fileName}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {export_.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>

      {isExporting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="p-6">
            <LoadingSpinner 
              size="lg" 
              text={language === 'ar' ? 'جاري تصدير البيانات...' : 'Exporting data...'}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;