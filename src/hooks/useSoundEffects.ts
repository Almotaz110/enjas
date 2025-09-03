import { useCallback } from 'react';

export const useSoundEffects = () => {
  const playSound = useCallback((type: 'success' | 'levelUp' | 'notification') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const createTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      };

      switch (type) {
        case 'success':
          // Success sound: C-E-G chord
          createTone(523.25, 0.2); // C5
          setTimeout(() => createTone(659.25, 0.2), 100); // E5
          setTimeout(() => createTone(783.99, 0.3), 200); // G5
          break;
          
        case 'levelUp':
          // Level up sound: ascending melody
          createTone(440, 0.15); // A4
          setTimeout(() => createTone(523.25, 0.15), 150); // C5
          setTimeout(() => createTone(659.25, 0.15), 300); // E5
          setTimeout(() => createTone(880, 0.3), 450); // A5
          break;
          
        case 'notification':
          // Notification sound: simple beep
          createTone(660, 0.2);
          break;
      }
    } catch (error) {
      console.log('Audio not supported or failed:', error);
    }
  }, []);

  return { playSound };
};