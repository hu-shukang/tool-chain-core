/**
 * Type definitions for the Chains library
 * This module provides comprehensive type definitions for the chainable async execution system.
 * It defines function types, result tracking, and the core API interfaces.
 */

/**
 * Base options shared by all chain() variants
 */
interface ChainOptionsBase {
  /**
   * Maximum number of retry attempts when a function fails.
   * Default: 0 (no retries, fail on first error)
   * Example: retry: 3 means the function can fail and retry up to 3 times
   */
  retry?: number;

  /**
   * Condition for deciding whether to retry on error.
   * Can be:
   * - Error type/constructor: Retries only if error is an instance of this type
   * - Error instance: Retries only if error is an instance of the same constructor
   * - string: Retries only if error message includes this string
   * - RegExp: Retries only if error message matches this pattern
   * - undefined: Retries all errors (default behavior)
   */
  retryWhen?: (new (...args: any[]) => Error) | Error | string | RegExp;

  /**
   * Delay in milliseconds between retry attempts.
   * Default: 0 (immediate retry)
   * Example: retryDelay: 1000 means wait 1 second between retries
   */
  retryDelay?: number;

  /**
   * Timeout in milliseconds for the function execution.
   * If the function takes longer than this time, it will be rejected with a TimeoutError.
   * Default: undefined (no timeout)
   * Example: timeout: 5000 means the function must complete within 5 seconds
   */
  timeout?: number;
}

/**
 * Options for chain() with error handling enabled (withoutThrow: true)
 * Errors are caught and wrapped as { data?: T; error?: Error }
 */
export interface ChainOptionsWithoutThrow extends ChainOptionsBase {
  /**
   * If true, errors are caught and wrapped in { error: Error } format.
   */
  withoutThrow: true;
}

/**
 * Options for chain() without error handling (default)
 * Errors are thrown and execution stops
 */
export interface ChainOptionsWithoutError extends ChainOptionsBase {
  /**
   * If false or undefined (default), errors are thrown and execution stops.
   */
  withoutThrow?: false;
}

/**
 * Options for the chain() method
 * Can be either ChainOptionsWithoutThrow or ChainOptionsWithoutError
 */
export type ChainOptions = ChainOptionsWithoutThrow | ChainOptionsWithoutError;

/**
 * Represents a function that can be either synchronous or asynchronous.
 *
 * @template T The return type of the function. Defaults to `any` if not specified.
 * @example
 * // Synchronous function returning a string
 * const syncFn: SyncOrAsyncFunction<string> = () => 'hello';
 *
 * // Asynchronous function returning a Promise
 * const asyncFn: SyncOrAsyncFunction<string> = async () => 'hello';
 *
 * // The function can take any number of arguments
 * const withArgs: SyncOrAsyncFunction<number> = (a: number, b: number) => a + b;
 */
export type SyncOrAsyncFunction<T = any> = (...args: any[]) => T | Promise<T>;

/**
 * Represents a function that is always asynchronous (returns a Promise).
 *
 * @template T The type of value resolved by the Promise. Defaults to `any` if not specified.
 * @example
 * // AsyncFunction that fetches user data
 * const fetchUser: AsyncFunction<User> = async (id: number) => {
 *   const response = await fetch(`/api/users/${id}`);
 *   return response.json();
 * };
 */
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

/**
 * Utility type that extracts the resolved value from a Promise type.
 * If the input is a Promise, returns the type inside the Promise.
 * If the input is not a Promise, returns the type itself.
 *
 * @template T The type to unwrap. Can be a Promise or a regular value.
 * @example
 * // Awaited<Promise<string>> results in string
 * type Result1 = Awaited<Promise<string>>; // string
 *
 * // Awaited<string> results in string (unchanged)
 * type Result2 = Awaited<string>; // string
 *
 * // Awaited<Promise<User | null>> results in User | null
 * type Result3 = Awaited<Promise<User | null>>; // User | null
 */
export type Awaited<T> = T extends Promise<infer R> ? R : T;

