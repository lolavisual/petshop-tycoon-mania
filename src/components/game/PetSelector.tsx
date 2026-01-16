import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Check, Loader2, Sparkles, Lock, ShoppingCart, Star, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticNotification, hapticImpact } from '@/lib/telegram';
import { Progress } from '@/components/ui/progress';

interface PetSelectorProps {
  currentPetType: string;
  userId: string;
  userCrystals: number;
  userDiamonds: number;
  onClose: () => void;
  onPetChanged: (petType: string) => void;
  onCurrencySpent?: () => void;
}

interface PetType {
  id: string;
  type: string;
  name_ru: string;
  emoji: string;
  price_crystals: number;
  price_diamonds: number;
  is_default: boolean;
  description_ru: string | null;
  bonus_type: string | null;
  bonus_value: number;
  rarity: string;
}

interface UserPet {
  pet_type: string;
  pet_level: number;
  pet_xp: number;
}

const RARITY_CONFIG = {
  common: { 
    label: 'Обычный', 
    color: 'text-gray-400', 
    bg: 'bg-gray-500/20', 
    border: 'border-gray-500',
    glow: ''
  },
  rare: { 
    label: 'Редкий', 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/20', 
    border: 'border-blue-500',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]'
  },
  epic: { 
    label: 'Эпический', 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/20', 
    border: 'border-purple-500',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]'
  },
  legendary: { 
    label: 'Легендарный', 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/20', 
    border: 'border-amber-500',
    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.7)]'
  }
};

const MAX_PET_LEVEL = 10;
const XP_PER_LEVEL = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000];

