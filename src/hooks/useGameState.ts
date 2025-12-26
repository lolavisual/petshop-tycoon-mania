import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hapticImpact, hapticNotification } from '@/lib/telegram';
import { toast } from 'sonner';

export interface GameProfile {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_variant: number;
  level: number;
  xp: number;
  crystals: number;
  diamonds: number;
  stones: number;
  passive_rate: number;
  last_passive_claim: string;
  last_chest_claim: string | null;
  streak_days: number;
  last_streak_date: string | null;
  last_active_at: string;
  is_banned: boolean;
  created_at: string;
  total_clicks?: number;
  total_crystals_earned?: number;
  friends_count?: number;
  gifts_sent?: number;
  gifts_received?: number;
  pet_type?: string;
}

export interface Accessory {
  id: string;
  name: string;
  name_ru: string;
  icon: string;
  category: string;
  required_level: number;
  is_special: boolean;
}

export interface UserAccessory extends Accessory {
  is_equipped: boolean;
}

interface ClickResult {
  crystals: number;
  xp: number;
  level: number;
  xpForNext: number;
  crystalsEarned: number;
  xpEarned: number;
  leveledUp: boolean;
  newAccessory: Accessory | null;
}

interface ChestResult {
  crystalsEarned: number;
  stonesEarned: number;
  streakDays: number;
  streakMilestone: number | null;
}

interface PassiveResult {
  crystalsEarned: number;
  hoursOffline: number;
  xpPenalty: number;
  hadPenalty: boolean;
}

// Мок-профиль для режима разработки
const DEV_MOCK_PROFILE: GameProfile = {
  id: 'dev-user',
  telegram_id: 123456789,
  username: 'dev_user',
  first_name: 'Разработчик',
  last_name: null,
  avatar_variant: 0,
  level: 5,
  xp: 50,
  crystals: 1000,
  diamonds: 100,
  stones: 50,
  passive_rate: 1,
  last_passive_claim: new Date().toISOString(),
  last_chest_claim: null,
  streak_days: 3,
  last_streak_date: null,
  last_active_at: new Date().toISOString(),
  is_banned: false,
  created_at: new Date().toISOString(),
  pet_type: 'dog',
};

