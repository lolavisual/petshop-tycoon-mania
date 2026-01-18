import { motion } from 'framer-motion';
import { useRanks } from '@/hooks/useRanks';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Shield, Sword, Sparkles } from 'lucide-react';

const rarityColors: Record<string, string> = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500',
  mythic: 'from-pink-400 to-rose-500',
};

const rarityGlows: Record<string, string> = {
  common: 'shadow-gray-400/30',
  rare: 'shadow-blue-400/40',
  epic: 'shadow-purple-400/50',
  legendary: 'shadow-yellow-400/60',
  mythic: 'shadow-pink-400/70',
};

export const RankDisplay = () => {
  const { getCurrentRank, getNextRank, getRankProgress, getEquippedTitle } = useRanks();
  
  const currentRank = getCurrentRank();
  const nextRank = getNextRank();
  const progress = getRankProgress();
  const equippedTitle = getEquippedTitle();

  if (!currentRank) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-lg"
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="relative"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${currentRank.color}40, ${currentRank.color}80)`,
              boxShadow: `0 0 20px ${currentRank.color}50`,
            }}
          >
            {currentRank.icon}
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-1 rounded-full border-2 border-dashed opacity-30"
            style={{ borderColor: currentRank.color }}
          />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg" style={{ color: currentRank.color }}>
              {currentRank.name_ru}
            </span>
            {equippedTitle && (
              <Badge
                variant="outline"
                className="text-xs"
                style={{ borderColor: equippedTitle.color, color: equippedTitle.color }}
              >
                {equippedTitle.icon} {equippedTitle.name_ru}
              </Badge>
            )}
          </div>

          {nextRank && (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>До {nextRank.name_ru}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="relative h-2">
                <Progress value={progress} className="h-full" />
                <motion.div
                  animate={{ x: [0, 100, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
