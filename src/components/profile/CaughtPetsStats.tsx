import { motion } from 'framer-motion';
import { useCaughtPetsStats } from '@/hooks/useCaughtPetsStats';
import { Trophy, Star, Sparkles, Flame } from 'lucide-react';

const CaughtPetsStats = () => {
  const { stats } = useCaughtPetsStats();
  
  const rarityData = [
    { 
      key: 'common', 
      label: 'Обычные', 
      count: stats.common, 
      emoji: '🐱', 
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      multiplier: 'x1'
    },
    { 
      key: 'rare', 
      label: 'Редкие', 
      count: stats.rare, 
      emoji: '💙', 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      multiplier: 'x2'
    },
    { 
      key: 'epic', 
      label: 'Эпические', 
      count: stats.epic, 
      emoji: '💜', 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      multiplier: 'x5'
    },
    { 
      key: 'legendary', 
      label: 'Легендарные', 
      count: stats.legendary, 
      emoji: '⭐', 
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      multiplier: 'x10'
    },
  ];

  const totalCaught = stats.totalCaught || 0;
  
  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Статистика поимки</h3>
      </div>

      {/* Общая статистика */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="font-medium">Всего поймано</span>
          </div>
          <motion.span 
            className="text-2xl font-bold text-primary"
            key={totalCaught}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {totalCaught.toLocaleString()}
          </motion.span>
        </div>
        
        {/* Рекорд стрика */}
        {stats.maxLegendaryStreak > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-muted-foreground">Макс. легендарный стрик</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-orange-400">{stats.maxLegendaryStreak}</span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
        )}
      </div>

      {/* Статистика по редкости */}
      <div className="grid grid-cols-2 gap-3">
        {rarityData.map((rarity, index) => (
          <motion.div
            key={rarity.key}
            className={`glass-card p-4 rounded-xl ${rarity.bgColor}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{rarity.emoji}</span>
              <span className={`text-sm font-medium ${rarity.color}`}>{rarity.label}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <motion.span 
                className={`text-2xl font-bold ${rarity.color}`}
                key={rarity.count}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {rarity.count.toLocaleString()}
              </motion.span>
              <span className="text-xs text-muted-foreground">{rarity.multiplier}</span>
            </div>
            
            {/* Процент от общего */}
            {totalCaught > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${rarity.key === 'common' ? 'bg-muted-foreground' : rarity.key === 'rare' ? 'bg-blue-400' : rarity.key === 'epic' ? 'bg-purple-400' : 'bg-yellow-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(rarity.count / totalCaught) * 100}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {((rarity.count / totalCaught) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Текущий стрик легендарных */}
      {stats.legendaryStreak > 0 && (
        <motion.div
          className="glass-card-premium p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🔥
              </motion.span>
              <span className="font-medium text-yellow-400">Активный легендарный стрик!</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-yellow-400">{stats.legendaryStreak}</span>
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Лови легендарных питомцев подряд для увеличения бонуса!
          </p>
        </motion.div>
      )}

      {/* Подсказка */}
      <div className="text-center text-xs text-muted-foreground">
        💡 Редкие питомцы дают больше кристаллов. Ловите легендарных подряд для бонуса до x5!
      </div>
    </div>
  );
};

export default CaughtPetsStats;
