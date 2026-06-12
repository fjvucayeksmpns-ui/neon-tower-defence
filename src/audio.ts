class CyberSynth {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = false;
  private backgroundIntervalId: any = null;
  private masterVolume: GainNode | null = null;
  private tempo: number = 130; // BPM

  constructor() {
    // Lazy initialize on first interaction or request
  }

  private initCtx() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.value = 0.15; // Moderate volume
      this.masterVolume.connect(this.ctx.destination);
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    this.initCtx();
    
    if (this.soundEnabled) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.startBackgroundBeat();
    } else {
      this.stopBackgroundBeat();
    }
    return this.soundEnabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, gainStartValue: number, sweepFreqTo?: number, filterType?: BiquadFilterType, filterFreq?: number) {
    if (!this.soundEnabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      
      if (sweepFreqTo) {
        osc.frequency.exponentialRampToValueAtTime(sweepFreqTo, t + duration);
      }

      gain.gain.setValueAtTime(gainStartValue, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration - 0.01);

      let connectionNode: AudioNode = gain;

      if (filterType && filterFreq) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(filterFreq, t);
        if (filterType === 'lowpass') {
          filter.frequency.exponentialRampToValueAtTime(100, t + duration);
        }
        gain.connect(filter);
        connectionNode = filter;
      }

      if (this.masterVolume) {
        connectionNode.connect(this.masterVolume);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + duration);
      }
    } catch (e) {
      console.warn("Audio feedback error", e);
    }
  }

  public playLaser() {
    // Short high sweep cyan laser
    this.playTone(880, 'sine', 0.12, 0.4, 330);
  }

  public playPlasma() {
    // Deep heavy violet sweep
    this.playTone(280, 'sawtooth', 0.35, 0.5, 60, 'lowpass', 600);
  }

  public playPulse() {
    // Expanding EMP sweep
    this.playTone(180, 'sine', 0.25, 0.6, 550, 'bandpass', 400);
  }

  public playFreeze() {
    // High piercing cooling crash
    this.playTone(1500, 'triangle', 0.2, 0.35, 1100);
  }

  public playUpgrade() {
    // Upward pentatonic neon bell sound
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.25, 0.3);
      }, idx * 60);
    });
  }

  public playSell() {
    // Downward sweep sound
    this.playTone(400, 'sine', 0.2, 0.3, 150);
  }

  public playDamageBase() {
    // Heavy deep red alarm siren
    this.playTone(130, 'sawtooth', 0.3, 0.6, 80);
  }

  public playWaveStart() {
    // Electronic threat warning alarm
    if (!this.soundEnabled || !this.ctx) return;
    this.playTone(220, 'sawtooth', 0.4, 0.5, 440);
    setTimeout(() => {
      this.playTone(330, 'sawtooth', 0.4, 0.5, 660);
    }, 200);
  }

  public playLevelSelect() {
    this.playTone(600, 'sine', 0.08, 0.3, 800);
  }

  public playGameOver() {
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [392.00, 311.13, 246.94, 196.00]; // G4, Eb4, B3, G3 (Sad)
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.5, 0.4, freq * 0.7);
      }, idx * 180);
    });
  }

  public playVictory() {
    if (!this.soundEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.4, 0.35, freq * 1.1);
      }, idx * 100);
    });
  }

  private startBackgroundBeat() {
    this.stopBackgroundBeat();
    if (!this.soundEnabled || !this.ctx) return;

    let step = 0;
    // Cyber-synth bassline: C -> Eb -> G -> F in minor cyber feel
    const bassSeq = [110, 110, 155.56, 155.56, 196.00, 196.00, 174.61, 174.61]; // A2, Eb3, G3, F3 relative keys
    const synthSeq = [440, 523.25, 587.33, 659.25, 0, 783.99, 0, 880];

    const intervalMs = (60 / this.tempo) * 500; // Playing eighth notes

    this.backgroundIntervalId = setInterval(() => {
      if (!this.soundEnabled || !this.ctx || this.ctx.state === 'suspended') return;

      const time = this.ctx.currentTime;
      // Play sub bass on step
      const bassFreq = bassSeq[step % bassSeq.length];
      if (step % 2 === 0) {
        this.playTone(bassFreq, 'triangle', 0.25, 0.25, bassFreq * 0.9);
      }

      // Play floating ambient melody on step
      const melodyFreq = synthSeq[step % synthSeq.length];
      if (melodyFreq > 0 && Math.random() > 0.4) {
        this.playTone(melodyFreq, 'sine', 0.3, 0.08);
      }

      // Gentle cyberpunk clock tick hi-hat on odd intervals
      if (step % 4 === 2) {
        this.playTone(3000, 'sine', 0.02, 0.04);
      }

      step++;
    }, intervalMs);
  }

  private stopBackgroundBeat() {
    if (this.backgroundIntervalId) {
      clearInterval(this.backgroundIntervalId);
      this.backgroundIntervalId = null;
    }
  }
}

export const cyberAudio = new CyberSynth();
export default cyberAudio;
