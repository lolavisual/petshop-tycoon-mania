import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface ParallaxLayer {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  depth: number; // 0.1 - 1.0, higher = more movement
  rotation?: number;
}

const CLOUDS: ParallaxLayer[] = [
  { id: 'cloud1', emoji: '☁️', x: 10, y: 15, size: 48, depth: 0.2, rotation: 0 },
  { id: 'cloud2', emoji: '☁️', x: 75, y: 8, size: 56, depth: 0.15, rotation: 0 },
  { id: 'cloud3', emoji: '☁️', x: 45, y: 25, size: 40, depth: 0.25, rotation: 0 },
  { id: 'cloud4', emoji: '☁️', x: 85, y: 35, size: 36, depth: 0.18, rotation: 0 },
  { id: 'cloud5', emoji: '☁️', x: 20, y: 40, size: 44, depth: 0.22, rotation: 0 },
];

const PET_ELEMENTS: ParallaxLayer[] = [
  { id: 'paw1', emoji: '🐾', x: 5, y: 60, size: 32, depth: 0.4, rotation: -15 },
  { id: 'paw2', emoji: '🐾', x: 92, y: 70, size: 28, depth: 0.35, rotation: 20 },
  { id: 'bone1', emoji: '🦴', x: 15, y: 85, size: 24, depth: 0.5, rotation: 45 },
  { id: 'bone2', emoji: '🦴', x: 80, y: 55, size: 20, depth: 0.45, rotation: -30 },
  { id: 'fish1', emoji: '🐟', x: 25, y: 75, size: 26, depth: 0.55, rotation: 10 },
  { id: 'fish2', emoji: '🐟', x: 70, y: 90, size: 22, depth: 0.6, rotation: -5 },
  { id: 'ball1', emoji: '🎾', x: 50, y: 65, size: 20, depth: 0.7, rotation: 0 },
  { id: 'heart1', emoji: '💜', x: 35, y: 50, size: 18, depth: 0.3, rotation: 0 },
  { id: 'heart2', emoji: '💜', x: 65, y: 45, size: 16, depth: 0.32, rotation: 0 },
  { id: 'star1', emoji: '✨', x: 8, y: 30, size: 20, depth: 0.28, rotation: 0 },
  { id: 'star2', emoji: '✨', x: 88, y: 20, size: 18, depth: 0.26, rotation: 0 },
  { id: 'cat1', emoji: '🐱', x: 40, y: 80, size: 28, depth: 0.65, rotation: 5 },
  { id: 'dog1', emoji: '🐕', x: 60, y: 78, size: 30, depth: 0.62, rotation: -8 },
];

const ParallaxElement = ({ 
  layer, 
  offsetX, 
  offsetY 
}: { 
  layer: ParallaxLayer; 
  offsetX: number; 
  offsetY: number;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 120 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  
  useEffect(() => {
    x.set(offsetX * layer.depth * 30);
    y.set(offsetY * layer.depth * 30);
  }, [offsetX, offsetY, layer.depth, x, y]);

  const floatY = useTransform(
    springY,
    (val) => val + Math.sin(Date.now() / 2000 + layer.x) * 5
  );

  return (
    <motion.div
      className="absolute pointer-events-none select-none opacity-60"
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        fontSize: layer.size,
        x: springX,
        y: springY,
        rotate: layer.rotation || 0,
        filter: `blur(${(1 - layer.depth) * 1.5}px)`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 0.6, 
        scale: 1,
      }}
      transition={{ 
        duration: 0.8, 
        delay: Math.random() * 0.5,
        ease: "easeOut"
      }}
    >
      <motion.span
        animate={{
          y: [0, -8, 0],
          rotate: layer.rotation ? [layer.rotation - 5, layer.rotation + 5, layer.rotation] : 0,
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: Math.random() * 2,
        }}
        className="block"
      >
        {layer.emoji}
      </motion.span>
    </motion.div>
  );
};

export const ParallaxBackground = () => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const hasGyroscope = useRef(false);

  useEffect(() => {
    // Check for device orientation support
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null && event.beta !== null) {
        hasGyroscope.current = true;
        // gamma: left-right tilt (-90 to 90)
        // beta: front-back tilt (-180 to 180)
        const x = (event.gamma || 0) / 45; // Normalize to -1 to 1
        const y = ((event.beta || 0) - 45) / 45; // Center around 45 degrees
        setOffset({ 
          x: Math.max(-1, Math.min(1, x)), 
          y: Math.max(-1, Math.min(1, y)) 
        });
      }
    };

    // Fallback to mouse movement on desktop
    const handleMouseMove = (event: MouseEvent) => {
      if (hasGyroscope.current) return;
      
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const x = (event.clientX - centerX) / centerX;
      const y = (event.clientY - centerY) / centerY;
      setOffset({ x, y });
    };

    // Request permission for iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          }
        } catch (error) {
          console.log('DeviceOrientation permission denied');
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    };

    requestPermission();
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const allLayers = [...CLOUDS, ...PET_ELEMENTS];

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      style={{
        background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)',
      }}
    >
      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
        }}
      />
      
      {/* Parallax elements */}
      {allLayers.map((layer) => (
        <ParallaxElement
          key={layer.id}
          layer={layer}
          offsetX={offset.x}
          offsetY={offset.y}
        />
      ))}
      
      {/* Bottom gradient fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: 'linear-gradient(0deg, hsl(var(--background)) 0%, transparent 100%)',
        }}
      />
    </div>
  );
};
