import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Crown, Sparkles, Zap, Gift, Star } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { Button } from '@/components/ui/button';
import { ModalPortal } from '@/components/ui/ModalPortal';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { plans, isPremium, subscription, purchasing, purchasePremium, getDaysRemaining } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    const result = await purchasePremium(selectedPlan);
    if (result) {
      onClose();
    }
  };

  const planIcons: Record<string, string> = {
    'Weekly VIP': '⭐',
    'Monthly VIP': '👑',
    'Yearly VIP': '🐲'
  };

  const planColors: Record<string, { from: string; to: string }> = {
    'Weekly VIP': { from: 'from-blue-500', to: 'to-cyan-400' },
    'Monthly VIP': { from: 'from-purple-500', to: 'to-pink-400' },
    'Yearly VIP': { from: 'from-amber-500', to: 'to-orange-400' }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={300}
      testId="premium-modal"
      ariaLabel="VIP Premium подписка"
      ariaDescription="Ускоренный прогресс и эксклюзивные бонусы для VIP участников"
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-3xl border border-amber-500/30 shadow-2xl"
        style={{ 
          background: 'linear-gradient(180deg, rgba(251,191,36,0.15) 0%, hsl(var(--card)) 20%)'
        }}
      >
        {/* Animated stars background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-amber-400/30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${8 + Math.random() * 12}px`
              }}
              animate={{
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            >
              ⭐
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
            👑
          </motion.div>
          
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            VIP Premium
          </h2>
          
          <p className="text-sm text-muted-foreground mt-1">
            Ускоренный прогресс и эксклюзивные бонусы!
          </p>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            type="button"
            data-testid="close-premium-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status */}
        {isPremium && subscription && (
          <motion.div 
            className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">👑</div>
              <div>
                <div className="font-bold text-amber-400">Вы VIP!</div>
                <div className="text-sm text-muted-foreground">
                  Осталось {getDaysRemaining()} дней
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Benefits */}
        <div className="px-4 mb-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Преимущества VIP
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Zap className="w-4 h-4" />, text: 'x2-3 кристаллы' },
              { icon: <Gift className="w-4 h-4" />, text: 'Бонусные алмазы' },
              { icon: <Star className="w-4 h-4" />, text: 'x2-5 пассив' },
              { icon: <Crown className="w-4 h-4" />, text: 'Эксклюзив. питомцы' }
            ].map((benefit, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 p-2 rounded-xl bg-muted/50 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-amber-400">{benefit.icon}</span>
                <span>{benefit.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="px-4 pb-6 space-y-3 max-h-[35vh] overflow-y-auto">
          <h3 className="font-bold flex items-center gap-2 sticky top-0 bg-card/90 backdrop-blur-sm py-2 z-10">
            <Star className="w-5 h-5 text-amber-400" />
            Выберите план
          </h3>

          {plans.map((plan) => {
            const colors = planColors[plan.name] || { from: 'from-primary', to: 'to-accent' };
            const icon = planIcons[plan.name] || '⭐';
            const isSelected = selectedPlan === plan.id;
            const stonesRequired = Math.ceil(plan.stars_price / 10);

            return (
              <motion.div
                key={plan.id}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-muted hover:border-amber-500/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    className="text-4xl"
                    animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isSelected ? Infinity : 0 }}
                  >
                    {icon}
                  </motion.div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{plan.name_ru}</span>
                      {plan.name === 'Yearly VIP' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 text-black font-bold">
                          ВЫГОДНО
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {plan.description_ru || `${plan.duration_days} дней VIP статуса`}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-muted flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        x{plan.click_multiplier}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-muted flex items-center gap-1">
                        💎 +{plan.diamonds_bonus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold flex items-center gap-1">
                      <span className="text-xl">🪨</span>
                      {stonesRequired}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ≈ ⭐ {plan.stars_price}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Purchase button */}
          <Button
            onClick={handlePurchase}
            disabled={!selectedPlan || purchasing}
            className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 shadow-lg shadow-amber-500/30"
          >
            {purchasing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Crown className="w-6 h-6" />
              </motion.div>
            ) : (
              <span className="flex items-center gap-2">
                <Crown className="w-6 h-6" />
                {selectedPlan ? 'Купить VIP' : 'Выберите план'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </ModalPortal>
  );
}