/**
 * Stores the execution history of all steps in a Chains execution.
 * This interface maintains a record of each step's result for later reference.
 * Results are indexed as `r1`, `r2`, `r3`, etc., where the number represents the execution order.
 *
 * @example
 * // After executing three steps, the history might look like:
 * const history: ExecutionHistory = {
 *   r1: 'first result',
 *   r2: { id: 123, name: 'User' },
 *   r3: true
 * };
 *
 * // Results can be accessed in executeWith callbacks as:
 * // results.r1, results.r2, results.r3, etc.
 */
export interface ExecutionHistory {
  [key: string]: any;
}

/**
 * Utility type that converts a tuple of result types into an object with indexed properties.
 * Transforms an array type like `[TypeA, TypeB, TypeC]` into an object like `{ r1: TypeA, r2: TypeB, r3: TypeC }`.
 *
 * This type is used internally to provide type-safe access to previous step results in `executeWith` callbacks.
 * The results are indexed with keys `r1`, `r2`, `r3`, etc., representing the execution order.
 *
 * Currently supports up to 20 results. For chains longer than 20 steps, falls back to `{ [key: string]: any }`.
 * This can be extended if support for longer chains is needed.
 *
 * @template T The tuple type to convert. Should be an array of result types.
 * @example
 * // Converting execution results to object format
 * type Results = TupleToResults<[string, number, boolean]>;
 * // Results is { r1: string; r2: number; r3: boolean }
 *
 * // Empty tuple conversion
 * type EmptyResults = TupleToResults<[]>;
 * // EmptyResults is Record<string, never> (no properties)
 *
 * // Used in executeWith for accessing previous results
 * .executeWith((sub, results) => {
 *   // results has type TupleToResults<[...previous result types]>
 *   const firstResult = results.r1;  // Type-safe access
 *   const secondResult = results.r2; // Type-safe access
 * })
 */
