import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRanks } from '@/hooks/useRanks';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Crown, Star, Sparkles, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useGameState } from '@/hooks/useGameState';
import Confetti from './Confetti';

const rarityColors: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500' },
  rare: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500' },
  epic: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500' },
  legendary: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500' },
  mythic: { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500' },
};

const rarityNames: Record<string, string> = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythic: 'Мифический',
};

interface TitlesPageProps {
  onBack: () => void;
}

export const TitlesPage = ({ onBack }: TitlesPageProps) => {
  const { profile } = useGameState();
  const { titles, userTitles, ranks, getCurrentRank, getNextRank, getRankProgress, checkTitleRequirement, unlockTitle, equipTitle, getEquippedTitle } = useRanks();
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();
  const progress = getRankProgress();
  const equippedTitle = getEquippedTitle();

  const handleUnlockTitle = async (titleId: string) => {
    await unlockTitle(titleId);
    setShowConfetti(true);
    toast.success('Титул разблокирован!');
  };

  const handleEquipTitle = async (titleId: string) => {
    await equipTitle(titleId);
    toast.success('Титул экипирован!');
  };

  const getProgress = (title: { requirement_type: string; requirement_value: number }): number => {
    if (!profile) return 0;

    let current = 0;
    switch (title.requirement_type) {
      case 'quests_completed':
        current = profile.quests_completed;
        break;
      case 'total_crystals':
        current = profile.total_crystals_earned;
        break;
      case 'total_clicks':
        current = profile.total_clicks;
        break;
      case 'pets_count':
        current = profile.pet_changes;
        break;
      case 'streak_days':
        current = profile.streak_days;
        break;
      case 'friends_count':
        current = profile.friends_count;
        break;
    }
    return Math.min(100, (current / title.requirement_value) * 100);
  };

  const filteredTitles = selectedRarity
    ? titles.filter(t => t.rarity === selectedRarity)
    : titles;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-gradient-to-b from-background to-background/95 p-4 pb-24"
    >
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">🏆 Ранги и Титулы</h1>
      </div>

      {/* Current Rank */}
      {currentRank && (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-xl mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  `0 0 20px ${currentRank.color}30`,
                  `0 0 40px ${currentRank.color}50`,
                  `0 0 20px ${currentRank.color}30`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{
                background: `linear-gradient(135deg, ${currentRank.color}40, ${currentRank.color}80)`,
              }}
            >
              {currentRank.icon}
            </motion.div>
            <div>
              <div className="text-sm text-muted-foreground">Текущий ранг</div>
              <div className="text-2xl font-bold" style={{ color: currentRank.color }}>
                {currentRank.name_ru}
              </div>
              {equippedTitle && (
                <Badge variant="outline" style={{ borderColor: equippedTitle.color, color: equippedTitle.color }}>
                  {equippedTitle.icon} {equippedTitle.name_ru}
                </Badge>
              )}
            </div>
          </div>

          {nextRank && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Прогресс до {nextRank.name_ru}</span>
                <span style={{ color: nextRank.color }}>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Уровень: {profile?.level || 1} / {nextRank.min_level}</span>
                <span>Достижения: {userTitles.length} / {nextRank.min_achievements}</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* All Ranks */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" /> Все ранги
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {ranks.map((rank, index) => {
            const isUnlocked = currentRank && ranks.indexOf(currentRank) >= index;
            return (
              <motion.div
                key={rank.id}
                whileHover={{ scale: 1.05 }}
                className={`flex-shrink-0 w-20 p-3 rounded-xl border text-center ${
                  isUnlocked
                    ? 'bg-card/80 border-border'
                    : 'bg-muted/30 border-muted opacity-50'
                }`}
              >
                <div className="text-2xl mb-1">{rank.icon}</div>
                <div className="text-xs font-medium truncate" style={{ color: isUnlocked ? rank.color : undefined }}>
                  {rank.name_ru}
                </div>
                <div className="text-[10px] text-muted-foreground">Ур. {rank.min_level}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Rarity Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={selectedRarity === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedRarity(null)}
        >
          Все
        </Button>
        {Object.entries(rarityNames).map(([key, name]) => (
          <Button
            key={key}
            variant={selectedRarity === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRarity(key)}
            className={selectedRarity === key ? rarityColors[key].bg : ''}
          >
            {name}
          </Button>
        ))}
      </div>

      {/* Titles */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Star className="h-5 w-5 text-purple-500" /> Титулы
        </h2>
        
        <AnimatePresence mode="popLayout">
          {filteredTitles.map((title, index) => {
            const isUnlocked = userTitles.some(ut => ut.title_id === title.id);
            const canUnlock = checkTitleRequirement(title) && !isUnlocked;
            const isEquipped = equippedTitle?.id === title.id;
            const progressValue = getProgress(title);
            const rarity = rarityColors[title.rarity] || rarityColors.common;

            return (
              <motion.div
                key={title.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`relative rounded-xl p-4 border ${rarity.border} ${rarity.bg} ${
                  !isUnlocked && !canUnlock ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={isUnlocked ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-3xl"
                  >
                    {title.icon}
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold" style={{ color: title.color }}>
                        {title.name_ru}
                      </span>
                      <Badge className={`${rarity.bg} ${rarity.text} text-xs`}>
                        {rarityNames[title.rarity]}
                      </Badge>
                      {isEquipped && (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" /> Активен
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {title.description_ru || title.description}
                    </p>

                    {!isUnlocked && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Прогресс</span>
                          <span>{Math.round(progressValue)}%</span>
                        </div>
                        <Progress value={progressValue} className="h-2" />
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {isUnlocked ? (
                      <Button
                        size="sm"
                        variant={isEquipped ? 'outline' : 'default'}
                        onClick={() => handleEquipTitle(title.id)}
                        disabled={isEquipped}
                      >
                        {isEquipped ? 'Активен' : 'Надеть'}
                      </Button>
                    ) : canUnlock ? (
                      <Button
                        size="sm"
                        onClick={() => handleUnlockTitle(title.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Получить
                      </Button>
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
