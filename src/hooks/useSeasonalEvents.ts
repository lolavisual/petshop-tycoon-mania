import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticNotification } from '@/lib/telegram';

interface SeasonalEvent {
  id: string;
  name: string;
  name_ru: string;
  description: string | null;
  description_ru: string | null;
  icon: string;
  theme_color: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  bonus_multiplier: number;
}

interface SeasonalReward {
  id: string;
  event_id: string;
  name: string;
  name_ru: string;
  description: string | null;
  description_ru: string | null;
  reward_type: string;
  reward_amount: number;
  requirement_type: string;
  requirement_value: number;
  icon: string;
  rarity: string;
}

interface UserSeasonalProgress {
  reward_id: string;
  progress: number;
  is_completed: boolean;
  is_claimed: boolean;
}

export function useSeasonalEvents() {
  const [activeEvent, setActiveEvent] = useState<SeasonalEvent | null>(null);
  const [rewards, setRewards] = useState<SeasonalReward[]>([]);
  const [userProgress, setUserProgress] = useState<UserSeasonalProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      
      // Загружаем активное событие
      const { data: eventData } = await supabase
        .from('seasonal_events')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .single();

      if (eventData) {
        setActiveEvent(eventData);

        // Загружаем награды события
        const { data: rewardsData } = await supabase
          .from('seasonal_rewards')
          .select('*')
          .eq('event_id', eventData.id)
          .order('requirement_value', { ascending: true });

        if (rewardsData) {
          setRewards(rewardsData);
        }

        // Загружаем прогресс пользователя
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: progressData } = await supabase
            .from('user_seasonal_rewards')
            .select('*')
            .eq('user_id', user.id);

          if (progressData) {
            setUserProgress(progressData);
          }

          // Инициализируем прогресс для новых наград
          if (rewardsData) {
            const existingRewardIds = progressData?.map(p => p.reward_id) || [];
            const newRewards = rewardsData.filter(r => !existingRewardIds.includes(r.id));
            
            if (newRewards.length > 0) {
              const newProgressEntries = newRewards.map(r => ({
                user_id: user.id,
                reward_id: r.id,
                progress: 0
              }));
              
              await supabase
                .from('user_seasonal_rewards')
                .insert(newProgressEntries);
              
              setUserProgress(prev => [
                ...prev,
                ...newProgressEntries.map(e => ({
                  ...e,
                  is_completed: false,
                  is_claimed: false
                }))
              ]);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading seasonal events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProgress = useCallback(async (requirementType: string, increment: number = 1) => {
    if (!activeEvent) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Находим награды с этим типом требования
      const matchingRewards = rewards.filter(r => r.requirement_type === requirementType);
      
      for (const reward of matchingRewards) {
        const existingProgress = userProgress.find(p => p.reward_id === reward.id);
        
        if (existingProgress?.is_completed) continue;

        const currentProgress = existingProgress?.progress || 0;
        const newProgress = Math.min(currentProgress + increment, reward.requirement_value);
        const isCompleted = newProgress >= reward.requirement_value;

        await supabase
          .from('user_seasonal_rewards')
          .upsert({
            user_id: user.id,
            reward_id: reward.id,
            progress: newProgress,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null
          }, {
            onConflict: 'user_id,reward_id'
          });

        setUserProgress(prev => {
          const existing = prev.find(p => p.reward_id === reward.id);
          if (existing) {
            return prev.map(p => p.reward_id === reward.id ? {
              ...p,
              progress: newProgress,
              is_completed: isCompleted
            } : p);
          }
          return [...prev, {
            reward_id: reward.id,
            progress: newProgress,
            is_completed: isCompleted,
            is_claimed: false
          }];
        });

        if (isCompleted && !existingProgress?.is_completed) {
          hapticNotification('success');
          toast.success(`🎉 Сезонная награда "${reward.name_ru}" выполнена!`);
        }
      }
    } catch (err) {
      console.error('Error updating seasonal progress:', err);
    }
  }, [activeEvent, rewards, userProgress]);

  const claimReward = useCallback(async (rewardId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const reward = rewards.find(r => r.id === rewardId);
      const progress = userProgress.find(p => p.reward_id === rewardId);
      
      if (!reward || !progress?.is_completed || progress.is_claimed) {
        return null;
      }

      // Получаем профиль
      const { data: profile } = await supabase
        .from('profiles')
        .select('crystals, diamonds, stones')
        .eq('id', user.id)
        .single();

      if (!profile) return null;

      // Обновляем ресурсы
      const updates: Record<string, number> = {};
      if (reward.reward_type === 'crystals') {
        updates.crystals = profile.crystals + reward.reward_amount;
      } else if (reward.reward_type === 'diamonds') {
        updates.diamonds = profile.diamonds + reward.reward_amount;
      } else if (reward.reward_type === 'stones') {
        updates.stones = profile.stones + reward.reward_amount;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
      }

      // Помечаем награду как полученную
      await supabase
        .from('user_seasonal_rewards')
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('reward_id', rewardId);

      setUserProgress(prev => prev.map(p => 
        p.reward_id === rewardId ? { ...p, is_claimed: true } : p
      ));

      hapticNotification('success');
      toast.success(`${reward.icon} Получено: +${reward.reward_amount} ${
        reward.reward_type === 'crystals' ? 'кристаллов' : 
        reward.reward_type === 'diamonds' ? 'алмазов' : 
        reward.reward_type === 'stones' ? 'камней' : 'награда'
      }!`);

      return reward;
    } catch (err) {
      console.error('Error claiming seasonal reward:', err);
      return null;
    }
  }, [rewards, userProgress]);

  const getTimeRemaining = useCallback((): string => {
    if (!activeEvent) return '';
    
    const end = new Date(activeEvent.end_date);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Завершено';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}д ${hours}ч`;
    }
    return `${hours}ч`;
  }, [activeEvent]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    activeEvent,
    rewards,
    userProgress,
    loading,
    updateProgress,
    claimReward,
    getTimeRemaining,
    refresh: loadEvents
  };
}
