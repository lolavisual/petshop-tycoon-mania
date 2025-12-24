import { useEffect, useState, useCallback } from 'react';
import { getTelegramWebApp, isTelegramWebApp } from '@/lib/telegram';

export type ThemeMode = 'light' | 'dark';

export function useTelegramTheme() {
  const [theme, setTheme] = useState<ThemeMode>('light');

  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    setTheme(mode);
    console.log('Theme applied:', mode);
  }, []);

  const syncWithTelegram = useCallback(() => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      const telegramTheme = webApp.colorScheme;
      applyTheme(telegramTheme);
      
      // Update header and background colors based on theme
      const isDark = telegramTheme === 'dark';
      const headerColor = isDark ? '#1a1a1e' : '#FFF5EB';
      const bgColor = isDark ? '#141418' : '#FFF5EB';
      
      webApp.setHeaderColor(headerColor);
      webApp.setBackgroundColor(bgColor);
    }
  }, [applyTheme]);

  useEffect(() => {
    // Initial sync
    if (isTelegramWebApp()) {
      syncWithTelegram();
      
      // Listen for theme changes from Telegram
      const webApp = getTelegramWebApp();
      if (webApp) {
        const handleThemeChange = () => {
          console.log('Telegram theme changed');
          syncWithTelegram();
        };
        
        webApp.onEvent('themeChanged', handleThemeChange);
        
        return () => {
          webApp.offEvent('themeChanged', handleThemeChange);
        };
      }
    } else {
      // Fallback: check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(prefersDark.matches ? 'dark' : 'light');
      
      const handleSystemChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      
      prefersDark.addEventListener('change', handleSystemChange);
      
      return () => {
        prefersDark.removeEventListener('change', handleSystemChange);
      };
    }
  }, [syncWithTelegram, applyTheme]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  }, [theme, applyTheme]);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    syncWithTelegram,
  };
}
