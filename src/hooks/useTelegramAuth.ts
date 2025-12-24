import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getInitData, getTelegramUser, isTelegramWebApp, initTelegramWebApp } from '@/lib/telegram';
import { Session, User } from '@supabase/supabase-js';

interface TelegramAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isTelegram: boolean;
}

export function useTelegramAuth() {
  const [state, setState] = useState<TelegramAuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isTelegram: false,
  });

  const authenticateWithTelegram = useCallback(async () => {
    try {
      const initData = getInitData();
      const telegramUser = getTelegramUser();

      if (!initData || !telegramUser) {
        console.log('No Telegram data, running in browser mode');
        setState(prev => ({ ...prev, loading: false, isTelegram: false }));
        return false;
      }

      console.log('Authenticating with Telegram...', { telegramId: telegramUser.id });

      // Вызываем edge function для авторизации
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { initData }
      });

      if (error) {
        console.error('Telegram auth error:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Ошибка авторизации Telegram',
          isTelegram: true
        }));
        return false;
      }

      if (data.error) {
        console.error('Telegram auth response error:', data.error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: data.error,
          isTelegram: true
        }));
        return false;
      }

      // Авторизуемся через magic link token
      if (data.token && data.tokenType === 'magiclink') {
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.token,
          type: 'magiclink'
        });

        if (verifyError) {
          console.error('Token verify error:', verifyError);
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Ошибка верификации токена',
            isTelegram: true
          }));
          return false;
        }

        if (verifyData.session && verifyData.user) {
          setState({
            user: verifyData.user,
            session: verifyData.session,
            loading: false,
            error: null,
            isAuthenticated: true,
            isTelegram: true
          });
          return true;
        }
      }

      setState(prev => ({ ...prev, loading: false, isTelegram: true }));
      return false;
    } catch (err) {
      console.error('Auth error:', err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Произошла ошибка авторизации'
      }));
      return false;
    }
  }, []);

  useEffect(() => {
    // Инициализируем Telegram WebApp
    initTelegramWebApp();
    
    const isTelegram = isTelegramWebApp();
    setState(prev => ({ ...prev, isTelegram }));

    // Слушаем изменения сессии
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false
      }));
    });

    // Проверяем существующую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState(prev => ({
          ...prev,
          session,
          user: session.user,
          isAuthenticated: true,
          loading: false
        }));
      } else if (isTelegram) {
        // Если в Telegram и нет сессии - авторизуемся
        authenticateWithTelegram();
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [authenticateWithTelegram]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState(prev => ({
      ...prev,
      user: null,
      session: null,
      isAuthenticated: false
    }));
  }, []);

  return {
    ...state,
    signOut,
    retry: authenticateWithTelegram
  };
}
