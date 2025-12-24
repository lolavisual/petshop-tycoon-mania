import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, Trash2, Save, X, Upload, Loader2, Tag, 
  Percent, Calendar, Edit2, Image as ImageIcon 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Promotion {
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
  created_at: string;
}

interface Product {
  id: string;
  name_ru: string;
  price: number;
}

const PromotionsAdminTab = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emptyPromotion: Omit<Promotion, 'id' | 'created_at'> = {
    title: '',
    description: null,
    discount_percent: 10,
    promo_code: null,
    product_ids: [],
    start_date: new Date().toISOString(),
    end_date: null,
    is_active: true,
    image_url: null,
  };

  const [newPromotion, setNewPromotion] = useState(emptyPromotion);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promoRes, productsRes] = await Promise.all([
        supabase.from('promotions').select('*').order('created_at', { ascending: false }),
        supabase.from('pet_products').select('id, name_ru, price')
      ]);
      
      if (promoRes.data) setPromotions(promoRes.data);
      if (productsRes.data) setProducts(productsRes.data);
    } catch (err) {
      console.error('Error loading promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (file: File, promotionId?: string) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return null;
    }

    setUploading(true);
    try {
      const fileName = `promo-${promotionId || Date.now()}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Ошибка загрузки');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!newPromotion.title.trim()) {
      toast.error('Введите название акции');
      return;
    }

    try {
      const { error } = await supabase.from('promotions').insert(newPromotion);
      if (error) throw error;
      
      toast.success('Акция создана');
      setIsCreating(false);
      setNewPromotion(emptyPromotion);
      loadData();
    } catch (err) {
      console.error('Create error:', err);
      toast.error('Ошибка создания');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;

    try {
      const { error } = await supabase
        .from('promotions')
        .update({
          title: editing.title,
          description: editing.description,
          discount_percent: editing.discount_percent,
          promo_code: editing.promo_code,
          product_ids: editing.product_ids,
          start_date: editing.start_date,
          end_date: editing.end_date,
          is_active: editing.is_active,
          image_url: editing.image_url,
        })
        .eq('id', editing.id);

      if (error) throw error;
      
      toast.success('Акция обновлена');
      setEditing(null);
      loadData();
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Ошибка обновления');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить акцию?')) return;

    try {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Акция удалена');
      loadData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Ошибка удаления');
    }
  };

  const toggleProduct = (productId: string, target: 'new' | 'edit') => {
    if (target === 'new') {
      const ids = newPromotion.product_ids.includes(productId)
        ? newPromotion.product_ids.filter(id => id !== productId)
        : [...newPromotion.product_ids, productId];
      setNewPromotion({ ...newPromotion, product_ids: ids });
    } else if (editing) {
      const ids = editing.product_ids.includes(productId)
        ? editing.product_ids.filter(id => id !== productId)
        : [...editing.product_ids, productId];
      setEditing({ ...editing, product_ids: ids });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Button
        className="w-full btn-gradient-primary"
        onClick={() => setIsCreating(true)}
        disabled={isCreating}
      >
        <Plus className="w-4 h-4 mr-2" />
        Создать акцию
      </Button>

      {/* Форма создания */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-4 rounded-2xl space-y-3"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Новая акция
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Input
            placeholder="Название акции"
            value={newPromotion.title}
            onChange={(e) => setNewPromotion({ ...newPromotion, title: e.target.value })}
          />

          <Input
            placeholder="Описание"
            value={newPromotion.description || ''}
            onChange={(e) => setNewPromotion({ ...newPromotion, description: e.target.value })}
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Скидка %</label>
              <Input
                type="number"
                value={newPromotion.discount_percent || ''}
                onChange={(e) => setNewPromotion({ ...newPromotion, discount_percent: Number(e.target.value) })}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Промокод</label>
              <Input
                placeholder="SALE2024"
                value={newPromotion.promo_code || ''}
                onChange={(e) => setNewPromotion({ ...newPromotion, promo_code: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Товары в акции</label>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => toggleProduct(p.id, 'new')}
                  className={`px-2 py-1 rounded text-xs ${
                    newPromotion.product_ids.includes(p.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {p.name_ru}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleCreate}>
              <Save className="w-4 h-4 mr-2" />
              Создать
            </Button>
          </div>
        </motion.div>
      )}

      {/* Список акций */}
      <div className="space-y-2">
        {promotions.map((promo) => (
          <div key={promo.id} className="glass-card p-3 rounded-xl">
            {editing?.id === promo.id ? (
              <div className="space-y-3">
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
                <Input
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Скидка %"
                    value={editing.discount_percent || ''}
                    onChange={(e) => setEditing({ ...editing, discount_percent: Number(e.target.value) })}
                    className="w-24"
                  />
                  <Input
                    placeholder="Промокод"
                    value={editing.promo_code || ''}
                    onChange={(e) => setEditing({ ...editing, promo_code: e.target.value.toUpperCase() })}
                    className="flex-1"
                  />
                </div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {products.map(p => (
                    <button
                      key={p.id}
                      onClick={() => toggleProduct(p.id, 'edit')}
                      className={`px-2 py-1 rounded text-xs ${
                        editing.product_ids.includes(p.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {p.name_ru}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  />
                  Активна
                </label>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleUpdate}>
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${promo.is_active ? 'bg-secondary/20' : 'bg-muted'}`}>
                  <Percent className={`w-5 h-5 ${promo.is_active ? 'text-secondary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate flex items-center gap-2">
                    {promo.title}
                    {!promo.is_active && <span className="text-xs text-muted-foreground">(неактивна)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {promo.discount_percent}% • {promo.product_ids.length} товаров
                    {promo.promo_code && ` • ${promo.promo_code}`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(promo)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(promo.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {promotions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Нет акций</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PromotionsAdminTab;
