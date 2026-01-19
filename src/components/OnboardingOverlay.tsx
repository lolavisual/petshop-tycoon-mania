import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, Trophy, Crown, ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  emoji: string;
  highlight?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'tap',
    title: 'Тапай по питомцу!',
    description: 'Нажимай на питомца, чтобы получать кристаллы 💎 и опыт. Чем выше уровень — тем больше награда!',
    icon: <Sparkles className="w-8 h-8" />,
    emoji: '👆',
    highlight: 'game',
  },
  {
    id: 'chest',
    title: 'Ежедневный сундук',
    description: 'Каждый день открывай сундук для бонусных кристаллов. Собирай стрик для увеличенных наград!',
    icon: <Gift className="w-8 h-8" />,
    emoji: '🎁',
    highlight: 'game',
  },
  {
    id: 'shop',
    title: 'Магазин питомцев',
    description: 'Покупай новых питомцев с уникальными бонусами. Редкие питомцы дают больше кристаллов!',
    icon: <ShoppingBag className="w-8 h-8" />,
    emoji: '🏪',
    highlight: 'shop',
  },
  {
    id: 'evolution',
    title: 'Эволюция питомцев',
    description: 'Твои питомцы получают опыт и прокачиваются до 10 уровня. В магазине можно выбрать активного питомца.',
    icon: <Crown className="w-8 h-8" />,
    emoji: '⬆️',
    highlight: 'shop',
  },
  {
    id: 'quests',
    title: 'Квесты и награды',
    description: 'Выполняй ежедневные и недельные квесты для кристаллов и алмазов. Не забывай забирать награды!',
    icon: <Trophy className="w-8 h-8" />,
    emoji: '🎯',
    highlight: 'quests',
  },
];

const ONBOARDING_KEY = 'petshop_onboarding_completed';

interface OnboardingOverlayProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export const OnboardingOverlay = ({ onComplete, forceShow = false }: OnboardingOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      return;
    }
    
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Небольшая задержка перед показом онбординга
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleSkip}
        />

        {/* Card */}
        <motion.div
          className="relative w-full max-w-sm glass-card-premium rounded-3xl p-6 space-y-6"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {ONBOARDING_STEPS.map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
                animate={index === currentStep ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Icon */}
          <motion.div
            key={step.id}
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary"
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(var(--primary), 0.2)',
                    '0 0 40px rgba(var(--primary), 0.4)',
                    '0 0 20px rgba(var(--primary), 0.2)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {step.icon}
              </motion.div>
              <motion.span
                className="absolute -top-2 -right-2 text-3xl"
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {step.emoji}
              </motion.span>
            </div>

            <h2 className="text-xl font-bold text-center">{step.title}</h2>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              {step.description}
            </p>
          </motion.div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1 gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 gap-2 btn-gradient-primary"
            >
              {isLastStep ? (
                <>
                  Начать игру!
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Далее
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Skip link */}
          <button
            onClick={handleSkip}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Пропустить обучение
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Хук для проверки прохождения онбординга
export const useOnboarding = () => {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(localStorage.getItem(ONBOARDING_KEY) === 'true');
  }, []);

  const reset = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setCompleted(false);
  };

  return { completed, reset };
};
