import { Chains, createChains } from '../src/index';
import { allUser, getUser, queryUser } from './setup';

describe('Actions - 基础功能', () => {
  it('应该执行单个异步函数', async () => {
    const result = await createChains()
      .chain(() => getUser('user123'))
      .invoke();
    expect(result).toEqual({ id: 'user123', name: 'John Doe' });
  });

  it('应该执行多个链式函数', async () => {
    const result = await new Chains()
      .chain(() => getUser('user123'))
      .chain(() => queryUser())
      .chain(() => allUser())
      .invoke();
    expect(result).toEqual([
      { id: '1', name: 'John Doe1' },
      { id: '2', name: 'John Doe2' },
      { id: '3', name: 'John Doe3' },
    ]);
  });

  it('应该能够访问历史结果', async () => {
    const result = await new Chains()
      .chain(() => 10)
      .chain(() => 20)
      .chain((r) => r.r1 + r.r2)
      .invoke();
    expect(result).toBe(30);
  });
});
