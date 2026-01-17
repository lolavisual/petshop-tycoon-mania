import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface RarityEffectsProps {
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  petLevel?: number;
  isActive?: boolean;
}

const RarityEffects = ({ rarity, petLevel = 1, isActive = true }: RarityEffectsProps) => {
  const effectConfig = useMemo(() => {
    const configs: Record<string, {
      particles: number;
      aura: boolean;
      sparkle: boolean;
      glow: string;
      ring: boolean;
      ringColor?: string;
      particleColor?: string;
      secondaryRing?: boolean;
      tertiaryRing?: boolean;
      flames?: boolean;
    }> = {
      common: {
        particles: 0,
        aura: false,
        sparkle: false,
        glow: 'transparent',
        ring: false
      },
      rare: {
        particles: 3,
        aura: true,
        sparkle: true,
        glow: 'rgba(59, 130, 246, 0.3)',
        ring: true,
        ringColor: 'rgba(59, 130, 246, 0.4)',
        particleColor: '#60a5fa'
      },
      epic: {
        particles: 5,
        aura: true,
        sparkle: true,
        glow: 'rgba(168, 85, 247, 0.4)',
        ring: true,
        ringColor: 'rgba(168, 85, 247, 0.5)',
        particleColor: '#c084fc',
        secondaryRing: true
      },
      legendary: {
        particles: 8,
        aura: true,
        sparkle: true,
        glow: 'rgba(251, 191, 36, 0.5)',
        ring: true,
        ringColor: 'rgba(251, 191, 36, 0.6)',
        particleColor: '#fbbf24',
        secondaryRing: true,
        tertiaryRing: true,
        flames: true
      }
    };
    return configs[rarity] || configs.common;
  }, [rarity]);

  if (!isActive || rarity === 'common') return null;

  const particleEmojis = {
    rare: ['💎', '✨', '💙'],
    epic: ['💜', '⚡', '🔮', '✨'],
    legendary: ['⭐', '🌟', '✨', '🔥', '💫', '👑']
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-visible">
      {/* Аура */}
      {effectConfig.aura && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${effectConfig.glow} 0%, transparent 70%)`,
            transform: 'scale(1.5)'
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1.4, 1.6, 1.4]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Основное кольцо */}
      {effectConfig.ring && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: effectConfig.ringColor,
            transform: 'scale(1.3)'
          }}
          animate={{
            rotate: 360,
            scale: [1.3, 1.4, 1.3]
          }}
          transition={{
            rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }}
        />
      )}

      {/* Второе кольцо для epic и legendary */}
      {effectConfig.secondaryRing && (
        <motion.div
          className="absolute inset-0 rounded-full border border-dashed"
          style={{
            borderColor: effectConfig.ringColor,
            transform: 'scale(1.5)'
          }}
          animate={{
            rotate: -360,
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          }}
        />
      )}

      {/* Третье кольцо для legendary */}
      {effectConfig.tertiaryRing && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 30px ${effectConfig.glow}, 0 0 60px ${effectConfig.glow}`,
            transform: 'scale(1.2)'
          }}
          animate={{
            boxShadow: [
              `0 0 30px ${effectConfig.glow}, 0 0 60px ${effectConfig.glow}`,
              `0 0 50px ${effectConfig.glow}, 0 0 100px ${effectConfig.glow}`,
              `0 0 30px ${effectConfig.glow}, 0 0 60px ${effectConfig.glow}`
            ]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Огненный эффект для legendary */}
      {effectConfig.flames && (
        <AnimatePresence>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`flame-${i}`}
              className="absolute text-xl"
              style={{
                left: '50%',
                bottom: '20%',
                marginLeft: `${-40 + i * 16}px`
              }}
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={{
                y: [-10, -40, -60],
                opacity: [0.8, 0.6, 0],
                scale: [0.8, 1, 0.5],
                x: [0, (i % 2 === 0 ? 5 : -5), 0]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeOut'
              }}
            >
              🔥
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Частицы */}
      {effectConfig.particles > 0 && (
        <AnimatePresence>
          {[...Array(effectConfig.particles + Math.floor(petLevel / 2))].map((_, i) => {
            const emojis = particleEmojis[rarity] || particleEmojis.rare;
            const emoji = emojis[i % emojis.length];
            const angle = (i / (effectConfig.particles + Math.floor(petLevel / 2))) * 360;
            const radius = 80 + (i % 3) * 20;
            
            return (
              <motion.div
                key={`particle-${i}`}
                className="absolute text-lg"
                style={{
                  left: '50%',
                  top: '50%'
                }}
                animate={{
                  x: [
                    Math.cos((angle * Math.PI) / 180) * radius,
                    Math.cos(((angle + 120) * Math.PI) / 180) * radius,
                    Math.cos(((angle + 240) * Math.PI) / 180) * radius,
                    Math.cos((angle * Math.PI) / 180) * radius
                  ],
                  y: [
                    Math.sin((angle * Math.PI) / 180) * radius,
                    Math.sin(((angle + 120) * Math.PI) / 180) * radius,
                    Math.sin(((angle + 240) * Math.PI) / 180) * radius,
                    Math.sin((angle * Math.PI) / 180) * radius
                  ],
                  scale: [1, 1.2, 0.8, 1],
                  opacity: [0.8, 1, 0.6, 0.8]
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.3
                }}
              >
                {emoji}
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Искры */}
      {effectConfig.sparkle && (
        <AnimatePresence>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: effectConfig.particleColor,
                left: `${25 + i * 20}%`,
                top: `${20 + (i % 2) * 60}%`,
                boxShadow: `0 0 6px ${effectConfig.particleColor}`
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut'
              }}
            />
          ))}
        </AnimatePresence>
      )}

      {/* Уровень питомца - дополнительные звёзды */}
      {petLevel > 5 && (
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {[...Array(Math.min(petLevel - 5, 5))].map((_, i) => (
            <motion.span
              key={`star-${i}`}
              className="text-xs"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            >
              ⭐
            </motion.span>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default RarityEffects;
