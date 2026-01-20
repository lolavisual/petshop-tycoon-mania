import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'petshop_caught_pets_stats';

export interface CaughtPetsStats {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  totalCaught: number;
  legendaryStreak: number;
  maxLegendaryStreak: number;
  lastCaughtRarity: string | null;
}

const DEFAULT_STATS: CaughtPetsStats = {
  common: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
  totalCaught: 0,
  legendaryStreak: 0,
  maxLegendaryStreak: 0,
  lastCaughtRarity: null,
};

export const useCaughtPetsStats = () => {
  const [stats, setStats] = useState<CaughtPetsStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  // Сохранение в localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  // Записать поимку питомца
  const recordCatch = useCallback((rarity: 'common' | 'rare' | 'epic' | 'legendary') => {
    setStats(prev => {
      const newStats = { ...prev };
      
      // Увеличиваем счётчик
      newStats[rarity]++;
      newStats.totalCaught++;
      newStats.lastCaughtRarity = rarity;
      
      // Обновляем стрик легендарных
      if (rarity === 'legendary') {
        newStats.legendaryStreak++;
        if (newStats.legendaryStreak > newStats.maxLegendaryStreak) {
          newStats.maxLegendaryStreak = newStats.legendaryStreak;
        }
      } else {
        // Сброс стрика при ловле не-легендарного
        newStats.legendaryStreak = 0;
      }
      
      return newStats;
    });
  }, []);

  // Получить бонус за стрик легендарных
  const getLegendaryStreakBonus = useCallback(() => {
    if (stats.legendaryStreak >= 5) return { multiplier: 5, label: '🔥🔥🔥🔥🔥 МЕГА БОНУС x5!' };
    if (stats.legendaryStreak >= 4) return { multiplier: 4, label: '🔥🔥🔥🔥 СУПЕР БОНУС x4!' };
    if (stats.legendaryStreak >= 3) return { multiplier: 3, label: '🔥🔥🔥 БОНУС x3!' };
    if (stats.legendaryStreak >= 2) return { multiplier: 2, label: '🔥🔥 БОНУС x2!' };
    return { multiplier: 1, label: '' };
  }, [stats.legendaryStreak]);

  // Сброс статистики
  const resetStats = useCallback(() => {
    setStats(DEFAULT_STATS);
  }, []);

  return {
    stats,
    recordCatch,
    getLegendaryStreakBonus,
    resetStats,
  };
};
