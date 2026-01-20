import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Trophy, X, Sparkles } from 'lucide-react';
import Confetti from './Confetti';

interface Achievement {
  id: string;
  name: string;
  name_ru: string;
  description: string | null;
  description_ru: string | null;
  icon: string;
  reward_crystals: number;
  reward_diamonds: number;
}

interface AchievementUnlockOverlayProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementUnlockOverlay = ({ achievement, onClose }: AchievementUnlockOverlayProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (achievement) {
      setShowConfetti(true);
      // Автозакрытие через 5 секунд
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Confetti */}
          <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

          {/* Content */}
          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -50, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-amber-500/30 to-yellow-500/30 rounded-3xl blur-2xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Card */}
            <div className="relative glass-card-premium rounded-3xl p-6 border-2 border-yellow-500/50 overflow-hidden">
              {/* Animated background particles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0.3, 0.7, 0.3],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  >
                    {['✨', '⭐', '🌟', '💫'][Math.floor(Math.random() * 4)]}
                  </motion.div>
                ))}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Trophy icon */}
              <motion.div
                className="relative flex justify-center mb-4"
                initial={{ rotate: 0, scale: 0 }}
                animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <motion.div
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/50"
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(251, 191, 36, 0.5)',
                      '0 0 40px rgba(251, 191, 36, 0.8)',
                      '0 0 20px rgba(251, 191, 36, 0.5)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="text-5xl">{achievement.icon}</span>
                </motion.div>
                
                {/* Floating sparkles around trophy */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-2xl"
                    style={{
                      top: '50%',
                      left: '50%',
                    }}
                    animate={{
                      x: Math.cos((i * 60) * Math.PI / 180) * 60,
                      y: Math.sin((i * 60) * Math.PI / 180) * 60,
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    ⭐
                  </motion.div>
                ))}
              </motion.div>

              {/* Title */}
              <motion.div
                className="text-center mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-sm mb-3"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Trophy className="w-4 h-4" />
                  ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО!
                </motion.div>
                
                <h2 className="text-2xl font-black text-gradient-primary mb-2">
                  {achievement.name_ru}
                </h2>
                
                <p className="text-muted-foreground text-sm">
                  {achievement.description_ru || achievement.description}
                </p>
              </motion.div>

              {/* Rewards */}
              <motion.div
                className="flex justify-center gap-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
              >
                {achievement.reward_crystals > 0 && (
                  <motion.div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="text-2xl">💎</span>
                    <span className="font-bold text-cyan-400">+{achievement.reward_crystals}</span>
                  </motion.div>
                )}
                
                {achievement.reward_diamonds > 0 && (
                  <motion.div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  >
                    <span className="text-2xl">💠</span>
                    <span className="font-bold text-purple-400">+{achievement.reward_diamonds}</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Tap to close hint */}
              <motion.p
                className="text-center text-xs text-muted-foreground mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                Нажмите чтобы закрыть
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementUnlockOverlay;