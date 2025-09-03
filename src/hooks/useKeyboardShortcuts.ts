import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  disabled?: boolean;
  preventDefault?: boolean;
}

export interface KeyboardShortcutGroup {
  name: string;
  shortcuts: KeyboardShortcut[];
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled: boolean = true) => {
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcuts);

  // Update shortcuts reference when they change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      if (shortcut.disabled) return false;

      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatch = !!shortcut.altKey === event.altKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
      const metaMatch = !!shortcut.metaKey === event.metaKey;

      return keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, enabled]);

  return { handleKeyPress };
};

// Hook for managing multiple shortcut groups
export const useKeyboardShortcutGroups = (groups: KeyboardShortcutGroup[], enabled: boolean = true) => {
  const allShortcuts = groups.flatMap(group => group.shortcuts);
  const { handleKeyPress } = useKeyboardShortcuts(allShortcuts, enabled);

  const getShortcutDisplay = (shortcut: KeyboardShortcut) => {
    const keys: string[] = [];
    
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.metaKey) keys.push('Cmd');
    
    keys.push(shortcut.key.toUpperCase());
    
    return keys.join(' + ');
  };

  return {
    groups,
    getShortcutDisplay,
    allShortcuts
  };
};

// Common shortcuts for tasks app
export const createTaskAppShortcuts = (callbacks: {
  onNewTask: () => void;
  onSearch: () => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onExportData: () => void;
  onShowHelp: () => void;
  onFocusMode: () => void;
  onNextTab: () => void;
  onPrevTab: () => void;
  onSave: () => void;
}): KeyboardShortcutGroup[] => {
  return [
    {
      name: 'إدارة المهام',
      shortcuts: [
        {
          key: 'n',
          ctrlKey: true,
          description: 'مهمة جديدة',
          action: callbacks.onNewTask
        },
        {
          key: 'f',
          ctrlKey: true,
          description: 'البحث',
          action: callbacks.onSearch
        },
        {
          key: 's',
          ctrlKey: true,
          description: 'حفظ',
          action: callbacks.onSave
        },
        {
          key: 'e',
          ctrlKey: true,
          shiftKey: true,
          description: 'تصدير البيانات',
          action: callbacks.onExportData
        }
      ]
    },
    {
      name: 'التنقل',
      shortcuts: [
        {
          key: 'Tab',
          ctrlKey: true,
          description: 'التبويب التالي',
          action: callbacks.onNextTab
        },
        {
          key: 'Tab',
          ctrlKey: true,
          shiftKey: true,
          description: 'التبويب السابق',
          action: callbacks.onPrevTab
        },
        {
          key: 'f11',
          description: 'وضع التركيز',
          action: callbacks.onFocusMode,
          preventDefault: false
        }
      ]
    },
    {
      name: 'الإعدادات',
      shortcuts: [
        {
          key: 'd',
          ctrlKey: true,
          altKey: true,
          description: 'تبديل المظهر',
          action: callbacks.onToggleTheme
        },
        {
          key: 'l',
          ctrlKey: true,
          altKey: true,
          description: 'تبديل اللغة',
          action: callbacks.onToggleLanguage
        },
        {
          key: '?',
          shiftKey: true,
          description: 'عرض المساعدة',
          action: callbacks.onShowHelp
        }
      ]
    }
  ];
};

export default useKeyboardShortcuts;