export function useGameState() {
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [accessories, setAccessories] = useState<UserAccessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClicking, setIsClicking] = useState(false);

  // Проверяем, работаем ли мы в Telegram
  const isTelegram = typeof window !== 'undefined' && 
    (window as any).Telegram?.WebApp?.initData?.length > 0;

  // Загрузка профиля
  const loadProfile = useCallback(async () => {
    try {
      // В DEV режиме без Telegram используем мок-данные
      if (import.meta.env.DEV && !isTelegram) {
        console.log('DEV режим: используем мок-профиль');
        setProfile(DEV_MOCK_PROFILE);
        setAccessories([]);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // В DEV режиме всё равно показываем мок
        if (import.meta.env.DEV) {
          setProfile(DEV_MOCK_PROFILE);
          setLoading(false);
          return;
        }
        setError('Пользователь не авторизован');
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Ошибка загрузки профиля:', profileError);
        // В DEV режиме используем мок при ошибке
        if (import.meta.env.DEV) {
          setProfile(DEV_MOCK_PROFILE);
          setLoading(false);
          return;
        }
        setError('Не удалось загрузить профиль');
        return;
      }

      setProfile(profileData as GameProfile);

      // Загружаем аксессуары пользователя
      const { data: userAccessories } = await supabase
        .from('user_accessories')
        .select(`
          is_equipped,
          accessories (
            id,
            name,
            name_ru,
            icon,
            category,
            required_level,
            is_special
          )
        `)
        .eq('user_id', user.id);

      if (userAccessories) {
        const formattedAccessories: UserAccessory[] = userAccessories.map((ua: any) => ({
          ...ua.accessories,
          is_equipped: ua.is_equipped
        }));
        setAccessories(formattedAccessories);
      }
    } catch (err) {
      console.error('Ошибка:', err);
      // В DEV режиме используем мок при любой ошибке
      if (import.meta.env.DEV) {
        setProfile(DEV_MOCK_PROFILE);
        setLoading(false);
        return;
      }
      setError('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }, [isTelegram]);

  // Клик
  const handleClick = useCallback(async (): Promise<ClickResult | null> => {
    if (isClicking) return null;
    
    setIsClicking(true);
    hapticImpact('medium');

    // В DEV режиме без Telegram - локальный мок клика
    if (import.meta.env.DEV && !isTelegram) {
      const xpEarned = 0.5;
      const crystalsEarned = 1;
      
      setProfile(prev => {
        if (!prev) return null;
        const newXp = prev.xp + xpEarned;
        const xpForNext = Math.floor(150 * Math.pow(1.4, prev.level - 1));
        let newLevel = prev.level;
        let finalXp = newXp;
        
        if (newXp >= xpForNext) {
          newLevel++;
          finalXp = newXp - xpForNext;
          toast.success(`🎉 Уровень ${newLevel}!`);
        }
        
        return {
          ...prev,
          crystals: prev.crystals + crystalsEarned,
          xp: finalXp,
          level: newLevel
        };
      });
      
      setIsClicking(false);
      return {
        crystals: profile?.crystals || 0,
        xp: profile?.xp || 0,
        level: profile?.level || 1,
        xpForNext: 150,
        crystalsEarned,
        xpEarned,
        leveledUp: false,
        newAccessory: null
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('game-click', {
        method: 'POST'
      });

      if (error) {
        console.error('Ошибка клика:', error);
        hapticNotification('error');
        toast.error(error.message || 'Ошибка клика');
        return null;
      }

      if (data.error) {
        hapticNotification('error');
        toast.error(data.error);
        return null;
      }

      // Обновляем локальный профиль
      setProfile(prev => prev ? {
        ...prev,
        crystals: data.crystals,
        xp: data.xp,
        level: data.level
      } : null);

      if (data.leveledUp) {
        hapticNotification('success');
        toast.success(`🎉 Уровень ${data.level}!`);
      }

      if (data.newAccessory) {
        hapticNotification('success');
        toast.success(`✨ Новый аксессуар: ${data.newAccessory.name_ru}!`);
        setAccessories(prev => [...prev, { ...data.newAccessory, is_equipped: data.newAccessory.name === 'santa_hat' }]);
      }

      return data as ClickResult;
    } catch (err) {
      console.error('Ошибка:', err);
      hapticNotification('error');
      return null;
    } finally {
      setIsClicking(false);
    }
  }, [isClicking, isTelegram, profile]);

  // Сундук
  const claimChest = useCallback(async (): Promise<ChestResult | null> => {
    hapticImpact('heavy');

    // В DEV режиме без Telegram - локальный мок сундука
    if (import.meta.env.DEV && !isTelegram) {
      const crystalsEarned = 50 + Math.floor(Math.random() * 100);
      const stonesEarned = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0;
      const newStreak = (profile?.streak_days || 0) + 1;
      
      setProfile(prev => prev ? {
        ...prev,
        crystals: prev.crystals + crystalsEarned,
        stones: prev.stones + stonesEarned,
        streak_days: newStreak,
        last_chest_claim: new Date().toISOString()
      } : null);

      hapticNotification('success');
      
      let message = `💎 +${crystalsEarned} кристаллов!`;
      if (stonesEarned > 0) {
        message += ` 🪨 +${stonesEarned} камней!`;
      }
      message += ` 🔥 Стрик ${newStreak} дней!`;
      
      toast.success(message);
      return {
        crystalsEarned,
        stonesEarned,
        streakDays: newStreak,
        streakMilestone: newStreak % 7 === 0 ? newStreak : null
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('game-chest', {
        method: 'POST'
      });

      if (error || data.error) {
        hapticNotification('error');
        toast.error(data?.error || 'Ошибка получения сундука');
        return null;
      }

      setProfile(prev => prev ? {
        ...prev,
        crystals: data.newCrystals,
        stones: data.newStones,
        streak_days: data.streakDays,
        last_chest_claim: new Date().toISOString()
      } : null);

      hapticNotification('success');
      
      let message = `💎 +${data.crystalsEarned} кристаллов!`;
      if (data.stonesEarned > 0) {
        message += ` 🪨 +${data.stonesEarned} камней!`;
      }
      if (data.streakMilestone) {
        message += ` 🔥 Стрик ${data.streakDays} дней!`;
      }
      
      toast.success(message);
      return data as ChestResult;
    } catch (err) {
      hapticNotification('error');
      return null;
    }
  }, [isTelegram, profile]);

  // Пассивный доход
  const claimPassive = useCallback(async (): Promise<PassiveResult | null> => {
    hapticImpact('light');

    try {
      const { data, error } = await supabase.functions.invoke('game-passive', {
        method: 'POST'
      });

      if (error || data.error) {
        if (data?.crystalsAvailable === 0) {
          toast.info('Подождите немного для накопления');
          return null;
        }
        hapticNotification('error');
        toast.error(data?.error || 'Ошибка');
        return null;
      }

      setProfile(prev => prev ? {
        ...prev,
        crystals: data.newCrystals,
        xp: data.newXp
      } : null);

      hapticNotification('success');
      toast.success(`💰 +${data.crystalsEarned} за ${data.hoursOffline}ч оффлайн!`);
      
      if (data.hadPenalty) {
        toast.warning(`⚠️ Штраф за долгий оффлайн: -${data.xpPenalty} XP`);
      }

      return data as PassiveResult;
    } catch (err) {
      hapticNotification('error');
      return null;
    }
  }, []);

  // Вычисление XP для следующего уровня
  const xpForNextLevel = useCallback((level: number): number => {
    return Math.floor(150 * Math.pow(1.4, level - 1));
  }, []);

  // Проверка, можно ли получить сундук
  const canClaimChest = useCallback((): boolean => {
    if (!profile?.last_chest_claim) return true;
    
    const now = new Date();
    const lastClaim = new Date(profile.last_chest_claim);
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const lastClaimUTC = new Date(Date.UTC(lastClaim.getUTCFullYear(), lastClaim.getUTCMonth(), lastClaim.getUTCDate()));
    
    return lastClaimUTC.getTime() < todayUTC.getTime();
  }, [profile]);

  // Время до следующего сундука
  const timeUntilChest = useCallback((): string => {
    if (canClaimChest()) return 'Доступен!';
    
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const ms = tomorrow.getTime() - now.getTime();
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}ч ${minutes}м`;
  }, [canClaimChest]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    accessories,
    loading,
    error,
    isClicking,
    handleClick,
    claimChest,
    claimPassive,
    xpForNextLevel,
    canClaimChest,
    timeUntilChest,
    refreshProfile: loadProfile
  };
}
