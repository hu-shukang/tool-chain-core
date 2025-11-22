import { Chains, createChains } from '../src/index';
import { User, getUser, throwError } from './setup';

describe('Actions - 错误处理', () => {
  it('在普通模式下应该抛出错误', async () => {
    const action = new Chains().chain(() => throwError()).invoke();
    await expect(action).rejects.toThrow('Test error');
  });

  it('应该在普通模式下链中间停止执行', async () => {
    let executedSecond = false;
    const action = new Chains()
      .chain(() => throwError())
      .chain(() => {
        executedSecond = true;
        return 'never';
      })
      .invoke();

    await expect(action).rejects.toThrow('Test error');
    expect(executedSecond).toBe(false);
  });

  it('应该支持混合错误处理 - 部分捕获错误', async () => {
    const result = await new Chains()
      .chain(() => 'initial')
      .chain(() => throwError(), { withoutThrow: true })
      .chain((r) => {
        const prev = r.r2;
        if (prev.error) {
          return 'recovered from error';
        }
        return prev.data;
      })
      .invoke();

    expect(result).toBe('recovered from error');
  });

  it('应该在没有错误时正常返回数据', async () => {
    const result = await new Chains()
      .chain(() => getUser('user789'), { withoutThrow: true })
      .chain((r) => {
        // r.r1 是 { data?: User; error?: Error } 格式（因为前一步使用了 withoutThrow: true）
        const wrapped = r.r1;
        if (wrapped.error) {
          return 'error';
        }
        // 成功时从 data 属性提取值
        const user = wrapped.data as User;
        return user.name;
      })
      .invoke();

    expect(result).toBe('John Doe');
  });
});
