import { motion } from 'framer-motion';
import { Promotion } from '@/hooks/usePromotions';
import { Tag, Percent, Gift, Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { hapticImpact } from '@/lib/telegram';
import { toast } from 'sonner';

interface PromotionsBannerProps {
  promotions: Promotion[];
}

const PromotionsBanner = ({ promotions }: PromotionsBannerProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (promotions.length === 0) return null;

  const copyPromoCode = (code: string) => {
    hapticImpact('light');
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Промокод ${code} скопирован!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-3">
      {promotions.map((promo, index) => (
        <motion.div
          key={promo.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 border border-primary/30"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-secondary/10 rounded-full blur-2xl" />
          </div>

          <div className="relative p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-lg">
                {promo.discount_percent ? (
                  <Percent className="w-6 h-6 text-primary-foreground" />
                ) : promo.promo_code ? (
                  <Tag className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <Gift className="w-6 h-6 text-primary-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-foreground">{promo.title}</h3>
                  {promo.discount_percent && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-destructive/20 text-destructive">
                      -{promo.discount_percent}%
                    </span>
                  )}
                </div>

                {promo.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {promo.description}
                  </p>
                )}

                {/* Promo code */}
                {promo.promo_code && (
                  <motion.button
                    className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 text-sm font-mono font-bold"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyPromoCode(promo.promo_code!)}
                  >
                    <Sparkles className="w-3 h-3 text-primary" />
                    {promo.promo_code}
                    {copiedCode === promo.promo_code ? (
                      <Check className="w-3 h-3 text-secondary" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                  </motion.button>
                )}

                {/* Products count */}
                {promo.product_ids.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    📦 {promo.product_ids.length} товар{promo.product_ids.length === 1 ? '' : promo.product_ids.length < 5 ? 'а' : 'ов'} по акции
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PromotionsBanner;
