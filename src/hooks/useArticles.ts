import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hapticImpact, hapticNotification } from '@/lib/telegram';
import { toast } from 'sonner';

export interface Article {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reward_given: boolean;
  created_at: string;
  reviewed_at: string | null;
}

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Загрузка статей пользователя
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки статей:', error);
        return;
      }

      setArticles(data as Article[]);
    } catch (err) {
      console.error('Ошибка:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Создание статьи
  const createArticle = useCallback(async (title: string, content: string): Promise<boolean> => {
    if (creating) return false;

    // Валидация на клиенте
    if (!title.trim()) {
      toast.error('Введите заголовок');
      return false;
    }

    if (content.trim().length < 50) {
      toast.error('Минимум 50 символов в тексте статьи');
      return false;
    }

    setCreating(true);
    hapticImpact('medium');

    try {
      const { data, error } = await supabase.functions.invoke('article-create', {
        body: { title, content }
      });

      if (error || data?.error) {
        hapticNotification('error');
        toast.error(data?.error || 'Ошибка создания статьи');
        return false;
      }

      hapticNotification('success');
      toast.success(data.message || 'Статья отправлена на модерацию!');
      
      // Перезагружаем список
      await loadArticles();
      return true;
    } catch (err) {
      console.error('Ошибка создания:', err);
      hapticNotification('error');
      toast.error('Ошибка соединения');
      return false;
    } finally {
      setCreating(false);
    }
  }, [creating, loadArticles]);

  // Подсчёт статей по статусам
  const getStats = useCallback(() => {
    const pending = articles.filter(a => a.status === 'pending').length;
    const approved = articles.filter(a => a.status === 'approved').length;
    const rejected = articles.filter(a => a.status === 'rejected').length;
    const totalReward = approved * 1000;
    
    return { pending, approved, rejected, totalReward };
  }, [articles]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  return {
    articles,
    loading,
    creating,
    createArticle,
    refreshArticles: loadArticles,
    getStats
  };
}
