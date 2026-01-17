import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Gift, Check, Clock, Sparkles, Gem, Zap, Target, Flame, Star, Trophy, Crown, Swords, Heart } from 'lucide-react';
import Confetti from '@/components/Confetti';

interface DailyQuestsPageProps {
  userId?: string;
}

// Категории квестов
const QUEST_CATEGORIES = {
  clicks: { name: 'Тапы', icon: Target, color: 'from-blue-500 to-cyan-500' },
  crystals: { name: 'Кристаллы', icon: Sparkles, color: 'from-cyan-500 to-teal-500' },
  chest: { name: 'Сундуки', icon: Gift, color: 'from-amber-500 to-orange-500' },
  streak: { name: 'Стрик', icon: Flame, color: 'from-orange-500 to-red-500' },
  social: { name: 'Социальные', icon: Heart, color: 'from-pink-500 to-rose-500' },
  pets: { name: 'Питомцы', icon: Star, color: 'from-purple-500 to-violet-500' },
  other: { name: 'Прочее', icon: Crown, color: 'from-gray-500 to-slate-500' },
};

const getCategoryFromType = (type: string) => {
  if (type.includes('click') || type.includes('tap')) return 'clicks';
  if (type.includes('crystal') || type.includes('earn')) return 'crystals';
  if (type.includes('chest')) return 'chest';
  if (type.includes('streak')) return 'streak';
  if (type.includes('friend') || type.includes('gift')) return 'social';
  if (type.includes('pet') || type.includes('evolve')) return 'pets';
  return 'other';
};

