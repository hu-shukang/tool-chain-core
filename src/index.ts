/**
 * Chains Chainable Async Execution Library
 *
 * This module provides a powerful and type-safe library for building chains of asynchronous
 * and synchronous function executions. It supports:
 *
 * - **Chainable API**: Build complex workflows using method chaining with `.chain()`
 * - **Type Safety**: Full TypeScript support with type inference for each step
 * - **Error Handling**: Fine-grained error control with `{ withoutThrow: true }` option per step
 * - **Result Access**: Access results from all previous steps in the chain
 * - **Mixed Error Modes**: Combine throwing and non-throwing steps in the same chain
 *
 * The library works with both ESM and CommonJS module systems.
 *
 * @example
 * // Basic chain with type safety
 * const result = await new Chains()
 *   .chain(() => 'hello')
 *   .chain((r) => r.r1.toUpperCase())
 *   .invoke();
 *
 * @example
 * // Accessing previous results
 * const result = await new Chains()
 *   .chain(() => 10)
 *   .chain(() => 20)
 *   .chain((r) => r.r1 + r.r2)  // 30
 *   .invoke();
 *
 * @example
 * // Safe error handling per step
 * const result = await new Chains()
 *   .chain(() => JSON.parse('invalid'), { withoutThrow: true })
 *   .chain((r) => {
 *     if (r.r1.error) return 'fallback';
 *     return r.r1.data.name;
 *   })
 *   .invoke();
 */
import type { ChainOptions, ChainOptionsWithoutError, ChainOptionsWithoutThrow, TupleToResults } from './types';
import { ChainsBase, ChainsInit, type ExecutionHistory } from './types';

// ==================== Error Classes ====================

/**
 * Error thrown when a function execution exceeds the specified timeout.
 *
 * @property timeout The timeout duration in milliseconds
 * @property step Optional step number where the timeout occurred
 *
 * @example
 * try {
 *   await new Chains()
 *     .chain(() => new Promise(resolve => setTimeout(resolve, 1000)), { timeout: 100 })
 *     .invoke();
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     console.log(`Timeout of ${error.timeout}ms exceeded at step ${error.step}`);
 *   }
 * }
 *
 * @internal
 */
