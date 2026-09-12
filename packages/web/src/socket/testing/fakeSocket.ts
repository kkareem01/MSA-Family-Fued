type Listener = (...args: unknown[]) => void;

/** Minimal stand-in for a socket.io-client socket: records emits and lets tests inject server events. */
export class FakeSocket {
  connected = false;
  readonly emitted: { event: string; args: unknown[] }[] = [];
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly anyListeners = new Set<(event: string, ...args: unknown[]) => void>();

  on(event: string, listener: Listener): this {
    const set = this.listeners.get(event) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(event, set);
    return this;
  }

  off(event: string, listener?: Listener): this {
    if (!listener) this.listeners.delete(event);
    else this.listeners.get(event)?.delete(listener);
    return this;
  }

  onAny(listener: (event: string, ...args: unknown[]) => void): this {
    this.anyListeners.add(listener);
    return this;
  }

  emit(event: string, ...args: unknown[]): this {
    this.emitted.push({ event, args });
    return this;
  }

  connect(): this {
    return this;
  }

  disconnect(): this {
    this.connected = false;
    this.serverEmit('disconnect', 'io client disconnect');
    return this;
  }

  removeAllListeners(): this {
    this.listeners.clear();
    return this;
  }

  /** Simulates a packet from the server. */
  serverEmit(event: string, ...args: unknown[]): void {
    if (event === 'connect') this.connected = true;
    this.listeners.get(event)?.forEach((l) => l(...args));
    this.anyListeners.forEach((l) => l(event, ...args));
  }

  lastEmitted(event: string) {
    return [...this.emitted].reverse().find((e) => e.event === event);
  }
}
