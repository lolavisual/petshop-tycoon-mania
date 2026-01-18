import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGameState } from './useGameState';
import { toast } from 'sonner';

interface Lootbox {
  id: string;
  name: string;
  name_ru: string;
  description: string | null;
  description_ru: string | null;
  rarity: string;
  price_crystals: number;
  price_diamonds: number;
  icon: string;
  drop_rates: Record<string, number>;
  is_active: boolean;
}

interface UserLootbox {
  id: string;
  user_id: string;
  lootbox_id: string;
  quantity: number;
  obtained_at: string;
}

interface LootboxOpening {
  id: string;
  user_id: string;
  lootbox_id: string;
  reward_type: string;
  reward_id: string | null;
  reward_amount: number | null;
  opened_at: string;
}

export interface LootboxReward {
  type: string;
  amount?: number;
  itemId?: string;
  itemName?: string;
  rarity?: string;
  icon?: string;
}

export const useLootboxes = () => {
  const { profile, refreshProfile } = useGameState();
  const queryClient = useQueryClient();

  const { data: lootboxes = [] } = useQuery({
    queryKey: ['lootboxes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lootboxes')
        .select('*')
        .eq('is_active', true)
        .order('price_crystals', { ascending: true });
      if (error) throw error;
      return data as Lootbox[];
    },
  });

  const { data: userLootboxes = [], refetch: refetchUserLootboxes } = useQuery({
    queryKey: ['user-lootboxes', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('user_lootboxes')
        .select('*')
        .eq('user_id', profile.id);
      if (error) throw error;
      return data as UserLootbox[];
    },
    enabled: !!profile?.id,
  });

  const { data: openingHistory = [] } = useQuery({
    queryKey: ['lootbox-history', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('lootbox_openings')
        .select('*')
        .eq('user_id', profile.id)
        .order('opened_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as LootboxOpening[];
    },
    enabled: !!profile?.id,
  });

  const generateReward = (lootbox: Lootbox): LootboxReward => {
    const dropRates = lootbox.drop_rates;
    const totalWeight = Object.values(dropRates).reduce((sum, val) => sum + val, 0);
    let random = Math.random() * totalWeight;
    
    for (const [rewardType, weight] of Object.entries(dropRates)) {
      random -= weight;
      if (random <= 0) {
        switch (rewardType) {
          case 'crystals':
            const crystalAmounts: Record<string, number> = {
              common: 100 + Math.floor(Math.random() * 200),
              rare: 300 + Math.floor(Math.random() * 500),
              epic: 800 + Math.floor(Math.random() * 1000),
              legendary: 2000 + Math.floor(Math.random() * 3000),
            };
            return { type: 'crystals', amount: crystalAmounts[lootbox.rarity] || 100, icon: '💎' };
          
          case 'diamonds':
            const diamondAmounts: Record<string, number> = {
              common: 1 + Math.floor(Math.random() * 2),
              rare: 3 + Math.floor(Math.random() * 5),
              epic: 8 + Math.floor(Math.random() * 10),
              legendary: 15 + Math.floor(Math.random() * 25),
            };
            return { type: 'diamonds', amount: diamondAmounts[lootbox.rarity] || 1, icon: '💠' };
          
          case 'common_pet':
            return { type: 'pet', rarity: 'common', itemName: 'Обычный питомец', icon: '🐕' };
          case 'rare_pet':
            return { type: 'pet', rarity: 'rare', itemName: 'Редкий питомец', icon: '🦊' };
          case 'epic_pet':
            return { type: 'pet', rarity: 'epic', itemName: 'Эпический питомец', icon: '🦁' };
          case 'legendary_pet':
            return { type: 'pet', rarity: 'legendary', itemName: 'Легендарный питомец', icon: '🐉' };
          case 'mythic_pet':
            return { type: 'pet', rarity: 'mythic', itemName: 'Мифический питомец', icon: '🦄' };
          
          case 'accessory':
            return { type: 'accessory', rarity: 'common', itemName: 'Аксессуар', icon: '🎀' };
          case 'rare_accessory':
            return { type: 'accessory', rarity: 'rare', itemName: 'Редкий аксессуар', icon: '👑' };
          case 'epic_accessory':
            return { type: 'accessory', rarity: 'epic', itemName: 'Эпический аксессуар', icon: '💎' };
          
          case 'title':
            return { type: 'title', rarity: 'rare', itemName: 'Титул', icon: '🏅' };
          case 'rare_title':
            return { type: 'title', rarity: 'legendary', itemName: 'Редкий титул', icon: '⚡' };
          
          default:
            return { type: 'crystals', amount: 50, icon: '💎' };
        }
      }
    }
    
    return { type: 'crystals', amount: 50, icon: '💎' };
  };

  const purchaseLootbox = useMutation({
    mutationFn: async (lootboxId: string) => {
      if (!profile?.id) throw new Error('Not authenticated');
      
      const lootbox = lootboxes.find(l => l.id === lootboxId);
      if (!lootbox) throw new Error('Lootbox not found');
      
      if (profile.crystals < lootbox.price_crystals) {
        throw new Error('Недостаточно кристаллов');
      }
      if (profile.diamonds < lootbox.price_diamonds) {
        throw new Error('Недостаточно алмазов');
      }
      
      // Deduct currency
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          crystals: profile.crystals - lootbox.price_crystals,
          diamonds: profile.diamonds - lootbox.price_diamonds,
        })
        .eq('id', profile.id);
      
      if (updateError) throw updateError;
      
      // Check if user already has this lootbox
      const existingLootbox = userLootboxes.find(ul => ul.lootbox_id === lootboxId);
      
      if (existingLootbox) {
        const { error } = await supabase
          .from('user_lootboxes')
          .update({ quantity: existingLootbox.quantity + 1 })
          .eq('id', existingLootbox.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_lootboxes')
          .insert({ user_id: profile.id, lootbox_id: lootboxId, quantity: 1 });
        if (error) throw error;
      }
      
      return lootbox;
    },
    onSuccess: (lootbox) => {
      toast.success(`Куплен ${lootbox.name_ru}!`);
      refreshProfile();
      refetchUserLootboxes();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openLootbox = useMutation({
    mutationFn: async (lootboxId: string) => {
      if (!profile?.id) throw new Error('Not authenticated');
      
      const userLootbox = userLootboxes.find(ul => ul.lootbox_id === lootboxId);
      if (!userLootbox || userLootbox.quantity < 1) {
        throw new Error('У вас нет этого лутбокса');
      }
      
      const lootbox = lootboxes.find(l => l.id === lootboxId);
      if (!lootbox) throw new Error('Lootbox not found');
      
      // Generate reward
      const reward = generateReward(lootbox);
      
      // Update lootbox quantity
      if (userLootbox.quantity === 1) {
        await supabase
          .from('user_lootboxes')
          .delete()
          .eq('id', userLootbox.id);
      } else {
        await supabase
          .from('user_lootboxes')
          .update({ quantity: userLootbox.quantity - 1 })
          .eq('id', userLootbox.id);
      }
      
      // Record opening
      await supabase
        .from('lootbox_openings')
        .insert({
          user_id: profile.id,
          lootbox_id: lootboxId,
          reward_type: reward.type,
          reward_id: reward.itemId || null,
          reward_amount: reward.amount || null,
        });
      
      // Apply reward
      if (reward.type === 'crystals' && reward.amount) {
        await supabase
          .from('profiles')
          .update({ crystals: profile.crystals + reward.amount })
          .eq('id', profile.id);
      } else if (reward.type === 'diamonds' && reward.amount) {
        await supabase
          .from('profiles')
          .update({ diamonds: profile.diamonds + reward.amount })
          .eq('id', profile.id);
      }
      
      return reward;
    },
    onSuccess: () => {
      refreshProfile();
      refetchUserLootboxes();
      queryClient.invalidateQueries({ queryKey: ['lootbox-history'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getLootboxCount = (lootboxId: string): number => {
    const userLootbox = userLootboxes.find(ul => ul.lootbox_id === lootboxId);
    return userLootbox?.quantity || 0;
  };

  return {
    lootboxes,
    userLootboxes,
    openingHistory,
    purchaseLootbox,
    openLootbox,
    getLootboxCount,
  };
};
