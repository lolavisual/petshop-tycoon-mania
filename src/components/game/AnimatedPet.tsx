import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface AnimatedPetProps {
  isClicking: boolean;
  level: number;
  hasSantaHat?: boolean;
}

const AnimatedPet = ({ isClicking, level, hasSantaHat = true }: AnimatedPetProps) => {
  const [blinking, setBlinking] = useState(false);
  const [tailWag, setTailWag] = useState(0);
  const [tongueOut, setTongueOut] = useState(false);
  const [happiness, setHappiness] = useState(0);

  // Моргание каждые 3-5 секунд
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Виляние хвостом
  useEffect(() => {
    const wagInterval = setInterval(() => {
      setTailWag(prev => prev + 1);
    }, 300);
    return () => clearInterval(wagInterval);
  }, []);

  // Реакция на клики - увеличение счастья
  useEffect(() => {
    if (isClicking) {
      setHappiness(prev => Math.min(prev + 10, 100));
      setTongueOut(true);
    }
  }, [isClicking]);

  // Уменьшение счастья со временем
  useEffect(() => {
    const decreaseInterval = setInterval(() => {
      setHappiness(prev => Math.max(prev - 1, 0));
      if (happiness < 30) setTongueOut(false);
    }, 500);
    return () => clearInterval(decreaseInterval);
  }, [happiness]);

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Аура счастья */}
      <AnimatePresence>
        {happiness > 50 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3], 
              scale: [1, 1.1, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Контейнер пёсика с дыханием */}
      <motion.div
        className="relative"
        animate={{
          scale: isClicking ? [1, 1.15, 0.95, 1] : [1, 1.02, 1],
          y: isClicking ? [0, -15, 0] : [0, -3, 0],
        }}
        transition={{
          duration: isClicking ? 0.3 : 2,
          repeat: isClicking ? 0 : Infinity,
          ease: isClicking ? 'easeOut' : 'easeInOut',
        }}
      >
        {/* Шапка Санты */}
        {hasSantaHat && (
          <motion.div
            className="absolute -top-10 left-1/2 z-20"
            style={{ marginLeft: '-28px' }}
            animate={{
              rotate: isClicking ? [-5, 15, -5, 10, 0] : [-2, 2, -2],
              y: isClicking ? [-5, 0, -3, 0] : 0,
            }}
            transition={{
              duration: isClicking ? 0.4 : 1.5,
              repeat: isClicking ? 0 : Infinity,
            }}
          >
            {/* SVG Шапка Санты */}
            <svg width="56" height="48" viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Основа шапки */}
              <ellipse cx="28" cy="42" rx="26" ry="6" fill="#fff" />
              <path d="M6 40 C10 10, 46 10, 50 40" fill="#e53935" />
              <path d="M50 40 C52 20, 55 15, 52 8 L48 35" fill="#e53935" />
              {/* Помпон */}
              <motion.circle
                cx="52"
                cy="8"
                r="6"
                fill="#fff"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              {/* Блики на шапке */}
              <ellipse cx="20" cy="25" rx="4" ry="8" fill="#ff5252" opacity="0.5" />
            </svg>
          </motion.div>
        )}

        {/* Тело пёсика */}
        <svg width="120" height="140" viewBox="0 0 120 140" className="drop-shadow-lg">
          {/* Тень */}
          <ellipse cx="60" cy="135" rx="35" ry="5" fill="hsl(var(--foreground) / 0.1)" />

          {/* Задние лапы */}
          <motion.g
            animate={{ y: isClicking ? [0, -5, 0] : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ellipse cx="35" cy="120" rx="12" ry="15" fill="#8B4513" />
            <ellipse cx="85" cy="120" rx="12" ry="15" fill="#8B4513" />
            {/* Подушечки */}
            <ellipse cx="35" cy="128" rx="6" ry="4" fill="#5D3A1A" />
            <ellipse cx="85" cy="128" rx="6" ry="4" fill="#5D3A1A" />
          </motion.g>

          {/* Хвост */}
          <motion.g
            style={{ transformOrigin: '95px 85px' }}
            animate={{
              rotate: [
                -20 + Math.sin(tailWag) * 25,
                20 + Math.sin(tailWag) * 25,
              ],
            }}
            transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse' }}
          >
            <path
              d="M95 85 Q115 75, 118 55 Q120 45, 115 40"
              stroke="#8B4513"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
          </motion.g>

          {/* Тело */}
          <ellipse cx="60" cy="90" rx="38" ry="35" fill="#D2691E" />
          <ellipse cx="60" cy="95" rx="28" ry="25" fill="#DEB887" />

          {/* Передние лапы */}
          <motion.g
            animate={{ 
              y: isClicking ? [0, 5, 0] : 0,
              rotate: isClicking ? [0, 5, -5, 0] : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <ellipse cx="38" cy="115" rx="10" ry="14" fill="#D2691E" />
            <ellipse cx="82" cy="115" rx="10" ry="14" fill="#D2691E" />
            <ellipse cx="38" cy="123" rx="5" ry="4" fill="#8B4513" />
            <ellipse cx="82" cy="123" rx="5" ry="4" fill="#8B4513" />
          </motion.g>

          {/* Голова */}
          <motion.g
            animate={{
              rotate: isClicking ? [0, -8, 8, 0] : [0, 2, 0, -2, 0],
            }}
            transition={{
              duration: isClicking ? 0.4 : 3,
              repeat: isClicking ? 0 : Infinity,
            }}
            style={{ transformOrigin: '60px 50px' }}
          >
            {/* Основа головы */}
            <ellipse cx="60" cy="45" rx="32" ry="30" fill="#D2691E" />
            
            {/* Уши */}
            <motion.ellipse
              cx="30"
              cy="25"
              rx="12"
              ry="18"
              fill="#8B4513"
              animate={{ 
                rotate: isClicking ? [0, 15, -5, 0] : [-5, 5, -5],
              }}
              transition={{ 
                duration: isClicking ? 0.3 : 2, 
                repeat: isClicking ? 0 : Infinity,
              }}
              style={{ transformOrigin: '35px 35px' }}
            />
            <motion.ellipse
              cx="90"
              cy="25"
              rx="12"
              ry="18"
              fill="#8B4513"
              animate={{ 
                rotate: isClicking ? [0, -15, 5, 0] : [5, -5, 5],
              }}
              transition={{ 
                duration: isClicking ? 0.3 : 2, 
                repeat: isClicking ? 0 : Infinity,
                delay: 0.1,
              }}
              style={{ transformOrigin: '85px 35px' }}
            />

            {/* Морда (светлая область) */}
            <ellipse cx="60" cy="55" rx="20" ry="18" fill="#FAEBD7" />

            {/* Глаза */}
            <g>
              {/* Левый глаз */}
              <ellipse cx="45" cy="42" rx="8" ry={blinking ? 1 : 9} fill="#fff" />
              <motion.ellipse
                cx="46"
                cy="43"
                rx="5"
                ry={blinking ? 0.5 : 6}
                fill="#4a3728"
                animate={{ 
                  cx: isClicking ? [46, 48, 44, 46] : 46 
                }}
                transition={{ duration: 0.3 }}
              />
              <ellipse cx="47" cy="40" rx="2" ry={blinking ? 0.3 : 2} fill="#fff" />
              
              {/* Правый глаз */}
              <ellipse cx="75" cy="42" rx="8" ry={blinking ? 1 : 9} fill="#fff" />
              <motion.ellipse
                cx="74"
                cy="43"
                rx="5"
                ry={blinking ? 0.5 : 6}
                fill="#4a3728"
                animate={{ 
                  cx: isClicking ? [74, 76, 72, 74] : 74 
                }}
                transition={{ duration: 0.3 }}
              />
              <ellipse cx="75" cy="40" rx="2" ry={blinking ? 0.3 : 2} fill="#fff" />
            </g>

            {/* Счастливые глаза при высоком уровне счастья */}
            {happiness > 70 && (
              <g>
                <path d="M38 42 Q45 36, 52 42" stroke="#4a3728" strokeWidth="3" fill="none" />
                <path d="M68 42 Q75 36, 82 42" stroke="#4a3728" strokeWidth="3" fill="none" />
              </g>
            )}

            {/* Брови */}
            <motion.path
              d="M37 32 Q42 28, 48 32"
              stroke="#8B4513"
              strokeWidth="2"
              fill="none"
              animate={{ d: isClicking ? "M37 30 Q42 25, 48 30" : "M37 32 Q42 28, 48 32" }}
            />
            <motion.path
              d="M72 32 Q78 28, 83 32"
              stroke="#8B4513"
              strokeWidth="2"
              fill="none"
              animate={{ d: isClicking ? "M72 30 Q78 25, 83 30" : "M72 32 Q78 28, 83 32" }}
            />

            {/* Нос */}
            <motion.ellipse
              cx="60"
              cy="55"
              rx="6"
              ry="5"
              fill="#1a1a1a"
              animate={{ scale: isClicking ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.2 }}
            />
            <ellipse cx="58" cy="53" rx="2" ry="1.5" fill="#4a4a4a" />

            {/* Рот и язык */}
            <path d="M54 62 Q60 66, 66 62" stroke="#1a1a1a" strokeWidth="2" fill="none" />
            
            <AnimatePresence>
              {tongueOut && (
                <motion.g
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  exit={{ scaleY: 0 }}
                  style={{ transformOrigin: '60px 62px' }}
                >
                  <ellipse cx="60" cy="72" rx="6" ry="10" fill="#ff6b6b" />
                  <ellipse cx="60" cy="75" rx="4" ry="6" fill="#ff8787" />
                  <path d="M60 78 L60 82" stroke="#ff5252" strokeWidth="2" />
                </motion.g>
              )}
            </AnimatePresence>

            {/* Щёчки при счастье */}
            {happiness > 40 && (
              <>
                <motion.ellipse
                  cx="35"
                  cy="52"
                  rx="6"
                  ry="4"
                  fill="#ffb6c1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                />
                <motion.ellipse
                  cx="85"
                  cy="52"
                  rx="6"
                  ry="4"
                  fill="#ffb6c1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                />
              </>
            )}
          </motion.g>
        </svg>

        {/* Сердечки при счастье */}
        <AnimatePresence>
          {happiness > 60 && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-xl pointer-events-none"
                  initial={{ 
                    opacity: 0, 
                    x: -10 + i * 20, 
                    y: 20,
                    scale: 0 
                  }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    y: [-10, -40, -60],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.5,
                  }}
                >
                  ❤️
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Искры при клике */}
        <AnimatePresence>
          {isClicking && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`spark-${i}`}
                  className="absolute w-2 h-2 rounded-full pointer-events-none"
                  style={{
                    background: i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: Math.cos((i * 60 * Math.PI) / 180) * 60,
                    y: Math.sin((i * 60 * Math.PI) / 180) * 60,
                  }}
                  transition={{ duration: 0.5 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Уровень под питомцем */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
          color: 'white',
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Lv.{level}
      </motion.div>
    </div>
  );
};

export default AnimatedPet;
