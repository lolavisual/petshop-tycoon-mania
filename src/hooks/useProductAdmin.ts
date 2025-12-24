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

  const downloadImageFromUrl = async (url: string, productId: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const blob = await response.blob();
      const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${productId}-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('Error downloading image from URL:', err);
      return null;
    }
  };

  const bulkUpsertProducts = async (
    products: Omit<PetProduct, 'id'>[],
    options: { updateExisting: boolean; importImages: boolean } = { updateExisting: false, importImages: false }
  ) => {
    try {
      const results = { created: 0, updated: 0, errors: 0 };
      
      for (const product of products) {
        // Check if product exists by name
        const { data: existing } = await supabase
          .from('pet_products')
          .select('id, image_url')
          .eq('name_ru', product.name_ru)
          .maybeSingle();

        let imageUrl = product.image_url;
        
        // Download and upload image if URL provided
        if (options.importImages && product.image_url && product.image_url.startsWith('http')) {
          const productId = existing?.id || crypto.randomUUID();
          const uploadedUrl = await downloadImageFromUrl(product.image_url, productId);
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          }
        }

        if (existing && options.updateExisting) {
          // Update existing product
          const { error } = await supabase
            .from('pet_products')
            .update({ ...product, image_url: imageUrl || existing.image_url })
            .eq('id', existing.id);
          
          if (error) {
            results.errors++;
          } else {
            results.updated++;
          }
        } else if (!existing) {
          // Create new product
          const { error } = await supabase
            .from('pet_products')
            .insert({ ...product, image_url: imageUrl });
          
          if (error) {
            results.errors++;
          } else {
            results.created++;
          }
        }
      }
      
      await loadProducts();
      return results;
    } catch (err) {
      console.error('Error bulk upserting products:', err);
      toast.error('Ошибка импорта товаров');
      return null;
    }
  };

  const bulkCreateProducts = async (products: Omit<PetProduct, 'id'>[]) => {
    try {
      const { data, error } = await supabase
        .from('pet_products')
        .insert(products)
        .select();

      if (error) throw error;
      
      await loadProducts();
      return data;
    } catch (err) {
      console.error('Error bulk creating products:', err);
      toast.error('Ошибка импорта товаров');
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
    bulkCreateProducts,
    bulkUpsertProducts,
    deleteProduct,
  };
};
