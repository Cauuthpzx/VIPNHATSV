import { logger } from "./logger.js";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  /** Name for logging */
  name: string;
  /** Number of failures before opening the circuit */
  failureThreshold?: number;
  /** How long to wait before trying again (ms) */
  resetTimeout?: number;
  /** Number of successful calls in HALF_OPEN to close the circuit */
  successThreshold?: number;
  /** Return false to exclude certain errors from triggering the circuit (e.g. auth errors) */
  shouldCountFailure?: (err: unknown) => boolean;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly successThreshold: number;
  private readonly shouldCountFailure: (err: unknown) => boolean;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30_000;
    this.successThreshold = options.successThreshold ?? 2;
    this.shouldCountFailure = options.shouldCountFailure ?? (() => true);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = "HALF_OPEN";
        this.successCount = 0;
        logger.info(`Circuit breaker [${this.name}] → HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker [${this.name}] is OPEN — upstream unavailable`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      // Only count infrastructure failures, not auth/credential issues
      if (this.shouldCountFailure(err)) {
        this.onFailure();
      }
      throw err;
    }
  }

  private onSuccess() {
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = "CLOSED";
        this.failureCount = 0;
        logger.info(`Circuit breaker [${this.name}] → CLOSED`);
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN" || this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      logger.warn(`Circuit breaker [${this.name}] → OPEN (${this.failureCount} failures)`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
