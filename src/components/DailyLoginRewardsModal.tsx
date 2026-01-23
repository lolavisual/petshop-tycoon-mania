import { motion } from 'framer-motion';
import { X, Gift, Check, Sparkles } from 'lucide-react';
import { useDailyLoginRewardsContext } from '@/contexts/DailyLoginRewardsContext';
import { Button } from '@/components/ui/button';
import { ModalPortal } from '@/components/ui/ModalPortal';

interface DailyLoginRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyLoginRewardsModal({ isOpen, onClose }: DailyLoginRewardsModalProps) {
  const { rewards, userProgress, loading, claiming, canClaimToday, claimReward } = useDailyLoginRewardsContext();

  const handleClaim = async () => {
    const result = await claimReward();
    if (result) {
      // Автоматически закрываем через 1.5 секунды после получения
      setTimeout(() => onClose(), 1500);
    }
  };

  const currentDay = userProgress?.current_day || 1;
  const canClaim = canClaimToday();

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={300}
      testId="daily-rewards-modal"
    >
      <div className="w-full max-w-md bg-gradient-to-b from-card to-card/95 rounded-3xl border border-primary/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4 text-center bg-gradient-to-b from-primary/20 to-transparent">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block text-5xl mb-2"
          >
            🎁
          </motion.div>
          <h2 className="text-2xl font-bold text-gradient-primary">
            Ежедневные награды
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Заходи каждый день за бонусами!
          </p>
          
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-50 cursor-pointer"
            type="button"
            data-testid="close-daily-rewards"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rewards Grid */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-7 gap-2">
            {rewards.map((reward) => {
              const isPast = reward.day_number < currentDay;
              const isCurrent = reward.day_number === currentDay;
              const isClaimed = isPast || (isCurrent && !canClaim);

              return (
                <motion.div
                  key={reward.id}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-1 border-2 transition-all ${
                    isCurrent && canClaim
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/30'
                      : isClaimed
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-muted bg-muted/30'
                  }`}
                  whileHover={isCurrent && canClaim ? { scale: 1.1 } : {}}
                  animate={isCurrent && canClaim ? { 
                    boxShadow: ['0 0 20px rgba(var(--primary), 0.3)', '0 0 30px rgba(var(--primary), 0.5)', '0 0 20px rgba(var(--primary), 0.3)']
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  data-testid={`reward-day-${reward.day_number}`}
                >
                  {/* Day label */}
                  <span className="text-[10px] font-bold text-muted-foreground mb-0.5">
                    Д{reward.day_number}
                  </span>

                  {/* Icon */}
                  <span className={`text-lg ${isClaimed ? 'opacity-50' : ''}`}>
                    {isClaimed ? '✓' : reward.icon}
                  </span>

                  {/* Amount */}
                  <span className={`text-[9px] font-bold ${
                    isCurrent && canClaim ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    +{reward.reward_amount}
                  </span>

                  {/* Premium badge */}
                  {reward.is_premium && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-400 rounded-full flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-2 h-2 text-white" />
                    </motion.div>
                  )}

                  {/* Current day indicator */}
                  {isCurrent && canClaim && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-primary"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Progress info */}
          <div className="text-center text-sm text-muted-foreground">
            Всего получено наград: <span className="font-bold text-primary">{userProgress?.total_claims || 0}</span>
          </div>

          {/* Claim button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleClaim();
            }}
            disabled={!canClaim || claiming || loading}
            type="button"
            data-testid="claim-reward-button"
            className={`w-full h-14 text-lg font-bold rounded-2xl transition-all relative z-50 ${
              canClaim 
                ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/30 cursor-pointer' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {claiming ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Gift className="w-6 h-6" />
              </motion.div>
            ) : canClaim ? (
              <span className="flex items-center gap-2">
                <Gift className="w-6 h-6" />
                Забрать награду дня {currentDay}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="w-6 h-6 text-green-400" />
                Получено! Приходи завтра
              </span>
            )}
          </Button>
        </div>
      </div>
    </ModalPortal>
  );
}
