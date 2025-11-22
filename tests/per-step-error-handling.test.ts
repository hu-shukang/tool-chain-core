import { Chains, createChains } from '../src/index';
import { getUser, throwError } from './setup';

describe('Actions - 按步骤的错误处理', () => {
  it('应该在 withoutThrow 模式下捕获错误', async () => {
    const result = await new Chains().chain(() => throwError(), { withoutThrow: true }).invoke();

    expect(result).toHaveProperty('error');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('Test error');
  });

  it('应该在 withoutThrow 模式下成功时返回包装格式', async () => {
    const result = await new Chains().chain(() => getUser('user123'), { withoutThrow: true }).invoke();

    // 成功时返回 { data: value } 格式
    expect(result).toEqual({ data: { id: 'user123', name: 'John Doe' } });
  });

  it('应该支持在错误捕获步骤后继续链式调用', async () => {
    const result = await new Chains()
      .chain(() => throwError(), { withoutThrow: true })
      .chain((r) => {
        // r.r1 是 { error: Error } 格式
        if (r.r1.error) {
          return 'error occurred';
        }
        return 'success';
      })
      .invoke();
    expect(result).toBe('error occurred');
  });

  it('应该能够在链中访问被包装的错误结果', async () => {
    const result = await new Chains()
      .chain(() => throwError(), { withoutThrow: true })
      .chain((r) => {
        const wrapped = r.r1;
        if (wrapped.error) {
          return `Caught: ${wrapped.error.message}`;
        }
        return wrapped.data;
      })
      .invoke();
    expect(result).toBe('Caught: Test error');
  });
});
