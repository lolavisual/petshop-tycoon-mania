import { motion, AnimatePresence } from 'framer-motion';
import { useAchievements } from '@/hooks/useAchievements';
import { Trophy, Gift, Check, Star, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const AchievementsPage = () => {
  const { 
    achievements, 
    isLoading, 
    getAchievementStatus, 
    getProgress, 
    claimReward,
    unlockedCount,
    totalCount 
  } = useAchievements();

  const categories = [
    { id: 'level', name: 'Уровни', icon: '🌱', color: 'from-emerald-400 to-teal-500' },
    { id: 'crystals', name: 'Кристаллы', icon: '💎', color: 'from-cyan-400 to-blue-500' },
    { id: 'streak', name: 'Стрики', icon: '🔥', color: 'from-orange-400 to-red-500' },
    { id: 'diamonds', name: 'Алмазы', icon: '💠', color: 'from-purple-400 to-pink-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="text-5xl"
        >
          🏆
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="p-4 space-y-6 pb-28"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="achievements-page"
    >
      {/* Header - Enhanced */}
      <motion.div 
        className="glass-card-premium p-5 rounded-3xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Trophy className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold">Достижения</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Star className="w-3 h-3" />
                Собирай награды!
              </p>
            </div>
          </div>
          <div className="text-right">
            <motion.div 
              className="text-3xl font-black text-gradient-primary"
              key={unlockedCount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {unlockedCount}/{totalCount}
            </motion.div>
            <div className="text-xs text-muted-foreground font-medium">Разблокировано</div>
          </div>
        </div>
        
        <div className="mt-4 relative">
          <Progress 
            value={(unlockedCount / Math.max(totalCount, 1)) * 100} 
            className="h-3"
          />
          <motion.div
            className="absolute -top-1 h-5 w-5 rounded-full bg-primary shadow-lg shadow-primary/50 flex items-center justify-center"
            style={{ left: `calc(${(unlockedCount / Math.max(totalCount, 1)) * 100}% - 10px)` }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-3 h-3 text-primary-foreground" />
          </motion.div>
        </div>
      </motion.div>

      {/* Categories */}
      {categories.map((category, categoryIndex) => {
        const categoryAchievements = achievements.filter(a => a.requirement_type === category.id);
        if (categoryAchievements.length === 0) return null;

        return (
          <motion.div 
            key={category.id} 
            className="space-y-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: categoryIndex * 0.1 + 0.2 }}
          >
            <h2 className="text-lg font-bold flex items-center gap-3 px-1">
              <motion.span 
                className="text-2xl"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: categoryIndex * 0.3 }}
              >
                {category.icon}
              </motion.span>
              <span>{category.name}</span>
              <div className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${category.color} text-white`}>
                {categoryAchievements.filter(a => getAchievementStatus(a).unlocked).length}/{categoryAchievements.length}
              </div>
            </h2>
            
            <div className="space-y-3">
              {categoryAchievements.map((achievement, index) => {
                const status = getAchievementStatus(achievement);
                const progress = getProgress(achievement);
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 + categoryIndex * 0.1 }}
                    className={`achievement-card ${
                      status.unlocked 
                        ? status.canClaim ? 'unlocked claimable' : 'unlocked'
                        : 'locked'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon with glow effect */}
                      <motion.div 
                        className={`text-4xl relative ${!status.unlocked && 'grayscale opacity-50'}`}
                        animate={status.canClaim ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {status.unlocked ? achievement.icon : '🔒'}
                        {status.canClaim && (
                          <motion.div
                            className="absolute -inset-2 rounded-full bg-primary/20 -z-10"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold truncate">{achievement.name_ru}</h3>
                          {status.unlocked && !status.canClaim && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {achievement.description_ru}
                        </p>
                        
                        {/* Progress bar for locked achievements */}
                        {!status.unlocked && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Прогресс</span>
                              <span className="font-medium">{Math.floor(progress)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full bg-gradient-to-r ${category.color}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Rewards */}
                        <div className="flex items-center gap-4 mt-3">
                          {achievement.reward_crystals > 0 && (
                            <motion.span 
                              className="flex items-center gap-1.5 text-sm font-medium"
                              whileHover={{ scale: 1.05 }}
                            >
                              <span className="text-lg">💎</span>
                              <span className="text-cyan-500">{achievement.reward_crystals}</span>
                            </motion.span>
                          )}
                          {achievement.reward_diamonds > 0 && (
                            <motion.span 
                              className="flex items-center gap-1.5 text-sm font-medium"
                              whileHover={{ scale: 1.05 }}
                            >
                              <span className="text-lg">💠</span>
                              <span className="text-purple-500">{achievement.reward_diamonds}</span>
                            </motion.span>
                          )}
                        </div>
                      </div>
                      
                      {/* Claim button */}
                      {status.unlocked && status.canClaim && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                        >
                          <Button
                            size="sm"
                            onClick={() => claimReward(achievement)}
                            className="flex-shrink-0 bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
                          >
                            <Gift className="w-4 h-4 mr-1.5" />
                            Забрать
                          </Button>
                        </motion.div>
                      )}
                      
                      {status.unlocked && !status.canClaim && (
                        <div className="text-xs text-muted-foreground flex-shrink-0 px-3 py-1.5 rounded-full bg-muted/50">
                          ✓ Получено
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default AchievementsPage;
