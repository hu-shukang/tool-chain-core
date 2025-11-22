import { Chains, createChains } from '../src/index';
import { getBook, getUser, syncMultiply } from './setup';

describe('Actions - 复杂工作流', () => {
  it('应该支持获取用户然后获取书籍的工作流', async () => {
    const result = await new Chains()
      .chain(() => getUser('user123'))
      .chain(() => getBook('book001'))
      .chain((r) => {
        const user = r.r1;
        const book = r.r2;
        return {
          user: user.name,
          book: book.title,
        };
      })
      .invoke();

    expect(result).toEqual({
      user: 'John Doe',
      book: 'book_01',
    });
  });

  it('应该支持条件链式调用', async () => {
    const result = await new Chains()
      .chain(() => 50)
      .chain((r) => {
        const val = r.r1;
        if (val > 40) {
          return syncMultiply(val, 2);
        }
        return val;
      })
      .invoke();

    expect(result).toBe(100);
  });
});
