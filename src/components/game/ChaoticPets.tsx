import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticImpact } from '@/lib/telegram';
import { useSoundEffects } from '@/hooks/useSoundEffects';

// Редкости питомцев
type PetRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface PetType {
  emoji: string;
  name: string;
  rarity: PetRarity;
  value: number; // множитель кристаллов
}

// Список питомцев с редкостью и ценностью
const PET_TYPES: PetType[] = [
  // Common (60% шанс) - x1
  { emoji: '🐱', name: 'Кошка', rarity: 'common', value: 1 },
  { emoji: '🐶', name: 'Собачка', rarity: 'common', value: 1 },
  { emoji: '🐹', name: 'Хомяк', rarity: 'common', value: 1 },
  { emoji: '🐰', name: 'Кролик', rarity: 'common', value: 1 },
  { emoji: '🐸', name: 'Лягушка', rarity: 'common', value: 1 },
  { emoji: '🐦', name: 'Птичка', rarity: 'common', value: 1 },
  // Rare (25% шанс) - x2
  { emoji: '🦝', name: 'Хорёк', rarity: 'rare', value: 2 },
  { emoji: '🦜', name: 'Попугай', rarity: 'rare', value: 2 },
  { emoji: '🐢', name: 'Черепаха', rarity: 'rare', value: 2 },
  { emoji: '🦔', name: 'Ёжик', rarity: 'rare', value: 2 },
  // Epic (12% шанс) - x5
  { emoji: '🦊', name: 'Лиса', rarity: 'epic', value: 5 },
  { emoji: '🐼', name: 'Панда', rarity: 'epic', value: 5 },
  { emoji: '🦉', name: 'Сова', rarity: 'epic', value: 5 },
  // Legendary (3% шанс) - x10
  { emoji: '🦄', name: 'Единорог', rarity: 'legendary', value: 10 },
  { emoji: '🐉', name: 'Дракон', rarity: 'legendary', value: 10 },
];

// Получить питомца по редкости с весами
const getRandomPet = (): PetType => {
  const roll = Math.random() * 100;
  let rarity: PetRarity;
  
  if (roll < 3) {
    rarity = 'legendary';
  } else if (roll < 15) {
    rarity = 'epic';
  } else if (roll < 40) {
    rarity = 'rare';
  } else {
    rarity = 'common';
  }
  
  const petsOfRarity = PET_TYPES.filter(p => p.rarity === rarity);
  return petsOfRarity[Math.floor(Math.random() * petsOfRarity.length)];
};

interface FloatingPet {
  id: number;
  x: number;
  y: number;
  pet: PetType;
  size: number;
  duration: number;
  delay: number;
}

interface CrystalEffect {
  id: number;
  x: number;
  y: number;
  value: number;
  rarity: PetRarity;
}

interface ChaoticPetsProps {
  onTap: (value: number, rarity: PetRarity, streakBonus: number) => Promise<void>;
  comboCount: number;
}

