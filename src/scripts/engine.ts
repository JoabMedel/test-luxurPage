/**
 * Synthesised air-cooled flat-six for the film's SOUND pill (off by default).
 * Stand-in for the client's recorded engine audio: a boxer fires three times
 * per crank revolution, so the fundamental is rpm / 60 × 3. Scroll speed revs it.
 */
export class Engine {
  private ac: AudioContext | null = null;
  private master!: GainNode;
  private oscs: OscillatorNode[] = [];
  private lp!: BiquadFilterNode;
  private bp!: BiquadFilterNode;
  private lfo!: OscillatorNode;
  private rpm = 950;
  on = false;

  private build() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = (this.ac = new AC());

    this.master = ac.createGain();
    this.master.gain.value = 0;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(ac.destination);

    const shaper = ac.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 2.6);
    }
    shaper.curve = curve;

    this.lp = ac.createBiquadFilter();
    this.lp.type = 'lowpass';
    this.lp.Q.value = 2.5;

    const body = ac.createGain();
    body.gain.value = 0.32;
    const pulse = ac.createGain(); // burble: amplitude modulated by an uneven LFO
    pulse.gain.value = 0.75;
    this.lfo = ac.createOscillator();
    this.lfo.type = 'square';
    const lfoDepth = ac.createGain();
    lfoDepth.gain.value = 0.25;
    this.lfo.connect(lfoDepth).connect(pulse.gain);

    const types: OscillatorType[] = ['sawtooth', 'sawtooth', 'sine'];
    this.oscs = types.map((type) => {
      const o = ac.createOscillator();
      o.type = type;
      o.connect(body);
      return o;
    });
    body.connect(shaper).connect(this.lp).connect(pulse).connect(this.master);

    // exhaust breath
    const len = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    this.bp = ac.createBiquadFilter();
    this.bp.type = 'bandpass';
    this.bp.Q.value = 0.9;
    const ng = ac.createGain();
    ng.gain.value = 0.08;
    noise.connect(this.bp).connect(ng).connect(pulse);

    this.oscs.forEach((o) => o.start());
    this.lfo.start();
    noise.start();
    this.apply(true);
  }

  private apply(immediate = false) {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    const k = immediate ? 0.001 : 0.12;
    const f = (this.rpm / 60) * 3;
    this.oscs[0].frequency.setTargetAtTime(f, t, k);
    this.oscs[1].frequency.setTargetAtTime(f * 0.5 * 1.004, t, k);
    this.oscs[2].frequency.setTargetAtTime(f * 0.25, t, k);
    this.lfo.frequency.setTargetAtTime(f / 6, t, k);
    this.lp.frequency.setTargetAtTime(260 + this.rpm * 0.32, t, k);
    this.bp.frequency.setTargetAtTime(f * 5, t, k);
  }

  /** 0 = idle, 1 = hard pull */
  setLoad(load: number) {
    this.rpm = 950 + Math.min(1, Math.max(0, load)) * 4300;
    this.apply();
  }

  get revving() {
    return this.rpm > 2400;
  }

  async setOn(on: boolean, audible = true) {
    this.on = on;
    if (on && !this.ac) this.build();
    if (!this.ac) return;
    if (on && this.ac.state === 'suspended') await this.ac.resume();
    this.setAudible(on && audible);
  }

  /** Fades in/out without changing the user's on/off choice (e.g. off-screen). */
  setAudible(audible: boolean) {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(audible && this.on ? 0.5 : 0, t, 0.25);
  }
}
