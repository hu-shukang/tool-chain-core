import { Chains, createChains } from '../src/index';
import { getUser } from './setup';

describe('Actions - createActions 工厂函数', () => {
  it('应该通过工厂函数创建 Actions 实例', async () => {
    const result = await createChains()
      .chain(() => getUser('user456'))
      .invoke();

    expect(result).toEqual({ id: 'user456', name: 'John Doe' });
  });

  it('应该支持初始数据', async () => {
    const result = await createChains(100)
      .chain((r) => r.r1 * 2)
      .invoke();

    expect(result).toBe(200);
  });

  it('初始数据应该作为 r1 在链中可用', async () => {
    const result = await createChains({ id: 'initial', value: 50 })
      .chain((r) => {
        const initial = r.r1;
        return initial.value * 2;
      })
      .invoke();

    expect(result).toBe(100);
  });
});