class TimeoutError extends Error {
  constructor(
    public readonly timeout: number,
    public readonly step?: number,
  ) {
    const stepInfo = step !== undefined ? ` at step ${step}` : '';
    super(`Operation timeout${stepInfo}: exceeded ${timeout}ms`);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

// ==================== Helper Functions ====================

/**
 * Determines whether to retry based on the error and retryWhen condition.
 *
 * @param error The error that occurred
 * @param retryWhen Optional condition for retrying:
 *   - undefined: retry all errors
 *   - Error constructor: retry only if error is an instance of this constructor
 *   - Error instance: retry only if error is an instance of the same constructor
 *   - string: retry only if error message includes this string ('timeout' matches TimeoutError)
 *   - RegExp: retry only if error message matches this pattern
 * @returns true if the error should trigger a retry, false otherwise
 *
 * @example
 * // Retry on specific error type
 * const shouldRetry = shouldRetry(error, NetworkError);
 *
 * @example
 * // Retry if message contains specific text
 * const shouldRetry = shouldRetry(error, 'connection');
 *
 * @example
 * // Retry on timeout errors
 * const shouldRetry = shouldRetry(error, 'timeout');
 *
 * @internal
 */
function shouldRetry(error: Error, retryWhen?: (new (...args: any[]) => Error) | Error | string | RegExp): boolean {
  if (!retryWhen) return true; // No condition specified, retry all errors

  if (typeof retryWhen === 'function') {
    // retryWhen is an Error constructor - check if error is instance of it
    try {
      return error instanceof retryWhen;
    } catch {
      // If instanceof fails, return false
      return false;
    }
  } else if (retryWhen instanceof Error) {
    // retryWhen is an Error instance - check if error is instance of the same constructor
    return error instanceof (retryWhen.constructor as any);
  } else if (typeof retryWhen === 'string') {
    // Match error message: retry if message includes the string
    // Special case: 'timeout' matches TimeoutError
    if (retryWhen === 'timeout') {
      return error instanceof TimeoutError;
    }
    return error.message.includes(retryWhen);
  } else if (retryWhen instanceof RegExp) {
    // Match error message: retry if message matches the pattern
    return retryWhen.test(error.message);
  }

  return false;
}

/**
 * Normalizes any error to an Error object.
 *
 * @param error The error to normalize (can be any type)
 * @returns A proper Error object
 *
 * @internal
 */
function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Parses chain options and extracts individual configuration properties.
 *
 * @param options The chain options to parse
 * @returns An object with parsed configuration values with defaults
 *
 * @internal
 */
function parseChainOptions(options?: ChainOptions) {
  return {
    withoutThrow: options?.withoutThrow ?? false,
    maxRetries: options?.retry ?? 0,
    retryWhen: options?.retryWhen,
    retryDelay: options?.retryDelay ?? 0,
    timeout: options?.timeout,
  };
}

/**
 * Wraps a result based on error handling mode.
 *
 * @param result The successful result to wrap
 * @param error The error if one occurred (undefined for success case)
 * @param withoutThrow Whether to catch errors and wrap them
 * @returns The wrapped result or throws if error and withoutThrow is false
 *
 * @internal
 */
function wrapResult<R>(result: R, error: Error | undefined, withoutThrow: boolean): R | { data?: R; error?: Error } {
  if (error) {
    if (withoutThrow) {
      return { error };
    }
    throw error;
  }

  if (withoutThrow) {
    return { data: result };
  }
  return result as any;
}

// ==================== Implementation Classes ====================

/**
 * Core implementation of the ChainsBase interface.
 *
 * This class handles chainable execution of functions with support for:
 * - Maintaining execution history of all steps
 * - Fine-grained error handling with per-step `withoutThrow` option
 * - Type-safe result tracking through the chain
 *
 * @template TResults A tuple of result types from all previous steps.
 *
 * @internal
 */
class ChainsImpl<TResults extends any[] = []> extends ChainsBase<TResults> {
  /**
   * The current async task in the chain.
   * @private
   */
  private asyncTask: Promise<any>;

  /**
   * Stores execution results indexed by keys like 'r1', 'r2', 'r3', etc.
   * @private
   */
  private history: ExecutionHistory;

  /**
   * The index of the current result in the execution sequence.
   * @private
   */
  private index: number;

  /**
   * Constructs a new ChainsImpl instance.
   *
   * @param asyncTask The Promise representing the current async operation.
   * @param history The execution history mapping result keys to values.
   * @param index The current step index in the execution sequence.
   *
   * @internal
   */
  constructor(asyncTask: Promise<any>, history: ExecutionHistory, index: number) {
    super();
    this.asyncTask = asyncTask;
    this.history = history;
    this.index = index;
  }

  /**
   * Chains a function to execute in the sequence.
   *
   * @param fn The function to execute, can be sync or async
   * @param options Optional configuration for retry, timeout, error handling
   *
   * @example
   * // Basic chaining with type safety
   * const result = await new Chains()
   *   .chain(() => 42)
   *   .chain((r) => r.r1 * 2)
   *   .invoke();
   * // result = 84
   *
   * @example
   * // With error handling using withoutThrow
   * const result = await new Chains()
   *   .chain(() => riskyOperation(), { withoutThrow: true })
   *   .chain((r) => {
   *     if (r.r1.error) return handleError(r.r1.error);
   *     return r.r1.data;
   *   })
   *   .invoke();
   *
   * @example
   * // With retry and timeout
   * const result = await new Chains()
   *   .chain(
   *     () => fetchData(),
   *     { retry: 3, timeout: 5000, retryDelay: 1000 }
   *   )
   *   .invoke();
   *
   * @override
   * @internal
   */
  override chain<R>(
    fn: (results: TupleToResults<TResults>) => R | Promise<R>,
    options: ChainOptionsWithoutThrow,
  ): ChainsBase<[...TResults, { data?: R; error?: Error }]>;
  override chain<R>(
    fn: (results: TupleToResults<TResults>) => R | Promise<R>,
    options?: undefined | ChainOptionsWithoutError,
  ): ChainsBase<[...TResults, R]>;
  override chain<R>(fn: (results: TupleToResults<TResults>) => R | Promise<R>, options?: ChainOptions): any {
    const { withoutThrow, maxRetries, retryWhen, retryDelay, timeout } = parseChainOptions(options);
    const currentIndex = this.index;

    const newAsyncTask = async () => {
      const previousResult = await this.asyncTask;
      let lastError: Error | null = null;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          // Create a Proxy that provides access to previous results
          const resultProxy = new Proxy(
            {},
            {
              get: (_target, prop) => {
                const key = String(prop);
                if (key.startsWith('r')) {
                  return this.history[key];
                }
                return undefined;
              },
            },
          ) as TupleToResults<TResults>;

          // Update the execution history with the previous result
          // Only save the actual value, not wrapped format
          if (this.index > 0) {
            // If previous result is an error object from withoutThrow, we don't propagate it
            // It stays as is in history
            this.history[`r${this.index}`] = previousResult;
          }

          // Execute the function with optional timeout
          let result: R;
          if (timeout !== undefined) {
            result = await Promise.race([
              Promise.resolve(fn(resultProxy)),
              new Promise<R>((_, reject) => setTimeout(() => reject(new TimeoutError(timeout, currentIndex)), timeout)),
            ]);
          } else {
            result = await Promise.resolve(fn(resultProxy));
          }

          // Return wrapped result based on error handling mode
          return wrapResult(result, undefined, withoutThrow);
        } catch (error) {
          lastError = normalizeError(error);

          // Check if we should retry
          if (attempt < maxRetries && shouldRetry(lastError, retryWhen)) {
            attempt++;
            // Wait for retryDelay before retrying
            if (retryDelay > 0) {
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
            continue;
          }

          // Return wrapped error based on error handling mode
          return wrapResult(undefined as any, lastError, withoutThrow);
        }
      }
    };

    return new ChainsImpl(newAsyncTask(), this.history, this.index + 1);
  }

  /**
   * Implementation of ChainsBase.invoke() method.
   *
   * @override
   * @internal
   */
  override async invoke() {
    return await this.asyncTask;
  }
}

/**
 * Implementation of ChainsInit interface.
 *
 * This class is the first step in the Chains execution.
 * It handles optional initial data that becomes `r1` in the execution history.
 *
 * @template TLastResult The type of the initial data (if provided).
 *
 * @internal
 */
class ChainsInitImpl<TLastResult = any> extends ChainsInit<TLastResult> {
  /**
   * Stores execution results indexed by keys like 'r1', 'r2', 'r3', etc.
   * @private
   */
  private executionHistory: ExecutionHistory = {};

