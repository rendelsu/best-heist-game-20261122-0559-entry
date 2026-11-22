// Sound, synthesised with WebAudio — no audio files, no network. A soft
// pickup chime, a rising alarm drone while the thief is seen, a caught sting,
// a coin clink, a smoke hush and a win arpeggio.
export class Sound {
  constructor() {
    this.context = null;
    this.muted = false;
    this.alarmNodes = null;
  }

  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') void this.context.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopAlarm();
    return this.muted;
  }

  tone(frequency, duration, type = 'sine', volume = 0.12, when = 0) {
    if (this.muted || !this.context) return;
    const start = this.context.currentTime + when;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  pickup() {
    this.tone(880, 0.12, 'sine', 0.1);
    this.tone(1318, 0.18, 'sine', 0.08, 0.07);
  }

  artifact() {
    this.tone(523, 0.15, 'triangle', 0.12);
    this.tone(784, 0.15, 'triangle', 0.12, 0.1);
    this.tone(1046, 0.3, 'triangle', 0.12, 0.2);
  }

  coin() {
    this.tone(1567, 0.1, 'square', 0.05);
    this.tone(2093, 0.14, 'square', 0.04, 0.06);
  }

  smoke() {
    if (this.muted || !this.context) return;
    const start = this.context.currentTime;
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 0.4, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.context.destination);
    source.start(start);
  }

  caught() {
    this.tone(220, 0.25, 'sawtooth', 0.14);
    this.tone(165, 0.4, 'sawtooth', 0.14, 0.18);
  }

  win() {
    [523, 659, 784, 1046].forEach((frequency, index) => this.tone(frequency, 0.3, 'triangle', 0.12, index * 0.12));
  }

  levelDone() {
    this.tone(784, 0.15, 'triangle', 0.1);
    this.tone(1046, 0.25, 'triangle', 0.1, 0.1);
  }

  /** A low pulsing drone while any watcher sees the thief. */
  startAlarm() {
    if (this.muted || !this.context || this.alarmNodes) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 110;
    lfo.frequency.value = 5;
    lfoGain.gain.value = 0.04;
    gain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    lfo.start();
    this.alarmNodes = { oscillator, lfo, gain };
  }

  stopAlarm() {
    if (!this.alarmNodes) return;
    try {
      this.alarmNodes.oscillator.stop();
      this.alarmNodes.lfo.stop();
    } catch {
      // Already stopped.
    }
    this.alarmNodes = null;
  }
}
