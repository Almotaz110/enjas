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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Keyboard, Search, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { KeyboardShortcutGroup } from '@/hooks/useKeyboardShortcuts';
import { Input } from '@/components/ui/input';

interface ShortcutsPanelProps {
  shortcuts: KeyboardShortcutGroup[];
  className?: string;
}

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({
  shortcuts,
  className
}) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const formatShortcut = (shortcut: any): string => {
    const keys: string[] = [];
    
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.metaKey) keys.push('Cmd');
    
    keys.push(shortcut.key.toUpperCase());
    
    return keys.join(' + ');
  };

  const filteredShortcuts = shortcuts.map(group => ({
    ...group,
    shortcuts: group.shortcuts.filter(shortcut =>
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatShortcut(shortcut).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.shortcuts.length > 0);

  const totalShortcuts = shortcuts.reduce((total, group) => total + group.shortcuts.length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Keyboard className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'اختصارات المفاتيح' : 'Keyboard Shortcuts'}
          <Badge variant="secondary" className="ml-2">
            {totalShortcuts}
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-arabic">
            <Keyboard className="h-5 w-5" />
            {language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
          </DialogTitle>
          <DialogDescription className="font-arabic">
            {language === 'ar' 
              ? 'استخدم هذه الاختصارات لتسريع استخدام التطبيق'
              : 'Use these shortcuts to speed up your workflow'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'ar' ? 'البحث في الاختصارات...' : 'Search shortcuts...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-arabic"
            />
          </div>

          {/* Shortcuts by Categories */}
          <Tabs defaultValue={filteredShortcuts[0]?.name} className="w-full">
            <TabsList className="grid w-full grid-cols-auto">
              {filteredShortcuts.map((group) => (
                <TabsTrigger 
                  key={group.name} 
                  value={group.name}
                  className="font-arabic text-sm"
                >
                  {group.name}
                  <Badge variant="outline" className="ml-1">
                    {group.shortcuts.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {filteredShortcuts.map((group) => (
              <TabsContent key={group.name} value={group.name} className="space-y-4">
                <div className="grid gap-3">
                  {group.shortcuts.map((shortcut, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium font-arabic">
                            {shortcut.description}
                          </h4>
                          {shortcut.disabled && (
                            <p className="text-xs text-muted-foreground mt-1 font-arabic">
                              {language === 'ar' ? 'غير متاح حالياً' : 'Currently disabled'}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {formatShortcut(shortcut).split(' + ').map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              <kbd className={`
                                px-2 py-1 text-xs font-mono rounded bg-muted border
                                ${shortcut.disabled ? 'opacity-50' : ''}
                              `}>
                                {key}
                              </kbd>
                              {keyIndex < formatShortcut(shortcut).split(' + ').length - 1 && (
                                <span className="text-muted-foreground text-xs">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* No Results */}
          {searchTerm && filteredShortcuts.length === 0 && (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-arabic">
                {language === 'ar' 
                  ? 'لم يتم العثور على اختصارات تطابق البحث'
                  : 'No shortcuts found matching your search'
                }
              </p>
            </div>
          )}

          {/* Help Section */}
          <Card className="mt-6 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-arabic">
                {language === 'ar' ? 'نصائح' : 'Tips'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="font-arabic">
                {language === 'ar' ? (
                  <>
                    <p>• لا تعمل الاختصارات أثناء الكتابة في حقول النص</p>
                    <p>• استخدم Ctrl+? لعرض هذه النافذة بسرعة</p>
                    <p>• يمكنك تخصيص الاختصارات من الإعدادات</p>
                  </>
                ) : (
                  <>
                    <p>• Shortcuts don't work when typing in text fields</p>
                    <p>• Use Ctrl+? to quickly open this panel</p>
                    <p>• You can customize shortcuts in settings</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsPanel;