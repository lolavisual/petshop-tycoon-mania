import { motion, AnimatePresence } from 'framer-motion';
import { usePetProducts, CategoryType, categoryLabels } from '@/hooks/usePetProducts';
import { hapticImpact } from '@/lib/telegram';
import { ShoppingCart, Send, RefreshCw } from 'lucide-react';

const PetShopPage = () => {
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

  const categories = Object.keys(categoryLabels) as CategoryType[];

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

      {/* Категории */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {categories.map((cat) => (
          <motion.button
            key={cat}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedCategory === cat
                ? 'btn-gradient-primary'
                : 'glass-card text-muted-foreground hover:text-foreground'
            }`}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              hapticImpact('light');
              setSelectedCategory(cat);
            }}
          >
            <span className="mr-1">{categoryLabels[cat].icon}</span>
            {categoryLabels[cat].label}
          </motion.button>
        ))}
      </div>

      {/* Товары */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-2 gap-3"
        >
          {products.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              В этой категории пока нет товаров
            </div>
          ) : (
            products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-3 rounded-2xl flex flex-col"
              >
                {/* Иконка товара */}
                <div className="text-4xl text-center mb-2">
                  {product.icon}
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
                <div className="mt-2 text-lg font-bold text-primary">
                  {formatPrice(product.price)}
                </div>

                {/* Кнопка заказа */}
                <motion.button
                  className="mt-2 w-full py-2 rounded-xl text-sm font-bold btn-gradient-secondary flex items-center justify-center gap-1"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    hapticImpact('medium');
                    openTelegramOrder(product);
                  }}
                >
                  <Send className="w-3 h-3" />
                  Заказать
                </motion.button>
              </motion.div>
            ))
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
