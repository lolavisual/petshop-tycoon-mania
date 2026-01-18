import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGameState } from './useGameState';
import { useAchievements } from './useAchievements';

interface Rank {
  id: string;
  name: string;
  name_ru: string;
  min_level: number;
  min_achievements: number;
  icon: string;
  color: string;
  badge_url: string | null;
}

interface Title {
  id: string;
  name: string;
  name_ru: string;
  description: string | null;
  description_ru: string | null;
  requirement_type: string;
  requirement_value: number;
  rarity: string;
  color: string;
  icon: string;
}

interface UserTitle {
  id: string;
  user_id: string;
  title_id: string;
  unlocked_at: string;
  is_equipped: boolean;
}

export const useRanks = () => {
  const { profile } = useGameState();
  const { unlockedCount } = useAchievements();

  const { data: ranks = [] } = useQuery({
    queryKey: ['ranks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .order('min_level', { ascending: true });
      if (error) throw error;
      return data as Rank[];
    },
  });

  const { data: titles = [] } = useQuery({
    queryKey: ['titles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('requirement_value', { ascending: true });
      if (error) throw error;
      return data as Title[];
    },
  });

  const { data: userTitles = [], refetch: refetchUserTitles } = useQuery({
    queryKey: ['user-titles', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('user_titles')
        .select('*')
        .eq('user_id', profile.id);
      if (error) throw error;
      return data as UserTitle[];
    },
    enabled: !!profile?.id,
  });

  const getCurrentRank = (): Rank | null => {
    if (!profile || ranks.length === 0) return null;
    
    const eligibleRanks = ranks.filter(
      rank => profile.level >= rank.min_level && unlockedCount >= rank.min_achievements
    );
    
    return eligibleRanks.length > 0 ? eligibleRanks[eligibleRanks.length - 1] : ranks[0];
  };

  const getNextRank = (): Rank | null => {
    if (!profile || ranks.length === 0) return null;
    
    const currentRank = getCurrentRank();
    if (!currentRank) return ranks[0];
    
    const currentIndex = ranks.findIndex(r => r.id === currentRank.id);
    return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;
  };

  const getRankProgress = (): number => {
    const current = getCurrentRank();
    const next = getNextRank();
    
    if (!current || !next || !profile) return 100;
    
    const levelProgress = (profile.level - current.min_level) / (next.min_level - current.min_level);
    const achievementProgress = (unlockedCount - current.min_achievements) / (next.min_achievements - current.min_achievements);
    
    return Math.min(100, Math.max(0, ((levelProgress + achievementProgress) / 2) * 100));
  };

  const checkTitleRequirement = (title: Title): boolean => {
    if (!profile) return false;

    switch (title.requirement_type) {
      case 'quests_completed':
        return profile.quests_completed >= title.requirement_value;
      case 'total_crystals':
        return profile.total_crystals_earned >= title.requirement_value;
      case 'total_clicks':
        return profile.total_clicks >= title.requirement_value;
      case 'pets_count':
        return profile.pet_changes >= title.requirement_value;
      case 'streak_days':
        return profile.streak_days >= title.requirement_value;
      case 'friends_count':
        return profile.friends_count >= title.requirement_value;
      case 'achievements_count':
        return unlockedCount >= title.requirement_value;
      default:
        return false;
    }
  };

  const unlockTitle = async (titleId: string) => {
    if (!profile?.id) return;
    
    const { error } = await supabase
      .from('user_titles')
      .insert({ user_id: profile.id, title_id: titleId });
    
    if (!error) {
      refetchUserTitles();
    }
  };

  const equipTitle = async (titleId: string) => {
    if (!profile?.id) return;
    
    // Unequip all titles first
    await supabase
      .from('user_titles')
      .update({ is_equipped: false })
      .eq('user_id', profile.id);
    
    // Equip the selected title
    await supabase
      .from('user_titles')
      .update({ is_equipped: true })
      .eq('user_id', profile.id)
      .eq('title_id', titleId);
    
    refetchUserTitles();
  };

  const getEquippedTitle = (): Title | null => {
    const equipped = userTitles.find(ut => ut.is_equipped);
    if (!equipped) return null;
    return titles.find(t => t.id === equipped.title_id) || null;
  };

  const getAvailableTitles = (): Title[] => {
    return titles.filter(title => {
      const isUnlocked = userTitles.some(ut => ut.title_id === title.id);
      const meetsRequirement = checkTitleRequirement(title);
      return isUnlocked || meetsRequirement;
    });
  };

  return {
    ranks,
    titles,
    userTitles,
    getCurrentRank,
    getNextRank,
    getRankProgress,
    checkTitleRequirement,
    unlockTitle,
    equipTitle,
    getEquippedTitle,
    getAvailableTitles,
  };
};
