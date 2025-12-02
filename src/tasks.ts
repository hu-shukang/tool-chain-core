import { TaskContext } from './types';

/**
 * Tasks class - base class without tasks (no invoke method available)
 * Must call addTask() first to proceed
 *
 * @example
 * ```typescript
 * // Basic usage - without parameter passing
 * await new Tasks()
 *   .addTask(async ({ next }) => {
 *     console.log('task 1');
 *     await next();
 *   })
 *   .addTask(async () => {
 *     console.log('task 2');
 *   })
 *   .invoke();
 *
 * // With parameter passing - specify the parameter type passed by the task
 * await new Tasks()
 *   .addTask<number>(async ({ next }) => {
 *     await next(10); // pass number
 *   })
 *   .addTask(async ({ param, next }) => {
 *     console.log(param); // param type is number (not optional)
 *     await next({ name: 'abc' });
 *   })
 *   .addTask<{ name: string }>(async ({ param }) => {
 *     console.log(param.name); // param type is { name: string } (not optional)
 *   })
 *   .invoke();
 * ```
 */
export class Tasks {
  protected tasks: Array<(context: any) => Promise<void>> = [];
  protected shouldStop = false;

  /**
   * Add a task to the queue
   *
   * The generic parameter U represents the parameter type received by this task,
   * and also the parameter type passed to the next task.
   * The TaskContext generic parameter of the next task will automatically be set to U.
   *
   * @param fn Task function that receives a context object with next, finish, and param
   * @returns Returns a TasksWithTasks instance that has the invoke() method
   *
   * @example
   * .addTask<number>(async ({ param, next }) => {
   *   // This task receives a parameter of type number
   *   // param is inferred as number (not optional)
   *   await next({ key: 'value' });
   * })
   */
  addTask<U = undefined>(fn: (context: TaskContext<U>) => Promise<void>): TasksWithTasks {
    const newTasks = new TasksWithTasks();
    newTasks.tasks = [...this.tasks, fn];
    newTasks.shouldStop = this.shouldStop;
    return newTasks;
  }

  /**
   * Private method for recursively executing tasks
   *
   * @param index The index of the current task
   * @param param The parameter passed from the previous task
   * @protected
   */
  protected async executeTask(index: number, param?: any): Promise<void> {
    // Check if we've reached the end of the task list or been marked to stop
    if (index >= this.tasks.length || this.shouldStop) {
      return;
    }

    let isNextCalled = false;

    // Create the task context object
    const context: any = {
      next: async (value?: any) => {
        isNextCalled = true;
        // Execute the next task, passing the current value as a parameter
        await this.executeTask(index + 1, value);
      },
      finish: async () => {
        // Mark to stop executing subsequent tasks
        this.shouldStop = true;
      },
    };

    // Add the parameter to the context
    context.param = param;

    try {
      // Execute the current task
      await this.tasks[index](context);
    } catch (error) {
      // Stop subsequent task execution on error
      this.shouldStop = true;
      throw error;
    }

    // If the task didn't call next(), automatically stop subsequent tasks
    if (!isNextCalled) {
      this.shouldStop = true;
    }
  }
}

/**
 * TasksWithTasks class - has at least one task and provides invoke() method
 */
export class TasksWithTasks extends Tasks {
  /**
   * Start executing all tasks
   *
   * Executes all tasks in sequence starting from the first task.
   * Each task can call next() to execute the next task, or call finish() to stop early.
   * If a task doesn't call next(), subsequent tasks will automatically stop executing.
   *
   * @returns Returns a Promise that resolves when all tasks are completed
   *
   * @example
   * await new Tasks()
   *   .addTask(async ({ next }) => { await next(); })
   *   .addTask(async () => { console.log('done'); })
   *   .invoke();
   */
  async invoke(): Promise<void> {
    this.shouldStop = false;
    await this.executeTask(0, undefined);
  }

  /**
   * Add another task to the queue
   *
   * @param fn Task function that receives a context object with next, finish, and param
   * @returns Returns a new TasksWithTasks instance for method chaining
   */
  override addTask<U = undefined>(fn: (context: TaskContext<U>) => Promise<void>): TasksWithTasks {
    const newTasks = new TasksWithTasks();
    newTasks.tasks = [...this.tasks, fn];
    newTasks.shouldStop = this.shouldStop;
    return newTasks;
  }
}

/**
 * Factory function to create a new Tasks instance
 *
 * Provides a convenient way to create and start building a task chain.
 *
 * @returns Returns a new Tasks instance
 *
 * @example
 * ```typescript
 * // Basic usage
 * await createTasks()
 *   .addTask(async ({ next }) => {
 *     console.log('task 1');
 *     await next();
 *   })
 *   .addTask(async () => {
 *     console.log('task 2');
 *   })
 *   .invoke();
 *
 * // With parameter passing
 * await createTasks()
 *   .addTask<number>(async ({ next }) => {
 *     await next(42);
 *   })
 *   .addTask(async ({ param }) => {
 *     console.log(param); // 42
 *   })
 *   .invoke();
 * ```
 */
export function createTasks(): Tasks {
  return new Tasks();
}
