import { useState, useEffect, useCallback } from 'react';

const DEMO_STORAGE_KEY = 'petshop_demo_profile';

export interface DemoProfile {
  id: string;
  telegram_id: number;
  username: string;
  first_name: string;
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
  pet_type: string;
  pet_changes: number;
  quests_completed: number;
  total_clicks: number;
  total_crystals_earned: number;
}

const DEFAULT_DEMO_PROFILE: DemoProfile = {
  id: 'demo-user',
  telegram_id: 0,
  username: 'demo_player',
  first_name: 'Демо',
  last_name: 'Игрок',
  avatar_variant: 0,
  level: 1,
  xp: 0,
  crystals: 100,
  diamonds: 10,
  stones: 5,
  passive_rate: 1,
  last_passive_claim: new Date().toISOString(),
  last_chest_claim: null,
  streak_days: 0,
  last_streak_date: null,
  last_active_at: new Date().toISOString(),
  is_banned: false,
  created_at: new Date().toISOString(),
  pet_type: 'dog',
  pet_changes: 0,
  quests_completed: 0,
  total_clicks: 0,
  total_crystals_earned: 0,
};

export function useDemoMode() {
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Загрузка профиля из localStorage
  const loadProfile = useCallback(() => {
    try {
      const saved = localStorage.getItem(DEMO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DemoProfile;
        // Обновляем last_active_at
        parsed.last_active_at = new Date().toISOString();
        setProfile(parsed);
        return parsed;
      } else {
        // Создаём новый демо-профиль
        const newProfile = { ...DEFAULT_DEMO_PROFILE };
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(newProfile));
        setProfile(newProfile);
        return newProfile;
      }
    } catch (error) {
      console.error('Ошибка загрузки демо-профиля:', error);
      setProfile(DEFAULT_DEMO_PROFILE);
      return DEFAULT_DEMO_PROFILE;
    }
  }, []);

  // Сохранение профиля в localStorage
  const saveProfile = useCallback((newProfile: DemoProfile) => {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (error) {
      console.error('Ошибка сохранения демо-профиля:', error);
    }
  }, []);

  // Обновление профиля
  const updateProfile = useCallback((updates: Partial<DemoProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Обработка клика
  const handleClick = useCallback(() => {
    if (!profile) return null;

    const baseXp = 0.5;
    const baseCrystals = 1;
    const levelMultiplier = 1 + (profile.level - 1) * 0.1;
    
    const xpEarned = baseXp * levelMultiplier;
    const crystalsEarned = Math.floor(baseCrystals * levelMultiplier);
    
    const newXp = profile.xp + xpEarned;
    const xpForNext = Math.floor(150 * Math.pow(1.4, profile.level - 1));
    
    let newLevel = profile.level;
    let finalXp = newXp;
    let leveledUp = false;
    
    if (newXp >= xpForNext) {
      newLevel++;
      finalXp = newXp - xpForNext;
      leveledUp = true;
    }
    
    const updated: DemoProfile = {
      ...profile,
      crystals: profile.crystals + crystalsEarned,
      xp: finalXp,
      level: newLevel,
      total_clicks: profile.total_clicks + 1,
      total_crystals_earned: profile.total_crystals_earned + crystalsEarned,
    };
    
    saveProfile(updated);
    
    return {
      crystals: updated.crystals,
      xp: updated.xp,
      level: updated.level,
      xpForNext: Math.floor(150 * Math.pow(1.4, newLevel - 1)),
      crystalsEarned,
      xpEarned,
      leveledUp,
      newAccessory: null,
    };
  }, [profile, saveProfile]);

  // Получение сундука
  const claimChest = useCallback(() => {
    if (!profile) return null;

    const now = new Date();
    const lastClaim = profile.last_chest_claim ? new Date(profile.last_chest_claim) : null;
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    if (lastClaim) {
      const lastClaimUTC = new Date(Date.UTC(lastClaim.getUTCFullYear(), lastClaim.getUTCMonth(), lastClaim.getUTCDate()));
      if (lastClaimUTC.getTime() >= todayUTC.getTime()) {
        return null; // Уже получал сегодня
      }
    }

    const streakMultiplier = 1 + Math.min(profile.streak_days, 30) * 0.05;
    const crystalsEarned = Math.floor((50 + Math.random() * 100) * streakMultiplier);
    const stonesEarned = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0;
    const newStreak = profile.streak_days + 1;
    
    const updated: DemoProfile = {
      ...profile,
      crystals: profile.crystals + crystalsEarned,
      stones: profile.stones + stonesEarned,
      streak_days: newStreak,
      last_chest_claim: now.toISOString(),
      last_streak_date: now.toISOString(),
    };
    
    saveProfile(updated);
    
    return {
      crystalsEarned,
      stonesEarned,
      streakDays: newStreak,
      streakMilestone: newStreak % 7 === 0 ? newStreak : null,
    };
  }, [profile, saveProfile]);

  // Проверка возможности получения сундука
  const canClaimChest = useCallback(() => {
    if (!profile?.last_chest_claim) return true;
    
    const now = new Date();
    const lastClaim = new Date(profile.last_chest_claim);
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const lastClaimUTC = new Date(Date.UTC(lastClaim.getUTCFullYear(), lastClaim.getUTCMonth(), lastClaim.getUTCDate()));
    
    return lastClaimUTC.getTime() < todayUTC.getTime();
  }, [profile]);

  // Время до следующего сундука
  const timeUntilChest = useCallback(() => {
    if (canClaimChest()) return 'Доступен!';
    
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const ms = tomorrow.getTime() - now.getTime();
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}ч ${minutes}м`;
  }, [canClaimChest]);

  // XP для следующего уровня
  const xpForNextLevel = useCallback((level: number) => {
    return Math.floor(150 * Math.pow(1.4, level - 1));
  }, []);

  // Сброс прогресса
  const resetProgress = useCallback(() => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    loadProfile();
  }, [loadProfile]);

  // Инициализация
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    isDemo,
    setIsDemo,
    loadProfile,
    updateProfile,
    handleClick,
    claimChest,
    canClaimChest,
    timeUntilChest,
    xpForNextLevel,
    resetProgress,
  };
}
