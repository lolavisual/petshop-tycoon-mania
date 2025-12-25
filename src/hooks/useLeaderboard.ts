import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  id: string;
  username: string | null;
  first_name: string | null;
  level: number;
  crystals: number;
  avatar_variant: number;
}

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, first_name, level, crystals, avatar_variant')
        .eq('is_banned', false)
        .order('level', { ascending: false })
        .order('crystals', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      
      setLeaderboard(data || []);
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
    loading,
    error,
    refreshLeaderboard: loadLeaderboard,
  };
};
