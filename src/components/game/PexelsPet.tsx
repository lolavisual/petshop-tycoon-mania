import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface PexelsPetProps {
  isClicking: boolean;
  level: number;
  hasSantaHat?: boolean;
}

const PEXELS_API_KEY = '563492ad6f91700001000001da3210bab5904864859f8c451833de3b';

// Заранее подготовленные ID милых собак для надёжности
const CUTE_DOG_QUERIES = [
  'cute puppy face',
  'happy dog portrait',
  'golden retriever puppy',
  'corgi smile',
  'shiba inu',
  'french bulldog cute',
];

const PexelsPet = ({ isClicking, level, hasSantaHat = true }: PexelsPetProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [happiness, setHappiness] = useState(0);
  const [blinking, setBlinking] = useState(false);

  // Загрузка случайного изображения собаки
  useEffect(() => {
    const fetchDogImage = async () => {
      try {
        const query = CUTE_DOG_QUERIES[Math.floor(Math.random() * CUTE_DOG_QUERIES.length)];
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=square`,
          {
            headers: {
              Authorization: PEXELS_API_KEY,
            },
          }
        );
        
        if (!response.ok) throw new Error('Pexels API error');
        
        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
          const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
          setImageUrl(randomPhoto.src.medium);
        }
      } catch (error) {
        console.error('Error fetching dog image:', error);
        // Fallback изображение
        setImageUrl('https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=400');
      } finally {
        setLoading(false);
      }
    };

    fetchDogImage();
  }, []);

  // Реакция на клики
  useEffect(() => {
    if (isClicking) {
      setHappiness(prev => Math.min(prev + 15, 100));
    }
  }, [isClicking]);

  // Уменьшение счастья
  useEffect(() => {
    const interval = setInterval(() => {
      setHappiness(prev => Math.max(prev - 2, 0));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Эффект моргания
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Аура счастья */}
      <AnimatePresence>
        {happiness > 50 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.3, 0.5, 0.3], 
              scale: [1, 1.15, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Контейнер питомца */}
      <motion.div
        className="relative"
        animate={{
          scale: isClicking ? [1, 1.15, 0.95, 1] : [1, 1.02, 1],
          y: isClicking ? [0, -20, 0] : [0, -5, 0],
          rotate: isClicking ? [-3, 3, -2, 0] : 0,
        }}
        transition={{
          duration: isClicking ? 0.35 : 2.5,
          repeat: isClicking ? 0 : Infinity,
          ease: isClicking ? 'easeOut' : 'easeInOut',
        }}
      >
        {/* Шапка Санты */}
        {hasSantaHat && (
          <motion.div
            className="absolute -top-8 left-1/2 z-20 text-5xl"
            style={{ marginLeft: '-24px' }}
            animate={{
              rotate: isClicking ? [-10, 15, -8, 12, 0] : [-3, 3, -3],
              y: isClicking ? [-8, 0, -4, 0] : 0,
            }}
            transition={{
              duration: isClicking ? 0.5 : 2,
              repeat: isClicking ? 0 : Infinity,
            }}
          >
            🎅
          </motion.div>
        )}

        {/* Фото собаки */}
        <div className="relative">
          {loading ? (
            <motion.div
              className="w-36 h-36 rounded-full bg-muted flex items-center justify-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="text-4xl">🐕</span>
            </motion.div>
          ) : (
            <motion.div
              className="relative w-36 h-36 rounded-full overflow-hidden shadow-xl"
              style={{
                boxShadow: happiness > 60 
                  ? '0 0 30px hsl(var(--primary) / 0.5)' 
                  : '0 8px 25px rgba(0,0,0,0.3)',
              }}
            >
              <motion.img
                src={imageUrl || ''}
                alt="Питомец"
                className="w-full h-full object-cover"
                animate={{
                  filter: blinking ? 'brightness(0.8)' : 'brightness(1)',
                }}
              />
              
              {/* Overlay для эффекта моргания */}
              <AnimatePresence>
                {blinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Блики */}
              <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white/30 blur-sm" />
              <div className="absolute top-6 left-8 w-3 h-3 rounded-full bg-white/40" />
            </motion.div>
          )}

          {/* Щёчки при счастье */}
          <AnimatePresence>
            {happiness > 40 && !loading && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute left-0 top-1/2 -translate-x-2 w-5 h-4 rounded-full bg-pink-400/60"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute right-0 top-1/2 translate-x-2 w-5 h-4 rounded-full bg-pink-400/60"
                />
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Сердечки при счастье */}
        <AnimatePresence>
          {happiness > 60 && (
            <>
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-xl pointer-events-none"
                  style={{
                    left: `${20 + i * 20}%`,
                    top: '0',
                  }}
                  initial={{ opacity: 0, y: 20, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    y: [-10, -50, -80],
                    scale: [0.5, 1.2, 0.8],
                    x: (i - 1.5) * 15,
                  }}
                  transition={{ 
                    duration: 1.8, 
                    repeat: Infinity, 
                    delay: i * 0.4,
                  }}
                >
                  {i % 2 === 0 ? '❤️' : '💕'}
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Искры при клике */}
        <AnimatePresence>
          {isClicking && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`spark-${i}`}
                  className="absolute w-3 h-3 rounded-full pointer-events-none"
                  style={{
                    background: `hsl(${40 + i * 15}, 100%, 60%)`,
                    boxShadow: `0 0 10px hsl(${40 + i * 15}, 100%, 60%)`,
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: Math.cos((i * 45 * Math.PI) / 180) * 70,
                    y: Math.sin((i * 45 * Math.PI) / 180) * 70,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              ))}
              
              {/* Звёзды */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute text-lg pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * 72 + 36) * Math.PI / 180) * 55,
                    y: Math.sin((i * 72 + 36) * Math.PI / 180) * 55,
                    rotate: 360,
                  }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                >
                  ⭐
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Бейдж уровня */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Lv.{level}
      </motion.div>

      {/* Индикатор счастья */}
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
        <span className="text-xs">😊</span>
        <div className="w-2 h-16 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="w-full rounded-full"
            style={{
              background: happiness > 60 ? 'hsl(var(--primary))' : happiness > 30 ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
            }}
            animate={{ height: `${happiness}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
};

export default PexelsPet;
