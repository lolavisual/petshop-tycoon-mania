import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticNotification, hapticImpact } from '@/lib/telegram';

interface PetSelectorProps {
  currentPetType: string;
  userId: string;
  onClose: () => void;
  onPetChanged: (petType: string) => void;
}

const PETS = [
  { type: 'dog', emoji: '🐕', name: 'Собака', queries: ['cute puppy face', 'happy dog portrait', 'golden retriever puppy'] },
  { type: 'cat', emoji: '🐈', name: 'Кот', queries: ['cute kitten face', 'fluffy cat portrait', 'persian cat'] },
  { type: 'hamster', emoji: '🐹', name: 'Хомяк', queries: ['cute hamster', 'fluffy hamster face', 'hamster eating'] },
  { type: 'rabbit', emoji: '🐰', name: 'Кролик', queries: ['cute rabbit', 'bunny face', 'fluffy bunny'] },
  { type: 'parrot', emoji: '🦜', name: 'Попугай', queries: ['colorful parrot', 'cute parakeet', 'bird portrait'] },
];

const PetSelector = ({ currentPetType, userId, onClose, onPetChanged }: PetSelectorProps) => {
  const [selectedPet, setSelectedPet] = useState(currentPetType);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);

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

  const handleSave = async () => {
    if (selectedPet === currentPetType) {
      onClose();
      return;
    }

    setSaving(true);
    hapticImpact('medium');
    
    try {
      // First get current pet_changes count
      const { data: profileData } = await supabase
        .from('profiles')
        .select('pet_changes')
        .eq('id', userId)
        .single();
      
      const currentChanges = profileData?.pet_changes || 0;
      
      // Update pet_type and increment pet_changes
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
        className="glass-card-premium p-6 rounded-3xl max-w-sm w-full space-y-6 relative overflow-hidden"
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
            Выбери питомца
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Pet Grid */}
        <div className="grid grid-cols-3 gap-3">
          {PETS.map((pet, index) => (
            <motion.button
              key={pet.type}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                selectedPet === pet.type
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'glass-card hover:bg-muted/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                hapticImpact('light');
                setSelectedPet(pet.type);
              }}
            >
              <motion.span 
                className="text-4xl"
                animate={selectedPet === pet.type ? { 
                  scale: [1, 1.3, 1],
                  rotate: [0, -10, 10, 0]
                } : {}}
                transition={{ duration: 0.4 }}
              >
                {pet.emoji}
              </motion.span>
              <span className="text-xs font-medium">{pet.name}</span>
              {selectedPet === pet.type && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Preview */}
        <div className="text-center space-y-2">
          <motion.div
            key={selectedPet}
            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="text-6xl"
          >
            {PETS.find(p => p.type === selectedPet)?.emoji}
          </motion.div>
          <motion.p 
            key={`name-${selectedPet}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground"
          >
            Твой новый друг: <strong>{PETS.find(p => p.type === selectedPet)?.name}</strong>
          </motion.p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
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
            disabled={saving || selectedPet === currentPetType}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Выбрать'
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PetSelector;

export const getPetQueries = (petType: string): string[] => {
  return PETS.find(p => p.type === petType)?.queries || PETS[0].queries;
};

export const getPetEmoji = (petType: string): string => {
  return PETS.find(p => p.type === petType)?.emoji || '🐕';
};