export type TupleToResults<T extends any[]> = T extends []
  ? Record<string, never>
  : T extends [infer T1]
    ? { r1: UnwrapForCallback<T1> }
    : T extends [infer T1, infer T2]
      ? { r1: UnwrapForCallback<T1>; r2: UnwrapForCallback<T2> }
      : T extends [infer T1, infer T2, infer T3]
        ? { r1: UnwrapForCallback<T1>; r2: UnwrapForCallback<T2>; r3: UnwrapForCallback<T3> }
        : T extends [infer T1, infer T2, infer T3, infer T4]
          ? {
              r1: UnwrapForCallback<T1>;
              r2: UnwrapForCallback<T2>;
              r3: UnwrapForCallback<T3>;
              r4: UnwrapForCallback<T4>;
            }
          : T extends [infer T1, infer T2, infer T3, infer T4, infer T5]
            ? {
                r1: UnwrapForCallback<T1>;
                r2: UnwrapForCallback<T2>;
                r3: UnwrapForCallback<T3>;
                r4: UnwrapForCallback<T4>;
                r5: UnwrapForCallback<T5>;
              }
            : T extends [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6]
              ? {
                  r1: UnwrapForCallback<T1>;
                  r2: UnwrapForCallback<T2>;
                  r3: UnwrapForCallback<T3>;
                  r4: UnwrapForCallback<T4>;
                  r5: UnwrapForCallback<T5>;
                  r6: UnwrapForCallback<T6>;
                }
              : T extends [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6, infer T7]
                ? {
                    r1: UnwrapForCallback<T1>;
                    r2: UnwrapForCallback<T2>;
                    r3: UnwrapForCallback<T3>;
                    r4: UnwrapForCallback<T4>;
                    r5: UnwrapForCallback<T5>;
                    r6: UnwrapForCallback<T6>;
                    r7: UnwrapForCallback<T7>;
                  }
                : T extends [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6, infer T7, infer T8]
                  ? {
                      r1: UnwrapForCallback<T1>;
                      r2: UnwrapForCallback<T2>;
                      r3: UnwrapForCallback<T3>;
                      r4: UnwrapForCallback<T4>;
                      r5: UnwrapForCallback<T5>;
                      r6: UnwrapForCallback<T6>;
                      r7: UnwrapForCallback<T7>;
                      r8: UnwrapForCallback<T8>;
                    }
                  : T extends [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6, infer T7, infer T8, infer T9]
                    ? {
                        r1: UnwrapForCallback<T1>;
                        r2: UnwrapForCallback<T2>;
                        r3: UnwrapForCallback<T3>;
                        r4: UnwrapForCallback<T4>;
                        r5: UnwrapForCallback<T5>;
                        r6: UnwrapForCallback<T6>;
                        r7: UnwrapForCallback<T7>;
                        r8: UnwrapForCallback<T8>;
                        r9: UnwrapForCallback<T9>;
                      }
                    : T extends [
                          infer T1,
                          infer T2,
                          infer T3,
                          infer T4,
                          infer T5,
                          infer T6,
                          infer T7,
                          infer T8,
                          infer T9,
                          infer T10,
                        ]
                      ? {
                          r1: UnwrapForCallback<T1>;
                          r2: UnwrapForCallback<T2>;
                          r3: UnwrapForCallback<T3>;
                          r4: UnwrapForCallback<T4>;
                          r5: UnwrapForCallback<T5>;
                          r6: UnwrapForCallback<T6>;
                          r7: UnwrapForCallback<T7>;
                          r8: UnwrapForCallback<T8>;
                          r9: UnwrapForCallback<T9>;
                          r10: UnwrapForCallback<T10>;
                        }
                      : T extends [
                            infer T1,
                            infer T2,
                            infer T3,
                            infer T4,
                            infer T5,
                            infer T6,
                            infer T7,
                            infer T8,
                            infer T9,
                            infer T10,
                            infer T11,
                          ]
                        ? {
                            r1: UnwrapForCallback<T1>;
                            r2: UnwrapForCallback<T2>;
                            r3: UnwrapForCallback<T3>;
                            r4: UnwrapForCallback<T4>;
                            r5: UnwrapForCallback<T5>;
                            r6: UnwrapForCallback<T6>;
                            r7: UnwrapForCallback<T7>;
                            r8: UnwrapForCallback<T8>;
                            r9: UnwrapForCallback<T9>;
                            r10: UnwrapForCallback<T10>;
                            r11: UnwrapForCallback<T11>;
                          }
                        : T extends [
                              infer T1,
                              infer T2,
                              infer T3,
                              infer T4,
                              infer T5,
                              infer T6,
                              infer T7,
                              infer T8,
                              infer T9,
                              infer T10,
                              infer T11,
                              infer T12,
                            ]
                          ? {
                              r1: UnwrapForCallback<T1>;
                              r2: UnwrapForCallback<T2>;
                              r3: UnwrapForCallback<T3>;
                              r4: UnwrapForCallback<T4>;
                              r5: UnwrapForCallback<T5>;
                              r6: UnwrapForCallback<T6>;
                              r7: UnwrapForCallback<T7>;
                              r8: UnwrapForCallback<T8>;
                              r9: UnwrapForCallback<T9>;
                              r10: UnwrapForCallback<T10>;
                              r11: UnwrapForCallback<T11>;
                              r12: UnwrapForCallback<T12>;
                            }
                          : T extends [
                                infer T1,
                                infer T2,
                                infer T3,
                                infer T4,
                                infer T5,
                                infer T6,
                                infer T7,
                                infer T8,
                                infer T9,
                                infer T10,
                                infer T11,
                                infer T12,
                                infer T13,
                              ]
                            ? {
                                r1: UnwrapForCallback<T1>;
                                r2: UnwrapForCallback<T2>;
                                r3: UnwrapForCallback<T3>;
                                r4: UnwrapForCallback<T4>;
                                r5: UnwrapForCallback<T5>;
                                r6: UnwrapForCallback<T6>;
                                r7: UnwrapForCallback<T7>;
                                r8: UnwrapForCallback<T8>;
                                r9: UnwrapForCallback<T9>;
                                r10: UnwrapForCallback<T10>;
                                r11: UnwrapForCallback<T11>;
                                r12: UnwrapForCallback<T12>;
                                r13: UnwrapForCallback<T13>;
                              }
                            : T extends [
                                  infer T1,
                                  infer T2,
                                  infer T3,
                                  infer T4,
                                  infer T5,
                                  infer T6,
                                  infer T7,
                                  infer T8,
                                  infer T9,
                                  infer T10,
                                  infer T11,
                                  infer T12,
                                  infer T13,
                                  infer T14,
                                ]
                              ? {
                                  r1: UnwrapForCallback<T1>;
                                  r2: UnwrapForCallback<T2>;
                                  r3: UnwrapForCallback<T3>;
                                  r4: UnwrapForCallback<T4>;
                                  r5: UnwrapForCallback<T5>;
                                  r6: UnwrapForCallback<T6>;
                                  r7: UnwrapForCallback<T7>;
                                  r8: UnwrapForCallback<T8>;
                                  r9: UnwrapForCallback<T9>;
                                  r10: UnwrapForCallback<T10>;
                                  r11: UnwrapForCallback<T11>;
                                  r12: UnwrapForCallback<T12>;
                                  r13: UnwrapForCallback<T13>;
                                  r14: UnwrapForCallback<T14>;
                                }
                              : T extends [
                                    infer T1,
                                    infer T2,
                                    infer T3,
                                    infer T4,
                                    infer T5,
                                    infer T6,
                                    infer T7,
                                    infer T8,
                                    infer T9,
                                    infer T10,
                                    infer T11,
                                    infer T12,
                                    infer T13,
                                    infer T14,
                                    infer T15,
                                  ]
                                ? {
                                    r1: UnwrapForCallback<T1>;
                                    r2: UnwrapForCallback<T2>;
                                    r3: UnwrapForCallback<T3>;
                                    r4: UnwrapForCallback<T4>;
                                    r5: UnwrapForCallback<T5>;
                                    r6: UnwrapForCallback<T6>;
                                    r7: UnwrapForCallback<T7>;
                                    r8: UnwrapForCallback<T8>;
                                    r9: UnwrapForCallback<T9>;
                                    r10: UnwrapForCallback<T10>;
                                    r11: UnwrapForCallback<T11>;
                                    r12: UnwrapForCallback<T12>;
                                    r13: UnwrapForCallback<T13>;
                                    r14: UnwrapForCallback<T14>;
                                    r15: UnwrapForCallback<T15>;
                                  }
                                : T extends [
                                      infer T1,
                                      infer T2,
                                      infer T3,
                                      infer T4,
                                      infer T5,
                                      infer T6,
                                      infer T7,
                                      infer T8,
                                      infer T9,
                                      infer T10,
                                      infer T11,
                                      infer T12,
                                      infer T13,
                                      infer T14,
                                      infer T15,
                                      infer T16,
                                    ]
                                  ? {
                                      r1: UnwrapForCallback<T1>;
                                      r2: UnwrapForCallback<T2>;
                                      r3: UnwrapForCallback<T3>;
                                      r4: UnwrapForCallback<T4>;
                                      r5: UnwrapForCallback<T5>;
                                      r6: UnwrapForCallback<T6>;
                                      r7: UnwrapForCallback<T7>;
                                      r8: UnwrapForCallback<T8>;
                                      r9: UnwrapForCallback<T9>;
                                      r10: UnwrapForCallback<T10>;
                                      r11: UnwrapForCallback<T11>;
                                      r12: UnwrapForCallback<T12>;
                                      r13: UnwrapForCallback<T13>;
                                      r14: UnwrapForCallback<T14>;
                                      r15: UnwrapForCallback<T15>;
                                      r16: UnwrapForCallback<T16>;
                                    }
                                  : T extends [
                                        infer T1,
                                        infer T2,
                                        infer T3,
                                        infer T4,
                                        infer T5,
                                        infer T6,
                                        infer T7,
                                        infer T8,
                                        infer T9,
                                        infer T10,
                                        infer T11,
                                        infer T12,
                                        infer T13,
                                        infer T14,
                                        infer T15,
                                        infer T16,
                                        infer T17,
                                      ]
                                    ? {
                                        r1: UnwrapForCallback<T1>;
                                        r2: UnwrapForCallback<T2>;
                                        r3: UnwrapForCallback<T3>;
                                        r4: UnwrapForCallback<T4>;
                                        r5: UnwrapForCallback<T5>;
                                        r6: UnwrapForCallback<T6>;
                                        r7: UnwrapForCallback<T7>;
                                        r8: UnwrapForCallback<T8>;
                                        r9: UnwrapForCallback<T9>;
                                        r10: UnwrapForCallback<T10>;
                                        r11: UnwrapForCallback<T11>;
                                        r12: UnwrapForCallback<T12>;
                                        r13: UnwrapForCallback<T13>;
                                        r14: UnwrapForCallback<T14>;
                                        r15: UnwrapForCallback<T15>;
                                        r16: UnwrapForCallback<T16>;
                                        r17: UnwrapForCallback<T17>;
                                      }
                                    : T extends [
                                          infer T1,
                                          infer T2,
                                          infer T3,
                                          infer T4,
                                          infer T5,
                                          infer T6,
                                          infer T7,
                                          infer T8,
                                          infer T9,
                                          infer T10,
                                          infer T11,
                                          infer T12,
                                          infer T13,
                                          infer T14,
                                          infer T15,
                                          infer T16,
                                          infer T17,
                                          infer T18,
                                        ]
                                      ? {
                                          r1: UnwrapForCallback<T1>;
                                          r2: UnwrapForCallback<T2>;
                                          r3: UnwrapForCallback<T3>;
                                          r4: UnwrapForCallback<T4>;
                                          r5: UnwrapForCallback<T5>;
                                          r6: UnwrapForCallback<T6>;
                                          r7: UnwrapForCallback<T7>;
                                          r8: UnwrapForCallback<T8>;
                                          r9: UnwrapForCallback<T9>;
                                          r10: UnwrapForCallback<T10>;
                                          r11: UnwrapForCallback<T11>;
                                          r12: UnwrapForCallback<T12>;
                                          r13: UnwrapForCallback<T13>;
                                          r14: UnwrapForCallback<T14>;
                                          r15: UnwrapForCallback<T15>;
                                          r16: UnwrapForCallback<T16>;
                                          r17: UnwrapForCallback<T17>;
                                          r18: UnwrapForCallback<T18>;
                                        }
                                      : T extends [
                                            infer T1,
                                            infer T2,
                                            infer T3,
                                            infer T4,
                                            infer T5,
                                            infer T6,
                                            infer T7,
                                            infer T8,
                                            infer T9,
                                            infer T10,
                                            infer T11,
                                            infer T12,
                                            infer T13,
                                            infer T14,
                                            infer T15,
                                            infer T16,
                                            infer T17,
                                            infer T18,
                                            infer T19,
                                          ]
                                        ? {
                                            r1: UnwrapForCallback<T1>;
                                            r2: UnwrapForCallback<T2>;
                                            r3: UnwrapForCallback<T3>;
                                            r4: UnwrapForCallback<T4>;
                                            r5: UnwrapForCallback<T5>;
                                            r6: UnwrapForCallback<T6>;
                                            r7: UnwrapForCallback<T7>;
                                            r8: UnwrapForCallback<T8>;
                                            r9: UnwrapForCallback<T9>;
                                            r10: UnwrapForCallback<T10>;
                                            r11: UnwrapForCallback<T11>;
                                            r12: UnwrapForCallback<T12>;
                                            r13: UnwrapForCallback<T13>;
                                            r14: UnwrapForCallback<T14>;
                                            r15: UnwrapForCallback<T15>;
                                            r16: UnwrapForCallback<T16>;
                                            r17: UnwrapForCallback<T17>;
                                            r18: UnwrapForCallback<T18>;
                                            r19: UnwrapForCallback<T19>;
                                          }
                                        : T extends [
                                              infer T1,
                                              infer T2,
                                              infer T3,
                                              infer T4,
                                              infer T5,
                                              infer T6,
                                              infer T7,
                                              infer T8,
                                              infer T9,
                                              infer T10,
                                              infer T11,
                                              infer T12,
                                              infer T13,
                                              infer T14,
                                              infer T15,
                                              infer T16,
                                              infer T17,
                                              infer T18,
                                              infer T19,
                                              infer T20,
                                            ]
                                          ? {
                                              r1: UnwrapForCallback<T1>;
                                              r2: UnwrapForCallback<T2>;
                                              r3: UnwrapForCallback<T3>;
                                              r4: UnwrapForCallback<T4>;
                                              r5: UnwrapForCallback<T5>;
                                              r6: UnwrapForCallback<T6>;
                                              r7: UnwrapForCallback<T7>;
                                              r8: UnwrapForCallback<T8>;
                                              r9: UnwrapForCallback<T9>;
                                              r10: UnwrapForCallback<T10>;
                                              r11: UnwrapForCallback<T11>;
                                              r12: UnwrapForCallback<T12>;
                                              r13: UnwrapForCallback<T13>;
                                              r14: UnwrapForCallback<T14>;
                                              r15: UnwrapForCallback<T15>;
                                              r16: UnwrapForCallback<T16>;
                                              r17: UnwrapForCallback<T17>;
                                              r18: UnwrapForCallback<T18>;
                                              r19: UnwrapForCallback<T19>;
                                              r20: UnwrapForCallback<T20>;
                                            }
                                          : { [key: string]: any }; // Fallback for > 20 items

