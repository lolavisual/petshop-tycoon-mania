import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  promo_code: string | null;
  product_ids: string[];
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  image_url: string | null;
}

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (err) {
      console.error('Error loading promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProductDiscount = (productId: string): number | null => {
    for (const promo of promotions) {
      if (promo.product_ids.includes(productId) && promo.discount_percent) {
        return promo.discount_percent;
      }
    }
    return null;
  };

  const getProductPromo = (productId: string): Promotion | null => {
    for (const promo of promotions) {
      if (promo.product_ids.includes(productId)) {
        return promo;
      }
    }
    return null;
  };

  return {
    promotions,
    loading,
    getProductDiscount,
    getProductPromo,
    refresh: loadPromotions,
  };
};
