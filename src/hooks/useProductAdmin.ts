import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PetProduct } from './usePetProducts';
import { toast } from 'sonner';

export const useProductAdmin = (adminSecret: string) => {
  const [products, setProducts] = useState<PetProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pet_products')
        .select('*')
        .order('category');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      toast.error('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, productId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Ошибка загрузки изображения');
      return null;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<PetProduct>) => {
    try {
      const { error } = await supabase
        .from('pet_products')
        .update(updates)
        .eq('id', productId);

      if (error) throw error;
      
      toast.success('Товар обновлён');
      await loadProducts();
      return true;
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Ошибка обновления товара');
      return false;
    }
  };

  const createProduct = async (product: Omit<PetProduct, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('pet_products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Товар создан');
      await loadProducts();
      return data;
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error('Ошибка создания товара');
      return null;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('pet_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      toast.success('Товар удалён');
      await loadProducts();
      return true;
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Ошибка удаления товара');
      return false;
    }
  };

  useEffect(() => {
    if (adminSecret) {
      loadProducts();
    }
  }, [adminSecret]);

  return {
    products,
    loading,
    loadProducts,
    uploadImage,
    updateProduct,
    createProduct,
    deleteProduct,
  };
};
