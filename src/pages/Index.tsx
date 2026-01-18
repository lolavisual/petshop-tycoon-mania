import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initTelegramWebApp, hapticImpact } from '@/lib/telegram';
import { useGameState } from '@/hooks/useGameState';
import { useTelegramTheme } from '@/hooks/useTelegramTheme';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { usePetCollection } from '@/hooks/usePetCollection';
import { Sparkles, Gift, User, ShoppingBag, FileText, Crown, Moon, Sun, Volume2, VolumeX, Trophy, Target, BarChart3, Package } from 'lucide-react';
import ShopPage from '@/components/ShopPage';
import ArticlesPage from '@/components/ArticlesPage';
import AchievementsPage from '@/components/AchievementsPage';
import DailyQuestsPage from '@/components/DailyQuestsPage';
import LeaderboardPage from '@/components/LeaderboardPage';
import ProfilePage from '@/components/ProfilePage';
import { TitlesPage } from '@/components/TitlesPage';
import { LootboxPage } from '@/components/LootboxPage';
import { useAchievements } from '@/hooks/useAchievements';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { useFriends } from '@/hooks/useFriends';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import FloatingParticles from '@/components/game/FloatingParticles';
import RarityEffects from '@/components/game/RarityEffects';
// Компонент питомца с эффектами редкости
interface PetAvatarProps {
  level: number;
  avatarVariant: number;
  petType?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  petLevel?: number;
}

const PetAvatar = ({ level, avatarVariant, petType, rarity = 'common', petLevel = 1 }: PetAvatarProps) => {
  const pets = ['🐕', '🐈', '🐹', '🐰', '🦜'];
  const petEmojis: Record<string, string> = {
    dog: '🐕', cat: '🐈', hamster: '🐹', rabbit: '🐰', parrot: '🦜',
    fox: '🦊', owl: '🦉', unicorn: '🦄', dragon: '🐉', phoenix: '🔥',
    panda: '🐼', turtle: '🐢', penguin: '🐧', wolf: '🐺', lion: '🦁'
  };
  const pet = petType ? (petEmojis[petType] || pets[avatarVariant % pets.length]) : pets[avatarVariant % pets.length];
  
  const rarityGlow = {
    common: '',
    rare: 'drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    epic: 'drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]',
    legendary: 'drop-shadow-[0_0_30px_rgba(251,191,36,0.7)]'
  };

  const rarityBadge = {
    common: null,
    rare: { emoji: '💙', label: 'Редкий' },
    epic: { emoji: '💜', label: 'Эпический' },
    legendary: { emoji: '⭐', label: 'Легендарный' }
  };
  
  return (
    <div className="relative">
      {/* Эффекты редкости */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ width: '200px', height: '200px', left: '-30px', top: '-30px' }}>
        <RarityEffects rarity={rarity} petLevel={petLevel} isActive={rarity !== 'common'} />
      </div>

      {/* Новогодние украшения вокруг питомца */}
      <motion.div 
        className="absolute -top-12 -left-8 text-2xl z-10"
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ❄️
      </motion.div>
      <motion.div 
        className="absolute -top-10 -right-8 text-2xl z-10"
        animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      >
        ⭐
      </motion.div>
      <motion.div 
        className="absolute top-0 -left-12 text-xl z-10"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🎄
      </motion.div>
      <motion.div 
        className="absolute top-0 -right-12 text-xl z-10"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 0.3 }}
      >
        🎁
      </motion.div>
      
      {/* Шапка Санты (красная шапочка) */}
      <motion.div 
        className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 text-3xl"
        initial={{ y: -50, opacity: 0, rotate: -30 }}
        animate={{ y: 0, opacity: 1, rotate: 15 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        🧢
      </motion.div>
      
      {/* Питомец с эффектом свечения редкости */}
      <motion.div 
        className={`text-8xl select-none relative z-10 ${rarityGlow[rarity]}`}
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {pet}
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
      
      {/* Снежинки внизу */}
      <motion.div 
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2 text-lg z-10"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span>❄️</span>
        <span>✨</span>
        <span>❄️</span>
      </motion.div>
    </div>
  );
};

