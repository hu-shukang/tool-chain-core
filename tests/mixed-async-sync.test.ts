import { Chains, createChains } from '../src/index';
import { getUser, syncAdd } from './setup';

describe('Actions - 同步和异步函数混合', () => {
  it('应该支持执行同步函数', async () => {
    const result = await new Chains().chain(() => syncAdd(5, 3)).invoke();
    expect(result).toBe(8);
  });

  it('应该支持混合异步和同步函数', async () => {
    const result = await new Chains()
      .chain(() => getUser('user123'))
      .chain((r) => syncAdd(10, 5))
      .invoke();
    expect(result).toBe(15);
  });

  it('应该支持异步和同步的多步混合', async () => {
    const result = await new Chains()
      .chain(() => 10)
      .chain(async (r) => {
        const val = r.r1;
        return Promise.resolve(val * 2);
      })
      .chain((r) => syncAdd(r.r2, 5))
      .invoke();
    expect(result).toBe(25);
  });
});
