import { retry, timeout } from 'rxjs/operators';
import { timer } from 'rxjs';

export interface KafkaRetryOptions {
  /** Timeout in ms waiting for a response (default: 5000) */
  timeoutMs?: number;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms between retries — grows exponentially (default: 500) */
  baseDelayMs?: number;
}

/**
 * Applies a timeout and exponential-backoff retry policy to a Kafka send() observable.
 *
 * @example
 * firstValueFrom(
 *   this.client.send('topic', payload).pipe(withKafkaRetry()),
 * )
 */
export function withKafkaRetry(options: KafkaRetryOptions = {}) {
  const { timeoutMs = 5000, maxRetries = 3, baseDelayMs = 500 } = options;

  return <T>(source: import('rxjs').Observable<T>) =>
    source.pipe(
      timeout(timeoutMs),
      retry({
        count: maxRetries,
        delay: (_error, retryIndex) => {
          const delayMs = baseDelayMs * Math.pow(2, retryIndex - 1);
          console.warn(
            `[KafkaRetry] Attempt ${retryIndex}/${maxRetries} — retrying in ${delayMs}ms`,
          );
          return timer(delayMs);
        },
      }),
    );
}
