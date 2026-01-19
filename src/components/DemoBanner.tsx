import { motion } from 'framer-motion';
import { Monitor, Smartphone, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface DemoBannerProps {
  onShowOnboarding?: () => void;
}

export const DemoBanner = ({ onShowOnboarding }: DemoBannerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5, type: 'spring', damping: 20 }}
    >
      <div className="mx-2 mt-2">
        <motion.div 
          className="glass-card rounded-2xl overflow-hidden"
          layout
        >
          {/* Main banner */}
          <div 
            className="flex items-center justify-between px-4 py-2 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20"
                animate={{ 
                  boxShadow: [
                    '0 0 0 0 rgba(245, 158, 11, 0.4)',
                    '0 0 0 8px rgba(245, 158, 11, 0)',
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Monitor className="w-4 h-4 text-amber-500" />
              </motion.div>
              <div>
                <span className="text-sm font-bold text-amber-500">
                  DEMO
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  Демо-режим браузера
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {onShowOnboarding && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowOnboarding();
                  }}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  title="Показать обучение"
                >
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="text-muted-foreground"
              >
                ▼
              </motion.div>
            </div>
          </div>

          {/* Expanded content */}
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? 'auto' : 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="h-px bg-border" />
              
              <p className="text-xs text-muted-foreground">
                Вы играете в демо-версии. Прогресс сохраняется локально в браузере.
              </p>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Smartphone className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-primary">Полная версия в Telegram</p>
                  <p className="text-muted-foreground">Прогресс синхронизируется между устройствами</p>
                </div>
              </div>

              <motion.a
                href="https://t.me/petshopgame_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2 px-4 rounded-xl bg-[#0088cc] text-white font-medium text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🤖 Открыть в Telegram
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};
