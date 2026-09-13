/** Just enough of the Web Audio API for the engine's logic to be tested without a browser. */
export class FakeParam {
  value = 0;
  readonly events: string[] = [];
  setValueAtTime(v: number, t: number) { this.events.push(`set:${v}@${t}`); return this; }
  linearRampToValueAtTime(v: number, t: number) { this.events.push(`lin:${v}@${t}`); return this; }
  exponentialRampToValueAtTime(v: number, t: number) { this.events.push(`exp:${v}@${t}`); return this; }
  cancelScheduledValues() { return this; }
}

export class FakeNode {
  readonly connections: FakeNode[] = [];
  started: number | null = null;
  stopped: number | null = null;
  onended: (() => void) | null = null;
  connect(node: FakeNode) { this.connections.push(node); return node; }
  disconnect() { /* noop */ }
  start(t = 0) { this.started = t; }
  stop(t = 0) { this.stopped = t; }
}

export class FakeOscillator extends FakeNode {
  type = 'sine';
  readonly frequency = new FakeParam();
  readonly detune = new FakeParam();
}

export class FakeGain extends FakeNode {
  readonly gain = new FakeParam();
}

export class FakeFilter extends FakeNode {
  type = 'lowpass';
  readonly frequency = new FakeParam();
  readonly Q = new FakeParam();
}

export class FakeBufferSource extends FakeNode {
  buffer: unknown = null;
  loop = false;
}

export class FakeAudioContext {
  state: 'suspended' | 'running' = 'suspended';
  currentTime = 0;
  readonly sampleRate = 44_100;
  readonly destination = new FakeNode();
  readonly created: FakeNode[] = [];
  resumed = 0;

  private track<T extends FakeNode>(node: T): T {
    this.created.push(node);
    return node;
  }
  createOscillator() { return this.track(new FakeOscillator()); }
  createGain() { return this.track(new FakeGain()); }
  createBiquadFilter() { return this.track(new FakeFilter()); }
  createBufferSource() { return this.track(new FakeBufferSource()); }
  createBuffer(_channels: number, length: number) {
    return { length, getChannelData: () => new Float32Array(length) };
  }
  decodeAudioData(data: ArrayBuffer) { return Promise.resolve({ decoded: data.byteLength }); }
  resume() { this.state = 'running'; this.resumed += 1; return Promise.resolve(); }
  sourcesOf<T extends FakeNode>(ctor: new () => T): T[] { return this.created.filter((n): n is T => n instanceof ctor); }
}