/**
 * Gets the last element type from a tuple.
 * Used to determine the return type of the entire chain.
 *
 * @internal
 */
export type GetLastTupleElement<T extends any[]> = T extends [...any[], infer Last] ? Last : never;

/**
 * Maps callback parameter types.
 * Handles both wrapped results (from withoutThrow: true) and raw results.
 *
 * @internal
 */
export type UnwrapForCallback<T> = T extends { data?: infer D; error?: infer E } ? { data?: D; error?: E } : T;

/**
 * Utility type that wraps each result in a `{ data?: T, error?: Error }` format.
 * Used to represent the results in error-safe mode (after calling `withoutThrow()`).
 *
 * This transforms each element of a results tuple so that accessing results.r1, results.r2, etc.
 * gives you the wrapped format instead of the raw types.
 *
 * @template T The results object type (typically the output of TupleToResults)
 * @example
 * // Before wrapping (normal mode):
 * type Results = { r1: string; r2: number; r3: boolean };
 *
 * // After wrapping (withoutThrow mode):
 * type WrappedResults = WrapResultsForErrorSafeMode<Results>;
 * // Results in: { r1: { data?: string, error?: Error }, r2: { data?: number, error?: Error }, r3: { data?: boolean, error?: Error } }
 */
export type WrapResultsForErrorSafeMode<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends any ? { data?: T[K]; error?: Error } : never;
};

