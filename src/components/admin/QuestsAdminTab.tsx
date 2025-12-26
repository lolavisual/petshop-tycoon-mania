import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyQuest {
  id: string;
  name: string;
  name_ru: string;
  description: string | null;
  description_ru: string | null;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  reward_crystals: number;
  reward_diamonds: number;
  reward_xp: number;
  is_active: boolean;
  created_at: string;
}

const REQUIREMENT_TYPES = [
  { value: 'clicks', label: 'Клики' },
  { value: 'crystals_earned', label: 'Заработать кристаллов' },
  { value: 'streak', label: 'Дней подряд' },
  { value: 'chest_claim', label: 'Открыть сундук' },
  { value: 'gift_sent', label: 'Отправить подарков' },
  { value: 'purchase', label: 'Сделать покупку' },
  { value: 'level_up', label: 'Повысить уровень' },
  { value: 'xp_earned', label: 'Заработать XP' },
  { value: 'achievement', label: 'Получить достижение' },
];

const DEFAULT_QUEST: Partial<DailyQuest> = {
  name: '',
  name_ru: '',
  description: '',
  description_ru: '',
  icon: '⭐',
  requirement_type: 'clicks',
  requirement_value: 10,
  reward_crystals: 100,
  reward_diamonds: 0,
  reward_xp: 50,
  is_active: true,
};

const QuestsAdminTab = () => {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Partial<DailyQuest> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_quests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuests(data || []);
    } catch (error) {
      console.error('Error loading quests:', error);
      toast.error('Ошибка загрузки квестов');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingQuest) return;

    if (!editingQuest.name_ru?.trim()) {
      toast.error('Введите название квеста');
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('daily_quests')
          .insert([{
            name: editingQuest.name || editingQuest.name_ru,
            name_ru: editingQuest.name_ru,
            description: editingQuest.description,
            description_ru: editingQuest.description_ru,
            icon: editingQuest.icon || '⭐',
            requirement_type: editingQuest.requirement_type,
            requirement_value: editingQuest.requirement_value,
            reward_crystals: editingQuest.reward_crystals,
            reward_diamonds: editingQuest.reward_diamonds,
            reward_xp: editingQuest.reward_xp,
            is_active: editingQuest.is_active,
          }]);

        if (error) throw error;
        toast.success('Квест создан!');
      } else {
        const { error } = await supabase
          .from('daily_quests')
          .update({
            name: editingQuest.name,
            name_ru: editingQuest.name_ru,
            description: editingQuest.description,
            description_ru: editingQuest.description_ru,
            icon: editingQuest.icon,
            requirement_type: editingQuest.requirement_type,
            requirement_value: editingQuest.requirement_value,
            reward_crystals: editingQuest.reward_crystals,
            reward_diamonds: editingQuest.reward_diamonds,
            reward_xp: editingQuest.reward_xp,
            is_active: editingQuest.is_active,
          })
          .eq('id', editingQuest.id);

        if (error) throw error;
        toast.success('Квест обновлён!');
      }

      setEditingQuest(null);
      setIsCreating(false);
      await loadQuests();
    } catch (error) {
      console.error('Error saving quest:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (questId: string) => {
    if (!confirm('Удалить этот квест?')) return;

    try {
      const { error } = await supabase
        .from('daily_quests')
        .delete()
        .eq('id', questId);

      if (error) throw error;
      toast.success('Квест удалён');
      await loadQuests();
    } catch (error) {
      console.error('Error deleting quest:', error);
      toast.error('Ошибка удаления');
    }
  };

  const handleToggleActive = async (quest: DailyQuest) => {
    try {
      const { error } = await supabase
        .from('daily_quests')
        .update({ is_active: !quest.is_active })
        .eq('id', quest.id);

      if (error) throw error;
      toast.success(quest.is_active ? 'Квест деактивирован' : 'Квест активирован');
      await loadQuests();
    } catch (error) {
      console.error('Error toggling quest:', error);
      toast.error('Ошибка');
    }
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
        <h2 className="text-lg font-bold">Ежедневные квесты ({quests.length})</h2>
        <Button
          onClick={() => {
            setEditingQuest(DEFAULT_QUEST);
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
        {editingQuest && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 rounded-xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{isCreating ? 'Новый квест' : 'Редактирование'}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingQuest(null);
                  setIsCreating(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Иконка</Label>
                <Input
                  value={editingQuest.icon || ''}
                  onChange={(e) => setEditingQuest({ ...editingQuest, icon: e.target.value })}
                  placeholder="⭐"
                  className="text-center text-2xl"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Название (RU)</Label>
                <Input
                  value={editingQuest.name_ru || ''}
                  onChange={(e) => setEditingQuest({ ...editingQuest, name_ru: e.target.value })}
                  placeholder="Название квеста"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Описание (RU)</Label>
              <Input
                value={editingQuest.description_ru || ''}
                onChange={(e) => setEditingQuest({ ...editingQuest, description_ru: e.target.value })}
                placeholder="Описание задания"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Тип требования</Label>
                <select
                  className="w-full p-2 rounded-lg bg-muted border border-border"
                  value={editingQuest.requirement_type || 'clicks'}
                  onChange={(e) => setEditingQuest({ ...editingQuest, requirement_type: e.target.value })}
                >
                  {REQUIREMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Значение</Label>
                <Input
                  type="number"
                  value={editingQuest.requirement_value || 0}
                  onChange={(e) => setEditingQuest({ ...editingQuest, requirement_value: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>💎 Кристаллы</Label>
                <Input
                  type="number"
                  value={editingQuest.reward_crystals || 0}
                  onChange={(e) => setEditingQuest({ ...editingQuest, reward_crystals: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>💠 Алмазы</Label>
                <Input
                  type="number"
                  value={editingQuest.reward_diamonds || 0}
                  onChange={(e) => setEditingQuest({ ...editingQuest, reward_diamonds: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>⭐ XP</Label>
                <Input
                  type="number"
                  value={editingQuest.reward_xp || 0}
                  onChange={(e) => setEditingQuest({ ...editingQuest, reward_xp: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={editingQuest.is_active ?? true}
                onCheckedChange={(checked) => setEditingQuest({ ...editingQuest, is_active: checked })}
              />
              <Label>Активен</Label>
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

      {/* Quest List */}
      <div className="space-y-2">
        {quests.map((quest) => (
          <motion.div
            key={quest.id}
            layout
            className={`glass-card p-3 rounded-xl ${!quest.is_active ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{quest.icon}</span>
              
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{quest.name_ru}</div>
                <div className="text-xs text-muted-foreground flex gap-3">
                  <span>{REQUIREMENT_TYPES.find(t => t.value === quest.requirement_type)?.label}: {quest.requirement_value}</span>
                  <span>💎{quest.reward_crystals}</span>
                  {quest.reward_diamonds > 0 && <span>💠{quest.reward_diamonds}</span>}
                  <span>⭐{quest.reward_xp}</span>
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleToggleActive(quest)}
                >
                  <div className={`w-3 h-3 rounded-full ${quest.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingQuest(quest);
                    setIsCreating(false);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(quest.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {quests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Нет квестов. Создайте первый!
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default QuestsAdminTab;