  /**
   * The current step index in the execution sequence.
   * @private
   */
  private resultIndex: number = 0;

  /**
   * Constructs a new ActionsInitImpl instance.
   *
   * @param initialData Optional data to be used as the first result.
   *                    If provided, it's stored in execution history as 'r1'.
   *
   * @internal
   */
  constructor(initialData?: TLastResult) {
    super();
    // If initial data is provided, add it to history as r1
    if (initialData !== undefined) {
      this.executionHistory['r1'] = initialData;
      this.resultIndex = 1;
    }
  }

  /**
   * Chains a function to execute as the first or subsequent step.
   *
   * @param fn The function to execute, can be sync or async
   * @param options Optional configuration for retry, timeout, error handling
   *
   * @example
   * // Without initial data
   * const result = await new Chains()
   *   .chain(() => fetchUser())
   *   .chain((r) => r.r1.name.toUpperCase())
   *   .invoke();
   *
   * @example
   * // With initial data
   * const result = await new Chains(userId)
   *   .chain((r) => fetchUser(r.r1))
   *   .chain((r) => r.r2.name.toUpperCase())
   *   .invoke();
   *
   * @override
   * @internal
   */
  override chain<R>(
    fn: (results: TupleToResults<TLastResult extends undefined ? [] : [TLastResult]>) => R | Promise<R>,
    options: ChainOptionsWithoutThrow,
  ): ChainsBase<[...(TLastResult extends undefined ? [] : [TLastResult]), { data?: R; error?: Error }]>;

  override chain<R>(
    fn: (results: TupleToResults<TLastResult extends undefined ? [] : [TLastResult]>) => R | Promise<R>,
    options?: undefined | ChainOptionsWithoutError,
  ): ChainsBase<[...(TLastResult extends undefined ? [] : [TLastResult]), R]>;

