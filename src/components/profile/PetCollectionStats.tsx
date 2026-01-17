import { motion, AnimatePresence } from 'framer-motion';
import { usePetCollection } from '@/hooks/usePetCollection';
import { Progress } from '@/components/ui/progress';
import { Star, Trophy, Zap, Crown, Sparkles, Lock, Check } from 'lucide-react';

interface PetCollectionStatsProps {
  userId?: string;
  currentPetType?: string;
}

const PetCollectionStats = ({ userId, currentPetType }: PetCollectionStatsProps) => {
  const {
    allPets,
    ownedPets,
    petsByRarity,
    collectionBonuses,
    totalCollectionBonus,
    stats,
    loading,
    getRarityConfig
  } = usePetCollection(userId);

  if (loading) {
    return (
      <div className="glass-card p-4 rounded-xl animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  const formatBonus = (bonusType: string | null, bonusValue: number | null, level: number = 1): string => {
    if (!bonusType || !bonusValue) return '';
    const multiplier = 1 + (level - 1) * 0.1;
    const actualValue = bonusValue * multiplier;
    
    const bonusLabels: Record<string, string> = {
      click_multiplier: `×${actualValue.toFixed(1)} клики`,
      passive_boost: `+${Math.round(actualValue * 100)}% пассив`,
      xp_multiplier: `×${actualValue.toFixed(1)} XP`,
      crystal_boost: `+${Math.round(actualValue * 100)}% 💎`,
      streak_protection: actualValue >= 999 ? 'Защита стрика' : `${actualValue.toFixed(0)}x стрик`,
      chest_bonus: `+${Math.round(actualValue * 100)}% сундук`,
      all_boost: `+${Math.round(actualValue * 100)}% всё`,
      daily_bonus: `+${Math.round(actualValue * 100)}% дневной`,
      friend_bonus: `+${Math.round(actualValue * 100)}% друзья`,
      currency_boost: `+${Math.round(actualValue * 100)}% валюта`,
    };
    return bonusLabels[bonusType] || '';
  };

  return (
    <div className="space-y-4">
      {/* Общая статистика коллекции */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-premium p-4 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold">Коллекция питомцев</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.ownedCount}</p>
            <p className="text-xs text-muted-foreground">из {stats.totalPets}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.maxLevel}</p>
            <p className="text-xs text-muted-foreground">макс. ур.</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">
              {totalCollectionBonus.completedCollections}
            </p>
            <p className="text-xs text-muted-foreground">коллекций</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Прогресс коллекции</span>
            <span className="font-bold">{Math.round(stats.collectionProgress)}%</span>
          </div>
          <Progress value={stats.collectionProgress} className="h-2" />
        </div>
      </motion.div>

      {/* Бонусы за коллекции */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-sm">Бонусы за коллекции</h3>
        </div>
        
        <div className="space-y-2">
          {collectionBonuses.map((bonus, index) => {
            const config = getRarityConfig(bonus.rarity);
            
            return (
              <motion.div
                key={bonus.rarity}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  bonus.isComplete 
                    ? `${config.bg} ${config.border} ${config.glow}` 
                    : 'glass-card border-transparent opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{bonus.emoji}</span>
                    <div>
                      <p className={`text-sm font-medium ${config.color}`}>{bonus.label}</p>
                      <p className="text-xs text-muted-foreground">{bonus.ownedPets}/{bonus.totalPets}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {bonus.isComplete ? (
                      <div className="flex items-center gap-1">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-bold text-green-400">{bonus.bonusDescription}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-50">
                        <Lock className="w-3 h-3" />
                        <span className="text-xs">{bonus.bonusDescription}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {!bonus.isComplete && bonus.totalPets > 0 && (
                  <Progress 
                    value={(bonus.ownedPets / bonus.totalPets) * 100} 
                    className="h-1 mt-2" 
                  />
                )}
              </motion.div>
            );
          })}
        </div>
        
        {totalCollectionBonus.completedCollections > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 p-2 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 text-center"
          >
            <span className="text-xs font-bold text-primary">
              ✨ Общий бонус: +{Math.round(totalCollectionBonus.totalBonus * 100)}%
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Мои питомцы */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-4 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm">Мои питомцы</h3>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {allPets.map((pet, index) => {
            const owned = ownedPets.has(pet.type);
            const userPet = ownedPets.get(pet.type);
            const config = getRarityConfig(pet.rarity);
            const isActive = pet.type === currentPetType;
            
            return (
              <motion.div
                key={pet.type}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`relative p-2 rounded-lg text-center transition-all ${
                  isActive 
                    ? `${config.bg} ${config.border} border-2 ${config.glow}`
                    : owned 
                      ? `glass-card border border-transparent hover:${config.bg}`
                      : 'glass-card opacity-40'
                }`}
              >
                {!owned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg z-10">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                
                <motion.span 
                  className="text-xl block"
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {pet.emoji}
                </motion.span>
                
                {owned && userPet && (
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    <Star className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-[10px] font-bold">{userPet.pet_level}</span>
                  </div>
                )}
                
                {owned && pet.bonus_type && (
                  <p className="text-[8px] text-muted-foreground truncate mt-0.5">
                    {formatBonus(pet.bonus_type, pet.bonus_value, userPet?.pet_level || 1)}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Текущий питомец с детальной информацией */}
      {currentPetType && (() => {
        const currentPet = allPets.find(p => p.type === currentPetType);
        const userPet = ownedPets.get(currentPetType);
        
        if (!currentPet || !userPet) return null;
        
        const config = getRarityConfig(currentPet.rarity);
        const XP_PER_LEVEL = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000];
        const requiredXp = XP_PER_LEVEL[userPet.pet_level] || XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
        const xpProgress = userPet.pet_level >= 10 ? 100 : (userPet.pet_xp / requiredXp) * 100;
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-4 rounded-xl ${config.bg} border-2 ${config.border} ${config.glow}`}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="text-4xl"
                animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {currentPet.emoji}
              </motion.div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold">{currentPet.name_ru}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color}`}>
                    {config.label?.replace('е', 'й').replace('ные', 'ный').replace('ие', 'ий') || currentPet.rarity}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="font-bold">Ур. {userPet.pet_level}</span>
                  </div>
                  
                  {currentPet.bonus_type && (
                    <div className="flex items-center gap-1 text-primary">
                      <Zap className="w-3 h-3" />
                      <span className="text-xs font-medium">
                        {formatBonus(currentPet.bonus_type, currentPet.bonus_value, userPet.pet_level)}
                      </span>
                    </div>
                  )}
                </div>
                
                {userPet.pet_level < 10 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span>{userPet.pet_xp}/{requiredXp} XP</span>
                    </div>
                    <Progress value={xpProgress} className="h-1.5" />
                  </div>
                )}
                
                {userPet.pet_level >= 10 && (
                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-amber-400">⭐ МАКСИМАЛЬНЫЙ УРОВЕНЬ ⭐</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
};

export default PetCollectionStats;
