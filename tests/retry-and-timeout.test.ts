import { Chains, createChains } from '../src/index';

describe('Actions - 重试功能', () => {
  it('应该在不指定retry时不进行重试', async () => {
    let attempts = 0;
    const action = new Chains()
      .chain(() => {
        attempts++;
        throw new Error('Test error');
      })
      .invoke();

    await expect(action).rejects.toThrow('Test error');
    expect(attempts).toBe(1);
  });

  it('应该重试失败的函数直到成功', async () => {
    let attempts = 0;
    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary error');
          }
          return 'success';
        },
        { retry: 3 },
      )
      .invoke();

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('应该在达到最大重试次数后仍然失败', async () => {
    let attempts = 0;
    const action = new Chains()
      .chain(
        () => {
          attempts++;
          throw new Error('Persistent error');
        },
        { retry: 2 },
      )
      .invoke();

    await expect(action).rejects.toThrow('Persistent error');
    expect(attempts).toBe(3); // 1 initial + 2 retries
  });

  it('应该支持 retryWhen 作为 string 来匹配错误消息', async () => {
    let attempts = 0;
    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts === 1) {
            throw new Error('Timeout error');
          }
          return 'recovered';
        },
        { retry: 3, retryWhen: 'Timeout' },
      )
      .invoke();

    expect(result).toBe('recovered');
    expect(attempts).toBe(2);
  });

  it('应该在 retryWhen string 不匹配时停止重试', async () => {
    let attempts = 0;
    const action = new Chains()
      .chain(
        () => {
          attempts++;
          throw new Error('Permanent error');
        },
        { retry: 3, retryWhen: 'Timeout' },
      )
      .invoke();

    await expect(action).rejects.toThrow('Permanent error');
    expect(attempts).toBe(1); // 不重试，因为错误消息不包含 'Timeout'
  });

  it('应该支持 retryWhen 作为 RegExp 来匹配错误消息', async () => {
    let attempts = 0;
    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts === 1) {
            throw new Error('Network timeout occurred');
          }
          return 'success';
        },
        { retry: 3, retryWhen: /timeout/i },
      )
      .invoke();

    expect(result).toBe('success');
    expect(attempts).toBe(2);
  });

  it('应该在 retryWhen RegExp 不匹配时停止重试', async () => {
    let attempts = 0;
    const action = new Chains()
      .chain(
        () => {
          attempts++;
          throw new Error('Database connection failed');
        },
        { retry: 3, retryWhen: /timeout/i },
      )
      .invoke();

    await expect(action).rejects.toThrow('Database connection failed');
    expect(attempts).toBe(1); // 不重试，因为错误消息不匹配 /timeout/i
  });

  it('应该支持 retryWhen 作为 Error 类型', async () => {
    class NetworkError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
      }
    }

    let attempts = 0;
    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts === 1) {
            throw new NetworkError('Connection failed');
          }
          return 'recovered';
        },
        { retry: 3, retryWhen: new NetworkError('') },
      )
      .invoke();

    expect(result).toBe('recovered');
    expect(attempts).toBe(2);
  });

  it('应该支持 retryWhen 作为 Error 构造函数', async () => {
    class NetworkError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
      }
    }

    let attempts = 0;
    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts === 1) {
            throw new NetworkError('Connection failed');
          }
          return 'recovered';
        },
        { retry: 3, retryWhen: NetworkError },
      )
      .invoke();

    expect(result).toBe('recovered');
    expect(attempts).toBe(2);
  });

  it('应该在 Error 构造函数不匹配时停止重试', async () => {
    class NetworkError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
      }
    }

    let attempts = 0;
    const action = new Chains()
      .chain(
        () => {
          attempts++;
          throw new Error('Generic error');
        },
        { retry: 3, retryWhen: NetworkError },
      )
      .invoke();

    await expect(action).rejects.toThrow('Generic error');
    expect(attempts).toBe(1); // 不重试，因为错误类型不匹配
  });

  it('应该支持 retryDelay 延迟重试', async () => {
    let attempts = 0;
    const startTime = Date.now();

    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temp error');
          }
          return 'success';
        },
        { retry: 2, retryDelay: 100 },
      )
      .invoke();

    const elapsed = Date.now() - startTime;
    expect(result).toBe('success');
    expect(attempts).toBe(3);
    // 应该至少等待 200ms (2 retries × 100ms)，允许 50ms 的误差
    expect(elapsed).toBeGreaterThanOrEqual(150);
  });

  it('应该在 retryDelay 为 0 时立即重试', async () => {
    let attempts = 0;
    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts < 2) {
            throw new Error('Temp error');
          }
          return 'success';
        },
        { retry: 1, retryDelay: 0 },
      )
      .invoke();

    expect(result).toBe('success');
    expect(attempts).toBe(2);
  });

  it('应该在 withoutThrow 和 retry 组合时捕获错误', async () => {
    let attempts = 0;
    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          throw new Error('Persistent error');
        },
        { retry: 2, withoutThrow: true },
      )
      .invoke();

    expect(result).toHaveProperty('error');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('Persistent error');
    expect(attempts).toBe(3); // 1 initial + 2 retries
  });

  it('应该在重试成功时返回包装格式（withoutThrow: true）', async () => {
    let attempts = 0;
    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts < 2) {
            throw new Error('Temp error');
          }
          return 'success';
        },
        { retry: 1, withoutThrow: true },
      )
      .invoke();

    expect(result).toEqual({ data: 'success' });
    expect(attempts).toBe(2);
  });

  it('应该支持在 retryWhen + withoutThrow 组合中选择性重试', async () => {
    let attempts = 0;
    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts === 1) {
            throw new Error('Timeout occurred');
          }
          return 'recovered';
        },
        { retry: 1, retryWhen: 'Timeout', withoutThrow: true },
      )
      .invoke();

    expect(result).toEqual({ data: 'recovered' });
    expect(attempts).toBe(2);
  });

  it('应该在链中支持多个带重试的步骤', async () => {
    let attempts1 = 0;
    let attempts2 = 0;

    const result = await new Chains()
      .chain(
        () => {
          attempts1++;
          if (attempts1 === 1) {
            throw new Error('First step error');
          }
          return 10;
        },
        { retry: 1 },
      )
      .chain(
        (r) => {
          attempts2++;
          if (attempts2 === 1) {
            throw new Error('Second step error');
          }
          return r.r1 * 2;
        },
        { retry: 1 },
      )
      .invoke();

    expect(result).toBe(20);
    expect(attempts1).toBe(2);
    expect(attempts2).toBe(2);
  });
});

