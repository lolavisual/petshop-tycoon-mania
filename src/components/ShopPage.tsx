import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '@/hooks/useShop';
import { useGameState } from '@/hooks/useGameState';
import { hapticImpact } from '@/lib/telegram';
import { ShoppingBag, Sparkles, Lock, Check, Star, Percent, Crown } from 'lucide-react';

type TabType = 'items' | 'accessories';

const ShopPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const { 
    shopItems, 
    accessories, 
    userAccessories, 
    loading, 
    purchasing,
    purchaseItem, 
    toggleEquip,
    isAccessoryOwned,
    isAccessoryEquipped,
    getDiscountedPrice
  } = useShop();
  
  const { profile } = useGameState();

  if (loading || !profile) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          🛒
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="p-4 space-y-4 pb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Баланс */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="flex justify-between items-center">
          <div className="currency-crystal text-lg">
            💎 {Math.floor(profile.crystals).toLocaleString()}
          </div>
          <div className="currency-diamond text-lg">
            💎💎 {Math.floor(profile.diamonds).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-2">
        <motion.button
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'items' 
              ? 'btn-gradient-primary' 
              : 'glass-card text-muted-foreground'
          }`}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            hapticImpact('light');
            setActiveTab('items');
          }}
        >
          <ShoppingBag className="w-4 h-4 inline mr-2" />
          Товары
        </motion.button>
        <motion.button
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'accessories' 
              ? 'btn-gradient-secondary' 
              : 'glass-card text-muted-foreground'
          }`}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            hapticImpact('light');
            setActiveTab('accessories');
          }}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Аксессуары
        </motion.button>
      </div>

      {/* Контент */}
      <AnimatePresence mode="wait">
        {activeTab === 'items' && (
          <motion.div
            key="items"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {shopItems.map((item, index) => {
              const price = getDiscountedPrice(item);
              const canAfford = (price.crystals === 0 || profile.crystals >= price.crystals) &&
                               (price.diamonds === 0 || profile.diamonds >= price.diamonds);
              const levelLocked = profile.level < item.required_level;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative overflow-hidden rounded-2xl ${
                    item.is_golden ? 'golden-card glass-card' : 'glass-card'
                  } p-4`}
                >
                  {/* Бейдж скидки */}
                  {price.hasDiscount && (
                    <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      -{price.discountPercent}%
                    </div>
                  )}

                  {/* Golden badge */}
                  {item.is_golden && (
                    <div className="absolute top-2 left-2 text-gold flex items-center gap-1 text-xs font-bold">
                      <Star className="w-4 h-4 fill-current" />
                      GOLD
                    </div>
                  )}

                  <div className="flex items-start gap-4 mt-4">
                    <div className="text-4xl">{item.icon}</div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate">{item.name_ru}</h3>
                      {item.description_ru && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description_ru}</p>
                      )}
                      
                      {/* Эффект */}
                      {item.effect_type && (
                        <div className="mt-1 text-xs text-secondary font-medium">
                          {item.effect_type === 'passive_rate' && `+${item.effect_value}/сек пассив`}
                          {item.effect_type === 'tap_multiplier' && `×${item.effect_value} за тап`}
                          {item.effect_type === 'xp_multiplier' && `×${item.effect_value} XP`}
                        </div>
                      )}

                      {/* Требуемый уровень */}
                      {levelLocked && (
                        <div className="mt-1 text-xs text-destructive flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Уровень {item.required_level}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* Цена */}
                      <div className="text-right">
                        {price.crystals > 0 && (
                          <div className={`text-sm font-bold ${price.hasDiscount ? 'text-gold' : 'currency-crystal'}`}>
                            {price.hasDiscount && (
                              <span className="line-through text-muted-foreground text-xs mr-1">
                                {item.price_crystals}
                              </span>
                            )}
                            💎 {price.crystals}
                          </div>
                        )}
                        {price.diamonds > 0 && (
                          <div className={`text-sm font-bold ${price.hasDiscount ? 'text-gold' : 'currency-diamond'}`}>
                            {price.hasDiscount && (
                              <span className="line-through text-muted-foreground text-xs mr-1">
                                {item.price_diamonds}
                              </span>
                            )}
                            💎💎 {price.diamonds}
                          </div>
                        )}
                      </div>

                      {/* Кнопка */}
                      <motion.button
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          levelLocked || !canAfford || purchasing
                            ? 'bg-muted text-muted-foreground'
                            : item.is_golden
                              ? 'btn-gradient-accent'
                              : 'btn-gradient-primary'
                        }`}
                        whileTap={!levelLocked && canAfford ? { scale: 0.95 } : {}}
                        onClick={() => !levelLocked && canAfford && purchaseItem(item.id, 'shop_item')}
                        disabled={levelLocked || !canAfford || purchasing}
                      >
                        {levelLocked ? <Lock className="w-4 h-4" /> : 'Купить'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'accessories' && (
          <motion.div
            key="accessories"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-2 gap-3"
          >
            {accessories.map((acc, index) => {
              const owned = isAccessoryOwned(acc.id);
              const equipped = isAccessoryEquipped(acc.id);
              const levelLocked = profile.level < acc.required_level;
              const canAfford = (acc.price_crystals === 0 || profile.crystals >= acc.price_crystals) &&
                               (acc.price_diamonds === 0 || profile.diamonds >= acc.price_diamonds);

              return (
                <motion.div
                  key={acc.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card p-4 rounded-2xl text-center relative ${
                    acc.is_special ? 'border-2 border-gold/50' : ''
                  } ${equipped ? 'ring-2 ring-secondary' : ''}`}
                >
                  {/* Special badge */}
                  {acc.is_special && (
                    <div className="absolute -top-2 -right-2 text-2xl">⭐</div>
                  )}

                  {/* Equipped indicator */}
                  {equipped && (
                    <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground p-1 rounded-full">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  <div className="text-4xl mb-2">{acc.icon}</div>
                  <h4 className="font-bold text-sm truncate">{acc.name_ru}</h4>
                  
                  {/* Уровень */}
                  <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                    levelLocked ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    <Crown className="w-3 h-3" />
                    Ур. {acc.required_level}
                  </div>

                  {/* Цена или статус */}
                  {owned ? (
                    <motion.button
                      className={`mt-3 w-full py-2 rounded-xl text-xs font-bold ${
                        equipped 
                          ? 'bg-secondary text-secondary-foreground' 
                          : 'btn-gradient-secondary'
                      }`}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleEquip(acc.id)}
                    >
                      {equipped ? 'Снять' : 'Надеть'}
                    </motion.button>
                  ) : (
                    <>
                      <div className="mt-2 space-y-0.5">
                        {acc.price_crystals > 0 && (
                          <div className="text-xs currency-crystal">💎 {acc.price_crystals}</div>
                        )}
                        {acc.price_diamonds > 0 && (
                          <div className="text-xs currency-diamond">💎💎 {acc.price_diamonds}</div>
                        )}
                        {acc.price_crystals === 0 && acc.price_diamonds === 0 && (
                          <div className="text-xs text-muted-foreground">Бесплатно</div>
                        )}
                      </div>

                      <motion.button
                        className={`mt-2 w-full py-2 rounded-xl text-xs font-bold ${
                          levelLocked || !canAfford || purchasing
                            ? 'bg-muted text-muted-foreground'
                            : 'btn-gradient-primary'
                        }`}
                        whileTap={!levelLocked && canAfford ? { scale: 0.95 } : {}}
                        onClick={() => !levelLocked && canAfford && purchaseItem(acc.id, 'accessory')}
                        disabled={levelLocked || !canAfford || purchasing}
                      >
                        {levelLocked ? <Lock className="w-3 h-3 mx-auto" /> : 'Купить'}
                      </motion.button>
                    </>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ShopPage;
