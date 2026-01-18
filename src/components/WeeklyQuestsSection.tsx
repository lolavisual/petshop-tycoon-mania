import { motion } from 'framer-motion';
import { Calendar, Snowflake, Sun, Leaf, Flower2, Gift, Check, Loader2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useWeeklyQuests } from '@/hooks/useWeeklyQuests';
import Confetti from './Confetti';
import { useState } from 'react';

interface WeeklyQuestsSectionProps {
  userId?: string;
}

const seasonIcons: Record<string, React.ReactNode> = {
  winter: <Snowflake className="w-4 h-4" />,
  spring: <Flower2 className="w-4 h-4" />,
  summer: <Sun className="w-4 h-4" />,
  autumn: <Leaf className="w-4 h-4" />,
};

const seasonNames: Record<string, string> = {
  winter: 'Зима',
  spring: 'Весна',
  summer: 'Лето',
  autumn: 'Осень',
};

const seasonColors: Record<string, string> = {
  winter: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  spring: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  summer: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  autumn: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
};

export const WeeklyQuestsSection = ({ userId }: WeeklyQuestsSectionProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const {
    userWeeklyQuests,
    userSeasonalQuests,
    loading,
    claiming,
    claimReward,
    currentSeason,
  } = useWeeklyQuests(userId);

  const handleClaim = async (userQuestId: string, quest: any) => {
    await claimReward(userQuestId, quest);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Weekly Quests */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-lg">Еженедельные квесты</h3>
          <Badge variant="outline" className="ml-auto">
            Сброс: Понедельник
          </Badge>
        </div>

        <div className="grid gap-3">
          {userWeeklyQuests.map((userQuest) => {
            const quest = userQuest.quest;
            if (!quest) return null;

            const progress = Math.min(100, (Number(userQuest.progress) / Number(quest.requirement_value)) * 100);
            const canClaim = userQuest.is_completed && !userQuest.reward_claimed;

            return (
              <motion.div
                key={userQuest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${
                  canClaim 
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30' 
                    : userQuest.reward_claimed
                    ? 'bg-muted/30 border-border opacity-60'
                    : 'bg-card border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{quest.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{quest.name_ru}</h4>
                      {userQuest.reward_claimed && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Получено
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{quest.description_ru}</p>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{Math.floor(Number(userQuest.progress))} / {quest.requirement_value}</span>
                        <span>{Math.floor(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-cyan-400">💎 {quest.reward_crystals}</span>
                      <span className="text-purple-400">💠 {quest.reward_diamonds}</span>
                      <span className="text-yellow-400">⭐ {quest.reward_xp} XP</span>
                    </div>
                  </div>

                  {canClaim && (
                    <Button
                      size="sm"
                      onClick={() => handleClaim(userQuest.id, quest)}
                      disabled={claiming === userQuest.id}
                      className="bg-gradient-to-r from-blue-500 to-purple-500"
                    >
                      {claiming === userQuest.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Gift className="w-4 h-4 mr-1" />
                          Забрать
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Seasonal Quests */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          {seasonIcons[currentSeason]}
          <h3 className="font-bold text-lg">Сезонные квесты: {seasonNames[currentSeason]}</h3>
          <Badge variant="outline" className={`ml-auto ${seasonColors[currentSeason]?.split(' ')[0]}`}>
            <Trophy className="w-3 h-3 mr-1" />
            Повышенные награды
          </Badge>
        </div>

        <div className="grid gap-3">
          {userSeasonalQuests.map((userQuest) => {
            const quest = userQuest.quest;
            if (!quest) return null;

            const progress = Math.min(100, (Number(userQuest.progress) / Number(quest.requirement_value)) * 100);
            const canClaim = userQuest.is_completed && !userQuest.reward_claimed;

            return (
              <motion.div
                key={userQuest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${
                  seasonColors[currentSeason] || 'bg-card border-border'
                } bg-gradient-to-r ${canClaim ? 'ring-2 ring-yellow-500/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{quest.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{quest.name_ru}</h4>
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-xs">
                        Сезонный
                      </Badge>
                      {userQuest.reward_claimed && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Получено
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{quest.description_ru}</p>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{Math.floor(Number(userQuest.progress))} / {quest.requirement_value}</span>
                        <span>{Math.floor(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-sm font-medium">
                      <span className="text-cyan-400">💎 {quest.reward_crystals}</span>
                      <span className="text-purple-400">💠 {quest.reward_diamonds}</span>
                      <span className="text-yellow-400">⭐ {quest.reward_xp} XP</span>
                    </div>
                  </div>

                  {canClaim && (
                    <Button
                      onClick={() => handleClaim(userQuest.id, quest)}
                      disabled={claiming === userQuest.id}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500"
                    >
                      {claiming === userQuest.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trophy className="w-4 h-4 mr-1" />
                          Забрать
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
