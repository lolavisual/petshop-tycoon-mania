import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const handleSave = async () => {
    if (selectedPet === currentPetType) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pet_type: selectedPet })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Питомец изменён! 🎉');
      onPetChanged(selectedPet);
      onClose();
    } catch (error) {
      console.error('Error changing pet:', error);
      toast.error('Ошибка сохранения');
    } finally {
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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card-premium p-6 rounded-3xl max-w-sm w-full space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Выбери питомца</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Pet Grid */}
        <div className="grid grid-cols-3 gap-3">
          {PETS.map((pet) => (
            <motion.button
              key={pet.type}
              type="button"
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                selectedPet === pet.type
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'glass-card hover:bg-muted/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPet(pet.type)}
            >
              <motion.span 
                className="text-4xl"
                animate={selectedPet === pet.type ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {pet.emoji}
              </motion.span>
              <span className="text-xs font-medium">{pet.name}</span>
              {selectedPet === pet.type && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
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
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl"
          >
            {PETS.find(p => p.type === selectedPet)?.emoji}
          </motion.div>
          <p className="text-sm text-muted-foreground">
            Твой новый друг: <strong>{PETS.find(p => p.type === selectedPet)?.name}</strong>
          </p>
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
            disabled={saving}
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
