import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PetType {
  id: string;
  type: string;
  name: string;
  name_ru: string;
  emoji: string;
  price_crystals: number;
  price_diamonds: number;
  is_default: boolean;
  description: string | null;
  description_ru: string | null;
  bonus_type: string | null;
  bonus_value: number | null;
  rarity: string;
}

export interface UserPet {
  pet_type: string;
  pet_level: number;
  pet_xp: number;
}

export interface CollectionBonus {
  rarity: string;
  label: string;
  emoji: string;
  totalPets: number;
  ownedPets: number;
  isComplete: boolean;
  bonusType: string;
  bonusValue: number;
  bonusDescription: string;
}

const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

const RARITY_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string; border: string; glow: string }> = {
  common: { 
    label: 'Обычные', 
    emoji: '⚪',
    color: 'text-gray-400', 
    bg: 'bg-gray-500/20', 
    border: 'border-gray-500',
    glow: ''
  },
  rare: { 
    label: 'Редкие', 
    emoji: '💙',
    color: 'text-blue-400', 
    bg: 'bg-blue-500/20', 
    border: 'border-blue-500',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]'
  },
  epic: { 
    label: 'Эпические', 
    emoji: '💜',
    color: 'text-purple-400', 
    bg: 'bg-purple-500/20', 
    border: 'border-purple-500',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]'
  },
  legendary: { 
    label: 'Легендарные', 
    emoji: '⭐',
    color: 'text-amber-400', 
    bg: 'bg-amber-500/20', 
    border: 'border-amber-500',
    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.7)]'
  }
};

// Бонусы за собранные коллекции
const COLLECTION_BONUSES: Record<string, { type: string; value: number; description: string }> = {
  common: { type: 'passive_boost', value: 0.05, description: '+5% к пассивному доходу' },
  rare: { type: 'crystal_boost', value: 0.10, description: '+10% к кристаллам' },
  epic: { type: 'xp_multiplier', value: 0.15, description: '+15% к опыту' },
  legendary: { type: 'all_boost', value: 0.20, description: '+20% ко всему!' }
};

export const usePetCollection = (userId?: string) => {
  const [allPets, setAllPets] = useState<PetType[]>([]);
  const [ownedPets, setOwnedPets] = useState<Map<string, UserPet>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const [petTypesRes, ownedPetsRes] = await Promise.all([
          supabase.from('pet_types').select('*').order('rarity', { ascending: true }),
          supabase.from('user_pets').select('pet_type, pet_level, pet_xp').eq('user_id', userId)
        ]);

        if (petTypesRes.data) {
          setAllPets(petTypesRes.data as PetType[]);
        }
        
        if (ownedPetsRes.data) {
          const petMap = new Map<string, UserPet>();
          ownedPetsRes.data.forEach(p => petMap.set(p.pet_type, p));
          setOwnedPets(petMap);
        }
      } catch (error) {
        console.error('Error loading pet collection:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Питомцы по редкости
  const petsByRarity = useMemo(() => {
    const grouped: Record<string, PetType[]> = {};
    RARITY_ORDER.forEach(r => grouped[r] = []);
    
    allPets.forEach(pet => {
      if (grouped[pet.rarity]) {
        grouped[pet.rarity].push(pet);
      }
    });
    
    return grouped;
  }, [allPets]);

  // Бонусы за коллекции
  const collectionBonuses = useMemo<CollectionBonus[]>(() => {
    return RARITY_ORDER.map(rarity => {
      const petsOfRarity = petsByRarity[rarity] || [];
      const ownedOfRarity = petsOfRarity.filter(p => ownedPets.has(p.type));
      const config = RARITY_CONFIG[rarity];
      const bonus = COLLECTION_BONUSES[rarity];
      
      return {
        rarity,
        label: config.label,
        emoji: config.emoji,
        totalPets: petsOfRarity.length,
        ownedPets: ownedOfRarity.length,
        isComplete: petsOfRarity.length > 0 && ownedOfRarity.length >= petsOfRarity.length,
        bonusType: bonus.type,
        bonusValue: bonus.value,
        bonusDescription: bonus.description
      };
    });
  }, [petsByRarity, ownedPets]);

  // Общий бонус от всех собранных коллекций
  const totalCollectionBonus = useMemo(() => {
    let totalBonus = 0;
    const activeTypes: string[] = [];
    
    collectionBonuses.forEach(cb => {
      if (cb.isComplete) {
        totalBonus += cb.bonusValue;
        activeTypes.push(cb.bonusType);
      }
    });
    
    return {
      totalBonus,
      completedCollections: collectionBonuses.filter(cb => cb.isComplete).length,
      activeTypes
    };
  }, [collectionBonuses]);

  // Статистика
  const stats = useMemo(() => {
    const totalPets = allPets.length;
    const ownedCount = ownedPets.size;
    const totalLevels = Array.from(ownedPets.values()).reduce((sum, pet) => sum + pet.pet_level, 0);
    const averageLevel = ownedCount > 0 ? totalLevels / ownedCount : 0;
    const maxLevel = Math.max(1, ...Array.from(ownedPets.values()).map(p => p.pet_level));
    
    return {
      totalPets,
      ownedCount,
      collectionProgress: totalPets > 0 ? (ownedCount / totalPets) * 100 : 0,
      totalLevels,
      averageLevel,
      maxLevel
    };
  }, [allPets, ownedPets]);

  // Получить информацию о питомце с уровнем
  const getPetWithLevel = useCallback((petType: string) => {
    const pet = allPets.find(p => p.type === petType);
    const userPet = ownedPets.get(petType);
    return { pet, userPet };
  }, [allPets, ownedPets]);

  // Получить конфиг редкости
  const getRarityConfig = useCallback((rarity: string) => {
    return RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  }, []);

  // Рефреш данных
  const refresh = useCallback(async () => {
    if (!userId) return;
    
    const { data } = await supabase
      .from('user_pets')
      .select('pet_type, pet_level, pet_xp')
      .eq('user_id', userId);
      
    if (data) {
      const petMap = new Map<string, UserPet>();
      data.forEach(p => petMap.set(p.pet_type, p));
      setOwnedPets(petMap);
    }
  }, [userId]);

  return {
    allPets,
    ownedPets,
    petsByRarity,
    collectionBonuses,
    totalCollectionBonus,
    stats,
    loading,
    getPetWithLevel,
    getRarityConfig,
    refresh,
    RARITY_CONFIG
  };
};
