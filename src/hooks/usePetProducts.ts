import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PetProduct {
  id: string;
  name: string;
  name_ru: string;
  description: string | null;
  description_ru: string | null;
  category: string;
  price: number;
  currency: string;
  image_url: string | null;
  icon: string;
  in_stock: boolean;
}

export type CategoryType = 'all' | 'cats' | 'dogs' | 'birds' | 'accessories';

export const categoryLabels: Record<CategoryType, { label: string; icon: string }> = {
  all: { label: 'Все товары', icon: '🐾' },
  cats: { label: 'Для кошек', icon: '🐱' },
  dogs: { label: 'Для собак', icon: '🐕' },
  birds: { label: 'Для птиц', icon: '🦜' },
  accessories: { label: 'Аксессуары', icon: '🧳' },
};

export const usePetProducts = () => {
  const [products, setProducts] = useState<PetProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pet_products')
        .select('*')
        .order('category', { ascending: true });

      if (fetchError) throw fetchError;

      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const openTelegramOrder = (product: PetProduct) => {
    const message = encodeURIComponent(
      `Здравствуйте! Хочу заказать:\n\n` +
      `📦 ${product.name_ru}\n` +
      `💰 Цена: ${formatPrice(product.price)}\n\n` +
      `Пожалуйста, уточните наличие и условия доставки.`
    );
    
    // Открываем чат с ботом магазина
    window.open(`https://t.me/petshopgame_bot?text=${message}`, '_blank');
  };

  return {
    products: filteredProducts,
    allProducts: products,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    formatPrice,
    openTelegramOrder,
    refresh: loadProducts,
  };
};
