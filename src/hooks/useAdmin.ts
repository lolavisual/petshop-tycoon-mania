import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminStats {
  totalUsers: number;
  dau: number;
  mau: number;
  totalClicks: number;
  totalCrystalsEarned: number;
  pendingArticles: number;
  economy: {
    crystals: number;
    diamonds: number;
    stones: number;
  };
  avgLevel: string;
  retention: string;
}

export interface AdminUser {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  level: number;
  crystals: number;
  diamonds: number;
  stones: number;
  streak_days: number;
  is_banned: boolean;
  created_at: string;
  last_active_at: string;
}

export interface AdminArticle {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  profiles: {
    username: string | null;
    first_name: string | null;
    telegram_id: number;
  };
}

export function useAdmin(adminSecret: string) {
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const callAdmin = useCallback(async (action: string, payload?: unknown) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin', {
        body: { action, payload },
        headers: {
          'x-admin-secret': adminSecret
        }
      });

      if (error) {
        console.error('Admin error:', error);
        if (error.message?.includes('403')) {
          setIsAuthorized(false);
          toast.error('Доступ запрещён');
          return null;
        }
        toast.error(error.message || 'Ошибка');
        return null;
      }

      if (data?.error) {
        if (data.error.includes('прав') || data.error.includes('IP') || data.error.includes('ключ')) {
          setIsAuthorized(false);
        }
        toast.error(data.error);
        return null;
      }

      setIsAuthorized(true);
      return data;
    } catch (err: unknown) {
      console.error('Admin call error:', err);
      toast.error('Ошибка соединения');
      return null;
    } finally {
      setLoading(false);
    }
  }, [adminSecret]);

  // Статистика
  const getStats = useCallback(() => callAdmin('get_stats'), [callAdmin]);

  // Пользователи
  const getUsers = useCallback((page = 1, limit = 20, search = '') => 
    callAdmin('get_users', { page, limit, search }), [callAdmin]);

  const updateUser = useCallback((userId: string, updates: Partial<AdminUser>) =>
    callAdmin('update_user', { userId, updates }), [callAdmin]);

  const banUser = useCallback((userId: string, ban: boolean) =>
    callAdmin('ban_user', { userId, ban }), [callAdmin]);

  // Статьи
  const getArticles = useCallback((status = 'pending', page = 1, limit = 20) =>
    callAdmin('get_articles', { status, page, limit }), [callAdmin]);

  const moderateArticle = useCallback((articleId: string, action: 'approve' | 'reject', reason?: string) =>
    callAdmin('moderate_article', { articleId, action, reason }), [callAdmin]);

  // Рассылка
  const broadcast = useCallback((message: string, segment?: { minLevel?: number; minStreak?: number }) =>
    callAdmin('broadcast', { message, segment }), [callAdmin]);

  // Массовая выдача валюты
  const bulkGiveCurrency = useCallback((currency: 'crystals' | 'diamonds' | 'stones', amount: number, segment?: { minLevel?: number }) =>
    callAdmin('bulk_give_currency', { currency, amount, segment }), [callAdmin]);

  return {
    loading,
    isAuthorized,
    getStats,
    getUsers,
    updateUser,
    banUser,
    getArticles,
    moderateArticle,
    broadcast,
    bulkGiveCurrency
  };
}