// Компонент тап-зоны с эффектами
const TapZone = ({ onTap, crystals }: { onTap: () => void; crystals: { id: number; x: number; y: number }[] }) => {
  const handleTap = () => {
    hapticImpact('medium');
    onTap();
  };

  return (
    <motion.button
      type="button"
      className="tap-zone relative w-48 h-48 rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)'
      }}
      whileTap={{ scale: 0.95 }}
      onClick={handleTap}
      onTouchStart={(e) => {
        e.preventDefault();
        handleTap();
      }}
    >
      <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30 animate-spin pointer-events-none" style={{ animationDuration: '20s' }} />
      
      <AnimatePresence>
        {crystals.map(crystal => (
          <motion.div
            key={crystal.id}
            className="absolute text-2xl pointer-events-none"
            style={{ left: crystal.x, top: crystal.y }}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -60, scale: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            💎
          </motion.div>
        ))}
      </AnimatePresence>
      
      <span className="text-lg font-bold text-primary pointer-events-none">Тапай!</span>
    </motion.button>
  );
};

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
  const { allPets, ownedPets } = usePetCollection(profile?.id);
  const { playTap, playCrystal, playChest } = useSoundEffects();
  const [floatingCrystals, setFloatingCrystals] = useState<{ id: number; x: number; y: number }[]>([]);
  const [crystalId, setCrystalId] = useState(0);

  const onTap = async () => {
    // Звуковые эффекты
    playTap();
    setTimeout(() => playCrystal(), 50);
    
    const id = crystalId;
    setCrystalId(prev => prev + 1);
    
    const x = 70 + Math.random() * 60;
    const y = 70 + Math.random() * 60;
    setFloatingCrystals(prev => [...prev, { id, x, y }]);
    
    setTimeout(() => {
      setFloatingCrystals(prev => prev.filter(c => c.id !== id));
    }, 700);
    
    const result = await handleClick();
    
    // Update quest progress for clicks
    onQuestProgress?.('clicks', 1);
    
    // Update quest progress for crystals earned
    if (result?.crystalsEarned) {
      onQuestProgress?.('crystals_earned', result.crystalsEarned);
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
      {/* Плавающие частицы */}
      <FloatingParticles />

      <StatsBar 
        crystals={profile.crystals} 
        diamonds={profile.diamonds}
        level={profile.level}
        xp={profile.xp}
        xpNext={xpForNextLevel(profile.level)}
      />
      
      {/* Питомец и зона тапа */}
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        {(() => {
          const currentPet = allPets.find(p => p.type === profile.pet_type);
          const userPet = ownedPets.get(profile.pet_type || 'dog');
          return (
            <PetAvatar 
              level={profile.level} 
              avatarVariant={profile.avatar_variant}
              petType={profile.pet_type}
              rarity={(currentPet?.rarity as 'common' | 'rare' | 'epic' | 'legendary') || 'common'}
              petLevel={userPet?.pet_level || 1}
            />
          );
        })()}
        <TapZone onTap={onTap} crystals={floatingCrystals} />
      </div>
      
      <button
        type="button"
        className={`w-full btn-gradient-accent py-4 rounded-2xl flex items-center justify-center gap-3 touch-manipulation active:scale-[0.98] transition-transform ${!canClaimChest() ? 'opacity-50' : ''}`}
        onClick={handleChestClaim}
        disabled={!canClaimChest()}
      >
        <Gift className="w-6 h-6" />
        <span className="font-bold">
          {canClaimChest() ? 'Открыть сундук!' : `Сундук через ${timeUntilChest()}`}
        </span>
      </button>
      
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
  const { unclaimedCount } = useAchievements();
  const { unclaimedCount: unclaimedQuestsCount, updateQuestProgress } = useDailyQuests(profile?.id);
  const { unclaimedGiftsCount } = useFriends(profile?.id);

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
    <div className="min-h-screen pb-24 relative">
      <ParallaxBackground />
      <header className="p-4 flex items-center justify-between relative z-10">
        <h1 className="text-2xl font-black text-gradient-primary">PetShop Tycoon</h1>
        <div className="flex items-center gap-2">
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
          {activeTab === 'shop' && <ShopPage key="shop" />}
          {activeTab === 'quests' && <DailyQuestsPage key="quests" userId={profile?.id} />}
          {activeTab === 'achievements' && <AchievementsPage key="achievements" />}
          {activeTab === 'profile' && <ProfilePage key="profile" />}
          {activeTab === 'titles' && <TitlesPage key="titles" onBack={() => setActiveTab('profile')} />}
          {activeTab === 'lootbox' && <LootboxPage key="lootbox" onBack={() => setActiveTab('shop')} />}
        </AnimatePresence>
      </main>

      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} unclaimedAchievements={unclaimedCount} unclaimedQuests={unclaimedQuestsCount} unclaimedGifts={unclaimedGiftsCount} />
    </div>
  );
};

export default Index;
