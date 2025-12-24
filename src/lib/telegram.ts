// Telegram WebApp SDK интеграция

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
  sendData: (data: string) => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: string; text?: string }> }) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
}

// Получение Telegram WebApp
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

// Проверка, запущено ли в Telegram
export function isTelegramWebApp(): boolean {
  return getTelegramWebApp() !== null;
}

// Получение initData для авторизации
export function getInitData(): string {
  const webApp = getTelegramWebApp();
  return webApp?.initData || '';
}

// Получение данных пользователя
export function getTelegramUser() {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
}

// Haptic feedback
export function hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
  const webApp = getTelegramWebApp();
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.impactOccurred(style);
  }
}

export function hapticNotification(type: 'error' | 'success' | 'warning') {
  const webApp = getTelegramWebApp();
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.notificationOccurred(type);
  }
}

export function hapticSelection() {
  const webApp = getTelegramWebApp();
  if (webApp?.HapticFeedback) {
    webApp.HapticFeedback.selectionChanged();
  }
}

// Инициализация WebApp
export function initTelegramWebApp() {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.ready();
    webApp.expand();
    webApp.enableClosingConfirmation();
    
    // Устанавливаем цвета темы в зависимости от темы Telegram
    const isDark = webApp.colorScheme === 'dark';
    const headerColor = isDark ? '#1a1a2e' : '#FFF5EB';
    const bgColor = isDark ? '#16213e' : '#FFF5EB';
    
    webApp.setHeaderColor(headerColor);
    webApp.setBackgroundColor(bgColor);
    
    // Скрываем кнопку "Назад" по умолчанию
    webApp.BackButton.hide();
    
    console.log('Telegram WebApp initialized:', {
      version: webApp.version,
      platform: webApp.platform,
      colorScheme: webApp.colorScheme,
      viewportHeight: webApp.viewportHeight
    });
  }
}

// Показать алерт
export function showTelegramAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.showAlert(message, resolve);
    } else {
      alert(message);
      resolve();
    }
  });
}

// Показать подтверждение
export function showTelegramConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.showConfirm(message, resolve);
    } else {
      resolve(confirm(message));
    }
  });
}

// Получить цветовую схему
export function getColorScheme(): 'light' | 'dark' {
  const webApp = getTelegramWebApp();
  return webApp?.colorScheme || 'light';
}