// Компонент бонуса за серию
const StreakBonus = ({ completedToday, totalQuests }: { completedToday: number; totalQuests: number }) => {
  const milestones = [
    { count: 3, bonus: 50, icon: '⭐' },
    { count: 5, bonus: 100, icon: '🌟' },
    { count: totalQuests, bonus: 250, icon: '👑' },
  ];

  return (
    <div className="flex gap-2 mt-3">
      {milestones.map((milestone, idx) => {
        const achieved = completedToday >= milestone.count;
        return (
          <motion.div
            key={idx}
            className={`flex-1 p-2 rounded-lg text-center text-xs ${
              achieved
                ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                : 'bg-muted/50'
            }`}
            animate={achieved ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2, delay: idx * 0.3 }}
          >
            <div className="text-lg mb-1">{milestone.icon}</div>
            <div className={achieved ? 'text-amber-400 font-medium' : 'text-muted-foreground'}>
              {milestone.count} квестов
            </div>
            <div className={achieved ? 'text-primary' : 'text-muted-foreground'}>
              +{milestone.bonus} 💎
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Компонент карточки квеста
const QuestCard = ({ 
  userQuest, 
  index, 
  onClaim, 
  claiming 
}: { 
  userQuest: any; 
  index: number; 
  onClaim: (id: string) => void;
  claiming: string | null;
}) => {
  const quest = userQuest.quest;
  const progress = Math.min(Number(userQuest.progress), Number(quest.requirement_value));
  const progressPercent = (progress / Number(quest.requirement_value)) * 100;
  const isClaimable = userQuest.is_completed && !userQuest.reward_claimed;
  const isClaimed = userQuest.reward_claimed;
  const isClaiming = claiming === userQuest.id;
  
  const category = getCategoryFromType(quest.requirement_type);
  const categoryConfig = QUEST_CATEGORIES[category as keyof typeof QUEST_CATEGORIES];
  const CategoryIcon = categoryConfig.icon;

  // Расчет сложности квеста
  const difficulty = quest.requirement_value >= 500 ? 'hard' : quest.requirement_value >= 100 ? 'medium' : 'easy';
  const difficultyConfig = {
    easy: { label: 'Лёгкий', color: 'bg-green-500/20 text-green-400' },
    medium: { label: 'Средний', color: 'bg-amber-500/20 text-amber-400' },
    hard: { label: 'Сложный', color: 'bg-red-500/20 text-red-400' },
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card p-4 rounded-xl transition-all relative overflow-hidden ${
        isClaimable ? 'ring-2 ring-primary' : ''
      } ${isClaimed ? 'opacity-60' : ''}`}
    >
      {/* Градиентный фон для категории */}
      <div className={`absolute inset-0 bg-gradient-to-r ${categoryConfig.color} opacity-5`} />
      
      {/* Эффект свечения для доступных наград */}
      {isClaimable && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}

      <div className="flex items-start gap-3 relative">
        {/* Icon */}
        <motion.div 
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${
            isClaimed 
              ? 'from-muted to-muted' 
              : categoryConfig.color
          }`}
          animate={isClaimable ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {isClaimed ? (
            <Check className="w-6 h-6 text-muted-foreground" />
          ) : (
            <span className="drop-shadow-lg">{quest.icon}</span>
          )}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className={`font-semibold ${isClaimed ? 'line-through text-muted-foreground' : ''}`}>
              {quest.name_ru}
            </h3>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${difficultyConfig[difficulty].color}`}>
              {difficultyConfig[difficulty].label}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {quest.description_ru}
          </p>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <CategoryIcon className="w-3 h-3" />
                Прогресс
              </span>
              <span className={userQuest.is_completed ? 'text-primary font-bold' : 'font-medium'}>
                {progress.toLocaleString()}/{quest.requirement_value.toLocaleString()}
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${categoryConfig.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              {progressPercent > 0 && progressPercent < 100 && (
                <motion.div
                  className="absolute right-0 top-0 h-full w-1 bg-white/50"
                  style={{ left: `${progressPercent}%` }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              )}
            </div>
          </div>

          {/* Rewards */}
          <div className="flex items-center gap-3 mt-2">
            {quest.reward_crystals > 0 && (
              <motion.span 
                className="flex items-center gap-1 text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-3 h-3" />
                +{quest.reward_crystals.toLocaleString()}
              </motion.span>
            )}
            {quest.reward_diamonds > 0 && (
              <motion.span 
                className="flex items-center gap-1 text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full"
                whileHover={{ scale: 1.05 }}
              >
                <Gem className="w-3 h-3" />
                +{quest.reward_diamonds}
              </motion.span>
            )}
            {quest.reward_xp > 0 && (
              <motion.span 
                className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full"
                whileHover={{ scale: 1.05 }}
              >
                <Zap className="w-3 h-3" />
                +{quest.reward_xp}
              </motion.span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {isClaimed ? (
            <motion.div 
              className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Check className="w-5 h-5 text-green-400" />
            </motion.div>
          ) : isClaimable ? (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="sm"
                onClick={() => onClaim(userQuest.id)}
                disabled={isClaiming}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/30"
              >
                {isClaiming ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
              </Button>
            </motion.div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const DailyQuestsPage = ({ userId }: DailyQuestsPageProps) => {
  const { userQuests, loading, claiming, claimReward } = useDailyQuests(userId);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleClaimReward = useCallback(async (userQuestId: string) => {
    try {
      await claimReward(userQuestId);
      setShowConfetti(true);
    } catch (error) {
      // Error handled in hook
    }
  }, [claimReward]);

  // Группировка квестов по категориям
  const groupedQuests = useMemo(() => {
    const groups: Record<string, typeof userQuests> = {};
    userQuests.forEach(uq => {
      const category = getCategoryFromType(uq.quest.requirement_type);
      if (!groups[category]) groups[category] = [];
      groups[category].push(uq);
    });
    return groups;
  }, [userQuests]);

  // Фильтрация квестов
  const filteredQuests = useMemo(() => {
    if (!selectedCategory) return userQuests;
    return userQuests.filter(uq => 
      getCategoryFromType(uq.quest.requirement_type) === selectedCategory
    );
  }, [userQuests, selectedCategory]);

  // Статистика
  const stats = useMemo(() => {
    const completed = userQuests.filter(uq => uq.is_completed).length;
    const claimed = userQuests.filter(uq => uq.reward_claimed).length;
    const claimable = userQuests.filter(uq => uq.is_completed && !uq.reward_claimed).length;
    const totalRewards = userQuests.reduce((acc, uq) => ({
      crystals: acc.crystals + (uq.reward_claimed ? 0 : uq.quest.reward_crystals),
      diamonds: acc.diamonds + (uq.reward_claimed ? 0 : uq.quest.reward_diamonds),
      xp: acc.xp + (uq.reward_claimed ? 0 : uq.quest.reward_xp),
    }), { crystals: 0, diamonds: 0, xp: 0 });
    return { completed, claimed, claimable, totalRewards };
  }, [userQuests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          🎯
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 pb-24 space-y-4"
    >
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Header with Stats */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card-premium p-4 rounded-2xl"
      >
        <div className="flex items-center gap-3 mb-3">
          <motion.div 
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Target className="w-7 h-7 text-white" />
          </motion.div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Ежедневные квесты</h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Выполнено: <span className="text-primary font-bold">{stats.completed}</span>/{userQuests.length}
              </span>
              {stats.claimable > 0 && (
                <Badge className="bg-primary text-primary-foreground animate-pulse">
                  {stats.claimable} наград
                </Badge>
              )}
            </div>
          </div>
          
          {/* Claimable rewards summary */}
          {stats.claimable > 0 && (
            <div className="text-right text-xs">
              <div className="text-cyan-400">+{stats.totalRewards.crystals} 💎</div>
              <div className="text-purple-400">+{stats.totalRewards.diamonds} 💜</div>
            </div>
          )}
        </div>
        
        <Progress 
          value={(stats.completed / Math.max(userQuests.length, 1)) * 100} 
          className="h-3"
        />

        {/* Streak Bonuses */}
        <StreakBonus completedToday={stats.claimed} totalQuests={userQuests.length} />
      </motion.div>

      {/* Category Filters */}
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      >
        <Button
          size="sm"
          variant={selectedCategory === null ? 'default' : 'outline'}
          onClick={() => setSelectedCategory(null)}
          className="flex-shrink-0"
        >
          Все ({userQuests.length})
        </Button>
        {Object.entries(groupedQuests).map(([category, quests]) => {
          const config = QUEST_CATEGORIES[category as keyof typeof QUEST_CATEGORIES];
          const Icon = config.icon;
          const claimableInCategory = quests.filter(q => q.is_completed && !q.reward_claimed).length;
          
          return (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 gap-1 relative ${
                selectedCategory === category ? `bg-gradient-to-r ${config.color}` : ''
              }`}
            >
              <Icon className="w-3 h-3" />
              {config.name}
              {claimableInCategory > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center">
                  {claimableInCategory}
                </span>
              )}
            </Button>
          );
        })}
      </motion.div>

      {/* Quests List */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {filteredQuests.map((userQuest, index) => (
            <QuestCard
              key={userQuest.id}
              userQuest={userQuest}
              index={index}
              onClaim={handleClaimReward}
              claiming={claiming}
            />
          ))}
        </div>
      </AnimatePresence>

      {filteredQuests.length === 0 && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{selectedCategory ? 'Нет квестов в этой категории' : 'Квесты скоро появятся!'}</p>
        </motion.div>
      )}

      {/* All Complete Banner */}
      {stats.claimed === userQuests.length && userQuests.length > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card-premium p-6 rounded-2xl text-center relative overflow-hidden"
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-primary/10 to-purple-500/10"
            animate={{ 
              background: [
                'linear-gradient(45deg, rgba(245,158,11,0.1), rgba(139,92,246,0.1))',
                'linear-gradient(45deg, rgba(139,92,246,0.1), rgba(34,197,94,0.1))',
                'linear-gradient(45deg, rgba(34,197,94,0.1), rgba(245,158,11,0.1))',
              ]
            }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
          
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl mb-3"
          >
            🏆
          </motion.div>
          <h3 className="font-bold text-xl text-gradient-primary">Все квесты выполнены!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Возвращайтесь завтра за новыми заданиями
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1 text-cyan-400">
              <Sparkles className="w-4 h-4" />
              Заработано: {userQuests.reduce((a, q) => a + q.quest.reward_crystals, 0)}
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Zap className="w-4 h-4" />
              +{userQuests.reduce((a, q) => a + q.quest.reward_xp, 0)} XP
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DailyQuestsPage;