  override chain<R>(
    fn: (results: TupleToResults<TLastResult extends undefined ? [] : [TLastResult]>) => R | Promise<R>,
    options?: ChainOptions,
  ): any {
    const { withoutThrow, maxRetries, retryWhen, retryDelay, timeout } = parseChainOptions(options);
    const currentResultIndex = this.resultIndex;

    const newAsyncTask = async () => {
      let lastError: Error | null = null;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          // Create a Proxy that provides access to initial data (if any)
          const resultProxy = new Proxy(
            {},
            {
              get: (_target, prop) => {
                const key = String(prop);
                if (Object.prototype.hasOwnProperty.call(this.executionHistory, key)) {
                  return this.executionHistory[key];
                }
                return undefined;
              },
            },
          ) as TupleToResults<TLastResult extends undefined ? [] : [TLastResult]>;

          // Execute the function with optional timeout
          let result: R;
          if (timeout !== undefined) {
            result = await Promise.race([
              Promise.resolve(fn(resultProxy)),
              new Promise<R>((_, reject) =>
                setTimeout(() => reject(new TimeoutError(timeout, currentResultIndex + 1)), timeout),
              ),
            ]);
          } else {
            result = await Promise.resolve(fn(resultProxy));
          }

          // Return wrapped result based on error handling mode
          return wrapResult(result, undefined, withoutThrow);
        } catch (error) {
          lastError = normalizeError(error);

          // Check if we should retry
          if (attempt < maxRetries && shouldRetry(lastError, retryWhen)) {
            attempt++;
            // Wait for retryDelay before retrying
            if (retryDelay > 0) {
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
            continue;
          }

          // Return wrapped error based on error handling mode
          return wrapResult(undefined as any, lastError, withoutThrow);
        }
      }
    };

    return new ChainsImpl(newAsyncTask(), this.executionHistory, this.resultIndex + 1);
  }

  /**
   * Implementation of ChainsBase.invoke() method.
   *
   * @override
   * @internal
   */
  override async invoke(): Promise<any> {
    // This shouldn't be called on the initial instance, but handle it gracefully
    return undefined;
  }
}

// ==================== Main Actions Class ====================

/**
 * Main Actions class for building chainable async execution workflows.
 *
 * This is the primary entry point for the Actions library. It supports:
 * - Chainable method calls for building workflows
 * - Optional initial data that's accessible in chain callbacks via `results.r1`
 * - Type-safe result tracking through the execution chain
 * - Fine-grained error handling with per-step control
 * - Access to previous step results in chain callbacks
 *
 * @template TLastResult The type of the initial data (if provided).
 *
 * @example
 * // Basic usage without initial data
 * const result = await new Chains()
 *   .chain(() => 'step 1')
 *   .chain(() => 'step 2')
 *   .invoke();
 *
 * @example
 * // With initial data - access via results.r1 in chain callbacks
 * const result = await new Chains(10)
 *   .chain((r) => r.r1 * 2)
 *   .chain((r) => r.r2 + 10)
 *   .invoke();
 *
 * @example
 * // With error handling
 * const result = await new Chains()
 *   .chain(() => JSON.parse('invalid'), { withoutThrow: true })
 *   .chain((r) => {
 *     if (r.r1.error) return 'fallback';
 *     return r.r1.data;
 *   })
 *   .invoke();
 */
export class Chains<TLastResult = undefined> extends ChainsInitImpl<TLastResult> {
  /**
   * Constructs a new Chains instance.
   *
   * @param initialData Optional data to be used as the first result in the chain.
   *                    This data is accessible in chain callbacks as `results.r1`.
   *
   * @example
   * new Chains()          // No initial data
   * new Chains(42)        // Initial data: 42, accessible as results.r1
   * new Chains('hello')   // Initial data: 'hello', accessible as results.r1
   */
  constructor(initialData?: TLastResult) {
    super(initialData);
  }
}

/**
 * Factory function to create a new Chains instance.
 *
 * This is an alternative to directly instantiating the Chains class.
 * Both approaches are functionally equivalent.
 *
 * @template T The type of the initial data (if provided). Defaults to `undefined`.
 * @param initialData Optional data to be used as the first result in the chain.
 * @returns A new Chains instance ready for chaining.
 *
 * @example
 * // Using createChains factory function without initial data
 * const result = await createChains()
 *   .chain(() => 42)
 *   .invoke();
 *
 * @example
 * // With initial data - access it via chain callbacks' results parameter
 * const result = await createChains(10)
 *   .chain((r) => r.r1 * 2)
 *   .invoke();
 */
export function createChains<T = undefined>(initialData?: T): Chains<T> {
  return new Chains(initialData);
}
