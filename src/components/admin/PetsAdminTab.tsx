import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Loader2, Save, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PetType {
  id: string;
  type: string;
  name: string | null;
  name_ru: string;
  emoji: string;
  price_crystals: number;
  price_diamonds: number;
  is_default: boolean;
  description: string | null;
  description_ru: string | null;
  bonus_type: string | null;
  bonus_value: number;
  created_at: string;
}

const BONUS_TYPES = [
  { value: '', label: 'Без бонуса' },
  { value: 'click_multiplier', label: 'Множитель кликов' },
  { value: 'passive_boost', label: 'Пассивный доход' },
  { value: 'xp_multiplier', label: 'Множитель XP' },
  { value: 'crystal_boost', label: 'Бонус кристаллов' },
  { value: 'streak_protection', label: 'Защита стрика' },
  { value: 'chest_bonus', label: 'Бонус сундука' },
  { value: 'all_boost', label: 'Все бонусы' },
  { value: 'daily_bonus', label: 'Дневной бонус' },
  { value: 'friend_bonus', label: 'Бонус друзей' },
  { value: 'currency_boost', label: 'Бонус валюты' },
];

const DEFAULT_PET: Partial<PetType> = {
  type: '',
  name: '',
  name_ru: '',
  emoji: '🐾',
  price_crystals: 0,
  price_diamonds: 0,
  is_default: false,
  description: '',
  description_ru: '',
  bonus_type: '',
  bonus_value: 0,
};

