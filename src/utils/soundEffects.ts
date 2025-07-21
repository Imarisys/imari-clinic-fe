import { useCallback } from 'react';

export type SoundType = 'click' | 'hover' | 'focus' | 'success' | 'error' | 'notification' | 'confirm' | 'cancel' | 'open' | 'close' | 'warning' | 'info';

interface SoundEffectsConfig {
  enabled: boolean;
  volume: number;
}

const defaultConfig: SoundEffectsConfig = {
  enabled: true,
  volume: 0.3,
};

// Sound frequencies for different effects
const soundFrequencies: Record<SoundType, { frequency: number; duration: number }> = {
  click: { frequency: 800, duration: 100 },
  hover: { frequency: 600, duration: 80 },
  focus: { frequency: 500, duration: 120 },
  success: { frequency: 660, duration: 200 },
  error: { frequency: 300, duration: 300 },
  notification: { frequency: 880, duration: 150 },
  confirm: { frequency: 740, duration: 180 },
  cancel: { frequency: 440, duration: 140 },
  open: { frequency: 523, duration: 160 },
  close: { frequency: 392, duration: 120 },
  warning: { frequency: 350, duration: 250 },
  info: { frequency: 750, duration: 170 }, // Added info sound frequency
};

class SoundEffectsManager {
  private audioContext: AudioContext | null = null;
  private config: SoundEffectsConfig = defaultConfig;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async ensureAudioContextResumed() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async playSound(type: SoundType) {
    if (!this.config.enabled || !this.audioContext) {
      return;
    }

    try {
      await this.ensureAudioContextResumed();

      const { frequency, duration } = soundFrequencies[type];
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.config.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  setConfig(config: Partial<SoundEffectsConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SoundEffectsConfig {
    return { ...this.config };
  }
}

const soundManager = new SoundEffectsManager();

export const useSoundEffects = () => {
  const playSound = useCallback((type: SoundType) => {
    soundManager.playSound(type);
  }, []);

  const setSoundConfig = useCallback((config: Partial<SoundEffectsConfig>) => {
    soundManager.setConfig(config);
  }, []);

  const getSoundConfig = useCallback(() => {
    return soundManager.getConfig();
  }, []);

  return {
    playSound,
    setSoundConfig,
    getSoundConfig,
  };
};
