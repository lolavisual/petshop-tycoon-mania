import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Gift, Check, Clock, Sparkles, Gem, Zap } from 'lucide-react';
import Confetti from '@/components/Confetti';

interface DailyQuestsPageProps {
  userId?: string;
}

const DailyQuestsPage = ({ userId }: DailyQuestsPageProps) => {
  const { userQuests, loading, claiming, claimReward } = useDailyQuests(userId);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClaimReward = useCallback(async (userQuestId: string) => {
    try {
      await claimReward(userQuestId);
      setShowConfetti(true);
    } catch (error) {
      // Error handled in hook
    }
  }, [claimReward]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const completedCount = userQuests.filter(uq => uq.is_completed).length;
  const claimedCount = userQuests.filter(uq => uq.reward_claimed).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 pb-24 space-y-4"
    >
      {/* Confetti */}
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card-premium p-4 rounded-2xl"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Ежедневные квесты</h1>
            <p className="text-sm text-muted-foreground">
              Выполнено: {completedCount}/{userQuests.length}
            </p>
          </div>
        </div>
        
        <Progress 
          value={(completedCount / Math.max(userQuests.length, 1)) * 100} 
          className="h-2"
        />
      </motion.div>

      {/* Quests List */}
      <div className="space-y-3">
        {userQuests.map((userQuest, index) => {
          const quest = userQuest.quest;
          const progress = Math.min(Number(userQuest.progress), Number(quest.requirement_value));
          const progressPercent = (progress / Number(quest.requirement_value)) * 100;
          const isClaimable = userQuest.is_completed && !userQuest.reward_claimed;
          const isClaimed = userQuest.reward_claimed;
          const isClaiming = claiming === userQuest.id;

          return (
            <motion.div
              key={userQuest.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-4 rounded-xl transition-all ${
                isClaimable ? 'ring-2 ring-primary animate-pulse-glow' : ''
              } ${isClaimed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <motion.div 
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    isClaimed 
                      ? 'bg-muted' 
                      : isClaimable 
                        ? 'bg-gradient-to-br from-primary to-primary/60'
                        : 'bg-secondary'
                  }`}
                  animate={isClaimable ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {isClaimed ? <Check className="w-6 h-6 text-muted-foreground" /> : quest.icon}
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold truncate ${isClaimed ? 'line-through text-muted-foreground' : ''}`}>
                      {quest.name_ru}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {quest.description_ru}
                  </p>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className={userQuest.is_completed ? 'text-primary font-medium' : ''}>
                        {progress}/{quest.requirement_value}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {quest.reward_crystals > 0 && (
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Sparkles className="w-3 h-3" />
                        +{quest.reward_crystals}
                      </span>
                    )}
                    {quest.reward_diamonds > 0 && (
                      <span className="flex items-center gap-1 text-purple-400">
                        <Gem className="w-3 h-3" />
                        +{quest.reward_diamonds}
                      </span>
                    )}
                    {quest.reward_xp > 0 && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Zap className="w-3 h-3" />
                        +{quest.reward_xp} XP
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  {isClaimed ? (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Check className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ) : isClaimable ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaimReward(userQuest.id)}
                      disabled={isClaiming}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      {isClaiming ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Gift className="w-4 h-4" />
                      )}
                    </Button>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {userQuests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Квесты скоро появятся!</p>
        </div>
      )}

      {/* All Complete Banner */}
      {claimedCount === userQuests.length && userQuests.length > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card-premium p-6 rounded-2xl text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-4xl mb-2"
          >
            🎉
          </motion.div>
          <h3 className="font-bold text-lg">Все квесты выполнены!</h3>
          <p className="text-sm text-muted-foreground">
            Возвращайтесь завтра за новыми заданиями
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DailyQuestsPage;
