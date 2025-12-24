import { motion, AnimatePresence } from 'framer-motion';

interface ClickEffect {
  id: number;
  x: number;
  y: number;
  type: 'crystal' | 'spark' | 'ring';
}

interface ClickEffectsProps {
  effects: ClickEffect[];
}

const ClickEffects = ({ effects }: ClickEffectsProps) => {
  return (
    <AnimatePresence>
      {effects.map(effect => {
        if (effect.type === 'crystal') {
          return (
            <motion.div
              key={effect.id}
              className="absolute text-3xl pointer-events-none z-30"
              style={{ left: effect.x, top: effect.y }}
              initial={{ opacity: 1, y: 0, scale: 0.5, rotate: -30 }}
              animate={{ 
                opacity: 0, 
                y: -80, 
                scale: 1.2,
                rotate: 30,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              💎
            </motion.div>
          );
        }

        if (effect.type === 'spark') {
          return (
            <motion.div
              key={effect.id}
              className="absolute pointer-events-none z-20"
              style={{ left: effect.x, top: effect.y }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: `hsl(${40 + i * 20}, 100%, 60%)`,
                    boxShadow: `0 0 6px hsl(${40 + i * 20}, 100%, 60%)`,
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * 45 * Math.PI) / 180) * 50,
                    y: Math.sin((i * 45 * Math.PI) / 180) * 50,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              ))}
            </motion.div>
          );
        }

        if (effect.type === 'ring') {
          return (
            <motion.div
              key={effect.id}
              className="absolute pointer-events-none z-10 rounded-full border-4"
              style={{ 
                left: effect.x - 30, 
                top: effect.y - 30,
                width: 60,
                height: 60,
                borderColor: 'hsl(var(--primary) / 0.6)',
              }}
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          );
        }

        return null;
      })}
    </AnimatePresence>
  );
};

export default ClickEffects;
export type { ClickEffect };
