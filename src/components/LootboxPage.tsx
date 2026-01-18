import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLootboxes, LootboxReward } from '@/hooks/useLootboxes';
import { useGameState } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Package, Gift, Sparkles, ShoppingCart, History, X } from 'lucide-react';
import Confetti from './Confetti';

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'from-gray-600 to-gray-700', border: 'border-gray-500', text: 'text-gray-300', glow: 'shadow-gray-500/30' },
  rare: { bg: 'from-blue-600 to-blue-700', border: 'border-blue-500', text: 'text-blue-300', glow: 'shadow-blue-500/50' },
  epic: { bg: 'from-purple-600 to-purple-700', border: 'border-purple-500', text: 'text-purple-300', glow: 'shadow-purple-500/50' },
  legendary: { bg: 'from-yellow-500 to-orange-600', border: 'border-yellow-400', text: 'text-yellow-300', glow: 'shadow-yellow-500/60' },
};

const rarityNames: Record<string, string> = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
};

interface LootboxPageProps {
  onBack: () => void;
}

export const LootboxPage = ({ onBack }: LootboxPageProps) => {
  const { profile } = useGameState();
  const { lootboxes, purchaseLootbox, openLootbox, getLootboxCount, openingHistory } = useLootboxes();
  const [showConfetti, setShowConfetti] = useState(false);
  const [openingBox, setOpeningBox] = useState<string | null>(null);
  const [reward, setReward] = useState<LootboxReward | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handlePurchase = async (lootboxId: string) => {
    await purchaseLootbox.mutateAsync(lootboxId);
  };

  const handleOpen = async (lootboxId: string) => {
    setOpeningBox(lootboxId);
    setReward(null);
    
    // Animate opening
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = await openLootbox.mutateAsync(lootboxId);
    setReward(result);
    setShowConfetti(true);
    
    // Close after delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    setOpeningBox(null);
    setReward(null);
  };

  const getRewardColor = (type: string, rarity?: string): string => {
    if (type === 'crystals') return '#06B6D4';
    if (type === 'diamonds') return '#EC4899';
    if (rarity === 'legendary') return '#F59E0B';
    if (rarity === 'epic') return '#A855F7';
    if (rarity === 'rare') return '#3B82F6';
    return '#9CA3AF';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-gradient-to-b from-background to-background/95 p-4 pb-24"
    >
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Opening Animation Overlay */}
      <AnimatePresence>
        {openingBox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
              {!reward ? (
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-8xl mb-4"
                >
                  📦
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      boxShadow: [
                        `0 0 30px ${getRewardColor(reward.type, reward.rarity)}50`,
                        `0 0 60px ${getRewardColor(reward.type, reward.rarity)}80`,
                        `0 0 30px ${getRewardColor(reward.type, reward.rarity)}50`,
                      ],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-card to-background flex items-center justify-center text-6xl mb-4 border-4"
                    style={{ borderColor: getRewardColor(reward.type, reward.rarity) }}
                  >
                    {reward.icon}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold mb-2"
                    style={{ color: getRewardColor(reward.type, reward.rarity) }}
                  >
                    {reward.amount ? `+${reward.amount}` : reward.itemName}
                  </motion.div>
                  {reward.rarity && (
                    <Badge className={`${rarityColors[reward.rarity]?.bg || 'bg-gray-500'}`}>
                      {rarityNames[reward.rarity] || reward.rarity}
                    </Badge>
                  )}
                </motion.div>
              )}
              
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-muted-foreground mt-4"
              >
                {reward ? 'Нажмите чтобы продолжить' : 'Открываем...'}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">📦 Лутбоксы</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="h-4 w-4 mr-1" />
          История
        </Button>
      </div>

      {/* Balance */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-card/80 rounded-xl p-3 text-center">
          <div className="text-2xl">💎</div>
          <div className="text-lg font-bold">{profile?.crystals || 0}</div>
          <div className="text-xs text-muted-foreground">Кристаллы</div>
        </div>
        <div className="flex-1 bg-card/80 rounded-xl p-3 text-center">
          <div className="text-2xl">💠</div>
          <div className="text-lg font-bold">{profile?.diamonds || 0}</div>
          <div className="text-xs text-muted-foreground">Алмазы</div>
        </div>
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-card/80 rounded-xl mb-6 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">История открытий</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {openingHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Пока нет открытий</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {openingHistory.slice(0, 10).map((opening) => (
                    <div key={opening.id} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {new Date(opening.opened_at).toLocaleDateString()}
                      </span>
                      <span className="font-medium">{opening.reward_type}</span>
                      {opening.reward_amount && (
                        <span className="text-primary">+{opening.reward_amount}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lootboxes Grid */}
      <div className="grid gap-4">
        {lootboxes.map((lootbox, index) => {
          const rarity = rarityColors[lootbox.rarity] || rarityColors.common;
          const count = getLootboxCount(lootbox.id);
          const canAfford = (profile?.crystals || 0) >= lootbox.price_crystals &&
                           (profile?.diamonds || 0) >= lootbox.price_diamonds;

          return (
            <motion.div
              key={lootbox.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl border-2 ${rarity.border} overflow-hidden shadow-xl ${rarity.glow}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${rarity.bg} opacity-20`} />
              
              <div className="relative p-5">
                <div className="flex items-start gap-4">
                  <motion.div
                    animate={{
                      y: [0, -5, 0],
                      rotate: [0, 3, -3, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-5xl"
                  >
                    {lootbox.icon}
                  </motion.div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold text-lg ${rarity.text}`}>
                        {lootbox.name_ru}
                      </h3>
                      <Badge className={`bg-gradient-to-r ${rarity.bg}`}>
                        {rarityNames[lootbox.rarity]}
                      </Badge>
                      {count > 0 && (
                        <Badge variant="secondary">×{count}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {lootbox.description_ru || lootbox.description}
                    </p>

                    {/* Drop rates preview */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {Object.entries(lootbox.drop_rates).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {value}%
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {count > 0 ? (
                        <Button
                          onClick={() => handleOpen(lootbox.id)}
                          disabled={openLootbox.isPending}
                          className="bg-gradient-to-r from-green-500 to-emerald-500"
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          Открыть
                        </Button>
                      ) : null}
                      
                      <Button
                        variant="outline"
                        onClick={() => handlePurchase(lootbox.id)}
                        disabled={!canAfford || purchaseLootbox.isPending}
                        className={rarity.border}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {lootbox.price_diamonds > 0 ? (
                          <span className="flex items-center gap-1">
                            💠 {lootbox.price_diamonds}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            💎 {lootbox.price_crystals}
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated particles */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-2 right-2"
              >
                <Sparkles className={`h-5 w-5 ${rarity.text}`} />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
