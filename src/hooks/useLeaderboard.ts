import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  id: string;
  username: string | null;
  first_name: string | null;
  level: number;
  crystals: number;
  avatar_variant: number;
  caught_legendary?: number;
}

type LeaderboardType = 'level' | 'legendary';

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [legendaryLeaderboard, setLegendaryLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<LeaderboardType>('level');

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load main leaderboard (by level)
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, first_name, level, crystals, avatar_variant, caught_legendary')
        .eq('is_banned', false)
        .order('level', { ascending: false })
        .order('crystals', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setLeaderboard(data || []);

      // Load legendary leaderboard (by caught_legendary)
      const { data: legendaryData, error: legendaryError } = await supabase
        .from('profiles')
        .select('id, username, first_name, level, crystals, avatar_variant, caught_legendary')
        .eq('is_banned', false)
        .gt('caught_legendary', 0)
        .order('caught_legendary', { ascending: false })
        .limit(50);

      if (legendaryError) throw legendaryError;
      setLegendaryLeaderboard(legendaryData || []);
      
      setError(null);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Не удалось загрузить лидерборд');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return {
    leaderboard,
    legendaryLeaderboard,
    loading,
    error,
    refreshLeaderboard: loadLeaderboard,
    activeType,
    setActiveType,
  };
};
