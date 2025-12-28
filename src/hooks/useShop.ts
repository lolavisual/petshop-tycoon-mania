import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hapticImpact, hapticNotification } from '@/lib/telegram';
import { toast } from 'sonner';

export interface ShopItem {
  id: string;
  name: string;
  name_ru: string;
  description_ru: string | null;
  icon: string;
  category: string;
  price_crystals: number;
  price_diamonds: number;
  effect_type: string | null;
  effect_value: number | null;
  is_golden: boolean;
  discount_percent: number;
  required_level: number;
}

export interface Accessory {
  id: string;
  name: string;
  name_ru: string;
  description_ru: string | null;
  icon: string;
  category: string;
  required_level: number;
  price_crystals: number;
  price_diamonds: number;
  is_special: boolean;
}

export interface UserAccessory extends Accessory {
  is_equipped: boolean;
}

export function useShop() {
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [userAccessories, setUserAccessories] = useState<UserAccessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Загрузка товаров и аксессуаров
  const loadShop = useCallback(async () => {
    try {
      setLoading(true);

      // Загружаем товары магазина
      const { data: items } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_active', true)
        .order('is_golden', { ascending: false })
        .order('price_crystals', { ascending: true });

      if (items) {
        setShopItems(items as ShopItem[]);
      }

      // Загружаем все аксессуары
      const { data: accs } = await supabase
        .from('accessories')
        .select('*')
        .order('required_level', { ascending: true });

      if (accs) {
        setAccessories(accs as Accessory[]);
      }

      // Загружаем аксессуары пользователя
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userAccs } = await supabase
          .from('user_accessories')
          .select(`
            is_equipped,
            accessories (*)
          `)
          .eq('user_id', user.id);

        if (userAccs) {
          const formatted: UserAccessory[] = userAccs.map((ua: unknown) => {
            const item = ua as { is_equipped: boolean; accessories: Accessory };
            return {
              ...item.accessories,
              is_equipped: item.is_equipped
            };
          });
          setUserAccessories(formatted);
        }
      }
    } catch (err: unknown) {
      console.error('Ошибка загрузки магазина:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Покупка товара
  const purchaseItem = useCallback(async (itemId: string, itemType: 'shop_item' | 'accessory', quantity = 1) => {
    if (purchasing) return false;
    
    setPurchasing(true);
    hapticImpact('medium');

    try {
      const { data, error } = await supabase.functions.invoke('shop-purchase', {
        body: { itemId, itemType, quantity }
      });

      if (error || data?.error) {
        hapticNotification('error');
        toast.error(data?.error || 'Ошибка покупки');
        return false;
      }

      hapticNotification('success');
      
      let message = `✅ Куплено: ${data.item}`;
      if (data.priceCrystals > 0) message += ` (-${data.priceCrystals}💎)`;
      if (data.priceDiamonds > 0) message += ` (-${data.priceDiamonds}💎💎)`;
      
      if (data.effectApplied) {
        if (data.effectApplied.type === 'passive_rate') {
          message += ` | Пассив +${data.effectApplied.value}/сек`;
        }
      }
      
      toast.success(message);

      // Перезагружаем данные
      await loadShop();
      return true;
    } catch (err: unknown) {
      console.error('Ошибка покупки:', err);
      hapticNotification('error');
      toast.error('Ошибка покупки');
      return false;
    } finally {
      setPurchasing(false);
    }
  }, [purchasing, loadShop]);

  // Экипировка аксессуара
  const toggleEquip = useCallback(async (accessoryId: string, equip?: boolean) => {
    hapticImpact('light');

    try {
      const { data, error } = await supabase.functions.invoke('accessory-equip', {
        body: { accessoryId, equip }
      });

      if (error || data?.error) {
        hapticNotification('error');
        toast.error(data?.error || 'Ошибка');
        return false;
      }

      hapticNotification('success');
      toast.success(data.equipped ? `${data.accessory} надет` : `${data.accessory} снят`);

      // Обновляем локальный стейт
      setUserAccessories(prev => prev.map(ua => {
        if (ua.id === accessoryId) {
          return { ...ua, is_equipped: data.equipped };
        }
        // Снимаем другие той же категории
        const target = prev.find(a => a.id === accessoryId);
        if (target && ua.category === target.category && ua.id !== accessoryId && data.equipped) {
          return { ...ua, is_equipped: false };
        }
        return ua;
      }));

      return true;
    } catch (err: unknown) {
      hapticNotification('error');
      return false;
    }
  }, []);

  // Проверка, куплен ли аксессуар
  const isAccessoryOwned = useCallback((accessoryId: string): boolean => {
    return userAccessories.some(ua => ua.id === accessoryId);
  }, [userAccessories]);

  // Проверка, экипирован ли аксессуар
  const isAccessoryEquipped = useCallback((accessoryId: string): boolean => {
    return userAccessories.some(ua => ua.id === accessoryId && ua.is_equipped);
  }, [userAccessories]);

  // Получение цены с учётом скидки
  const getDiscountedPrice = useCallback((item: ShopItem) => {
    if (item.is_golden && item.discount_percent > 0) {
      const discount = item.discount_percent / 100;
      return {
        crystals: Math.floor(item.price_crystals * (1 - discount)),
        diamonds: Math.floor(item.price_diamonds * (1 - discount)),
        hasDiscount: true,
        discountPercent: item.discount_percent
      };
    }
    return {
      crystals: item.price_crystals,
      diamonds: item.price_diamonds,
      hasDiscount: false,
      discountPercent: 0
    };
  }, []);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  return {
    shopItems,
    accessories,
    userAccessories,
    loading,
    purchasing,
    purchaseItem,
    toggleEquip,
    isAccessoryOwned,
    isAccessoryEquipped,
    getDiscountedPrice,
    refreshShop: loadShop
  };
}
