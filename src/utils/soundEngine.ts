import { PanelId } from './gridLogic';

class AbyssSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private oscA: OscillatorNode | null = null;
  private oscB: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isMuted: boolean = false;
  private isStarted: boolean = false;

  public init(): boolean {
    if (typeof window === 'undefined') return false;
    if (this.isStarted && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.35;
      this.masterGain.connect(this.ctx.destination);

      // Ambient eerie drone chain
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.droneGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 2.5);

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(160, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(4.5, this.ctx.currentTime);

      // Slow LFO modulating the lowpass filter frequency for breathing loneliness
      this.lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      this.lfo.type = 'sine';
      this.lfo.frequency.value = 0.09; // 11 second cycle
      lfoGain.gain.value = 55;
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.filterNode.frequency);

      // Primary dark drone oscillators (A1 = 55Hz, E2 = 82.41Hz fifth, plus subtle detuned A1)
      this.oscA = this.ctx.createOscillator();
      this.oscB = this.ctx.createOscillator();
      this.subOsc = this.ctx.createOscillator();

      this.oscA.type = 'sawtooth';
      this.oscA.frequency.value = 55.0; // A1

      this.oscB.type = 'triangle';
      this.oscB.frequency.value = 82.41; // E2
      this.oscB.detune.value = -7; // eerie slight flat fifth

      this.subOsc.type = 'sine';
      this.subOsc.frequency.value = 27.5; // A0 deep sub

      const subGain = this.ctx.createGain();
      subGain.gain.value = 0.45;

      this.oscA.connect(this.filterNode);
      this.oscB.connect(this.filterNode);
      this.subOsc.connect(subGain);
      subGain.connect(this.droneGain);

      this.filterNode.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      this.oscA.start();
      this.oscB.start();
      this.subOsc.start();
      this.lfo.start();

      this.isStarted = true;
      return true;
    } catch {
      return false;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (!muted && !this.isStarted) {
      this.init();
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.35, now, 0.08);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public isActive(): boolean {
    return this.isStarted && !this.isMuted;
  }

  /**
   * Shifts the ambient drone harmonic tension slightly based on which panel you inhabit
   */
  public modulateForPanel(panel: PanelId): void {
    if (!this.ctx || !this.oscA || !this.oscB || !this.filterNode) return;
    const now = this.ctx.currentTime;

    const pitchMap: Record<PanelId, [number, number, number]> = {
      C: [55.0, 82.41, 155],
      N: [58.27, 87.31, 210], // Bb1
      S: [49.0, 73.42, 130],  // G1 deeper
      W: [55.0, 65.41, 185],  // A1 + C2 minor third
      E: [61.74, 92.5, 220],  // B1
      NW: [51.91, 77.78, 145],
      NE: [65.41, 98.0, 230],
      SW: [46.25, 69.3, 120],
      SE: [55.0, 77.78, 140], // A1 + Eb2 tritone tension
    };

    const [freqA, freqB, cutoff] = pitchMap[panel] || pitchMap.C;
    this.oscA.frequency.setTargetAtTime(freqA, now, 0.8);
    this.oscB.frequency.setTargetAtTime(freqB, now, 0.8);
    this.filterNode.frequency.setTargetAtTime(cutoff, now, 0.6);
  }

  /**
   * Intimate, close-mic'd ASMR heavy archival paper page flip sound when transitioning between panels
   */
  public playPanelTransition(targetPanel: PanelId): void {
    if (this.isMuted) return;
    if (!this.isStarted) {
      this.init();
    }
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const sampleRate = this.ctx.sampleRate;
      const duration = 0.58;
      const bufferSize = Math.floor(sampleRate * duration);

      // Generate correlated pink/brownish fiber noise with micro-crinkle impulses
      const fiberBuffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const out = fiberBuffer.getChannelData(ch);
        let b0 = 0, b1 = 0, b2 = 0;
        let sparseCrinkle = 0;

        for (let i = 0; i < bufferSize; i++) {
          const t = i / bufferSize;
          const white = Math.random() * 2 - 1;

          // Kellet pink-noise approximation for warm natural paper texture
          b0 = 0.99765 * b0 + white * 0.0990460;
          b1 = 0.96300 * b1 + white * 0.2965164;
          b2 = 0.57000 * b2 + white * 1.0526913;
          const pink = (b0 + b1 + b2 + white * 0.1848) * 0.18;

          // Occasional microscopic paper fiber snap / crinkle
          if (Math.random() < 0.018) {
            sparseCrinkle = (Math.random() * 2 - 1) * 0.85;
          } else {
            sparseCrinkle *= 0.84;
          }

          // 3-Stage ASMR Page-Turn Envelope:
          // Stage 1 (0.00 - 0.14): Finger pad catches dry paper corner
          const cornerCatch = Math.exp(-Math.pow((t - 0.06) / 0.032, 2)) * 0.55;
          // Stage 2 (0.12 - 0.68): Long velvety sliding arc of the sheet turning through the air
          const slideArc =
            t > 0.08
              ? Math.pow(Math.sin(Math.PI * Math.min(1, (t - 0.08) / 0.72)), 1.35) * 0.95
              : 0;
          // Stage 3 (0.72 - 0.95): Gentle crisp settle as the page lays flat against the book
          const pageSettle = Math.exp(-Math.pow((t - 0.78) / 0.048, 2)) * 0.42;

          const env = cornerCatch + slideArc + pageSettle;
          out[i] = (pink * 0.78 + white * 0.22 + sparseCrinkle * 0.35) * env;
        }
      }

      // Layer 1: Close-mic'd fibrous paper brush (sweeping resonant bandpass + air shelf)
      const brushSrc = this.ctx.createBufferSource();
      brushSrc.buffer = fiberBuffer;

      const hpFilter = this.ctx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.setValueAtTime(420, now);

      const formA = this.ctx.createBiquadFilter();
      formA.type = 'bandpass';
      formA.Q.setValueAtTime(1.35, now);
      // Pitch contour: low corner lift -> higher crisp arc -> warm settle
      formA.frequency.setValueAtTime(950, now);
      formA.frequency.exponentialRampToValueAtTime(2850, now + 0.19);
      formA.frequency.exponentialRampToValueAtTime(1650, now + 0.42);
      formA.frequency.exponentialRampToValueAtTime(1100, now + duration);

      // High-frequency ASMR "air/silk" presence boost around 5.8 kHz
      const airShelf = this.ctx.createBiquadFilter();
      airShelf.type = 'peaking';
      airShelf.frequency.setValueAtTime(5800, now);
      airShelf.Q.setValueAtTime(1.1, now);
      airShelf.gain.setValueAtTime(6.5, now);

      const panner = this.ctx.createStereoPanner
        ? this.ctx.createStereoPanner()
        : null;
      if (panner) {
        // Subtle binaural spatial sweep from right to left as the page turns
        panner.pan.setValueAtTime(0.28, now);
        panner.pan.linearRampToValueAtTime(-0.28, now + duration);
      }

      const brushGain = this.ctx.createGain();
      brushGain.gain.setValueAtTime(0.75, now);
      brushGain.gain.exponentialRampToValueAtTime(0.008, now + duration);

      brushSrc.connect(hpFilter);
      hpFilter.connect(formA);
      formA.connect(airShelf);
      if (panner) {
        airShelf.connect(panner);
        panner.connect(brushGain);
      } else {
        airShelf.connect(brushGain);
      }
      brushGain.connect(this.masterGain);

      brushSrc.start(now);
      brushSrc.stop(now + duration);

      // Layer 2: Heavy rag paper body flex (warm low-mid resonance around 240Hz -> 130Hz)
      const bodySrc = this.ctx.createBufferSource();
      bodySrc.buffer = fiberBuffer;

      const bodyFilter = this.ctx.createBiquadFilter();
      bodyFilter.type = 'bandpass';
      bodyFilter.frequency.setValueAtTime(280, now + 0.04);
      bodyFilter.frequency.exponentialRampToValueAtTime(135, now + 0.36);
      bodyFilter.Q.setValueAtTime(2.4, now);

      const bodyGain = this.ctx.createGain();
      bodyGain.gain.setValueAtTime(0.001, now);
      bodyGain.gain.linearRampToValueAtTime(0.32, now + 0.14);
      bodyGain.gain.exponentialRampToValueAtTime(0.004, now + 0.48);

      bodySrc.connect(bodyFilter);
      bodyFilter.connect(bodyGain);
      bodyGain.connect(this.masterGain);

      bodySrc.start(now);
      bodySrc.stop(now + 0.5);

      this.modulateForPanel(targetPanel);
    } catch {
      // Ignore audio errors when autoplay blocked
    }
  }

  /**
   * Authentic, tactile ASMR mechanical typewriter strike:
   * 1. Steel typebar hammer snapping through ink ribbon onto paper/platen (crisp metallic transient)
   * 2. Heavy cast-iron frame & rubber platen thud (low-mid mechanical punch)
   * 3. Escapement gear pawl & spring return click (~22ms after strike)
   */
  public playTypeTick(isSpace = false): void {
    if (this.isMuted || !this.isStarted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const sampleRate = this.ctx.sampleRate;
      const variation = (Math.random() - 0.5) * 0.12;

      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.setValueAtTime((Math.random() - 0.5) * 0.22, now);
        panner.connect(this.masterGain);
      }
      const targetNode = panner || this.masterGain;

      // 1. Steel Typebar Hammer Strike (sharp, high-impact mechanical snap against paper & platen)
      if (!isSpace) {
        const strikeDur = 0.018;
        const strikeLen = Math.floor(sampleRate * strikeDur);
        const strikeBuf = this.ctx.createBuffer(1, strikeLen, sampleRate);
        const strikeData = strikeBuf.getChannelData(0);
        for (let i = 0; i < strikeLen; i++) {
          const t = i / strikeLen;
          // Instantaneous hammer impact with tight exponential decay
          const env = Math.exp(-t * 22);
          strikeData[i] = (Math.random() * 2 - 1) * env;
        }

        const strikeSrc = this.ctx.createBufferSource();
        strikeSrc.buffer = strikeBuf;

        // Crisp paper/ribbon snap at ~3.2 kHz
        const hammerBand = this.ctx.createBiquadFilter();
        hammerBand.type = 'bandpass';
        hammerBand.frequency.setValueAtTime(3200 * (1 + variation), now);
        hammerBand.Q.setValueAtTime(2.6, now);

        const strikeGain = this.ctx.createGain();
        strikeGain.gain.setValueAtTime(0.42, now);
        strikeGain.gain.exponentialRampToValueAtTime(0.001, now + strikeDur);

        strikeSrc.connect(hammerBand);
        hammerBand.connect(strikeGain);
        strikeGain.connect(targetNode);
        strikeSrc.start(now);
        strikeSrc.stop(now + strikeDur);

        // Metallic typebar ring (short steel ping at ~1.48 kHz)
        const metalOsc = this.ctx.createOscillator();
        const metalGain = this.ctx.createGain();
        metalOsc.type = 'square';
        metalOsc.frequency.setValueAtTime(1480 * (1 + variation), now);
        metalOsc.frequency.exponentialRampToValueAtTime(620, now + 0.012);

        metalGain.gain.setValueAtTime(0.065, now);
        metalGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.013);

        metalOsc.connect(metalGain);
        metalGain.connect(targetNode);
        metalOsc.start(now);
        metalOsc.stop(now + 0.014);
      }

      // 2. Rubber Platen & Cast-Iron Chassis Thump (solid mechanical weight)
      const platenOsc = this.ctx.createOscillator();
      const platenGain = this.ctx.createGain();
      platenOsc.type = 'triangle';

      const bodyStart = (isSpace ? 240 : 340) * (1 + variation);
      const bodyEnd = (isSpace ? 72 : 95) * (1 + variation);
      platenOsc.frequency.setValueAtTime(bodyStart, now);
      platenOsc.frequency.exponentialRampToValueAtTime(bodyEnd, now + 0.028);

      platenGain.gain.setValueAtTime(0.001, now);
      platenGain.gain.linearRampToValueAtTime(isSpace ? 0.25 : 0.28, now + 0.0015);
      platenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

      platenOsc.connect(platenGain);
      platenGain.connect(targetNode);
      platenOsc.start(now);
      platenOsc.stop(now + 0.034);

      // 3. Escapement Gear Ratchet Pawl Click (the signature typewriter carriage step ~22ms later)
      const pawlDelay = (isSpace ? 0.016 : 0.022) + Math.random() * 0.004;
      const pawlDur = 0.012;
      const pawlLen = Math.floor(sampleRate * pawlDur);
      const pawlBuf = this.ctx.createBuffer(1, pawlLen, sampleRate);
      const pawlData = pawlBuf.getChannelData(0);
      for (let i = 0; i < pawlLen; i++) {
        const t = i / pawlLen;
        pawlData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 28);
      }

      const pawlSrc = this.ctx.createBufferSource();
      pawlSrc.buffer = pawlBuf;

      const pawlFilter = this.ctx.createBiquadFilter();
      pawlFilter.type = 'bandpass';
      pawlFilter.frequency.setValueAtTime(4600 * (1 + variation), now + pawlDelay);
      pawlFilter.Q.setValueAtTime(3.8, now + pawlDelay);

      const pawlGain = this.ctx.createGain();
      pawlGain.gain.setValueAtTime(0.19, now + pawlDelay);
      pawlGain.gain.exponentialRampToValueAtTime(0.001, now + pawlDelay + pawlDur);

      pawlSrc.connect(pawlFilter);
      pawlFilter.connect(pawlGain);
      pawlGain.connect(targetNode);
      pawlSrc.start(now + pawlDelay);
      pawlSrc.stop(now + pawlDelay + pawlDur);
    } catch {
      // Ignore
    }
  }

  /**
   * Ethereal harmonic chord when discovering a hidden sigil or game echo
   */
  public playSecretChime(weight: 'light' | 'heavy' = 'light'): void {
    if (this.isMuted) return;
    if (!this.isStarted) this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const notes = weight === 'heavy' ? [220, 277.18, 329.63, 440, 554.37] : [329.63, 440, 659.25];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.11, now + idx * 0.06 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.06 + 1.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 1.45);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundEngine = new AbyssSoundEngine();