// Цвета по редкости
const RARITY_COLORS: Record<PetRarity, { glow: string; bg: string; text: string }> = {
  common: { glow: 'rgba(156, 163, 175, 0.4)', bg: 'bg-gray-500/20', text: 'text-gray-400' },
  rare: { glow: 'rgba(59, 130, 246, 0.6)', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  epic: { glow: 'rgba(168, 85, 247, 0.7)', bg: 'bg-purple-500/20', text: 'text-purple-400' },
  legendary: { glow: 'rgba(251, 191, 36, 0.8)', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
};

// Стрик бонусы
interface StreakBonusEffect {
  id: number;
  label: string;
}

const ChaoticPets = ({ onTap, comboCount }: ChaoticPetsProps) => {
  const [pets, setPets] = useState<FloatingPet[]>([]);
  const [crystalEffects, setCrystalEffects] = useState<CrystalEffect[]>([]);
  const [effectId, setEffectId] = useState(0);
  const [legendaryStreak, setLegendaryStreak] = useState(0);
  const [streakBonusEffect, setStreakBonusEffect] = useState<StreakBonusEffect | null>(null);
  const { playTap, playCrystal, playChest, playLevelUp } = useSoundEffects();

  // Получить бонус за стрик легендарных
  const getLegendaryStreakBonus = useCallback((streak: number) => {
    if (streak >= 5) return { multiplier: 5, label: '🔥🔥🔥🔥🔥 МЕГА БОНУС x5!' };
    if (streak >= 4) return { multiplier: 4, label: '🔥🔥🔥🔥 СУПЕР x4!' };
    if (streak >= 3) return { multiplier: 3, label: '🔥🔥🔥 БОНУС x3!' };
    if (streak >= 2) return { multiplier: 2, label: '🔥🔥 x2!' };
    return { multiplier: 1, label: '' };
  }, []);

  // Генерация случайного питомца
  const createPet = useCallback((id: number): FloatingPet => {
    const pet = getRandomPet();
    return {
      id,
      x: 10 + Math.random() * 70, // 10-80% от ширины
      y: 15 + Math.random() * 50, // 15-65% от высоты
      pet,
      size: pet.rarity === 'legendary' ? 3.5 : pet.rarity === 'epic' ? 3.2 : pet.rarity === 'rare' ? 3 : 2.5 + Math.random() * 0.5,
      duration: 3 + Math.random() * 2,
      delay: 0,
    };
  }, []);

  // Начальные питомцы и спавн новых
  useEffect(() => {
    // Начальные питомцы
    const initialPets: FloatingPet[] = [];
    for (let i = 0; i < 5; i++) {
      initialPets.push(createPet(i));
    }
    setPets(initialPets);

    // Спавн новых питомцев каждые 800мс
    const spawnInterval = setInterval(() => {
      setPets(prev => {
        // Максимум 8 питомцев одновременно
        if (prev.length >= 8) return prev;
        
        // Если питомцев мало, спавним сразу несколько
        const petsToSpawn = prev.length < 3 ? 2 : 1;
        const newPets: FloatingPet[] = [];
        
        for (let i = 0; i < petsToSpawn; i++) {
          newPets.push(createPet(Date.now() + Math.random() + i));
        }
        
        return [...prev, ...newPets].slice(0, 8);
      });
    }, 800);

    return () => clearInterval(spawnInterval);
  }, [createPet]);

  // Звук по редкости
  const playRaritySound = useCallback((rarity: PetRarity) => {
    switch (rarity) {
      case 'legendary':
        playLevelUp(); // Победный звук для легендарных
        break;
      case 'epic':
        playChest(); // Аккорд для эпических
        break;
      case 'rare':
        playCrystal(); // Звенящий для редких
        setTimeout(() => playCrystal(), 100);
        break;
      default:
        playTap(); // Обычный клик
        setTimeout(() => playCrystal(), 50);
    }
  }, [playTap, playCrystal, playChest, playLevelUp]);

  // Обработчик тапа по питомцу
  const handlePetTap = async (pet: FloatingPet, x: number, y: number) => {
    // Haptic feedback по редкости
    const hapticType = pet.pet.rarity === 'legendary' ? 'heavy' 
                     : pet.pet.rarity === 'epic' ? 'medium' 
                     : 'light';
    hapticImpact(hapticType as 'light' | 'medium' | 'heavy');
    
    // Звук по редкости
    playRaritySound(pet.pet.rarity);
    
    // Обновляем стрик легендарных
    let currentStreak = legendaryStreak;
    let streakBonus = 1;
    
    if (pet.pet.rarity === 'legendary') {
      currentStreak = legendaryStreak + 1;
      setLegendaryStreak(currentStreak);
      
      // Показываем бонус если стрик >= 2
      const bonus = getLegendaryStreakBonus(currentStreak);
      streakBonus = bonus.multiplier;
      
      if (currentStreak >= 2) {
        setStreakBonusEffect({ id: Date.now(), label: bonus.label });
        setTimeout(() => setStreakBonusEffect(null), 1500);
        
        // Дополнительные звуки для стрика
        setTimeout(() => playLevelUp(), 200);
      }
    } else {
      // Сброс стрика
      setLegendaryStreak(0);
    }
    
    // Добавляем эффект кристалла
    const newEffectId = effectId;
    setEffectId(prev => prev + 1);
    setCrystalEffects(prev => [...prev, { 
      id: newEffectId, 
      x, 
      y, 
      value: pet.pet.value * streakBonus,
      rarity: pet.pet.rarity 
    }]);
    
    // Удаляем эффект через 800мс
    setTimeout(() => {
      setCrystalEffects(prev => prev.filter(e => e.id !== newEffectId));
    }, 800);

    // Удаляем питомца
    setPets(prev => prev.filter(p => p.id !== pet.id));

    // Вызываем обработчик тапа с ценностью питомца и бонусом стрика
    await onTap(pet.pet.value, pet.pet.rarity, streakBonus);
  };

  // Цвет свечения в зависимости от комбо
  const getComboGlow = (baseGlow: string) => {
    if (comboCount >= 20) return '0 0 30px rgba(255,0,0,0.6), 0 0 50px rgba(255,100,0,0.4)';
    if (comboCount >= 15) return '0 0 25px rgba(255,100,0,0.5)';
    if (comboCount >= 10) return '0 0 20px rgba(255,200,0,0.5)';
    if (comboCount >= 5) return `0 0 15px rgba(100,200,255,0.4), 0 0 10px ${baseGlow}`;
    return `0 0 10px ${baseGlow}`;
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
          ✨ Лови питомцев! Редкие дают больше! ✨
        </span>
      </motion.div>

      {/* Стрик легендарных */}
      <AnimatePresence>
        {legendaryStreak >= 1 && (
          <motion.div
            className="absolute top-12 left-1/2 -translate-x-1/2 z-20"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
              <span>⭐</span>
              <span>ЛЕГЕНДАРНЫЙ СТРИК: {legendaryStreak}</span>
              {legendaryStreak >= 2 && <span>({getLegendaryStreakBonus(legendaryStreak).multiplier}x)</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Эффект бонуса стрика */}
      <AnimatePresence>
        {streakBonusEffect && (
          <motion.div
            key={streakBonusEffect.id}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.5, 1.5, 1], y: -50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black px-6 py-3 rounded-2xl text-lg font-black shadow-2xl">
              {streakBonusEffect.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Легенда редкости */}
      <motion.div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-xs text-gray-400 bg-background/60 px-2 py-0.5 rounded-full">x1</span>
        <span className="text-xs text-blue-400 bg-background/60 px-2 py-0.5 rounded-full">x2 💙</span>
        <span className="text-xs text-purple-400 bg-background/60 px-2 py-0.5 rounded-full">x5 💜</span>
        <span className="text-xs text-yellow-400 bg-background/60 px-2 py-0.5 rounded-full">x10 ⭐</span>
      </motion.div>

      {/* Питомцы */}
      <AnimatePresence>
        {pets.map(pet => {
          const rarityStyle = RARITY_COLORS[pet.pet.rarity];
          
          return (
            <motion.button
              key={pet.id}
              type="button"
              className="absolute cursor-pointer touch-manipulation select-none z-20"
              style={{
                left: `${pet.x}%`,
                top: `${pet.y}%`,
                fontSize: `${pet.size}rem`,
                boxShadow: getComboGlow(rarityStyle.glow),
                borderRadius: '50%',
              }}
              initial={{ scale: 0, opacity: 0, rotate: -30 }}
              animate={{
                scale: [0, 1.1, 1],
                opacity: 1,
                rotate: pet.pet.rarity === 'legendary' ? [0, 5, -5, 0] : [0, 3, -3, 0],
                y: [0, pet.pet.rarity === 'legendary' ? -15 : -10, 0, pet.pet.rarity === 'legendary' ? -8 : -5, 0],
              }}
              exit={{ 
                scale: [1, 1.5, 0],
                opacity: 0,
                rotate: pet.pet.rarity === 'legendary' ? 360 : 180,
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
                handlePetTap(pet, rect.left + rect.width / 2, rect.top);
              }}
            >
              <span className="drop-shadow-lg relative">
                {pet.pet.emoji}
                {/* Индикатор редкости */}
                {pet.pet.rarity !== 'common' && (
                  <motion.span
                    className="absolute -top-1 -right-1 text-sm"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {pet.pet.rarity === 'legendary' ? '⭐' : pet.pet.rarity === 'epic' ? '💜' : '💙'}
                  </motion.span>
                )}
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Эффекты кристаллов с показом ценности */}
      <AnimatePresence>
        {crystalEffects.map(effect => {
          const isRare = effect.rarity !== 'common';
          
          return (
            <motion.div
              key={effect.id}
              className="fixed pointer-events-none z-30 flex flex-col items-center"
              style={{ left: effect.x, top: effect.y }}
              initial={{ opacity: 1, y: 0, scale: 0.5 }}
              animate={{ opacity: 0, y: -100, scale: isRare ? 1.5 : 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: isRare ? 0.8 : 0.6 }}
            >
              <span className={`text-3xl ${isRare ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : ''}`}>
                💎
              </span>
              <motion.span
                className={`text-sm font-bold ${RARITY_COLORS[effect.rarity].text}`}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.3 }}
              >
                x{effect.value}
              </motion.span>
              
              {/* Дополнительные эффекты для редких */}
              {effect.rarity === 'legendary' && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute text-xl"
                      initial={{ opacity: 1, x: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        x: Math.cos(i * 72 * Math.PI / 180) * 60,
                        y: Math.sin(i * 72 * Math.PI / 180) * 60 - 30,
                      }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    >
                      ⭐
                    </motion.span>
                  ))}
                </>
              )}
              
              {effect.rarity === 'epic' && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute text-lg"
                      initial={{ opacity: 1, x: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        x: Math.cos((i * 120 + 60) * Math.PI / 180) * 40,
                        y: Math.sin((i * 120 + 60) * Math.PI / 180) * 40 - 20,
                      }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                    >
                      💜
                    </motion.span>
                  ))}
                </>
              )}
            </motion.div>
          );
        })}
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