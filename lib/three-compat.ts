import { Timer, type Clock as LegacyClock } from "three-original";

// Keep all consumers on the same Three.js instance. Fiber 9 still constructs
// Clock internally, so provide its public API using the supported Timer.
export * from "three-original";

export class Clock implements LegacyClock {
  autoStart: boolean;
  startTime = 0;
  oldTime = 0;
  elapsedTime = 0;
  running = false;

  private readonly timer = new Timer();

  constructor(autoStart = true) {
    this.autoStart = autoStart;
  }

  start() {
    const now = performance.now();
    this.startTime = now;
    this.oldTime = now;
    this.elapsedTime = 0;
    this.running = true;
    this.timer.reset();
  }

  stop() {
    this.getElapsedTime();
    this.running = false;
    this.autoStart = false;
  }

  getElapsedTime() {
    this.getDelta();
    return this.elapsedTime;
  }

  getDelta() {
    if (this.autoStart && !this.running) {
      this.start();
      return 0;
    }

    if (!this.running) return 0;

    const now = performance.now();
    this.timer.update(now);
    const delta = this.timer.getDelta();
    this.oldTime = now;
    // Fiber writes elapsedTime directly when changing its frame-loop mode.
    this.elapsedTime += delta;
    return delta;
  }
}
