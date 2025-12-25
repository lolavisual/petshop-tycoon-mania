import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DailyQuest {
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
}

interface UserDailyQuest {
  id: string;
  user_id: string;
  quest_id: string;
  quest_date: string;
  progress: number;
  is_completed: boolean;
  reward_claimed: boolean;
  quest: DailyQuest;
}

export const useDailyQuests = (userId?: string) => {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [userQuests, setUserQuests] = useState<UserDailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const { toast } = useToast();

  const loadQuests = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Load all active quests
      const { data: questsData, error: questsError } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('is_active', true);

      if (questsError) throw questsError;
      setQuests(questsData || []);

      // Load user's quest progress for today
      const today = new Date().toISOString().split('T')[0];
      const { data: userQuestsData, error: userQuestsError } = await supabase
        .from('user_daily_quests')
        .select('*, quest:daily_quests(*)')
        .eq('user_id', userId)
        .eq('quest_date', today);

      if (userQuestsError) throw userQuestsError;

      // Initialize quests that user hasn't started yet
      const existingQuestIds = new Set((userQuestsData || []).map(uq => uq.quest_id));
      const missingQuests = (questsData || []).filter(q => !existingQuestIds.has(q.id));

      if (missingQuests.length > 0) {
        const newUserQuests = missingQuests.map(q => ({
          user_id: userId,
          quest_id: q.id,
          quest_date: today,
          progress: 0,
          is_completed: false,
          reward_claimed: false,
        }));

        const { error: insertError } = await supabase
          .from('user_daily_quests')
          .insert(newUserQuests);

        if (insertError) {
          console.error('Error inserting user quests:', insertError);
        }

        // Reload user quests
        const { data: refreshedData } = await supabase
          .from('user_daily_quests')
          .select('*, quest:daily_quests(*)')
          .eq('user_id', userId)
          .eq('quest_date', today);

        setUserQuests(refreshedData as UserDailyQuest[] || []);
      } else {
        setUserQuests(userQuestsData as UserDailyQuest[] || []);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const claimReward = useCallback(async (userQuestId: string) => {
    setClaiming(userQuestId);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('quest-claim', {
        body: { userQuestId },
      });

      if (error) throw error;

      toast({
        title: "Награда получена! 🎉",
        description: `+${data.rewards.crystals} кристаллов, +${data.rewards.diamonds} алмазов, +${data.rewards.xp} XP`,
      });

      // Refresh quests
      await loadQuests();
      return data;
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось получить награду",
        variant: "destructive",
      });
      throw error;
    } finally {
      setClaiming(null);
    }
  }, [loadQuests, toast]);

  const updateQuestProgress = useCallback(async (
    requirementType: string,
    incrementBy: number = 1
  ) => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Find quests matching this requirement type
    const matchingUserQuests = userQuests.filter(
      uq => uq.quest.requirement_type === requirementType && 
            !uq.is_completed &&
            uq.quest_date === today
    );

    let questCompleted = false;
    let completedQuestName = '';

    for (const userQuest of matchingUserQuests) {
      const newProgress = Number(userQuest.progress) + incrementBy;
      const isCompleted = newProgress >= userQuest.quest.requirement_value;

      const { error } = await supabase
        .from('user_daily_quests')
        .update({
          progress: newProgress,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', userQuest.id);

      if (error) {
        console.error('Error updating quest progress:', error);
      }

      if (isCompleted && !userQuest.is_completed) {
        questCompleted = true;
        completedQuestName = userQuest.quest.name_ru;
      }
    }

    // Show notification when quest is completed
    if (questCompleted) {
      toast({
        title: "🎯 Квест выполнен!",
        description: `«${completedQuestName}» завершён! Забери награду в разделе Квесты.`,
        duration: 5000,
      });
    }

    // Refresh quests
    await loadQuests();
  }, [userId, userQuests, loadQuests, toast]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  const unclaimedCount = userQuests.filter(
    uq => uq.is_completed && !uq.reward_claimed
  ).length;

  return {
    quests,
    userQuests,
    loading,
    claiming,
    claimReward,
    updateQuestProgress,
    refreshQuests: loadQuests,
    unclaimedCount,
  };
};