describe('Actions - 超时功能', () => {
  it('应该在函数执行超时时拒绝', async () => {
    try {
      await new Chains()
        .chain(
          () => new Promise((resolve) => setTimeout(() => resolve('done'), 1000)),
          { timeout: 100 },
        )
        .invoke();
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('timeout');
      expect((error as Error).message).toContain('100');
    }
  });

  it('应该在函数在超时前完成时成功', async () => {
    const result = await new Chains()
      .chain(
        () => new Promise((resolve) => setTimeout(() => resolve('done'), 50)),
        { timeout: 200 },
      )
      .invoke();

    expect(result).toBe('done');
  });

  it('应该在没有指定超时时正常执行', async () => {
    const result = await new Chains()
      .chain(
        () => new Promise((resolve) => setTimeout(() => resolve('done'), 100)),
      )
      .invoke();

    expect(result).toBe('done');
  });

  it('应该支持超时与withoutThrow的组合', async () => {
    const result = await new Chains()
      .chain(
        () => new Promise<string>((resolve) => setTimeout(() => resolve('done'), 1000)),
        { timeout: 100, withoutThrow: true },
      )
      .invoke();

    expect(result).toEqual({
      error: expect.objectContaining({ message: expect.stringContaining('timeout') }),
    });
  });

  it('应该支持超时与重试的组合', async () => {
    let attempts = 0;

    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts === 1) {
            return new Promise<string>((resolve) =>
              setTimeout(() => resolve('delayed'), 500),
            );
          }
          return 'immediate';
        },
        { timeout: 100, retry: 1 },
      )
      .invoke();

    expect(result).toBe('immediate');
    expect(attempts).toBe(2);
  });

  it('应该支持使用 retryWhen: "timeout" 重试超时错误', async () => {
    let attempts = 0;

    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts < 2) {
            return new Promise<string>((resolve) =>
              setTimeout(() => resolve('done'), 500),
            );
          }
          return 'recovered';
        },
        { timeout: 100, retry: 1, retryWhen: 'timeout' },
      )
      .invoke();

    expect(result).toBe('recovered');
    expect(attempts).toBe(2);
  });

  it('应该支持使用 TimeoutError 构造函数重试超时错误', async () => {
    let attempts = 0;

    class CustomTimeoutError extends Error {
      name = 'CustomTimeoutError';
    }

    const result = await new Chains()
      .chain(
        () => {
          attempts++;
          if (attempts === 1) {
            throw new CustomTimeoutError('Operation timeout');
          }
          return 'recovered';
        },
        { retry: 1, retryWhen: CustomTimeoutError },
      )
      .invoke();

    expect(result).toBe('recovered');
    expect(attempts).toBe(2);
  });

  it('应该在超时时使用 withoutThrow 捕获错误', async () => {
    const result = await new Chains()
      .chain(
        () => new Promise<string>((resolve) =>
          setTimeout(() => resolve('should timeout'), 500),
        ),
        { timeout: 50, withoutThrow: true },
      )
      .chain((r) => {
        if (r.r1.error) {
          return 'timeout_handled';
        }
        return r.r1.data;
      })
      .invoke();

    expect(result).toBe('timeout_handled');
  });

  it('应该支持链中多个步骤的不同超时', async () => {
    const result = await new Chains()
      .chain(
        () => new Promise((resolve) => setTimeout(() => resolve(10), 30)),
        { timeout: 100 },
      )
      .chain(
        (r) => new Promise<number>((resolve) => setTimeout(() => resolve((r.r1 as number) * 2), 30)),
        { timeout: 100 },
      )
      .invoke();

    expect(result).toBe(20);
  });
});
