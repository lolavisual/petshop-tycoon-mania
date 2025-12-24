import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import PexelsPet from './PexelsPet';
import ClickEffects, { ClickEffect } from './ClickEffects';

interface EnhancedTapZoneProps {
  onTap: () => void;
  level: number;
  hasSantaHat?: boolean;
}

const EnhancedTapZone = ({ onTap, level, hasSantaHat = true }: EnhancedTapZoneProps) => {
  const [isClicking, setIsClicking] = useState(false);
  const [effects, setEffects] = useState<ClickEffect[]>([]);
  const [effectId, setEffectId] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [comboTimer, setComboTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    // Позиция клика
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Анимация клика
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 300);

    // Добавляем эффекты
    const newEffects: ClickEffect[] = [
      { id: effectId, x, y, type: 'crystal' },
      { id: effectId + 1, x, y, type: 'spark' },
      { id: effectId + 2, x, y, type: 'ring' },
    ];
    
    setEffectId(prev => prev + 3);
    setEffects(prev => [...prev, ...newEffects]);

    // Удаляем эффекты через время
    setTimeout(() => {
      setEffects(prev => prev.filter(e => !newEffects.find(ne => ne.id === e.id)));
    }, 1000);

    // Комбо система
    setComboCount(prev => prev + 1);
    
    if (comboTimer) clearTimeout(comboTimer);
    const timer = setTimeout(() => setComboCount(0), 1500);
    setComboTimer(timer);

    onTap();
  }, [effectId, onTap, comboTimer]);

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center py-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Комбо индикатор */}
      <AnimatePresence>
        {comboCount > 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <motion.div
              className="px-4 py-2 rounded-full font-bold text-white text-lg"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(${Math.min(comboCount * 10, 60)}, 100%, 50%), 
                  hsl(${Math.min(comboCount * 10 + 30, 90)}, 100%, 60%)
                )`,
                boxShadow: `0 0 20px hsl(${Math.min(comboCount * 10, 60)}, 100%, 50%, 0.5)`,
              }}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
            >
              🔥 x{comboCount} COMBO!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Зона тапа */}
      <motion.button
        type="button"
        className="relative w-72 h-72 rounded-full flex items-center justify-center cursor-pointer touch-manipulation outline-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
        }}
        whileTap={{ scale: 0.98 }}
        onClick={handleTap}
        onTouchStart={handleTap}
      >
        {/* Вращающееся кольцо */}
        <motion.div
          className="absolute inset-4 rounded-full border-2 border-dashed pointer-events-none"
          style={{ borderColor: 'hsl(var(--primary) / 0.3)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />

        {/* Второе кольцо (обратное вращение) */}
        <motion.div
          className="absolute inset-8 rounded-full border-2 border-dotted pointer-events-none"
          style={{ borderColor: 'hsl(var(--accent) / 0.2)' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />

        {/* Пульсирующий круг */}
        <motion.div
          className="absolute inset-12 rounded-full pointer-events-none"
          style={{ 
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Питомец */}
        <PexelsPet 
          isClicking={isClicking} 
          level={level} 
          hasSantaHat={hasSantaHat}
        />

        {/* Эффекты кликов */}
        <ClickEffects effects={effects} />
      </motion.button>

      {/* Подсказка */}
      <motion.p
        className="mt-4 text-sm text-muted-foreground font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        ✨ Тапай по питомцу! ✨
      </motion.p>
    </motion.div>
  );
};

export default EnhancedTapZone;
