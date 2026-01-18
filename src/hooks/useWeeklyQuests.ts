import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WeeklyQuest {
  id: string;
  name: string;
  name_ru: string;
  description: string | null;
  description_ru: string | null;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  reward_crystals: number;
  reward_diamonds: number;
  reward_xp: number;
  quest_type: string;
  season: string | null;
}

interface UserWeeklyQuest {
  id: string;
  user_id: string;
  quest_id: string;
  week_start: string;
  progress: number;
  is_completed: boolean;
  reward_claimed: boolean;
  quest: WeeklyQuest;
}

const getCurrentSeason = (): string => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
};

export const useWeeklyQuests = (userId?: string) => {
  const [weeklyQuests, setWeeklyQuests] = useState<WeeklyQuest[]>([]);
  const [seasonalQuests, setSeasonalQuests] = useState<WeeklyQuest[]>([]);
  const [userWeeklyQuests, setUserWeeklyQuests] = useState<UserWeeklyQuest[]>([]);
  const [userSeasonalQuests, setUserSeasonalQuests] = useState<UserWeeklyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const { toast } = useToast();

  const currentSeason = getCurrentSeason();
  const weekStart = getWeekStart();

  const loadQuests = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Load weekly quests
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('weekly_quests')
        .select('*')
        .eq('is_active', true)
        .eq('quest_type', 'weekly');

      if (weeklyError) throw weeklyError;
      setWeeklyQuests(weeklyData || []);

      // Load seasonal quests for current season
      const { data: seasonalData, error: seasonalError } = await supabase
        .from('weekly_quests')
        .select('*')
        .eq('is_active', true)
        .eq('quest_type', 'seasonal')
        .eq('season', currentSeason);

      if (seasonalError) throw seasonalError;
      setSeasonalQuests(seasonalData || []);

      // Load user's weekly quest progress
      const { data: userWeeklyData, error: userWeeklyError } = await supabase
        .from('user_weekly_quests')
        .select('*, quest:weekly_quests(*)')
        .eq('user_id', userId)
        .eq('week_start', weekStart);

      if (userWeeklyError) throw userWeeklyError;

      // Separate weekly and seasonal user quests
      const allUserQuests = (userWeeklyData || []) as UserWeeklyQuest[];
      setUserWeeklyQuests(allUserQuests.filter(uq => uq.quest?.quest_type === 'weekly'));
      setUserSeasonalQuests(allUserQuests.filter(uq => uq.quest?.quest_type === 'seasonal'));

      // Initialize missing quests
      const existingQuestIds = new Set(allUserQuests.map(uq => uq.quest_id));
      const allQuests = [...(weeklyData || []), ...(seasonalData || [])];
      const missingQuests = allQuests.filter(q => !existingQuestIds.has(q.id));

      if (missingQuests.length > 0) {
        const newUserQuests = missingQuests.map(q => ({
          user_id: userId,
          quest_id: q.id,
          week_start: weekStart,
          progress: 0,
          is_completed: false,
          reward_claimed: false,
        }));

        await supabase
          .from('user_weekly_quests')
          .insert(newUserQuests);

        // Reload after insert
        const { data: refreshedData } = await supabase
          .from('user_weekly_quests')
          .select('*, quest:weekly_quests(*)')
          .eq('user_id', userId)
          .eq('week_start', weekStart);

        const refreshedQuests = (refreshedData || []) as UserWeeklyQuest[];
        setUserWeeklyQuests(refreshedQuests.filter(uq => uq.quest?.quest_type === 'weekly'));
        setUserSeasonalQuests(refreshedQuests.filter(uq => uq.quest?.quest_type === 'seasonal'));
      }
    } catch (error) {
      console.error('Error loading weekly quests:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, currentSeason, weekStart]);

  const claimReward = useCallback(async (userQuestId: string, quest: WeeklyQuest) => {
    if (!userId) return;
    setClaiming(userQuestId);

    try {
      // Update user quest
      const { error: updateError } = await supabase
        .from('user_weekly_quests')
        .update({
          reward_claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', userQuestId);

      if (updateError) throw updateError;

      // Update user profile with rewards
      const { data: profile } = await supabase
        .from('profiles')
        .select('crystals, diamonds, xp')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            crystals: Number(profile.crystals) + Number(quest.reward_crystals),
            diamonds: Number(profile.diamonds) + Number(quest.reward_diamonds),
            xp: Number(profile.xp) + Number(quest.reward_xp),
          })
          .eq('id', userId);
      }

      toast({
        title: quest.quest_type === 'seasonal' ? '🌟 Сезонная награда!' : '📅 Недельная награда!',
        description: `+${quest.reward_crystals} кристаллов, +${quest.reward_diamonds} алмазов, +${quest.reward_xp} XP`,
      });

      await loadQuests();
    } catch (error) {
      console.error('Error claiming weekly reward:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось получить награду',
        variant: 'destructive',
      });
    } finally {
      setClaiming(null);
    }
  }, [userId, loadQuests, toast]);

  const updateQuestProgress = useCallback(async (
    requirementType: string,
    incrementBy: number = 1
  ) => {
    if (!userId) return;

    const allUserQuests = [...userWeeklyQuests, ...userSeasonalQuests];
    const matchingQuests = allUserQuests.filter(
      uq => uq.quest?.requirement_type === requirementType && !uq.is_completed
    );

    for (const userQuest of matchingQuests) {
      const newProgress = Number(userQuest.progress) + incrementBy;
      const isCompleted = newProgress >= userQuest.quest.requirement_value;

      await supabase
        .from('user_weekly_quests')
        .update({
          progress: newProgress,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', userQuest.id);

      if (isCompleted && !userQuest.is_completed) {
        const questType = userQuest.quest.quest_type === 'seasonal' ? 'сезонный' : 'еженедельный';
        toast({
          title: `🎯 ${questType.charAt(0).toUpperCase() + questType.slice(1)} квест выполнен!`,
          description: `«${userQuest.quest.name_ru}» завершён! Забери награду.`,
          duration: 5000,
        });
      }
    }

    await loadQuests();
  }, [userId, userWeeklyQuests, userSeasonalQuests, loadQuests, toast]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  const weeklyUnclaimedCount = userWeeklyQuests.filter(
    uq => uq.is_completed && !uq.reward_claimed
  ).length;

  const seasonalUnclaimedCount = userSeasonalQuests.filter(
    uq => uq.is_completed && !uq.reward_claimed
  ).length;

  return {
    weeklyQuests,
    seasonalQuests,
    userWeeklyQuests,
    userSeasonalQuests,
    loading,
    claiming,
    claimReward,
    updateQuestProgress,
    refreshQuests: loadQuests,
    weeklyUnclaimedCount,
    seasonalUnclaimedCount,
    currentSeason,
  };
};