/**
 * Abstract base class for the Chains chainable API.
 *
 * This is the core interface for building chains of asynchronous and synchronous function executions.
 * It provides the `chain()` method for chaining operations and `invoke()` to finalize the chain.
 *
 * The class uses a generic type parameter to track execution history:
 *
 * @template TResults A tuple containing the return types of all chained steps in order.
 *                     Empty array `[]` means no steps have executed yet.
 *                     Grows as each step is added: `[T1]`, then `[T1, T2]`, etc.
 *
 * @example
 * // Chain of operations with type tracking
 * const result = await new Chains()
 *   .chain(() => 10)              // r1: 10
 *   .chain((r) => r.r1 * 2)       // r2: 20
 *   .chain((r) => r.r2 + 5)       // r3: 25
 *   .invoke();
 *
 * @example
 * // With error handling per step
 * const result = await new Chains()
 *   .chain(() => JSON.parse('invalid'), { withoutThrow: true })  // r1: { error: ... }
 *   .chain((r) => {
 *     if (r.r1.error) return 'fallback';
 *     return r.r1.data;
 *   })
 *   .invoke();
 */
export abstract class ChainsBase<TResults extends any[] = []> {
  /**
   * Chains a function to execute in the sequence.
   *
   * The function receives an object containing all previous results indexed as `r1`, `r2`, etc.
   * The return value becomes the new result and is added to the history.
   *
   * When `withoutThrow: true` is used, the result is wrapped as `{ data?: R; error?: Error }`.
   * Otherwise, the result is returned as-is (or error is thrown).
   *
   * @template R The return type of the function.
   * @param fn A function that receives previous results and returns a new result.
   * @param options Configuration options for this chain step:
   *   - `retry?: number`: Maximum number of retry attempts (default: 0)
   *   - `retryWhen?: ErrorConstructor | Error | string | RegExp`: Condition for retrying
   *   - `retryDelay?: number`: Delay between retries in milliseconds (default: 0)
   *   - `timeout?: number`: Timeout in milliseconds (default: undefined, no timeout)
   *   - `withoutThrow?: boolean`: If true, catches errors and wraps result as `{ data?: R; error?: Error }`
   * @returns A new ChainsBase instance with updated results history.
   *
   * @example
   * // Simple chaining - returns R
   * .chain(() => 10)
   * .chain((r) => r.r1 * 2)
   *
   * @example
   * // With error handling - returns { data?: R; error?: Error }
   * .chain(async () => fetch('/api/data'), { withoutThrow: true })
   * .chain((r) => {
   *   if (r.r1.error) return 'fallback';
   *   return r.r1.data;
   * })
   *
   * @example
   * // With retry and timeout
   * .chain(
   *   () => fetchData(),
   *   { retry: 3, timeout: 5000, retryDelay: 1000 }
   * )
   */
  abstract chain<R>(
    fn: (results: TupleToResults<TResults>) => R | Promise<R>,
    options: ChainOptionsWithoutThrow,
  ): ChainsBase<[...TResults, { data?: R; error?: Error }]>;

