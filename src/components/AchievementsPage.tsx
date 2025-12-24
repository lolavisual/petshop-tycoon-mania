import { motion } from 'framer-motion';
import { useAchievements } from '@/hooks/useAchievements';
import { Trophy, Gift, Lock, Check } from 'lucide-react';
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
    { id: 'level', name: 'Уровни', icon: '🌱' },
    { id: 'crystals', name: 'Кристаллы', icon: '💎' },
    { id: 'streak', name: 'Стрики', icon: '🔥' },
    { id: 'diamonds', name: 'Алмазы', icon: '💠' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          🏆
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="p-4 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-accent" />
            <div>
              <h1 className="text-xl font-bold">Достижения</h1>
              <p className="text-sm text-muted-foreground">Собирай награды!</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{unlockedCount}/{totalCount}</div>
            <div className="text-xs text-muted-foreground">Разблокировано</div>
          </div>
        </div>
        <Progress 
          value={(unlockedCount / Math.max(totalCount, 1)) * 100} 
          className="mt-3 h-2"
        />
      </div>

      {/* Categories */}
      {categories.map(category => {
        const categoryAchievements = achievements.filter(a => a.requirement_type === category.id);
        if (categoryAchievements.length === 0) return null;

        return (
          <div key={category.id} className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </h2>
            
            <div className="space-y-2">
              {categoryAchievements.map((achievement, index) => {
                const status = getAchievementStatus(achievement);
                const progress = getProgress(achievement);
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`glass-card p-4 rounded-xl ${
                      status.unlocked 
                        ? 'border-2 border-primary/30' 
                        : 'opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`text-3xl ${!status.unlocked && 'grayscale'}`}>
                        {status.unlocked ? achievement.icon : '🔒'}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold truncate">{achievement.name_ru}</h3>
                          {status.unlocked && (
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description_ru}
                        </p>
                        
                        {/* Progress bar for locked achievements */}
                        {!status.unlocked && (
                          <div className="mt-2">
                            <Progress value={progress} className="h-1.5" />
                            <div className="text-xs text-muted-foreground mt-1">
                              {Math.floor(progress)}%
                            </div>
                          </div>
                        )}
                        
                        {/* Rewards */}
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          {achievement.reward_crystals > 0 && (
                            <span className="flex items-center gap-1">
                              💎 {achievement.reward_crystals}
                            </span>
                          )}
                          {achievement.reward_diamonds > 0 && (
                            <span className="flex items-center gap-1">
                              💠 {achievement.reward_diamonds}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Claim button */}
                      {status.unlocked && status.canClaim && (
                        <Button
                          size="sm"
                          onClick={() => claimReward(achievement)}
                          className="flex-shrink-0 bg-gradient-to-r from-primary to-accent"
                        >
                          <Gift className="w-4 h-4 mr-1" />
                          Забрать
                        </Button>
                      )}
                      
                      {status.unlocked && !status.canClaim && (
                        <div className="text-xs text-muted-foreground flex-shrink-0">
                          ✓ Получено
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

export default AchievementsPage;
