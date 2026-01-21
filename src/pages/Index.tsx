import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initTelegramWebApp, hapticImpact, isTelegramWebApp } from '@/lib/telegram';
import { useGameState } from '@/hooks/useGameState';
import { useTelegramTheme } from '@/hooks/useTelegramTheme';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { usePetCollection } from '@/hooks/usePetCollection';
import { useCaughtPetsStats } from '@/hooks/useCaughtPetsStats';
import { useSeasonalEvents } from '@/hooks/useSeasonalEvents';
import { useDailyLoginRewardsContext, isDismissedToday, setDismissedToday } from '@/contexts/DailyLoginRewardsContext';
import { usePremium } from '@/hooks/usePremium';
import { Sparkles, Gift, User, ShoppingBag, FileText, Crown, Moon, Sun, Volume2, VolumeX, Trophy, Target, BarChart3, Package, Calendar, Snowflake, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import Confetti from '@/components/Confetti';
import ShopPage from '@/components/ShopPage';
import ArticlesPage from '@/components/ArticlesPage';
import AchievementsPage from '@/components/AchievementsPage';
import DailyQuestsPage from '@/components/DailyQuestsPage';
import LeaderboardPage from '@/components/LeaderboardPage';
import ProfilePage from '@/components/ProfilePage';
import { TitlesPage } from '@/components/TitlesPage';
import { LootboxPage } from '@/components/LootboxPage';
import AchievementUnlockOverlay from '@/components/AchievementUnlockOverlay';
import { DailyLoginRewardsModal } from '@/components/DailyLoginRewardsModal';
import { SeasonalEventBanner } from '@/components/SeasonalEventBanner';
import { PremiumModal } from '@/components/PremiumModal';
import { useAchievements } from '@/hooks/useAchievements';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { useFriends } from '@/hooks/useFriends';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import FloatingParticles from '@/components/game/FloatingParticles';
import RarityEffects from '@/components/game/RarityEffects';
import ChaoticPets from '@/components/game/ChaoticPets';
import { OnboardingOverlay } from '@/components/OnboardingOverlay';
import { DemoBanner } from '@/components/DemoBanner';
// Компонент питомца с эффектами редкости
interface PetAvatarProps {
  level: number;
  avatarVariant: number;
  petType?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  petLevel?: number;
  isTapped?: boolean;
  comboCount?: number;
}

const PetAvatar = ({ level, avatarVariant, petType, rarity = 'common', petLevel = 1, isTapped = false, comboCount = 0 }: PetAvatarProps) => {
  const pets = ['🐕', '🐈', '🐹', '🐰', '🦜'];
  const petEmojis: Record<string, string> = {
    dog: '🐕', cat: '🐈', hamster: '🐹', rabbit: '🐰', parrot: '🦜',
    fox: '🦊', owl: '🦉', unicorn: '🦄', dragon: '🐉', phoenix: '🔥',
    panda: '🐼', turtle: '🐢', penguin: '🐧', wolf: '🐺', lion: '🦁'
  };
  const pet = petType ? (petEmojis[petType] || pets[avatarVariant % pets.length]) : pets[avatarVariant % pets.length];
  
  // Динамическое свечение в зависимости от комбо
  const getComboGlow = () => {
    if (comboCount >= 20) return 'drop-shadow-[0_0_40px_rgba(255,0,0,0.8)] drop-shadow-[0_0_60px_rgba(255,165,0,0.6)]';
    if (comboCount >= 15) return 'drop-shadow-[0_0_35px_rgba(255,100,0,0.7)]';
    if (comboCount >= 10) return 'drop-shadow-[0_0_30px_rgba(255,200,0,0.6)]';
    if (comboCount >= 5) return 'drop-shadow-[0_0_20px_rgba(100,200,255,0.5)]';
    return '';
  };

  const rarityGlow = {
    common: getComboGlow() || '',
    rare: getComboGlow() || 'drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    epic: getComboGlow() || 'drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]',
    legendary: getComboGlow() || 'drop-shadow-[0_0_30px_rgba(251,191,36,0.7)]'
  };

  const rarityBadge = {
    common: null,
    rare: { emoji: '💙', label: 'Редкий' },
    epic: { emoji: '💜', label: 'Эпический' },
    legendary: { emoji: '⭐', label: 'Легендарный' }
  };

  // Анимации по редкости
  const getTapAnimation = () => {
    switch (rarity) {
      case 'legendary':
        // Радужное свечение + мощный прыжок
        return {
          y: [0, -40, 0],
          scale: [1, 1.3, 0.95, 1.15, 1],
          filter: [
            'hue-rotate(0deg) brightness(1)',
            'hue-rotate(60deg) brightness(1.3)',
            'hue-rotate(120deg) brightness(1.4)',
            'hue-rotate(180deg) brightness(1.3)',
            'hue-rotate(0deg) brightness(1)',
          ],
        };
      case 'epic':
        // Пульсация + качание
        return {
          y: [0, -25, 0],
          scale: [1, 1.25, 0.9, 1.2, 1],
          rotate: [0, -15, 15, -10, 10, 0],
        };
      case 'rare':
        // Вращение
        return {
          y: [0, -20, 0],
          rotate: [0, 360],
          scale: [1, 1.15, 1],
        };
      default:
        // Обычный прыжок
        return {
          y: [0, -30, 0],
          scale: [1, 1.1, 0.95, 1],
        };
    }
  };

  const getTapTransition = (): { duration: number; ease: [number, number, number, number] } => {
    switch (rarity) {
      case 'legendary':
        return { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] };
      case 'epic':
        return { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] };
      case 'rare':
        return { duration: 0.5, ease: [0.42, 0, 0.58, 1] };
      default:
        return { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] };
    }
  };

  // Эффекты по редкости при тапе
  const getTapEffects = () => {
    switch (rarity) {
      case 'legendary':
        return ['🌟', '✨', '💫', '⭐', '🔥'];
      case 'epic':
        return ['💜', '✨', '💫', '🔮'];
      case 'rare':
        return ['💙', '✨', '💎'];
      default:
        return ['✨', '💫'];
    }
  };

  // Комбо эффекты
  const getComboEffects = () => {
    if (comboCount >= 20) return ['🔥', '💥', '⚡', '🌟', '💀'];
    if (comboCount >= 15) return ['🔥', '⚡', '💥', '🌟'];
    if (comboCount >= 10) return ['⚡', '🔥', '💫', '✨'];
    if (comboCount >= 5) return ['💫', '✨', '⭐'];
    return [];
  };

  const tapEffects = getTapEffects();
  const comboEffects = getComboEffects();
  
  return (
    <div className="relative">
      {/* Эффекты редкости */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ width: '200px', height: '200px', left: '-30px', top: '-30px' }}>
        <RarityEffects rarity={rarity} petLevel={petLevel} isActive={rarity !== 'common'} />
      </div>

      {/* Радужный ореол для легендарных */}
      {rarity === 'legendary' && isTapped && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none z-0"
          style={{
            width: '150px',
            height: '150px',
            left: '-20px',
            top: '-20px',
            background: 'conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0080, #ff0000)',
            filter: 'blur(20px)',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1.5, 2], rotate: [0, 180] }}
          transition={{ duration: 0.6 }}
        />
      )}

      {/* Декоративные элементы */}
      <motion.div 
        className="absolute -top-12 -left-8 text-2xl z-10"
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ✨
      </motion.div>
      <motion.div 
        className="absolute -top-10 -right-8 text-2xl z-10"
        animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      >
        ⭐
      </motion.div>
      
      {/* Питомец с анимациями при тапе */}
      <motion.div 
        className={`text-8xl select-none relative z-10 ${comboCount >= 5 ? getComboGlow() : rarityGlow[rarity]}`}
        animate={isTapped ? getTapAnimation() : { y: [0, -5, 0] }}
        transition={isTapped ? getTapTransition() : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {pet}
        
        {/* Эффекты при тапе по редкости */}
        <AnimatePresence>
          {isTapped && (
            <>
              {/* Центральный эффект */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <span className="text-4xl">{tapEffects[0]}</span>
              </motion.div>
              
              {/* Разлетающиеся эффекты */}
              {tapEffects.slice(1).map((effect, i) => (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: [1, 0], 
                    x: Math.cos((i * 90 + 45) * Math.PI / 180) * 50,
                    y: Math.sin((i * 90 + 45) * Math.PI / 180) * 50 - 20,
                    scale: 1,
                  }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <span className="text-xl">{effect}</span>
                </motion.div>
              ))}

              {/* Комбо эффекты */}
              {comboEffects.map((effect, i) => (
                <motion.div
                  key={`combo-${i}`}
                  className="absolute pointer-events-none"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                  animate={{ 
                    opacity: [1, 0], 
                    x: Math.cos((i * 72) * Math.PI / 180) * 70,
                    y: Math.sin((i * 72) * Math.PI / 180) * 70 - 30,
                    scale: 1.2,
                    rotate: 360,
                  }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.03 }}
                >
                  <span className="text-2xl">{effect}</span>
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Бейдж редкости */}
      {rarityBadge[rarity] && (
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-20"
          style={{
            background: rarity === 'legendary' 
              ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
              : rarity === 'epic'
                ? 'linear-gradient(135deg, #a855f7, #9333ea)'
                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            boxShadow: rarity === 'legendary' 
              ? '0 0 15px rgba(251, 191, 36, 0.5)'
              : rarity === 'epic'
                ? '0 0 15px rgba(168, 85, 247, 0.5)'
                : '0 0 15px rgba(59, 130, 246, 0.5)'
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span>{rarityBadge[rarity].emoji}</span>
          <span>{rarityBadge[rarity].label}</span>
          {petLevel > 1 && <span className="ml-1">Ур.{petLevel}</span>}
        </motion.div>
      )}
      
      {/* Декор внизу */}
      <motion.div 
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2 text-lg z-10"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span>💎</span>
        <span>✨</span>
        <span>💎</span>
      </motion.div>
    </div>
  );
};

// TapZone removed - using ChaoticPets instead

// Навигация - Enhanced
const NavBar = ({ activeTab, setActiveTab, unclaimedAchievements, unclaimedQuests, unclaimedGifts }: { activeTab: string; setActiveTab: (tab: string) => void; unclaimedAchievements: number; unclaimedQuests: number; unclaimedGifts: number }) => {
  const tabs = [
    { id: 'game', icon: Sparkles, label: 'Игра', badge: 0 },
    { id: 'shop', icon: ShoppingBag, label: 'Магазин', badge: 0 },
    { id: 'quests', icon: Target, label: 'Квесты', badge: unclaimedQuests },
    { id: 'achievements', icon: Trophy, label: 'Награды', badge: unclaimedAchievements },
    { id: 'profile', icon: User, label: 'Профиль', badge: unclaimedGifts },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient border top */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="glass-card-premium rounded-t-3xl px-2 py-3 mx-2 mb-0 safe-area-inset-bottom">
        <div className="flex justify-around items-center">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            
            return (
              <motion.button
                key={tab.id}
                type="button"
                className={`nav-button ${isActive ? 'active' : ''}`}
                onClick={() => {
                  hapticImpact('light');
                  setActiveTab(tab.id);
                }}
                whileTap={{ scale: 0.92 }}
              >
                <div className="relative">
                  <motion.div
                    animate={isActive ? { y: [0, -3, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <TabIcon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'icon-glow' : ''}`} />
                  </motion.div>
                  
                  {tab.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="notification-badge"
                    >
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </motion.span>
                  )}
                </div>
                
                <motion.span 
                  className={`text-xs font-semibold transition-all duration-300 ${isActive ? 'text-primary' : ''}`}
                  animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                >
                  {tab.label}
                </motion.span>
                
                {isActive && (
                  <motion.div
                    className="nav-indicator-pill"
                    layoutId="navPill"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

// Статистика - Enhanced
const StatsBar = ({ crystals, diamonds, level, xp, xpNext }: { crystals: number; diamonds: number; level: number; xp: number; xpNext: number }) => {
  const xpPercent = Math.min((xp / xpNext) * 100, 100);
  
  return (
    <motion.div 
      className="stats-card"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center">
        <motion.div 
          className="currency-crystal text-lg"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-2xl">💎</span>
          <span>{Math.floor(crystals).toLocaleString()}</span>
        </motion.div>
        <motion.div 
          className="currency-diamond text-lg"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-2xl">💠</span>
          <span>{Math.floor(diamonds).toLocaleString()}</span>
        </motion.div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-bold flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-5 h-5 text-accent icon-glow" />
            </motion.div>
            <span className="text-gradient-primary">Уровень {level}</span>
          </span>
          <span className="text-muted-foreground font-medium">{Math.floor(xp)}/{xpNext} XP</span>
        </div>
        <div className="progress-xp">
          <motion.div 
            className="progress-xp-fill"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Главная страница игры
const GamePage = ({ onQuestProgress }: { onQuestProgress?: (type: string, value?: number) => void }) => {
  const { profile, accessories, handleClick, claimChest, canClaimChest, timeUntilChest, xpForNextLevel } = useGameState();
  const { playTap, playCrystal, playChest, playLevelUp } = useSoundEffects();
  const { recordCatch } = useCaughtPetsStats();
  
  // Комбо система
  const [comboCount, setComboCount] = useState(0);
  const [comboTimer, setComboTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  
  // Конфетти для легендарных стриков
  const [showConfetti, setShowConfetti] = useState(false);

  // Обработчик легендарного стрика (вызывается из ChaoticPets)
  const handleStreakBonus = (streak: number) => {
    if (streak >= 3) {
      setShowConfetti(true);
      // Дополнительный звук для большого стрика
      if (streak >= 5) {
        playLevelUp();
        setTimeout(() => playLevelUp(), 300);
      }
    }
  };

  // Получение множителя комбо
  const getComboMultiplier = () => {
    if (comboCount >= 20) return 3.0;
    if (comboCount >= 15) return 2.5;
    if (comboCount >= 10) return 2.0;
    if (comboCount >= 5) return 1.5;
    return 1.0;
  };

  // Цвет множителя комбо
  const getComboColor = () => {
    if (comboCount >= 20) return 'from-red-500 to-orange-500';
    if (comboCount >= 15) return 'from-orange-500 to-yellow-500';
    if (comboCount >= 10) return 'from-yellow-500 to-green-500';
    if (comboCount >= 5) return 'from-blue-400 to-cyan-400';
    return 'from-primary to-accent';
  };

  const onTap = async (petValue: number = 1, rarity: string = 'common', streakBonus: number = 1) => {
    const now = Date.now();
    
    // Звуки теперь воспроизводятся в ChaoticPets по редкости
    
    // Комбо логика
    if (now - lastTapTime < 1000) {
      setComboCount(prev => prev + 1);
    } else {
      setComboCount(1);
    }
    setLastTapTime(now);
    
    // Сброс комбо через 1.5 секунды без тапа
    if (comboTimer) clearTimeout(comboTimer);
    const newTimer = setTimeout(() => {
      setComboCount(0);
    }, 1500);
    setComboTimer(newTimer);
    
    // Передаём множитель ценности питомца (применяется вместе с комбо на сервере)
    const result = await handleClick();
    
    // Общий множитель = редкость * стрик бонус
    const totalMultiplier = petValue * streakBonus;
    
    // Update quest progress for clicks (учитываем ценность питомца и стрик)
    onQuestProgress?.('clicks', totalMultiplier);
    
    // Update quest progress for crystals earned
    if (result?.crystalsEarned) {
      // Применяем множитель редкости и стрика к прогрессу квестов
      onQuestProgress?.('crystals_earned', result.crystalsEarned * totalMultiplier);
    }
    
    // Записываем статистику поимки по редкости и обновляем квесты ловли
    if (rarity && (rarity === 'common' || rarity === 'rare' || rarity === 'epic' || rarity === 'legendary')) {
      recordCatch(rarity as 'common' | 'rare' | 'epic' | 'legendary');
      // Обновляем квесты ловли питомцев
      onQuestProgress?.(`catch_${rarity}`, 1);
    }
  };

  const handleChestClaim = async () => {
    if (canClaimChest()) {
      playChest();
      await claimChest();
      
      // Update quest progress for chest claim
      onQuestProgress?.('chest_claim', 1);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          🐾
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="p-4 space-y-6 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Конфетти для легендарных стриков */}
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Плавающие частицы */}
      <FloatingParticles />

      <StatsBar 
        crystals={profile.crystals} 
        diamonds={profile.diamonds}
        level={profile.level}
        xp={profile.xp}
        xpNext={xpForNextLevel(profile.level)}
      />
      
      {/* Индикатор комбо */}
      <AnimatePresence>
        {comboCount >= 3 && (
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
          >
            <motion.div
              className={`px-4 py-2 rounded-2xl bg-gradient-to-r ${getComboColor()} text-white font-bold shadow-lg`}
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: comboCount >= 10 
                  ? ['0 0 20px rgba(255,200,0,0.5)', '0 0 40px rgba(255,200,0,0.8)', '0 0 20px rgba(255,200,0,0.5)']
                  : undefined
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {comboCount >= 20 ? '🔥💀🔥' : comboCount >= 15 ? '🔥⚡🔥' : comboCount >= 10 ? '⚡🔥' : comboCount >= 5 ? '🔥' : '✨'}
                </span>
                <span>COMBO x{comboCount}</span>
                <span className="text-xs opacity-80">({getComboMultiplier()}x)</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Хаотичные питомцы */}
      <ChaoticPets onTap={onTap} comboCount={comboCount} onStreakBonus={handleStreakBonus} />
      
      <div className="flex gap-2">
        <button
          type="button"
          className={`flex-1 btn-gradient-accent py-4 rounded-2xl flex items-center justify-center gap-3 touch-manipulation active:scale-[0.98] transition-transform ${!canClaimChest() ? 'opacity-50' : ''}`}
          onClick={handleChestClaim}
          disabled={!canClaimChest()}
        >
          <Gift className="w-6 h-6" />
          <span className="font-bold">
            {canClaimChest() ? 'Открыть сундук!' : `Сундук через ${timeUntilChest()}`}
          </span>
        </button>
        
        <Link to="/consultant" className="shrink-0">
          <button
            type="button"
            className="h-full px-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl flex items-center justify-center gap-2 touch-manipulation active:scale-[0.98] transition-transform"
          >
            <Bot className="w-5 h-5" />
            <span className="font-bold text-sm">AI</span>
          </button>
        </Link>
      </div>
      
      {profile.streak_days > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          🔥 Стрик: {profile.streak_days} дней
        </div>
      )}
    </motion.div>
  );
};


// Главный компонент
const Index = () => {
  const [activeTab, setActiveTab] = useState('game');
  const { loading, error, profile } = useGameState();
  const { isDark, toggleTheme } = useTelegramTheme();
  const { isMuted, toggleMute } = useSoundEffects();
  const { unclaimedCount, newlyUnlockedAchievement, dismissUnlockedAchievement } = useAchievements();
  const { unclaimedCount: unclaimedQuestsCount, updateQuestProgress } = useDailyQuests(profile?.id);
  const { unclaimedGiftsCount } = useFriends(profile?.id);
  const { activeEvent, updateProgress: updateSeasonalProgress } = useSeasonalEvents();
  const { canClaimToday, loading: dailyRewardsLoading } = useDailyLoginRewardsContext();
  
  // Демо-режим и онбординг
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [showSeasonalEvent, setShowSeasonalEvent] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const { isPremium } = usePremium();
  const isInTelegram = isTelegramWebApp();
  const isDemoMode = !isInTelegram && profile?.id === 'dev-user';

  // Показываем ежедневные награды при загрузке если можно забрать
  useEffect(() => {
    if (!loading && !dailyRewardsLoading && canClaimToday() && !isDismissedToday()) {
      // Небольшая задержка для плавности
      const timer = setTimeout(() => setShowDailyRewards(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, dailyRewardsLoading, canClaimToday]);

  const handleCloseDailyRewards = () => {
    setShowDailyRewards(false);
    // Если пользователь закрыл окно — не показываем автопопап повторно в этот день
    setDismissedToday();
  };

  useEffect(() => {
    initTelegramWebApp();
  }, []);

  if (loading) {
    return (
      <div className="parallax-bg min-h-screen flex items-center justify-center">
        <motion.div
          className="text-6xl"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🐾
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 relative ${isDemoMode ? 'pt-16' : ''}`}>
      <ParallaxBackground />
      
      {/* Achievement Unlock Overlay */}
      <AchievementUnlockOverlay 
        achievement={newlyUnlockedAchievement} 
        onClose={dismissUnlockedAchievement} 
      />
      {/* Демо баннер */}
      {isDemoMode && (
        <DemoBanner onShowOnboarding={() => setShowOnboarding(true)} />
      )}
      
      {/* Онбординг */}
      <OnboardingOverlay 
        onComplete={() => setShowOnboarding(false)} 
        forceShow={showOnboarding}
      />
      
      {/* Daily Login Rewards Modal */}
      <DailyLoginRewardsModal 
        isOpen={showDailyRewards} 
        onClose={handleCloseDailyRewards} 
      />

      {/* Seasonal Event Modal */}
      <SeasonalEventBanner 
        isOpen={showSeasonalEvent} 
        onClose={() => setShowSeasonalEvent(false)} 
      />

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremium} 
        onClose={() => setShowPremium(false)} 
      />

      <header className="p-4 flex items-center justify-between relative z-10">
        <h1 className="text-2xl font-black text-gradient-primary">PetShop Tycoon</h1>
        <div className="flex items-center gap-2">
          {/* Daily Rewards Button */}
          <motion.button
            type="button"
            onClick={() => {
              hapticImpact('light');
              setShowDailyRewards(true);
            }}
            className="relative p-2 rounded-full glass-card touch-manipulation active:scale-95"
            aria-label="Ежедневные награды"
            animate={canClaimToday() ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Calendar className={`w-5 h-5 ${canClaimToday() ? 'text-primary' : 'text-muted-foreground'}`} />
            {canClaimToday() && (
              <motion.span
                className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.button>

          {/* Seasonal Event Button */}
          {activeEvent && (
            <motion.button
              type="button"
              onClick={() => {
                hapticImpact('light');
                setShowSeasonalEvent(true);
              }}
              className="relative p-2 rounded-full glass-card touch-manipulation active:scale-95"
              style={{ boxShadow: `0 0 15px ${activeEvent.theme_color}40` }}
              aria-label="Сезонное событие"
              animate={{ 
                boxShadow: [`0 0 10px ${activeEvent.theme_color}30`, `0 0 20px ${activeEvent.theme_color}60`, `0 0 10px ${activeEvent.theme_color}30`]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-lg">{activeEvent.icon}</span>
            </motion.button>
          )}

          {/* Premium Button */}
          <motion.button
            type="button"
            onClick={() => {
              hapticImpact('light');
              setShowPremium(true);
            }}
            className={`relative p-2 rounded-full glass-card touch-manipulation active:scale-95 ${isPremium ? 'ring-2 ring-amber-500/50' : ''}`}
            aria-label="VIP Premium"
            animate={isPremium ? { 
              boxShadow: ['0 0 10px rgba(251,191,36,0.3)', '0 0 20px rgba(251,191,36,0.5)', '0 0 10px rgba(251,191,36,0.3)']
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className={`w-5 h-5 ${isPremium ? 'text-amber-400' : 'text-muted-foreground'}`} />
            {isPremium && (
              <motion.span
                className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>

          <button
            type="button"
            onClick={() => {
              hapticImpact('light');
              toggleMute();
            }}
            className="p-2 rounded-full glass-card touch-manipulation active:scale-95"
            aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Volume2 className="w-5 h-5 text-primary" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              hapticImpact('light');
              toggleTheme();
            }}
            className="p-2 rounded-full glass-card touch-manipulation active:scale-95"
            aria-label="Переключить тему"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-accent" />
            ) : (
              <Moon className="w-5 h-5 text-primary" />
            )}
          </button>
        </div>
      </header>

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'game' && <GamePage key="game" onQuestProgress={updateQuestProgress} />}
          {activeTab === 'shop' && <ShopPage key="shop" setCurrentPage={setActiveTab} />}
          {activeTab === 'quests' && <DailyQuestsPage key="quests" userId={profile?.id} />}
          {activeTab === 'achievements' && <AchievementsPage key="achievements" />}
          {activeTab === 'profile' && <ProfilePage key="profile" setCurrentPage={setActiveTab} />}
          {activeTab === 'titles' && <TitlesPage key="titles" onBack={() => setActiveTab('profile')} />}
          {activeTab === 'lootbox' && <LootboxPage key="lootbox" onBack={() => setActiveTab('shop')} />}
        </AnimatePresence>
      </main>

      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} unclaimedAchievements={unclaimedCount} unclaimedQuests={unclaimedQuestsCount} unclaimedGifts={unclaimedGiftsCount} />
    </div>
  );
};

export default Index;