  /**
   * Overload 2: chain without error handling - returns raw result directly.
   * When an error occurs, it is thrown (unless retried).
   *
   * @example
   * // Without withoutThrow - errors are thrown
   * const result = await new Chains()
   *   .chain(() => 42)
   *   .chain((r) => r.r1 * 2)  // Returns 84 directly
   *   .invoke();
   */
  abstract chain<R>(
    fn: (results: TupleToResults<TResults>) => R | Promise<R>,
    options?: undefined | ChainOptionsWithoutError,
  ): ChainsBase<[...TResults, R]>;

  /**
   * Executes the entire chain and returns the final result.
   *
   * This method is terminal and must be called at the end of a chain to execute all steps
   * and retrieve the final result.
   *
   * @returns A Promise that resolves to the result of the last chain step.
   *
   * @example
   * const result = await new Chains()
   *   .chain(() => 42)
   *   .chain((r) => r.r1 * 2)
   *   .invoke();
   * // result = 84
   *
   * @example
   * // With multiple steps and result access
   * const result = await new Chains()
   *   .chain(() => 10)
   *   .chain((r) => r.r1 * 2)
   *   .chain((r) => r.r1 + r.r2)
   *   .invoke();
   * // result = 30 (10 + 20)
   */
  abstract invoke(): Promise<GetLastTupleElement<TResults>>;
}

/**
 * Chains interface for initialization.
 *
 * This is the restricted interface provided by the `Chains` constructor and `createChains()` function.
 * It only exposes `chain()` and `invoke()` methods.
 *
 * @template TLastResult The type of the initial data passed to the constructor.
 *
 * @example
 * // Without initial data
 * const result = await new Chains()
 *   .chain(() => 'hello')
 *   .invoke();
 *
 * @example
 * // With initial data - accessible in chain callbacks as results.r1
 * const result = await new Chains(10)
 *   .chain((r) => r.r1 * 2)
 *   .invoke();
 */
export abstract class ChainsInit<TLastResult = any> extends ChainsBase<
  TLastResult extends undefined ? [] : [TLastResult]
> {
  // Inherits chain() and invoke() from ActionsBase
}
