import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticNotification } from '@/lib/telegram';

interface PremiumPlan {
  id: string;
  name: string;
  name_ru: string;
  description: string | null;
  description_ru: string | null;
  duration_days: number;
  stars_price: number;
  crystals_bonus: number;
  diamonds_bonus: number;
  click_multiplier: number;
  passive_multiplier: number;
  xp_multiplier: number;
  exclusive_pet: string | null;
}

interface PremiumSubscription {
  id: string;
  plan_type: string;
  stars_paid: number;
  started_at: string;
  expires_at: string;
  is_active: boolean;
}

export function usePremium() {
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const loadPremiumData = useCallback(async () => {
    try {
      // Load plans
      const { data: plansData } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('is_active', true)
        .order('stars_price', { ascending: true });

      if (plansData) {
        setPlans(plansData);
      }

      // Load user subscription
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subData } = await supabase
          .from('premium_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gte('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1)
          .single();

        if (subData) {
          setSubscription(subData);
          setIsPremium(true);
        }

        // Check profile premium status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium, premium_expires_at')
          .eq('id', user.id)
          .single();

        if (profile) {
          const premiumActive = profile.is_premium && 
            profile.premium_expires_at && 
            new Date(profile.premium_expires_at) > new Date();
          setIsPremium(premiumActive);
        }
      }
    } catch (err) {
      console.error('Error loading premium data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const purchasePremium = useCallback(async (planId: string) => {
    if (purchasing) return null;
    
    setPurchasing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Необходима авторизация');
        return null;
      }

      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        toast.error('План не найден');
        return null;
      }

      // Try to create Telegram Stars invoice
      const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke('telegram-stars-payment', {
        body: {
          action: 'create_invoice',
          planId,
          userId: user.id
        }
      });

      if (invoiceError) {
        console.error('Invoice error:', invoiceError);
        // Fall back to in-game currency
        return await purchaseWithStones(user.id, plan);
      }

      if (invoiceData?.success && invoiceData?.invoiceLink) {
        // Open Telegram payment dialog
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.openInvoice) {
          tg.openInvoice(invoiceData.invoiceLink, async (status: string) => {
            if (status === 'paid') {
              hapticNotification('success');
              toast.success(`🌟 Premium активирован на ${plan.duration_days} дней!`);
              await loadPremiumData();
            } else if (status === 'cancelled') {
              toast.info('Оплата отменена');
            } else if (status === 'failed') {
              toast.error('Ошибка оплаты');
            }
          });
          return plan;
        } else {
          // Fallback for non-Telegram environment
          window.open(invoiceData.invoiceLink, '_blank');
          toast.info('Откройте ссылку для оплаты в Telegram');
          return plan;
        }
      }

      // Fall back to in-game currency
      return await purchaseWithStones(user.id, plan);
    } catch (err) {
      console.error('Error purchasing premium:', err);
      toast.error('Ошибка покупки');
      return null;
    } finally {
      setPurchasing(false);
    }
  }, [purchasing, plans, loadPremiumData]);

  const purchaseWithStones = async (userId: string, plan: PremiumPlan) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stones, crystals, diamonds')
      .eq('id', userId)
      .single();

    if (!profile) {
      toast.error('Профиль не найден');
      return null;
    }

    // Use stones as premium currency (1 stone = 10 stars equivalent)
    const stonesRequired = Math.ceil(plan.stars_price / 10);
    
    if (profile.stones < stonesRequired) {
      toast.error(`Недостаточно камней! Нужно: ${stonesRequired} 🪨`);
      return null;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

    // Create subscription
    await supabase
      .from('premium_subscriptions')
      .insert({
        user_id: userId,
        plan_type: plan.name,
        stars_paid: plan.stars_price,
        expires_at: expiresAt.toISOString(),
        is_active: true
      });

    // Update profile
    await supabase
      .from('profiles')
      .update({
        stones: profile.stones - stonesRequired,
        crystals: profile.crystals + plan.crystals_bonus,
        diamonds: profile.diamonds + plan.diamonds_bonus,
        is_premium: true,
        premium_expires_at: expiresAt.toISOString()
      })
      .eq('id', userId);

    // Grant exclusive pet if available
    if (plan.exclusive_pet) {
      await supabase
        .from('user_pets')
        .upsert({
          user_id: userId,
          pet_type: plan.exclusive_pet
        }, { onConflict: 'user_id,pet_type' });
    }

    setIsPremium(true);
    hapticNotification('success');
    toast.success(`🌟 Premium активирован на ${plan.duration_days} дней!`);

    await loadPremiumData();
    return plan;
  };

  const getMultipliers = useCallback(() => {
    if (!isPremium || !subscription) {
      return { click: 1, passive: 1, xp: 1 };
    }

    const plan = plans.find(p => p.name === subscription.plan_type);
    if (!plan) {
      return { click: 1.5, passive: 2, xp: 1.5 }; // Default premium multipliers
    }

    return {
      click: plan.click_multiplier,
      passive: plan.passive_multiplier,
      xp: plan.xp_multiplier
    };
  }, [isPremium, subscription, plans]);

  const getDaysRemaining = useCallback(() => {
    if (!subscription) return 0;
    
    const expires = new Date(subscription.expires_at);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [subscription]);

  useEffect(() => {
    loadPremiumData();
  }, [loadPremiumData]);

  return {
    plans,
    subscription,
    isPremium,
    loading,
    purchasing,
    purchasePremium,
    getMultipliers,
    getDaysRemaining,
    refresh: loadPremiumData
  };
}
