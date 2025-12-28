import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Check, Loader2, Sparkles, Lock, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticNotification, hapticImpact } from '@/lib/telegram';

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
}

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [ownedPets, setOwnedPets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load pet types and owned pets
  useEffect(() => {
    const loadData = async () => {
      try {
        const [petTypesRes, ownedPetsRes] = await Promise.all([
          supabase.from('pet_types').select('*').order('price_crystals', { ascending: true }),
          supabase.from('user_pets').select('pet_type').eq('user_id', userId)
        ]);

        if (petTypesRes.data) {
          setPetTypes(petTypesRes.data);
        }
        
        if (ownedPetsRes.data) {
          setOwnedPets(ownedPetsRes.data.map(p => p.pet_type));
        }
      } catch (error) {
        console.error('Error loading pet data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const createParticles = useCallback(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      emoji: ['✨', '⭐', '💫', '🌟', '❤️', '💕'][Math.floor(Math.random() * 6)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);
  }, []);

  const formatBonus = (bonusType: string, bonusValue: number): string => {
    const bonusLabels: Record<string, string> = {
      click_multiplier: `×${bonusValue} к кликам`,
      passive_boost: `+${Math.round(bonusValue * 100)}% пассивный доход`,
      xp_multiplier: `×${bonusValue} XP`,
      crystal_boost: `+${Math.round(bonusValue * 100)}% кристаллов`,
      streak_protection: bonusValue >= 999 ? 'Стрик не теряется' : `Защита стрика ${bonusValue}x`,
      chest_bonus: `+${Math.round(bonusValue * 100)}% к сундуку`,
      all_boost: `+${Math.round(bonusValue * 100)}% ко всему`,
      daily_bonus: `+${Math.round(bonusValue * 100)}% дневной бонус`,
      friend_bonus: `+${Math.round(bonusValue * 100)}% бонус друзей`,
      currency_boost: `+${Math.round(bonusValue * 100)}% валюты`,
    };
    return bonusLabels[bonusType] || `+${bonusValue}`;
  };

  const isPetOwned = (petType: string) => ownedPets.includes(petType);

  const canAffordPet = (pet: PetType) => {
    if (pet.price_crystals > 0 && pet.price_diamonds > 0) {
      return userCrystals >= pet.price_crystals && userDiamonds >= pet.price_diamonds;
    }
    if (pet.price_crystals > 0) return userCrystals >= pet.price_crystals;
    if (pet.price_diamonds > 0) return userDiamonds >= pet.price_diamonds;
    return true;
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
      // Deduct currency
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

      // Add pet to user's collection
      const { error: insertError } = await supabase
        .from('user_pets')
        .insert({ user_id: userId, pet_type: pet.type });

      if (insertError) throw insertError;

      hapticNotification('success');
      createParticles();
      setOwnedPets(prev => [...prev, pet.type]);
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
        className="glass-card-premium p-6 rounded-3xl max-w-sm w-full space-y-5 relative overflow-hidden max-h-[90vh] overflow-y-auto"
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

        {/* Pet Grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {petTypes.map((pet, index) => {
              const owned = isPetOwned(pet.type);
              const canAfford = canAffordPet(pet);
              const isSelected = selectedPet === pet.type;
              const isFree = pet.price_crystals === 0 && pet.price_diamonds === 0;

              return (
                <motion.button
                  key={pet.type}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : owned 
                        ? 'glass-card hover:bg-muted/50' 
                        : 'glass-card opacity-80'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    hapticImpact('light');
                    setSelectedPet(pet.type);
                  }}
                >
                  {/* Lock overlay for unowned */}
                  {!owned && !isFree && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/30 rounded-2xl z-10">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  
                  <motion.span 
                    className="text-3xl"
                    animate={isSelected ? { 
                      scale: [1, 1.3, 1],
                      rotate: [0, -10, 10, 0]
                    } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {pet.emoji}
                  </motion.span>
                  <span className="text-xs font-medium">{pet.name_ru}</span>
                  
                  {/* Price tag */}
                  {!owned && !isFree && (
                    <div className={`text-xs font-bold mt-1 ${canAfford ? 'text-primary' : 'text-muted-foreground'}`}>
                      {pet.price_crystals > 0 && `${pet.price_crystals} 💎`}
                      {pet.price_diamonds > 0 && `${pet.price_diamonds} 💠`}
                    </div>
                  )}
                  
                  {owned && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Preview & Info */}
        {selectedPetData && (
          <div className="text-center space-y-2">
            <motion.div
              key={selectedPet}
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-6xl"
            >
              {selectedPetData.emoji}
            </motion.div>
            <motion.div 
              key={`info-${selectedPet}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1"
            >
              <p className="font-bold">{selectedPetData.name_ru}</p>
              {selectedPetData.description_ru && (
                <p className="text-xs text-muted-foreground">{selectedPetData.description_ru}</p>
              )}
              {selectedPetData.bonus_type && selectedPetData.bonus_value > 0 && (
                <div className="flex items-center justify-center gap-1 text-xs text-primary font-medium">
                  <span>✨</span>
                  <span>{formatBonus(selectedPetData.bonus_type, selectedPetData.bonus_value)}</span>
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
  };
  return EMOJIS[petType] || '🐕';
};