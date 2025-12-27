import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGameState } from './useGameState';
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  name: string;
  name_ru: string;
  description: string | null;
  description_ru: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  reward_crystals: number;
  reward_diamonds: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  reward_claimed: boolean;
}

export const useAchievements = () => {
  const { profile, refreshProfile } = useGameState();
  const queryClient = useQueryClient();

  // Fetch all achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });
      
      if (error) throw error;
      return data as Achievement[];
    },
  });

  // Fetch user's unlocked achievements
  const { data: userAchievements = [], isLoading: userAchievementsLoading } = useQuery({
    queryKey: ['user-achievements', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', profile.id);
      
      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!profile?.id,
  });

  // Check if user meets requirements for an achievement
  const checkAchievementRequirement = useCallback((achievement: Achievement): boolean => {
    if (!profile) return false;

    switch (achievement.requirement_type) {
      case 'level':
        return profile.level >= achievement.requirement_value;
      case 'crystals':
        return profile.crystals >= achievement.requirement_value;
      case 'diamonds':
        return profile.diamonds >= achievement.requirement_value;
      case 'streak':
        return profile.streak_days >= achievement.requirement_value;
      case 'pet_changes':
        return (profile.pet_changes || 0) >= achievement.requirement_value;
      case 'quests_completed':
        return (profile.quests_completed || 0) >= achievement.requirement_value;
      default:
        return false;
    }
  }, [profile]);

  // Unlock achievement mutation
  const unlockMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      if (!profile?.id) throw new Error('No profile');
      
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: profile.id,
          achievement_id: achievementId,
        });
      
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
    },
  });

  // Claim reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: async ({ achievementId, crystals, diamonds }: { achievementId: string; crystals: number; diamonds: number }) => {
      if (!profile?.id) throw new Error('No profile');
      
      // Update user_achievements to mark reward as claimed
      const { error: updateError } = await supabase
        .from('user_achievements')
        .update({ reward_claimed: true })
        .eq('user_id', profile.id)
        .eq('achievement_id', achievementId);
      
      if (updateError) throw updateError;

      // Add rewards to profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          crystals: profile.crystals + crystals,
          diamonds: profile.diamonds + diamonds,
        })
        .eq('id', profile.id);
      
      if (profileError) throw profileError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      refreshProfile();
      toast.success(`Награда получена! +${variables.crystals} 💎 ${variables.diamonds > 0 ? `+${variables.diamonds} 💠` : ''}`);
    },
  });

  // Check and unlock new achievements automatically
  useEffect(() => {
    if (!profile || achievements.length === 0) return;

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

    achievements.forEach(achievement => {
      if (!unlockedIds.has(achievement.id) && checkAchievementRequirement(achievement)) {
        unlockMutation.mutate(achievement.id);
        toast.success(`🏆 Достижение разблокировано: ${achievement.name_ru}!`);
      }
    });
  }, [profile?.level, profile?.crystals, profile?.diamonds, profile?.streak_days, profile?.pet_changes, profile?.quests_completed, achievements, userAchievements]);

  // Get achievement status
  const getAchievementStatus = useCallback((achievement: Achievement) => {
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
    
    if (!userAchievement) {
      return { unlocked: false, canClaim: false };
    }
    
    return {
      unlocked: true,
      canClaim: !userAchievement.reward_claimed,
      unlockedAt: userAchievement.unlocked_at,
    };
  }, [userAchievements]);

  // Get progress for an achievement
  const getProgress = useCallback((achievement: Achievement): number => {
    if (!profile) return 0;

    let current = 0;
    switch (achievement.requirement_type) {
      case 'level':
        current = profile.level;
        break;
      case 'crystals':
        current = profile.crystals;
        break;
      case 'diamonds':
        current = profile.diamonds;
        break;
      case 'streak':
        current = profile.streak_days;
        break;
      case 'pet_changes':
        current = profile.pet_changes || 0;
        break;
      case 'quests_completed':
        current = profile.quests_completed || 0;
        break;
    }

    return Math.min((current / achievement.requirement_value) * 100, 100);
  }, [profile]);

  const claimReward = useCallback((achievement: Achievement) => {
    claimRewardMutation.mutate({
      achievementId: achievement.id,
      crystals: achievement.reward_crystals,
      diamonds: achievement.reward_diamonds,
    });
  }, [claimRewardMutation]);

  // Count unclaimed rewards
  const unclaimedCount = userAchievements.filter(ua => !ua.reward_claimed).length;

  return {
    achievements,
    userAchievements,
    isLoading: achievementsLoading || userAchievementsLoading,
    getAchievementStatus,
    getProgress,
    claimReward,
    unlockedCount: userAchievements.length,
    totalCount: achievements.length,
    unclaimedCount,
  };
};
