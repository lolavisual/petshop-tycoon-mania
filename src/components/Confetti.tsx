import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
const EMOJIS = ['🎉', '✨', '⭐', '💎', '🎊', '💫', '🌟', '💝'];

const Confetti = ({ isActive, onComplete }: ConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 0.5,
          rotation: Math.random() * 360,
          size: 8 + Math.random() * 8,
        });
      }
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {/* Emoji burst */}
          {EMOJIS.map((emoji, i) => (
            <motion.div
              key={`emoji-${i}`}
              className="absolute text-3xl"
              initial={{ 
                x: '50vw', 
                y: '50vh', 
                scale: 0, 
                opacity: 1 
              }}
              animate={{ 
                x: `${20 + Math.random() * 60}vw`,
                y: `${10 + Math.random() * 40}vh`,
                scale: [0, 1.5, 1],
                opacity: [1, 1, 0],
                rotate: [0, Math.random() * 360],
              }}
              transition={{ 
                duration: 1.5, 
                delay: i * 0.1,
                ease: 'easeOut'
              }}
            >
              {emoji}
            </motion.div>
          ))}

          {/* Confetti pieces */}
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute"
              style={{
                left: `${piece.x}%`,
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
              initial={{ 
                y: -20, 
                opacity: 1,
                rotate: 0,
                scale: 0,
              }}
              animate={{ 
                y: '100vh',
                opacity: [1, 1, 0],
                rotate: piece.rotation + 720,
                scale: [0, 1, 1, 0.5],
              }}
              transition={{ 
                duration: 2 + Math.random(),
                delay: piece.delay,
                ease: [0.23, 0.51, 0.32, 0.95],
              }}
            />
          ))}

          {/* Central burst */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 3], opacity: [1, 0] }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary/50 to-accent/50 blur-xl" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Confetti;
