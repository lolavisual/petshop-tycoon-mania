import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initTelegramWebApp, hapticImpact } from '@/lib/telegram';
import { useGameState } from '@/hooks/useGameState';
import { useTelegramTheme } from '@/hooks/useTelegramTheme';
import { Sparkles, Gift, User, ShoppingBag, FileText, Crown, Moon, Sun } from 'lucide-react';
import ShopPage from '@/components/ShopPage';
import ArticlesPage from '@/components/ArticlesPage';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import FloatingParticles from '@/components/game/FloatingParticles';

// Компонент питомца с шапкой Санты
const PetAvatar = ({ level, avatarVariant }: { level: number; avatarVariant: number }) => {
  const pets = ['🐕', '🐈', '🐹', '🐰', '🦜'];
  const pet = pets[avatarVariant % pets.length];
  
  return (
    <div className="relative">
      {/* Новогодние украшения вокруг питомца */}
      <motion.div 
        className="absolute -top-12 -left-8 text-2xl"
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ❄️
      </motion.div>
      <motion.div 
        className="absolute -top-10 -right-8 text-2xl"
        animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      >
        ⭐
      </motion.div>
      <motion.div 
        className="absolute top-0 -left-12 text-xl"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🎄
      </motion.div>
      <motion.div 
        className="absolute top-0 -right-12 text-xl"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 0.3 }}
      >
        🎁
      </motion.div>
      
      {/* Шапка Санты (красная шапочка) */}
      <motion.div 
        className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 text-3xl"
        initial={{ y: -50, opacity: 0, rotate: -30 }}
        animate={{ y: 0, opacity: 1, rotate: 15 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        🧢
      </motion.div>
      
      {/* Питомец */}
      <motion.div 
        className="text-8xl select-none"
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {pet}
      </motion.div>
      
      {/* Снежинки внизу */}
      <motion.div 
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2 text-lg"
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

// Навигация
const NavBar = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'game', icon: Sparkles, label: 'Игра' },
    { id: 'shop', icon: ShoppingBag, label: 'Магазин' },
    { id: 'profile', icon: User, label: 'Профиль' },
    { id: 'articles', icon: FileText, label: 'Статьи' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl px-4 py-3 safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors active:scale-95 touch-manipulation ${
              activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
            }`}
            onClick={() => {
              hapticImpact('light');
              setActiveTab(tab.id);
            }}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                layoutId="navIndicator"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

// Статистика
const StatsBar = ({ crystals, diamonds, level, xp, xpNext }: { crystals: number; diamonds: number; level: number; xp: number; xpNext: number }) => {
  const xpPercent = Math.min((xp / xpNext) * 100, 100);
  
  return (
    <div className="glass-card p-4 rounded-2xl space-y-3">
      <div className="flex justify-between items-center">
        <div className="currency-crystal text-lg">
          💎 {Math.floor(crystals).toLocaleString()}
        </div>
        <div className="currency-diamond text-lg">
          💎💎 {Math.floor(diamonds).toLocaleString()}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-bold flex items-center gap-1">
            <Crown className="w-4 h-4 text-accent" /> Уровень {level}
          </span>
          <span className="text-muted-foreground">{Math.floor(xp)}/{xpNext} XP</span>
        </div>
        <div className="progress-xp">
          <motion.div 
            className="progress-xp-fill"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
};

// Главная страница игры
const GamePage = () => {
  const { profile, accessories, handleClick, claimChest, canClaimChest, timeUntilChest, xpForNextLevel } = useGameState();
  const [floatingCrystals, setFloatingCrystals] = useState<{ id: number; x: number; y: number }[]>([]);
  const [crystalId, setCrystalId] = useState(0);

  const onTap = async () => {
    const id = crystalId;
    setCrystalId(prev => prev + 1);
    
    const x = 70 + Math.random() * 60;
    const y = 70 + Math.random() * 60;
    setFloatingCrystals(prev => [...prev, { id, x, y }]);
    
    setTimeout(() => {
      setFloatingCrystals(prev => prev.filter(c => c.id !== id));
    }, 700);
    
    await handleClick();
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
        <PetAvatar level={profile.level} avatarVariant={profile.avatar_variant} />
        <TapZone onTap={onTap} crystals={floatingCrystals} />
      </div>
      
      <button
        type="button"
        className={`w-full btn-gradient-accent py-4 rounded-2xl flex items-center justify-center gap-3 touch-manipulation active:scale-[0.98] transition-transform ${!canClaimChest() ? 'opacity-50' : ''}`}
        onClick={() => canClaimChest() && claimChest()}
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

// Страница профиля

const ProfilePage = () => {
  const { profile } = useGameState();
  
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">👤 Профиль</h1>
      {profile && (
        <div className="glass-card p-4 space-y-3">
          <p><strong>Имя:</strong> {profile.first_name || 'Игрок'}</p>
          <p><strong>Уровень:</strong> {profile.level}</p>
          <p><strong>Кристаллы:</strong> {Math.floor(profile.crystals)}</p>
          <p><strong>Алмазы:</strong> {Math.floor(profile.diamonds)}</p>
          <p><strong>Стрик:</strong> {profile.streak_days} дней</p>
        </div>
      )}
    </div>
  );
};

// Главный компонент
const Index = () => {
  const [activeTab, setActiveTab] = useState('game');
  const { loading, error } = useGameState();
  const { isDark, toggleTheme } = useTelegramTheme();

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
      </header>

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'game' && <GamePage key="game" />}
          {activeTab === 'shop' && <ShopPage key="shop" />}
          {activeTab === 'profile' && <ProfilePage key="profile" />}
          {activeTab === 'articles' && <ArticlesPage key="articles" />}
        </AnimatePresence>
      </main>

      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Index;