const PetSelector = ({ 
  currentPetType, 
  userId, 
  userCrystals, 
  userDiamonds, 
  onClose, 
  onPetChanged,
  onCurrencySpent 
}: PetSelectorProps) => {
  const [selectedPet, setSelectedPet] = useState(currentPetType);
  const [saving, setSaving] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [evolving, setEvolving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [ownedPets, setOwnedPets] = useState<Map<string, UserPet>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'owned'>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [petTypesRes, ownedPetsRes] = await Promise.all([
          supabase.from('pet_types').select('*').order('price_crystals', { ascending: true }),
          supabase.from('user_pets').select('pet_type, pet_level, pet_xp').eq('user_id', userId)
        ]);

        if (petTypesRes.data) {
          setPetTypes(petTypesRes.data);
        }
        
        if (ownedPetsRes.data) {
          const petMap = new Map<string, UserPet>();
          ownedPetsRes.data.forEach(p => petMap.set(p.pet_type, p));
          setOwnedPets(petMap);
        }
      } catch (error) {
        console.error('Error loading pet data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const createParticles = useCallback((emojis?: string[]) => {
    const emojiSet = emojis || ['✨', '⭐', '💫', '🌟', '❤️', '💕'];
    const newParticles = Array.from({ length: 16 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 250 - 125,
      y: Math.random() * 250 - 125,
      emoji: emojiSet[Math.floor(Math.random() * emojiSet.length)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);
  }, []);

  const formatBonus = (bonusType: string, bonusValue: number, level: number = 1): string => {
    const multiplier = 1 + (level - 1) * 0.1;
    const actualValue = bonusValue * multiplier;
    
    const bonusLabels: Record<string, string> = {
      click_multiplier: `×${actualValue.toFixed(1)} к кликам`,
      passive_boost: `+${Math.round(actualValue * 100)}% пассивный доход`,
      xp_multiplier: `×${actualValue.toFixed(1)} XP`,
      crystal_boost: `+${Math.round(actualValue * 100)}% кристаллов`,
      streak_protection: actualValue >= 999 ? 'Стрик не теряется' : `Защита стрика ${actualValue.toFixed(0)}x`,
      chest_bonus: `+${Math.round(actualValue * 100)}% к сундуку`,
      all_boost: `+${Math.round(actualValue * 100)}% ко всему`,
      daily_bonus: `+${Math.round(actualValue * 100)}% дневной бонус`,
      friend_bonus: `+${Math.round(actualValue * 100)}% бонус друзей`,
      currency_boost: `+${Math.round(actualValue * 100)}% валюты`,
    };
    return bonusLabels[bonusType] || `+${actualValue}`;
  };

  const isPetOwned = (petType: string) => ownedPets.has(petType);
  const getPetLevel = (petType: string) => ownedPets.get(petType)?.pet_level || 1;
  const getPetXp = (petType: string) => ownedPets.get(petType)?.pet_xp || 0;

  const canAffordPet = (pet: PetType) => {
    if (pet.price_crystals > 0 && pet.price_diamonds > 0) {
      return userCrystals >= pet.price_crystals && userDiamonds >= pet.price_diamonds;
    }
    if (pet.price_crystals > 0) return userCrystals >= pet.price_crystals;
    if (pet.price_diamonds > 0) return userDiamonds >= pet.price_diamonds;
    return true;
  };

  const getEvolutionCost = (level: number): { crystals: number; diamonds: number } => {
    return {
      crystals: level * 500,
      diamonds: Math.floor(level / 2)
    };
  };

  const canEvolve = (petType: string): boolean => {
    const level = getPetLevel(petType);
    if (level >= MAX_PET_LEVEL) return false;
    const xp = getPetXp(petType);
    const requiredXp = XP_PER_LEVEL[level] || XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
    const cost = getEvolutionCost(level);
    return xp >= requiredXp && userCrystals >= cost.crystals && userDiamonds >= cost.diamonds;
  };

  const handleEvolution = async (petType: string) => {
    const level = getPetLevel(petType);
    if (level >= MAX_PET_LEVEL) {
      toast.error('Питомец уже максимального уровня!');
      return;
    }

    const cost = getEvolutionCost(level);
    if (userCrystals < cost.crystals || userDiamonds < cost.diamonds) {
      hapticNotification('error');
      toast.error('Недостаточно ресурсов для эволюции!');
      return;
    }

    setEvolving(true);
    hapticImpact('heavy');

    try {
      // Deduct currency
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          crystals: userCrystals - cost.crystals,
          diamonds: userDiamonds - cost.diamonds
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update pet level
      const { error: petError } = await supabase
        .from('user_pets')
        .update({ 
          pet_level: level + 1,
          pet_xp: 0,
          evolved_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('pet_type', petType);

      if (petError) throw petError;

      hapticNotification('success');
      createParticles(['🔥', '⬆️', '✨', '🌟', '💪', '🚀']);
      
      // Update local state
      setOwnedPets(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(petType);
        if (current) {
          newMap.set(petType, { ...current, pet_level: level + 1, pet_xp: 0 });
        }
        return newMap;
      });
      
      onCurrencySpent?.();
      toast.success(`${petTypes.find(p => p.type === petType)?.emoji} Эволюция до уровня ${level + 1}!`);
    } catch (error) {
      console.error('Error evolving pet:', error);
      hapticNotification('error');
      toast.error('Ошибка эволюции');
    } finally {
      setEvolving(false);
    }
  };

  const handlePurchase = async (pet: PetType) => {
    if (!canAffordPet(pet)) {
      hapticNotification('error');
      toast.error('Недостаточно средств!');
      return;
    }

    setPurchasing(true);
    hapticImpact('heavy');

    try {
      const updates: Record<string, number> = {};
      if (pet.price_crystals > 0) {
        updates.crystals = userCrystals - pet.price_crystals;
      }
      if (pet.price_diamonds > 0) {
        updates.diamonds = userDiamonds - pet.price_diamonds;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      const { error: insertError } = await supabase
        .from('user_pets')
        .insert({ user_id: userId, pet_type: pet.type, pet_level: 1, pet_xp: 0 });

      if (insertError) throw insertError;

      hapticNotification('success');
      createParticles(['🎉', '✨', pet.emoji, '🌟', '💎']);
      setOwnedPets(prev => new Map(prev).set(pet.type, { pet_type: pet.type, pet_level: 1, pet_xp: 0 }));
      onCurrencySpent?.();
      
      const priceText = pet.price_crystals > 0 
        ? `${pet.price_crystals} 💎` 
        : `${pet.price_diamonds} 💠`;
      toast.success(`${pet.emoji} ${pet.name_ru} куплен за ${priceText}!`);
    } catch (error) {
      console.error('Error purchasing pet:', error);
      hapticNotification('error');
      toast.error('Ошибка покупки');
    } finally {
      setPurchasing(false);
    }
  };

  const handleSave = async () => {
    if (selectedPet === currentPetType) {
      onClose();
      return;
    }

    if (!isPetOwned(selectedPet)) {
      toast.error('Сначала купи этого питомца!');
      return;
    }

    setSaving(true);
    hapticImpact('medium');
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('pet_changes')
        .eq('id', userId)
        .single();
      
      const currentChanges = profileData?.pet_changes || 0;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          pet_type: selectedPet,
          pet_changes: currentChanges + 1
        })
        .eq('id', userId);
      
      if (error) throw error;

      hapticNotification('success');
      createParticles();
      setShowSuccess(true);
      
      setTimeout(() => {
        toast.success('Питомец изменён! 🎉');
        onPetChanged(selectedPet);
        onClose();
      }, 800);
    } catch (error) {
      console.error('Error changing pet:', error);
      hapticNotification('error');
      toast.error('Ошибка сохранения');
      setSaving(false);
    }
  };

  const selectedPetData = petTypes.find(p => p.type === selectedPet);
  const selectedPetLevel = getPetLevel(selectedPet);
  const selectedPetXp = getPetXp(selectedPet);
  const selectedXpRequired = XP_PER_LEVEL[selectedPetLevel] || XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
  
  const filteredPets = activeTab === 'owned' 
    ? petTypes.filter(p => isPetOwned(p.type))
    : petTypes;

  const getRarityConfig = (rarity: string) => RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.common;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        className="glass-card-premium p-6 rounded-3xl max-w-md w-full space-y-4 relative overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-primary/20 backdrop-blur-sm rounded-3xl"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12 }}
                className="text-6xl"
              >
                ✨
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Particles */}
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 1.5,
                x: particle.x,
                y: particle.y,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute left-1/2 top-1/2 text-2xl pointer-events-none z-30"
            >
              {particle.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Питомцы
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Balance */}
        <div className="flex justify-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-lg">💎</span>
            <span className="font-bold">{Math.floor(userCrystals).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">💠</span>
            <span className="font-bold">{Math.floor(userDiamonds).toLocaleString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'all' ? 'bg-primary text-primary-foreground' : 'glass-card'
            }`}
          >
            Все ({petTypes.length})
          </button>
          <button
            onClick={() => setActiveTab('owned')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'owned' ? 'bg-primary text-primary-foreground' : 'glass-card'
            }`}
          >
            Мои ({ownedPets.size})
          </button>
        </div>

        {/* Pet Grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {filteredPets.map((pet, index) => {
              const owned = isPetOwned(pet.type);
              const isSelected = selectedPet === pet.type;
              const isFree = pet.price_crystals === 0 && pet.price_diamonds === 0;
              const rarityConfig = getRarityConfig(pet.rarity);
              const level = getPetLevel(pet.type);

              return (
                <motion.button
                  key={pet.type}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all border-2 ${
                    isSelected
                      ? `${rarityConfig.bg} ${rarityConfig.border} ${rarityConfig.glow}`
                      : owned 
                        ? `glass-card hover:${rarityConfig.bg} border-transparent` 
                        : 'glass-card opacity-70 border-transparent'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    hapticImpact('light');
                    setSelectedPet(pet.type);
                  }}
                >
                  {/* Lock overlay */}
                  {!owned && !isFree && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-xl z-10">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Rarity indicator */}
                  <div className={`absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold ${rarityConfig.bg} ${rarityConfig.color}`}>
                    {pet.rarity === 'legendary' ? '⭐' : pet.rarity === 'epic' ? '💜' : pet.rarity === 'rare' ? '💙' : ''}
                  </div>
                  
                  <motion.span 
                    className="text-2xl"
                    animate={isSelected ? { 
                      scale: [1, 1.2, 1],
                      rotate: [0, -5, 5, 0]
                    } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {pet.emoji}
                  </motion.span>
                  <span className="text-[10px] font-medium truncate w-full text-center">{pet.name_ru}</span>
                  
                  {/* Level badge for owned */}
                  {owned && level > 1 && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground">
                      {level}
                    </div>
                  )}
                  
                  {owned && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Check className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Preview & Info */}
        {selectedPetData && (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <motion.div
                key={selectedPet}
                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className={`text-5xl p-3 rounded-2xl ${getRarityConfig(selectedPetData.rarity).bg} ${getRarityConfig(selectedPetData.rarity).glow}`}
              >
                {selectedPetData.emoji}
              </motion.div>
            </div>
            
            <motion.div 
              key={`info-${selectedPet}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-center gap-2">
                <p className="font-bold">{selectedPetData.name_ru}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs ${getRarityConfig(selectedPetData.rarity).bg} ${getRarityConfig(selectedPetData.rarity).color}`}>
                  {getRarityConfig(selectedPetData.rarity).label}
                </span>
              </div>
              
              {selectedPetData.description_ru && (
                <p className="text-xs text-muted-foreground">{selectedPetData.description_ru}</p>
              )}
              
              {selectedPetData.bonus_type && selectedPetData.bonus_value > 0 && (
                <div className="flex items-center justify-center gap-1 text-xs text-primary font-medium">
                  <Zap className="w-3 h-3" />
                  <span>{formatBonus(selectedPetData.bonus_type, selectedPetData.bonus_value, selectedPetLevel)}</span>
                </div>
              )}

              {/* Evolution Progress */}
              {isPetOwned(selectedPet) && selectedPetLevel < MAX_PET_LEVEL && (
                <div className="glass-card p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" />
                      Уровень {selectedPetLevel}
                    </span>
                    <span className="text-muted-foreground">{selectedPetXp}/{selectedXpRequired} XP</span>
                  </div>
                  <Progress value={(selectedPetXp / selectedXpRequired) * 100} className="h-2" />
                  
                  {canEvolve(selectedPet) && (
                    <Button
                      size="sm"
                      className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-500"
                      onClick={() => handleEvolution(selectedPet)}
                      disabled={evolving}
                    >
                      {evolving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Эволюция ({getEvolutionCost(selectedPetLevel).crystals}💎 {getEvolutionCost(selectedPetLevel).diamonds}💠)
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {isPetOwned(selectedPet) && selectedPetLevel >= MAX_PET_LEVEL && (
                <div className="glass-card p-2 rounded-xl text-center">
                  <span className="text-amber-400 text-sm font-bold">⭐ МАКСИМАЛЬНЫЙ УРОВЕНЬ ⭐</span>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {selectedPetData && !isPetOwned(selectedPet) && (selectedPetData.price_crystals > 0 || selectedPetData.price_diamonds > 0) ? (
            <Button
              className="flex-1 btn-gradient-accent"
              onClick={() => handlePurchase(selectedPetData)}
              disabled={purchasing || !canAffordPet(selectedPetData)}
            >
              {purchasing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Купить за {selectedPetData.price_crystals > 0 
                    ? `${selectedPetData.price_crystals} 💎` 
                    : `${selectedPetData.price_diamonds} 💠`}
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Отмена
              </Button>
              <Button
                className="flex-1 btn-gradient-primary"
                onClick={handleSave}
                disabled={saving || selectedPet === currentPetType || !isPetOwned(selectedPet)}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Выбрать'
                )}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PetSelector;

export const getPetQueries = (petType: string): string[] => {
  const QUERIES: Record<string, string[]> = {
    dog: ['cute puppy face', 'happy dog portrait', 'golden retriever puppy'],
    cat: ['cute kitten face', 'fluffy cat portrait', 'persian cat'],
    hamster: ['cute hamster', 'fluffy hamster face', 'hamster eating'],
    rabbit: ['cute rabbit', 'bunny face', 'fluffy bunny'],
    parrot: ['colorful parrot', 'cute parakeet', 'bird portrait'],
  };
  return QUERIES[petType] || QUERIES.dog;
};

export const getPetEmoji = (petType: string): string => {
  const EMOJIS: Record<string, string> = {
    dog: '🐕',
    cat: '🐈',
    hamster: '🐹',
    rabbit: '🐰',
    parrot: '🦜',
    fox: '🦊',
    owl: '🦉',
    unicorn: '🦄',
    dragon: '🐉',
    phoenix: '🔥',
    panda: '🐼',
    turtle: '🐢',
    penguin: '🐧',
    wolf: '🐺',
    lion: '🦁',
  };
  return EMOJIS[petType] || '🐕';
};
