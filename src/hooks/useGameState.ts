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

export function useGameState() {
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [accessories, setAccessories] = useState<UserAccessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClicking, setIsClicking] = useState(false);

  // Загрузка профиля
  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
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
      setError('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  // Клик
  const handleClick = useCallback(async (): Promise<ClickResult | null> => {
    if (isClicking) return null;
    
    setIsClicking(true);
    hapticImpact('medium');

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
  }, [isClicking]);

  // Сундук
  const claimChest = useCallback(async (): Promise<ChestResult | null> => {
    hapticImpact('heavy');

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
        streak_days: data.streakDays
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
  }, []);

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
