import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'star' | 'crystal' | 'sparkle';
}

const FloatingParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 8 + Math.random() * 12,
        duration: 4 + Math.random() * 4,
        delay: Math.random() * 3,
        type: ['star', 'crystal', 'sparkle'][Math.floor(Math.random() * 3)] as Particle['type'],
      });
    }
    setParticles(newParticles);
  }, []);

  const renderParticle = (type: Particle['type'], size: number) => {
    if (type === 'star') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 8.41L24 12L14.59 15.59L12 24L9.41 15.59L0 12L9.41 8.41L12 0Z" />
        </svg>
      );
    }
    if (type === 'crystal') {
      return <span style={{ fontSize: size * 0.8 }}>💎</span>;
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 0L12 6M12 18L12 24M0 12L6 12M18 12L24 12" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute text-primary/30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 0.6, 0.6, 0],
            y: [-20, -40, -60, -80],
            x: [0, 10, -10, 0],
            rotate: [0, 180, 360],
            scale: [0.5, 1, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {renderParticle(particle.type, particle.size)}
        </motion.div>
      ))}

      {/* Светящиеся орбы на фоне */}
      <motion.div
        className="absolute w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          left: '10%',
          top: '20%',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute w-24 h-24 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)',
          right: '15%',
          top: '40%',
        }}
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
          scale: [1, 0.8, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <motion.div
        className="absolute w-20 h-20 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
          left: '50%',
          bottom: '30%',
        }}
        animate={{
          x: [0, 15, -15, 0],
          y: [0, -15, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  );
};

export default FloatingParticles;
