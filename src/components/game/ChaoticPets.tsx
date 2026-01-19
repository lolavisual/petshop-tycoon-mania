import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticImpact } from '@/lib/telegram';

// Список питомцев разных типов
const PET_EMOJIS = [
  { emoji: '🐱', name: 'Кошка' },
  { emoji: '🐶', name: 'Собачка' },
  { emoji: '🦝', name: 'Хорёк' },
  { emoji: '🦜', name: 'Попугай' },
  { emoji: '🐹', name: 'Хомяк' },
  { emoji: '🐰', name: 'Кролик' },
  { emoji: '🐢', name: 'Черепаха' },
  { emoji: '🦔', name: 'Ёжик' },
  { emoji: '🐠', name: 'Рыбка' },
  { emoji: '🦎', name: 'Ящерица' },
  { emoji: '🐦', name: 'Птичка' },
  { emoji: '🦊', name: 'Лиса' },
  { emoji: '🐼', name: 'Панда' },
  { emoji: '🦉', name: 'Сова' },
  { emoji: '🐸', name: 'Лягушка' },
];

interface FloatingPet {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
  duration: number;
  delay: number;
}

interface CrystalEffect {
  id: number;
  x: number;
  y: number;
}

interface ChaoticPetsProps {
  onTap: () => Promise<void>;
  comboCount: number;
}

const ChaoticPets = ({ onTap, comboCount }: ChaoticPetsProps) => {
  const [pets, setPets] = useState<FloatingPet[]>([]);
  const [crystalEffects, setCrystalEffects] = useState<CrystalEffect[]>([]);
  const [effectId, setEffectId] = useState(0);
  const [petIdCounter, setPetIdCounter] = useState(0);

  // Генерация случайного питомца
  const spawnPet = useCallback(() => {
    const petEmoji = PET_EMOJIS[Math.floor(Math.random() * PET_EMOJIS.length)];
    const newPet: FloatingPet = {
      id: petIdCounter,
      x: 10 + Math.random() * 70, // 10-80% от ширины
      y: 15 + Math.random() * 50, // 15-65% от высоты (оставляем место сверху и снизу)
      emoji: petEmoji.emoji,
      size: 2.5 + Math.random() * 1.5, // 2.5-4rem
      duration: 3 + Math.random() * 2, // 3-5 секунд на экране
      delay: 0,
    };
    setPetIdCounter(prev => prev + 1);
    return newPet;
  }, [petIdCounter]);

  // Начальные питомцы и спавн новых
  useEffect(() => {
    // Начальные питомцы
    const initialPets: FloatingPet[] = [];
    for (let i = 0; i < 5; i++) {
      const petEmoji = PET_EMOJIS[Math.floor(Math.random() * PET_EMOJIS.length)];
      initialPets.push({
        id: i,
        x: 10 + Math.random() * 70,
        y: 15 + Math.random() * 50,
        emoji: petEmoji.emoji,
        size: 2.5 + Math.random() * 1.5,
        duration: 4 + Math.random() * 2,
        delay: i * 0.3,
      });
    }
    setPets(initialPets);
    setPetIdCounter(5);

    // Спавн новых питомцев каждые 1-2 секунды
    const spawnInterval = setInterval(() => {
      setPets(prev => {
        // Максимум 8 питомцев одновременно
        if (prev.length >= 8) return prev;
        const petEmoji = PET_EMOJIS[Math.floor(Math.random() * PET_EMOJIS.length)];
        const newPet: FloatingPet = {
          id: Date.now() + Math.random(),
          x: 10 + Math.random() * 70,
          y: 15 + Math.random() * 50,
          emoji: petEmoji.emoji,
          size: 2.5 + Math.random() * 1.5,
          duration: 4 + Math.random() * 2,
          delay: 0,
        };
        return [...prev, newPet];
      });
    }, 1500);

    return () => clearInterval(spawnInterval);
  }, []);

  // Обработчик тапа по питомцу
  const handlePetTap = async (petId: number, x: number, y: number) => {
    hapticImpact('medium');
    
    // Добавляем эффект кристалла
    const newEffectId = effectId;
    setEffectId(prev => prev + 1);
    setCrystalEffects(prev => [...prev, { id: newEffectId, x, y }]);
    
    // Удаляем эффект через 600мс
    setTimeout(() => {
      setCrystalEffects(prev => prev.filter(e => e.id !== newEffectId));
    }, 600);

    // Удаляем питомца
    setPets(prev => prev.filter(p => p.id !== petId));

    // Вызываем обработчик тапа
    await onTap();
  };

  // Цвет свечения в зависимости от комбо
  const getComboGlow = () => {
    if (comboCount >= 20) return '0 0 30px rgba(255,0,0,0.6)';
    if (comboCount >= 15) return '0 0 25px rgba(255,100,0,0.5)';
    if (comboCount >= 10) return '0 0 20px rgba(255,200,0,0.5)';
    if (comboCount >= 5) return '0 0 15px rgba(100,200,255,0.4)';
    return 'none';
  };

  return (
    <div className="relative w-full h-[50vh] min-h-[300px] overflow-hidden rounded-3xl bg-gradient-to-b from-primary/5 to-accent/5 border border-primary/10">
      {/* Фоновые декорации */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xl opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      {/* Инструкция */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded-full backdrop-blur-sm">
          ✨ Лови питомцев! ✨
        </span>
      </motion.div>

      {/* Питомцы */}
      <AnimatePresence>
        {pets.map(pet => (
          <motion.button
            key={pet.id}
            type="button"
            className="absolute cursor-pointer touch-manipulation select-none z-20"
            style={{
              left: `${pet.x}%`,
              top: `${pet.y}%`,
              fontSize: `${pet.size}rem`,
              boxShadow: getComboGlow(),
              borderRadius: '50%',
            }}
            initial={{ scale: 0, opacity: 0, rotate: -30 }}
            animate={{
              scale: [0, 1.1, 1],
              opacity: 1,
              rotate: [0, 5, -5, 0],
              y: [0, -10, 0, -5, 0],
            }}
            exit={{ 
              scale: [1, 1.3, 0],
              opacity: 0,
              rotate: 180,
            }}
            transition={{
              scale: { duration: 0.3 },
              rotate: { duration: pet.duration, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: pet.duration * 0.7, repeat: Infinity, ease: 'easeInOut' },
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              handlePetTap(pet.id, rect.left + rect.width / 2, rect.top);
            }}
          >
            <span className="drop-shadow-lg">{pet.emoji}</span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Эффекты кристаллов */}
      <AnimatePresence>
        {crystalEffects.map(effect => (
          <motion.div
            key={effect.id}
            className="fixed pointer-events-none z-30"
            style={{ left: effect.x, top: effect.y }}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -80, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-3xl">💎</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Дополнительные эффекты при высоком комбо */}
      {comboCount >= 10 && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'radial-gradient(circle at 30% 30%, rgba(255,200,0,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 70% 70%, rgba(255,200,0,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 30%, rgba(255,200,0,0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
};

export default ChaoticPets;
