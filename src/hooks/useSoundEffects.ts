import { useCallback, useRef, useState, useEffect } from 'react';

const MUTE_KEY = 'petshop_sound_muted';

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem(MUTE_KEY);
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(MUTE_KEY, String(isMuted));
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Звук тапа - короткий "клик"
  const playTap = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.log('Sound not available');
    }
  }, [getAudioContext, isMuted]);

  // Звук получения кристалла - звенящий
  const playCrystal = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.1);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log('Sound not available');
    }
  }, [getAudioContext, isMuted]);

  // Звук открытия сундука - торжественный
  const playChest = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      
      // Играем аккорд из нескольких нот
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      
      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.4);

        oscillator.start(ctx.currentTime + i * 0.1);
        oscillator.stop(ctx.currentTime + i * 0.1 + 0.4);
      });
    } catch (e) {
      console.log('Sound not available');
    }
  }, [getAudioContext, isMuted]);

  // Звук повышения уровня - победный
  const playLevelUp = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const frequencies = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
      
      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        oscillator.type = 'triangle';

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.5);

        oscillator.start(ctx.currentTime + i * 0.12);
        oscillator.stop(ctx.currentTime + i * 0.12 + 0.5);
      });
    } catch (e) {
      console.log('Sound not available');
    }
  }, [getAudioContext, isMuted]);

  return { playTap, playCrystal, playChest, playLevelUp, isMuted, toggleMute };
};
