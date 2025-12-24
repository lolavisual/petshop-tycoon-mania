import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TelegramAuthGateProps {
  children: ReactNode;
}

export const TelegramAuthGate = ({ children }: TelegramAuthGateProps) => {
  const { loading, error, isAuthenticated, isTelegram, retry } = useTelegramAuth();

  // Загрузка
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <motion.div
          className="text-7xl mb-6"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🐾
        </motion.div>
        <motion.p
          className="text-lg text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Загрузка PetShop Tycoon...
        </motion.p>
      </div>
    );
  }

  // Ошибка авторизации
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-4"
        >
          😿
        </motion.div>
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Ошибка авторизации</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">{error}</p>
        <Button onClick={retry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Попробовать снова
        </Button>
      </div>
    );
  }

  // Не в Telegram
  if (!isTelegram && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-7xl mb-6"
        >
          🐕
        </motion.div>
        <Smartphone className="w-12 h-12 text-primary mb-4" />
        <h1 className="text-2xl font-black text-gradient-primary mb-4">
          PetShop Tycoon
        </h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Это приложение работает как Telegram Mini App. 
          Откройте бота в Telegram для игры!
        </p>
        <motion.a
          href="https://t.me/PetShopTycoonBot"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gradient-primary px-6 py-3 rounded-xl font-bold text-primary-foreground inline-flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>🤖</span>
          Открыть в Telegram
        </motion.a>
        
        {/* Демо-режим для разработки */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 border border-dashed border-muted-foreground/30 rounded-xl">
            <p className="text-sm text-muted-foreground mb-2">
              🛠️ Режим разработки
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Обновить страницу
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Авторизованы или в режиме разработки
  return <>{children}</>;
};
