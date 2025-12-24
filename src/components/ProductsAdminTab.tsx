import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useProductAdmin } from '@/hooks/useProductAdmin';
import { PetProduct, categoryLabels, CategoryType } from '@/hooks/usePetProducts';
import { 
  Plus, Upload, Trash2, Save, X, Image as ImageIcon, 
  Loader2, Package, Edit2 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductsAdminTabProps {
  adminSecret: string;
}

const emptyProduct: Omit<PetProduct, 'id'> = {
  name: '',
  name_ru: '',
  description: null,
  description_ru: null,
  category: 'cats',
  price: 0,
  currency: 'RUB',
  image_url: null,
  icon: '🐾',
  in_stock: true,
  created_at: new Date().toISOString(),
};

const ProductsAdminTab = ({ adminSecret }: ProductsAdminTabProps) => {
  const {
    products,
    loading,
    uploadImage,
    updateProduct,
    createProduct,
    deleteProduct,
  } = useProductAdmin(adminSecret);

  const [editingProduct, setEditingProduct] = useState<PetProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = Object.entries(categoryLabels).filter(([key]) => key !== 'all') as [CategoryType, { label: string; icon: string }][];

  const handleImageUpload = async (file: File, productId?: string) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }

    setUploading(true);
    
    // Для нового товара сначала создаём, потом загружаем фото
    if (!productId && isCreating) {
      const created = await createProduct(newProduct);
      if (created) {
        const imageUrl = await uploadImage(file, created.id);
        if (imageUrl) {
          await updateProduct(created.id, { image_url: imageUrl });
        }
        setIsCreating(false);
        setNewProduct(emptyProduct);
      }
    } else if (productId) {
      const imageUrl = await uploadImage(file, productId);
      if (imageUrl) {
        await updateProduct(productId, { image_url: imageUrl });
        if (editingProduct?.id === productId) {
          setEditingProduct({ ...editingProduct, image_url: imageUrl });
        }
      }
    }
    
    setUploading(false);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    
    const success = await updateProduct(editingProduct.id, {
      name_ru: editingProduct.name_ru,
      description_ru: editingProduct.description_ru,
      category: editingProduct.category,
      price: editingProduct.price,
      icon: editingProduct.icon,
      in_stock: editingProduct.in_stock,
    });
    
    if (success) {
      setEditingProduct(null);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name_ru.trim()) {
      toast.error('Введите название товара');
      return;
    }

    const created = await createProduct({
      ...newProduct,
      name: newProduct.name_ru,
    });
    
    if (created) {
      setIsCreating(false);
      setNewProduct(emptyProduct);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Удалить этот товар?')) return;
    await deleteProduct(productId);
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
      {/* Кнопка добавления */}
      <Button
        className="w-full btn-gradient-primary"
        onClick={() => setIsCreating(true)}
        disabled={isCreating}
      >
        <Plus className="w-4 h-4 mr-2" />
        Добавить товар
      </Button>

      {/* Форма создания */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-4 rounded-2xl space-y-3"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Новый товар</h3>
            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Input
            placeholder="Название товара"
            value={newProduct.name_ru}
            onChange={(e) => setNewProduct({ ...newProduct, name_ru: e.target.value })}
          />

          <Input
            placeholder="Описание"
            value={newProduct.description_ru || ''}
            onChange={(e) => setNewProduct({ ...newProduct, description_ru: e.target.value })}
          />

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Цена"
              className="flex-1"
              value={newProduct.price || ''}
              onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
            />
            <select
              className="px-3 py-2 rounded-lg bg-background border border-input"
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            >
              {categories.map(([key, { label, icon }]) => (
                <option key={key} value={key}>{icon} {label}</option>
              ))}
            </select>
          </div>

          <Input
            placeholder="Эмодзи (🐾)"
            value={newProduct.icon}
            onChange={(e) => setNewProduct({ ...newProduct, icon: e.target.value })}
            className="w-24"
          />

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleCreateProduct}>
              <Save className="w-4 h-4 mr-2" />
              Создать
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          />
        </motion.div>
      )}

      {/* Список товаров */}
      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="glass-card p-3 rounded-xl">
            {editingProduct?.id === product.id ? (
              // Режим редактирования
              <div className="space-y-3">
                <div className="flex gap-3">
                  {/* Превью изображения */}
                  <div className="relative w-16 h-16 flex-shrink-0">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name_ru}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg text-2xl">
                        {product.icon}
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                      <Upload className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], product.id)}
                      />
                    </label>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editingProduct.name_ru}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name_ru: e.target.value })}
                      placeholder="Название"
                    />
                    <Input
                      value={editingProduct.description_ru || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description_ru: e.target.value })}
                      placeholder="Описание"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-24"
                  />
                  <select
                    className="px-3 py-2 rounded-lg bg-background border border-input flex-1"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  >
                    {categories.map(([key, { label, icon }]) => (
                      <option key={key} value={key}>{icon} {label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.in_stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, in_stock: e.target.checked })}
                    />
                    В наличии
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleSaveProduct}>
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => setEditingProduct(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              // Режим просмотра
              <div className="flex items-center gap-3">
                {/* Изображение */}
                <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name_ru}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      {product.icon}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate flex items-center gap-2">
                    {product.name_ru}
                    {!product.in_stock && (
                      <span className="text-xs text-destructive">(нет в наличии)</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {product.price} ₽ • {categoryLabels[product.category as CategoryType]?.label || product.category}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditingProduct(product)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {products.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Нет товаров</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductsAdminTab;