const PetsAdminTab = () => {
  const [pets, setPets] = useState<PetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPet, setEditingPet] = useState<Partial<PetType> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pet_types')
        .select('*')
        .order('price_crystals', { ascending: true });

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
      toast.error('Ошибка загрузки питомцев');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingPet) return;

    if (!editingPet.type?.trim() || !editingPet.name_ru?.trim()) {
      toast.error('Заполните тип и название питомца');
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('pet_types')
          .insert([{
            type: editingPet.type,
            name: editingPet.name || editingPet.name_ru,
            name_ru: editingPet.name_ru,
            emoji: editingPet.emoji || '🐾',
            price_crystals: editingPet.price_crystals || 0,
            price_diamonds: editingPet.price_diamonds || 0,
            is_default: editingPet.is_default || false,
            description: editingPet.description,
            description_ru: editingPet.description_ru,
            bonus_type: editingPet.bonus_type || null,
            bonus_value: editingPet.bonus_value || 0,
          }]);

        if (error) throw error;
        toast.success('Питомец создан!');
      } else {
        const { error } = await supabase
          .from('pet_types')
          .update({
            type: editingPet.type,
            name: editingPet.name,
            name_ru: editingPet.name_ru,
            emoji: editingPet.emoji,
            price_crystals: editingPet.price_crystals,
            price_diamonds: editingPet.price_diamonds,
            is_default: editingPet.is_default,
            description: editingPet.description,
            description_ru: editingPet.description_ru,
            bonus_type: editingPet.bonus_type || null,
            bonus_value: editingPet.bonus_value || 0,
          })
          .eq('id', editingPet.id);

        if (error) throw error;
        toast.success('Питомец обновлён!');
      }

      setEditingPet(null);
      setIsCreating(false);
      await loadPets();
    } catch (error) {
      console.error('Error saving pet:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (petId: string) => {
    if (!confirm('Удалить этого питомца?')) return;

    try {
      const { error } = await supabase
        .from('pet_types')
        .delete()
        .eq('id', petId);

      if (error) throw error;
      toast.success('Питомец удалён');
      await loadPets();
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast.error('Ошибка удаления');
    }
  };

  const getBonusLabel = (bonusType: string | null) => {
    return BONUS_TYPES.find(b => b.value === bonusType)?.label || 'Без бонуса';
  };

  const formatBonusValue = (pet: PetType) => {
    if (!pet.bonus_type || pet.bonus_value === 0) return '';
    
    if (pet.bonus_type === 'click_multiplier' || pet.bonus_type === 'xp_multiplier') {
      return `×${pet.bonus_value}`;
    }
    if (pet.bonus_type === 'streak_protection') {
      return pet.bonus_value >= 999 ? '∞' : `${pet.bonus_value}`;
    }
    return `+${Math.round(pet.bonus_value * 100)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Типы питомцев ({pets.length})</h2>
        <Button
          onClick={() => {
            setEditingPet(DEFAULT_PET);
            setIsCreating(true);
          }}
          className="btn-gradient-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {editingPet && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 rounded-xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{isCreating ? 'Новый питомец' : 'Редактирование'}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingPet(null);
                  setIsCreating(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Эмодзи</Label>
                <Input
                  value={editingPet.emoji || ''}
                  onChange={(e) => setEditingPet({ ...editingPet, emoji: e.target.value })}
                  placeholder="🐾"
                  className="text-center text-2xl"
                  maxLength={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Тип (EN)</Label>
                <Input
                  value={editingPet.type || ''}
                  onChange={(e) => setEditingPet({ ...editingPet, type: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  placeholder="pet_type"
                />
              </div>
              <div className="space-y-2">
                <Label>Название (RU)</Label>
                <Input
                  value={editingPet.name_ru || ''}
                  onChange={(e) => setEditingPet({ ...editingPet, name_ru: e.target.value })}
                  placeholder="Питомец"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Описание (RU)</Label>
                <Input
                  value={editingPet.description_ru || ''}
                  onChange={(e) => setEditingPet({ ...editingPet, description_ru: e.target.value })}
                  placeholder="Описание питомца"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (EN)</Label>
                <Input
                  value={editingPet.description || ''}
                  onChange={(e) => setEditingPet({ ...editingPet, description: e.target.value })}
                  placeholder="Pet description"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>💎 Цена (кристаллы)</Label>
                <Input
                  type="number"
                  value={editingPet.price_crystals || 0}
                  onChange={(e) => setEditingPet({ ...editingPet, price_crystals: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>💠 Цена (алмазы)</Label>
                <Input
                  type="number"
                  value={editingPet.price_diamonds || 0}
                  onChange={(e) => setEditingPet({ ...editingPet, price_diamonds: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Тип бонуса</Label>
                <select
                  className="w-full p-2 rounded-lg bg-muted border border-border"
                  value={editingPet.bonus_type || ''}
                  onChange={(e) => setEditingPet({ ...editingPet, bonus_type: e.target.value })}
                >
                  {BONUS_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Значение бонуса</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingPet.bonus_value || 0}
                  onChange={(e) => setEditingPet({ ...editingPet, bonus_value: parseFloat(e.target.value) || 0 })}
                  min={0}
                  placeholder="1.0 = 100%, 0.1 = 10%"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={editingPet.is_default ?? false}
                onCheckedChange={(checked) => setEditingPet({ ...editingPet, is_default: checked })}
              />
              <Label>По умолчанию (бесплатный)</Label>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-gradient-primary"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pets List */}
      <div className="space-y-2">
        {pets.map((pet) => (
          <motion.div
            key={pet.id}
            layout
            className="glass-card p-3 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{pet.emoji}</span>
              
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate flex items-center gap-2">
                  {pet.name_ru}
                  {pet.is_default && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Free</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                  <span className="text-muted-foreground/60">{pet.type}</span>
                  {pet.price_crystals > 0 && <span>💎{pet.price_crystals}</span>}
                  {pet.price_diamonds > 0 && <span>💠{pet.price_diamonds}</span>}
                  {pet.bonus_type && (
                    <span className="flex items-center gap-1 text-primary">
                      <Sparkles className="w-3 h-3" />
                      {getBonusLabel(pet.bonus_type)} {formatBonusValue(pet)}
                    </span>
                  )}
                </div>
                {pet.description_ru && (
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {pet.description_ru}
                  </div>
                )}
              </div>

              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingPet(pet);
                    setIsCreating(false);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(pet.id)}
                  disabled={pet.is_default}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {pets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Нет питомцев. Создайте первого!
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PetsAdminTab;