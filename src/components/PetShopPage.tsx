import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePetProducts, CategoryType, categoryLabels, isNewProduct, isHitProduct } from '@/hooks/usePetProducts';
import { usePromotions } from '@/hooks/usePromotions';
import { useGameState } from '@/hooks/useGameState';
import PromotionsBanner from './PromotionsBanner';
import { hapticImpact } from '@/lib/telegram';
import { ShoppingCart, Send, RefreshCw, Heart, Sparkles, Flame, Package, PackageX, Percent, Gift, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Локальное хранилище избранного
const FAVORITES_KEY = 'petshop_favorites';

const getFavorites = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveFavorites = (favorites: string[]) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

interface PetShopPageProps {
  setCurrentPage?: (page: string) => void;
}

const PetShopPage = ({ setCurrentPage }: PetShopPageProps) => {
  const {
    products,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    formatPrice,
    openTelegramOrder,
    refresh,
  } = usePetProducts();

  const { promotions, getProductDiscount, getProductPromo } = usePromotions();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const toggleFavorite = (productId: string) => {
    hapticImpact('light');
    setFavorites(prev => {
      const newFavorites = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      saveFavorites(newFavorites);
      return newFavorites;
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  const categories = Object.keys(categoryLabels) as CategoryType[];

  const displayProducts = showFavoritesOnly 
    ? products.filter(p => favorites.includes(p.id))
    : products;

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          🐾
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={refresh}
          className="btn-gradient-primary flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Повторить
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 space-y-4 pb-24"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary" />
          Зоомагазин
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Товары для ваших питомцев
        </p>
      </div>

      {/* Lootbox Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-premium p-4 rounded-2xl cursor-pointer hover:scale-[1.02] transition-transform"
        onClick={() => {
          hapticImpact('medium');
          setCurrentPage?.('lootbox');
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl"
            >
              🎁
            </motion.div>
            <div>
              <h3 className="font-bold text-foreground">Лутбоксы</h3>
              <p className="text-xs text-muted-foreground">
                Открывай сундуки и получай редких питомцев!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              НОВИНКА
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </motion.div>

      {/* Активные акции */}
      {promotions.length > 0 && (
        <PromotionsBanner promotions={promotions} />
      )}

      {/* Фильтр избранного */}
      {favorites.length > 0 && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            showFavoritesOnly
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
              : 'glass-card text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => {
            hapticImpact('light');
            setShowFavoritesOnly(!showFavoritesOnly);
          }}
        >
          <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-white' : ''}`} />
          Избранное ({favorites.length})
        </motion.button>
      )}

      {/* Категории - Enhanced */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {categories.map((cat, index) => (
          <motion.button
            type="button"
            key={cat}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              hapticImpact('light');
              setSelectedCategory(cat);
              setShowFavoritesOnly(false);
            }}
          >
            <span className="mr-1.5">{categoryLabels[cat].icon}</span>
            {categoryLabels[cat].label}
          </motion.button>
        ))}
      </div>

      {/* Товары */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedCategory}-${showFavoritesOnly}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-2 gap-3"
        >
          {displayProducts.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              {showFavoritesOnly 
                ? 'В избранном пока ничего нет' 
                : 'В этой категории пока нет товаров'}
            </div>
          ) : (
            displayProducts.map((product, index) => {
              const isNew = isNewProduct(product.created_at);
              const isHit = isHitProduct(product);
              const isFav = isFavorite(product.id);
              const discount = getProductDiscount(product.id);
              const promo = getProductPromo(product.id);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className={`product-card flex flex-col relative ${
                    !product.in_stock ? 'opacity-70' : ''
                  } ${promo ? 'ring-2 ring-primary/50' : ''}`}
                >
                  {/* Бейджи */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    {discount && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center gap-1 shadow-md"
                      >
                        <Percent className="w-3 h-3" />
                        -{discount}%
                      </motion.div>
                    )}
                    {isNew && !discount && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-white flex items-center gap-1 shadow-md"
                      >
                        <Sparkles className="w-3 h-3" />
                        Новинка
                      </motion.div>
                    )}
                    {isHit && !discount && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white flex items-center gap-1 shadow-md"
                      >
                        <Flame className="w-3 h-3" />
                        Хит
                      </motion.div>
                    )}
                  </div>

                  {/* Кнопка избранного */}
                  <motion.button
                    type="button"
                    className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md"
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                  >
                    <Heart 
                      className={`w-4 h-4 transition-colors ${
                        isFav 
                          ? 'text-rose-500 fill-rose-500' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  </motion.button>

                  {/* Изображение или иконка товара */}
                  <div className="relative">
                    {product.image_url ? (
                      <div className="aspect-square w-full overflow-hidden bg-muted">
                        <img 
                          src={product.image_url} 
                          alt={product.name_ru}
                          className={`w-full h-full object-cover transition-all ${
                            !product.in_stock ? 'grayscale' : ''
                          }`}
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className={`aspect-square w-full flex items-center justify-center bg-muted/50 text-5xl ${
                        !product.in_stock ? 'grayscale' : ''
                      }`}>
                        {product.icon}
                      </div>
                    )}

                    {/* Статус наличия */}
                    {!product.in_stock && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-bold flex items-center gap-1">
                          <PackageX className="w-4 h-4" />
                          Нет в наличии
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    {/* Статус наличия - маленький индикатор */}
                    <div className="flex items-center gap-1 mb-1">
                      {product.in_stock ? (
                        <span className="flex items-center gap-1 text-[10px] text-secondary font-medium">
                          <Package className="w-3 h-3" />
                          В наличии
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                          <PackageX className="w-3 h-3" />
                          Под заказ
                        </span>
                      )}
                    </div>

                    {/* Название */}
                    <h3 className="font-bold text-sm text-foreground line-clamp-2 min-h-[2.5rem]">
                      {product.name_ru}
                    </h3>

                    {/* Описание */}
                    {product.description_ru && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-1">
                        {product.description_ru}
                      </p>
                    )}

                    {/* Цена */}
                    <div className="mt-2">
                      {discount ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(Math.round(product.price * (1 - discount / 100)))}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>

                    {/* Кнопка заказа */}
                    <motion.button
                      type="button"
                      className={`mt-2 w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 ${
                        product.in_stock 
                          ? 'btn-gradient-secondary' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        hapticImpact('medium');
                        openTelegramOrder(product);
                      }}
                    >
                      <Send className="w-3 h-3" />
                      {product.in_stock ? 'Заказать' : 'Уточнить'}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* Инфо о заказе */}
      <div className="glass-card p-4 rounded-2xl text-center">
        <p className="text-sm text-muted-foreground">
          📱 Для заказа нажмите кнопку <strong>«Заказать»</strong> — 
          откроется чат с нашим ботом в Telegram
        </p>
      </div>
    </motion.div>
  );
};

export default PetShopPage;