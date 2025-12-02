import { Tasks, createTasks } from '../src/tasks';

describe('Tasks', () => {
  it('should execute tasks in sequence with param passing', async () => {
    const output: string[] = [];

    await new Tasks()
      .addTask(async ({ next }) => {
        output.push('task 1 start');
        await next();
        output.push('task 1 end');
      })
      .addTask(async ({ next }) => {
        output.push('task 2 start');
        await next(10);
        output.push('task 2 end');
      })
      .addTask<number>(async ({ param, next }) => {
        output.push('task 3 start');
        output.push(`param: ${param}`);
        await next({ name: 'abc' });
        output.push('task 3 end');
      })
      .addTask<{ name: string }>(async ({ param }) => {
        output.push('task 4 start');
        output.push(`param: ${JSON.stringify(param)}`);
        output.push('task 4 end');
      })
      .invoke();

    expect(output).toEqual([
      'task 1 start',
      'task 2 start',
      'task 3 start',
      'param: 10',
      'task 4 start',
      'param: {"name":"abc"}',
      'task 4 end',
      'task 3 end',
      'task 2 end',
      'task 1 end',
    ]);
  });

  it('should not have param when next() is called without value', async () => {
    const output: string[] = [];

    await new Tasks()
      .addTask(async ({ next, param }) => {
        output.push(`task 1 param: ${param}`);
        await next();
      })
      .addTask(async ({ next, param }) => {
        output.push(`task 2 param: ${param}`);
        await next(42);
      })
      .addTask(async ({ param }) => {
        output.push(`task 3 param: ${param}`);
      })
      .invoke();

    expect(output).toEqual(['task 1 param: undefined', 'task 2 param: undefined', 'task 3 param: 42']);
  });

  it('should stop execution when finish() is called', async () => {
    const output: string[] = [];

    await new Tasks()
      .addTask(async ({ next }) => {
        output.push('task 1');
        await next();
      })
      .addTask(async ({ finish }) => {
        output.push('task 2');
        await finish();
      })
      .addTask(async () => {
        output.push('task 3');
      })
      .invoke();

    expect(output).toEqual(['task 1', 'task 2']);
  });

  it('should auto finish when next() is not called', async () => {
    const output: string[] = [];

    await new Tasks()
      .addTask(async ({ next }) => {
        output.push('task 1');
        await next();
      })
      .addTask(async () => {
        output.push('task 2');
        // No next() call
      })
      .addTask(async () => {
        output.push('task 3');
      })
      .invoke();

    expect(output).toEqual(['task 1', 'task 2']);
  });

  it('should pass different parameter types between tasks', async () => {
    const output: any[] = [];

    await new Tasks()
      .addTask(async ({ next }) => {
        await next('hello');
      })
      .addTask(async ({ param, next }) => {
        output.push(param);
        await next(42);
      })
      .addTask(async ({ param, next }) => {
        output.push(param);
        await next({ key: 'value' });
      })
      .addTask(async ({ param }) => {
        output.push((param as any)?.key);
      })
      .invoke();

    expect(output).toEqual(['hello', 42, 'value']);
  });

  it('should handle single task', async () => {
    const output: string[] = [];

    await new Tasks()
      .addTask(async () => {
        output.push('task 1');
      })
      .invoke();

    expect(output).toEqual(['task 1']);
  });

  it('should handle empty task chain', async () => {
    await expect(new Tasks().addTask(async () => {}).invoke()).resolves.toBeUndefined();
  });

  it('should support chainable addTask API', () => {
    const tasks = new Tasks();
    const result = tasks
      .addTask(async () => {})
      .addTask(async () => {})
      .addTask(async () => {});

    expect(result).toBeInstanceOf(Tasks);
  });

  it('should pass next and finish functions to all tasks', async () => {
    const output: string[] = [];

    await new Tasks()
      .addTask(async ({ next, finish, param }) => {
        output.push('task 1');
        expect(typeof next).toBe('function');
        expect(typeof finish).toBe('function');
        expect(param).toBeUndefined();
        await next();
      })
      .addTask(async ({ next, finish, param }) => {
        output.push('task 2');
        expect(typeof next).toBe('function');
        expect(typeof finish).toBe('function');
        expect(param).toBeUndefined();
      })
      .invoke();

    expect(output).toEqual(['task 1', 'task 2']);
  });

  it('should handle complex nested object parameters', async () => {
    const output: any[] = [];

    await new Tasks()
      .addTask(async ({ next }) => {
        await next({ user: { id: 123, name: 'Alice' }, status: 'active' });
      })
      .addTask(async ({ param, next }) => {
        const p = param as any;
        output.push(p.user.id);
        output.push(p.user.name);
        output.push(p.status);
        await next({ result: 'success' });
      })
      .addTask(async ({ param }) => {
        output.push((param as any).result);
      })
      .invoke();

    expect(output).toEqual([123, 'Alice', 'active', 'success']);
  });

  it('should throw error when task throws', async () => {
    const testError = new Error('test error');

    await expect(
      new Tasks()
        .addTask(async () => {
          throw testError;
        })
        .addTask(async () => {
          // This task should not be executed
          throw new Error('should not be called');
        })
        .invoke()
    ).rejects.toThrow('test error');
  });

  it('should stop executing tasks when one throws', async () => {
    const output: string[] = [];

    await expect(
      new Tasks()
        .addTask(async ({ next }) => {
          output.push('task 1');
          await next();
        })
        .addTask(async () => {
          output.push('task 2');
          throw new Error('task 2 error');
        })
        .addTask(async () => {
          output.push('task 3');
        })
        .invoke()
    ).rejects.toThrow('task 2 error');

    expect(output).toEqual(['task 1', 'task 2']);
  });

  it('should handle error with error parameter in next', async () => {
    const output: string[] = [];

    await expect(
      new Tasks()
        .addTask(async ({ next }) => {
          output.push('task 1');
          await next({ value: 'error-data' });
        })
        .addTask(async ({ param, next }) => {
          output.push('task 2');
          const data = param as any;
          if (data.value === 'error-data') {
            throw new Error('invalid data');
          }
          await next();
        })
        .addTask(async () => {
          output.push('task 3');
        })
        .invoke()
    ).rejects.toThrow('invalid data');

    expect(output).toEqual(['task 1', 'task 2']);
  });

  it('should work with createTasks factory function', async () => {
    const output: string[] = [];

    await createTasks()
      .addTask(async ({ next }) => {
        output.push('task 1');
        await next();
      })
      .addTask(async () => {
        output.push('task 2');
      })
      .invoke();

    expect(output).toEqual(['task 1', 'task 2']);
  });

  it('should work with createTasks and parameter passing', async () => {
    const output: any[] = [];

    await createTasks()
      .addTask<string>(async ({ next }) => {
        await next('hello');
      })
      .addTask(async ({ param, next }) => {
        output.push(param);
        await next(42);
      })
      .addTask(async ({ param }) => {
        output.push(param);
      })
      .invoke();

    expect(output).toEqual(['hello', 42]);
  });
});
