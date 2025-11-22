import { Chains, createChains } from '../src/index';

describe('Actions - 初始数据流', () => {
  it('初始数据应该在第一个 chain 中可用', async () => {
    const result = await new Chains(10).chain((r) => r.r1 * 2).invoke();

    expect(result).toBe(20);
  });

  it('初始数据和链结果应该都可以访问', async () => {
    const result = await new Chains(5)
      .chain((r) => r.r1 + 10)
      .chain((r) => {
        const initial = r.r1;
        const afterFirst = r.r2;
        return initial + afterFirst;
      })
      .invoke();

    expect(result).toBe(20);
  });

  it('初始数据为 undefined 时应该不在 r1', async () => {
    const result = await new Chains()
      .chain(() => 100)
      .chain((r) => {
        // r.r1 应该是 100（第一个 chain 的结果），不是 undefined
        return r.r1;
      })
      .invoke();

    expect(result).toBe(100);
  });
});
