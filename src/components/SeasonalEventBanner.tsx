import { motion } from 'framer-motion';
import { X, ChevronRight, Gift, Clock, Sparkles, Check, Trophy } from 'lucide-react';
import { useSeasonalEvents } from '@/hooks/useSeasonalEvents';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ModalPortal } from '@/components/ui/ModalPortal';

interface SeasonalEventBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SeasonalEventBanner({ isOpen, onClose }: SeasonalEventBannerProps) {
  const { activeEvent, rewards, userProgress, loading, claimReward, getTimeRemaining } = useSeasonalEvents();

  if (!activeEvent) return null;

  const rarityStyles: Record<string, { bg: string; border: string; text: string }> = {
    common: { bg: 'bg-slate-500/20', border: 'border-slate-400/50', text: 'text-slate-300' },
    rare: { bg: 'bg-blue-500/20', border: 'border-blue-400/50', text: 'text-blue-300' },
    epic: { bg: 'bg-purple-500/20', border: 'border-purple-400/50', text: 'text-purple-300' },
    legendary: { bg: 'bg-amber-500/20', border: 'border-amber-400/50', text: 'text-amber-300' }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={300}
      testId="seasonal-event-modal"
      ariaLabel={activeEvent.name_ru}
      ariaDescription={activeEvent.description_ru || 'Сезонное событие с особыми наградами'}
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-3xl border shadow-2xl"
        style={{ 
          background: `linear-gradient(180deg, ${activeEvent.theme_color}20 0%, hsl(var(--card)) 30%)`,
          borderColor: `${activeEvent.theme_color}40`
        }}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-xl opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -50, 0],
                opacity: [0.2, 0.5, 0.2],
                rotate: [0, 360]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            >
              {activeEvent.icon}
            </motion.div>
          ))}
        </div>

        {/* Header */}
        <div className="relative p-6 pb-4 text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block text-6xl mb-3"
          >
            {activeEvent.icon}
          </motion.div>
          
          <h2 className="text-2xl font-bold" style={{ color: activeEvent.theme_color }}>
            {activeEvent.name_ru}
          </h2>
          
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            {activeEvent.description_ru}
          </p>

          {/* Timer */}
          <motion.div 
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full"
            style={{ backgroundColor: `${activeEvent.theme_color}20` }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Clock className="w-4 h-4" style={{ color: activeEvent.theme_color }} />
            <span className="text-sm font-bold" style={{ color: activeEvent.theme_color }}>
              Осталось: {getTimeRemaining()}
            </span>
          </motion.div>

          {/* Bonus multiplier */}
          <motion.div
            className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
            style={{ 
              backgroundColor: `${activeEvent.theme_color}30`,
              color: activeEvent.theme_color
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-3 h-3" />
            x{activeEvent.bonus_multiplier} бонус
          </motion.div>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            type="button"
            data-testid="close-seasonal-event"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rewards */}
        <div className="px-4 pb-6 space-y-3 max-h-[45vh] overflow-y-auto">
          <h3 className="font-bold text-lg flex items-center gap-2 sticky top-0 bg-card/90 backdrop-blur-sm py-2 z-10">
            <Trophy className="w-5 h-5" style={{ color: activeEvent.theme_color }} />
            Награды события
          </h3>

          {rewards.map((reward) => {
            const progress = userProgress.find(p => p.reward_id === reward.id);
            const currentProgress = progress?.progress || 0;
            const progressPercent = (currentProgress / reward.requirement_value) * 100;
            const isCompleted = progress?.is_completed || false;
            const isClaimed = progress?.is_claimed || false;
            const style = rarityStyles[reward.rarity] || rarityStyles.common;

            return (
              <motion.div
                key={reward.id}
                className={`p-4 rounded-2xl border ${style.bg} ${style.border} relative overflow-hidden`}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {/* Glow effect for legendary */}
                {reward.rarity === 'legendary' && (
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `radial-gradient(circle at center, ${activeEvent.theme_color} 0%, transparent 70%)`
                    }}
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className="flex items-start gap-3 relative z-10">
                  {/* Icon */}
                  <motion.div
                    className="text-3xl"
                    animate={isCompleted && !isClaimed ? { 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {isClaimed ? '✅' : reward.icon}
                  </motion.div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold truncate">{reward.name_ru}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} capitalize`}>
                        {reward.rarity === 'common' ? 'Обычная' :
                         reward.rarity === 'rare' ? 'Редкая' :
                         reward.rarity === 'epic' ? 'Эпическая' : 'Легендарная'}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {reward.description_ru}
                    </p>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <Progress 
                        value={progressPercent} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {currentProgress} / {reward.requirement_value}
                        </span>
                        <span className="font-bold" style={{ color: activeEvent.theme_color }}>
                          +{reward.reward_amount} {
                            reward.reward_type === 'crystals' ? '💎' :
                            reward.reward_type === 'diamonds' ? '💠' :
                            reward.reward_type === 'stones' ? '🪨' : '🎁'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Claim button */}
                  {isCompleted && !isClaimed && (
                    <Button
                      onClick={() => claimReward(reward.id)}
                      size="sm"
                      className="shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${activeEvent.theme_color}, ${activeEvent.theme_color}cc)` 
                      }}
                    >
                      <Gift className="w-4 h-4" />
                    </Button>
                  )}

                  {isClaimed && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </ModalPortal>
  );
}
