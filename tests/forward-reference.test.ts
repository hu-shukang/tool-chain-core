import { Chains, createChains } from '../src/index';
import { getUser, deleteUser } from './setup';

describe('Actions - 前向引用功能', () => {
  it('应该允许后续执行访问前面的结果', async () => {
    const result = await new Chains()
      .chain(() => getUser('user123'))
      .chain(async (r) => {
        const user = r.r1;
        await deleteUser(user);
        return user.id;
      })
      .invoke();

    expect(result).toBe('user123');
  });

  it('应该支持多步访问历史结果', async () => {
    const result = await new Chains()
      .chain(() => 5)
      .chain((r) => r.r1 * 2)
      .chain((r) => r.r1 + r.r2)
      .chain((r) => {
        const r1 = r.r1;
        const r2 = r.r2;
        const r3 = r.r3;
        return { r1, r2, r3, sum: r1 + r2 + r3 };
      })
      .invoke();

    expect(result).toEqual({
      r1: 5,
      r2: 10,
      r3: 15,
      sum: 30,
    });
  });
});
