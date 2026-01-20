import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticNotification } from '@/lib/telegram';

interface DailyReward {
  id: string;
  day_number: number;
  reward_type: string;
  reward_amount: number;
  icon: string;
  is_premium: boolean;
}

interface UserLoginReward {
  current_day: number;
  last_claim_date: string | null;
  total_claims: number;
}

export function useDailyLoginRewards() {
  const [rewards, setRewards] = useState<DailyReward[]>([]);
  const [userProgress, setUserProgress] = useState<UserLoginReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const loadRewards = useCallback(async () => {
    try {
      // Загружаем награды
      const { data: rewardsData } = await supabase
        .from('daily_login_rewards')
        .select('*')
        .order('day_number', { ascending: true });

      if (rewardsData) {
        setRewards(rewardsData);
      }

      // Загружаем прогресс пользователя
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: progressData } = await supabase
          .from('user_login_rewards')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (progressData) {
          setUserProgress(progressData);
        } else {
          // Создаем запись для нового пользователя
          const { data: newProgress } = await supabase
            .from('user_login_rewards')
            .insert({ user_id: user.id, current_day: 1 })
            .select()
            .single();
          
          if (newProgress) {
            setUserProgress(newProgress);
          }
        }
      }
    } catch (err) {
      console.error('Error loading daily rewards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const canClaimToday = useCallback((): boolean => {
    if (!userProgress?.last_claim_date) return true;
    
    const today = new Date().toISOString().split('T')[0];
    const lastClaim = userProgress.last_claim_date;
    
    return lastClaim !== today;
  }, [userProgress]);

  const claimReward = useCallback(async () => {
    if (claiming || !canClaimToday()) return null;
    
    setClaiming(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Необходима авторизация');
        return null;
      }

      const currentDay = userProgress?.current_day || 1;
      const reward = rewards.find(r => r.day_number === currentDay);
      
      if (!reward) {
        toast.error('Награда не найдена');
        return null;
      }

      // Получаем текущий профиль
      const { data: profile } = await supabase
        .from('profiles')
        .select('crystals, diamonds, stones')
        .eq('id', user.id)
        .single();

      if (!profile) {
        toast.error('Профиль не найден');
        return null;
      }

      // Обновляем ресурсы
      const updates: Record<string, number> = {};
      if (reward.reward_type === 'crystals') {
        updates.crystals = profile.crystals + reward.reward_amount;
      } else if (reward.reward_type === 'diamonds') {
        updates.diamonds = profile.diamonds + reward.reward_amount;
      } else if (reward.reward_type === 'stones') {
        updates.stones = profile.stones + reward.reward_amount;
      }

      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      // Обновляем прогресс (циклически 1-7)
      const nextDay = currentDay >= 7 ? 1 : currentDay + 1;
      const today = new Date().toISOString().split('T')[0];

      await supabase
        .from('user_login_rewards')
        .update({
          current_day: nextDay,
          last_claim_date: today,
          total_claims: (userProgress?.total_claims || 0) + 1
        })
        .eq('user_id', user.id);

      setUserProgress(prev => prev ? {
        ...prev,
        current_day: nextDay,
        last_claim_date: today,
        total_claims: prev.total_claims + 1
      } : null);

      hapticNotification('success');
      toast.success(`${reward.icon} +${reward.reward_amount} ${
        reward.reward_type === 'crystals' ? 'кристаллов' : 
        reward.reward_type === 'diamonds' ? 'алмазов' : 'камней'
      }!`);

      return reward;
    } catch (err) {
      console.error('Error claiming reward:', err);
      toast.error('Ошибка получения награды');
      return null;
    } finally {
      setClaiming(false);
    }
  }, [claiming, canClaimToday, userProgress, rewards]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  return {
    rewards,
    userProgress,
    loading,
    claiming,
    canClaimToday,
    claimReward,
    refresh: loadRewards
  };
}
