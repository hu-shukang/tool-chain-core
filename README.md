# @tool-chain/core

[![npm version](https://img.shields.io/npm/v/@tool-chain/core.svg)](https://www.npmjs.com/package/@tool-chain/core)
[![npm downloads](https://img.shields.io/npm/dm/@tool-chain/core.svg)](https://www.npmjs.com/package/@tool-chain/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D12-brightgreen)](https://nodejs.org/)

**A powerful asynchronous chaining execution library** - Build complex async workflows with elegant APIs. Supports both ESM and CommonJS module formats with complete TypeScript type safety and flexible error handling.

> Simplify async operations and make your code more elegant, readable, and maintainable.

## 🚀 Quick Start

### Installation

Install with your preferred package manager:

```bash
# npm
npm install @tool-chain/core

# yarn
yarn add @tool-chain/core

# pnpm
pnpm add @tool-chain/core
```

### Requirements

- **Node.js**: >= 12.0
- **TypeScript**: >= 4.5 (optional, but recommended for full type support)
- **Browser**: Modern browsers (requires build tools like Webpack/Rollup)

### 30-Second Quick Examples

The library provides two powerful tools for async workflow management:

#### Option 1: Chains - Access all previous results

Use `Chains` when you need to access multiple historical results:

```typescript
import { Chains } from '@tool-chain/core';

const result = await new Chains()
  .chain(() => 10) // Step 1: Returns 10, r1 = 10
  .chain((r) => r.r1 * 2) // Step 2: r1=10, returns 20, r2 = 20
  .chain((r) => r.r2 + 5) // Step 3: r2=20, returns 25, r3 = 25
  .invoke();

console.log(result); // Output: 25

// Key Concepts:
// - Each step can access all previous results (r1, r2, r3...)
// - r1 is the result of step 1, r2 is the result of step 2, and so on
// - .invoke() executes the entire chain and returns the result of the last step
```

#### Option 2: Tasks - Clean parameter passing between steps

Use `Tasks` when you prefer parameter-based flow control:

```typescript
import { Tasks } from '@tool-chain/core';

await new Tasks()
  .addTask(async ({ next }) => {
    const data = 10;
    await next(data * 2); // Pass 20 to next task
  })
  .addTask(async ({ param, next }) => {
    // param = 20 (from previous task)
    await next(param + 5); // Pass 25 to next task
  })
  .addTask(async ({ param }) => {
    console.log(param); // Output: 25
  })
  .invoke();
```

That's it! You've mastered the basics. Continue reading to learn about more powerful features and when to use each tool.

## ✨ Core Features

### 🔗 **Two Powerful Execution Patterns**

#### Chains - Multi-Result Access
- Build async workflows using `.chain()` method
- Access all historical results (`r1`, `r2`, `r3`...)
- Perfect for pipelines where you need multiple intermediate results

#### Tasks - Parameter Passing
- Sequential task execution with `.addTask()` method
- Clean parameter passing between tasks via `next(param)`
- Perfect for workflows with linear data flow

### 🛡️ **Flexible Error Handling**

- **Default Mode**: Errors are thrown directly, interrupting the chain
- **Capture Mode**: Use `{ withoutThrow: true }` to capture errors per step (Chains only)
- **Mixed Mode**: Flexibly mix both error handling strategies in the same chain (Chains only)
- **Task Errors**: Errors propagate immediately, stopping subsequent tasks (Tasks)
- Fine-grained error control without wrapping entire chains in try-catch

### 🎯 **Smart Retry and Timeout**

- Automatic retry of failed steps (configurable retry count)
- Flexible retry conditions (by error type, message, or regex)
- Configurable retry delay (prevents resource waste from immediate retries)
- Execution timeout control (prevents long hangs)
- **Note**: Retry and timeout features are available for Chains; Tasks focuses on simplicity

### 📊 **Initial Data and State Management**

- **Chains**: Pass initial data on construction, available as `r1` in the chain
- **Tasks**: Pass parameters between tasks using `next(param)`
- Automatically preserves results from all steps
- Flexible data flow and state management

### ✅ **Complete TypeScript Support**

- Complete type definition files (`.d.ts`)
- Strict mode compilation configuration
- Smart type inference (supporting 20+ step chains for Chains; full type safety for Tasks)
- Perfect IDE autocomplete and type checking
- Type-safe parameter passing in Tasks ensures compile-time safety

### 📦 **Dual Module Support**

- **ESM** (ES Modules) - Modern JavaScript module format
- **CommonJS** - Node.js standard module format
- Automatic module detection, no manual configuration needed

## 📚 Detailed Usage Guide

### Chains Usage

#### Basic Chaining

Create a simple chain flow to process data step by step:

```typescript
import { Chains } from '@tool-chain/core';

const result = await new Chains()
  .chain(() => 10)
  .chain((r) => r.r1 * 2) // Access result from step 1
  .chain((r) => r.r2 + 5) // Access result from step 2
  .chain((r) => r.r3.toString()) // Convert to string
  .invoke();

console.log(result); // "25"
```

**Key Points:**

- Each `.chain()` step can access all previous results
- `r1` is the result of the first step, `r2` is the result of the second step, and so on
- You must call `.invoke()` at the end to execute the entire chain

#### Factory Function

Use the `createChains()` factory function for more concise code:

```typescript
import { createChains } from '@tool-chain/core';

const result = await createChains()
  .chain(() => 'hello')
  .chain((r) => r.r1.toUpperCase())
  .invoke();

console.log(result); // "HELLO"
```

#### Using Initial Data

Pass initial data on construction, which will be available as `r1` in the chain:

```typescript
const result = await new Chains(100) // Initial data: 100
  .chain((r) => r.r1 * 2) // r1 = 100, returns 200
  .chain((r) => r.r2 - 50) // r2 = 200, returns 150
  .invoke();

console.log(result); // 150
```

**Use Cases:**

- Processing initial data passed from function parameters
- Building reusable data processing flows
- Initializing chains in class methods

#### Error Handling - Deep Dive

##### Method 1: Default Throw Mode

Errors are thrown directly, interrupting chain execution. Use try-catch to handle:

```typescript
try {
  const result = await new Chains()
    .chain(() => JSON.parse('invalid')) // Throws SyntaxError
    .chain((r) => r.r1.name) // Not executed
    .invoke();
} catch (error) {
  console.error('Chain failed:', error.message);
  // Handle error
}
```

**Pros:** Simple and clear, errors interrupt immediately
**Cons:** Requires wrapping entire chain in try-catch

##### Method 2: Capture Mode (Recommended)

Use `{ withoutThrow: true }` to capture errors and wrap them as objects, chain continues:

```typescript
const result = await new Chains()
  .chain(() => JSON.parse('invalid'), { withoutThrow: true })
  // Returns: { error: SyntaxError, data: undefined }
  .chain((r) => {
    if (r.r1.error) {
      console.log('Parse failed, using default value');
      return { name: 'default', age: 0 };
    }
    return r.r1.data;
  })
  .chain((r) => {
    // r.r1 is now safe to use
    return r.r1.name.toUpperCase();
  })
  .invoke();

console.log(result); // "DEFAULT"
```

**Return Value Structure:**

```typescript
{
  data?: T;      // Data when successful
  error?: Error; // Error object when failed
}
```

**Pros:** Flexible error handling, chain continues, can fallback
**Cons:** Must check errors at each step

##### Method 3: Mixed Mode

Mix both error handling strategies in the same chain:

```typescript
const result = await new Chains()
  // Step 1: Capture network errors
  .chain(
    async () => {
      const resp = await fetch('/api/users');
      return resp.json();
    },
    { withoutThrow: true },
  )
  // Step 2: Check errors, fallback if needed
  .chain((r) => {
    if (r.r1.error) {
      console.log('API call failed, using cached data');
      return [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
    }
    return r.r1.data;
  })
  // Step 3: Data transformation (default mode, errors thrown)
  .chain((r) => {
    return r.r1.map((user) => user.name.toUpperCase());
  })
  // Step 4: Capture errors again
  .chain((r) => saveToDatabase(r.r1), { withoutThrow: true })
  .invoke();
```

**Key Concepts:**

- Each step can independently set its error handling strategy
- Capture mode error objects have a consistent format
- Mixed use allows defensive programming at critical points while failing fast elsewhere

#### Retry and Timeout - Deep Dive

##### Basic Retry

Automatically retry specified number of times on failure:

```typescript
const result = await new Chains()
  .chain(
    async () => {
      return fetch('/api/unstable').then((r) => r.json());
    },
    {
      retry: 3, // Maximum 3 retries (4 total attempts)
      retryDelay: 1000, // Wait 1 second between retries
    },
  )
  .invoke();
```

**Work Flow:**

1. Execute function
2. On failure → wait retryDelay → retry
3. Repeat until success or retries exhausted

##### Smart Retry Conditions

Only retry for specific errors, fail immediately for others:

```typescript
const result = await new Chains()
  .chain(
    async () => {
      const res = await fetch('/api/data');
      if (res.status === 429) throw new Error('Rate limited');
      if (res.status === 404) throw new Error('Not found');
      return res.json();
    },
    {
      retry: 5,
      // Method 1: String - retry when error message contains this string
      retryWhen: 'Rate limited',
      retryDelay: 2000,
    },
  )
  .invoke();
```

**retryWhen Parameter Types:**

```typescript
// 1. Error type - only retry that specific error type
retryWhen: TypeError; // Only retry TypeError

// 2. String - retry when error message contains this string
retryWhen: 'timeout'; // Retry if error message contains 'timeout'

// 3. RegExp - retry when error message matches regex
retryWhen: /timeout|Rate limited/; // Retry if matches either term
```

##### Timeout Control

Prevent requests from hanging indefinitely:

```typescript
const result = await new Chains()
  .chain(
    async () => {
      return fetch('/api/slow-endpoint').then((r) => r.json());
    },
    {
      timeout: 5000, // 5 second timeout, throws error if exceeded
      retry: 2, // If timeout, retry 2 times
      retryWhen: /timeout/, // Only retry on timeout
    },
  )
  .chain((r) => {
    // Guaranteed to get data within 5 seconds here
    return r.r1;
  })
  .invoke();
```

**Timeout Error Example:**

```typescript
// Timeout throws error (if withoutThrow not set)
// Error: Timeout exceeded: operation took longer than 5000ms
```

#### Async Operations Chain

Chain multiple async operations with automatic Promise handling:

```typescript
const result = await new Chains()
  // Step 1: Fetch user list
  .chain(async () => {
    const res = await fetch('/api/users');
    return res.json();
  })
  // Step 2: Fetch user details
  .chain(async (r) => {
    const userIds = r.r1.map((u) => u.id);
    const res = await fetch(`/api/user-details?ids=${userIds.join(',')}`);
    return res.json();
  })
  // Step 3: Combine results
  .chain((r) => {
    return {
      users: r.r1, // Step 1 result
      details: r.r2, // Step 2 result
    };
  })
  .invoke();
```

#### Mixing Sync and Async

Freely mix synchronous and asynchronous operations:

```typescript
const result = await new Chains()
  .chain(() => 10) // Sync: initial value
  .chain(async (r) => {
    // Async: simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));
    return r.r1 * 2; // 20
  })
  .chain((r) => {
    // Sync: data transformation
    return r.r2 + 5; // 25
  })
  .chain(async (r) => {
    // Async: save data
    await saveToDatabase({ value: r.r1 });
    return r.r1;
  })
  .invoke();

console.log(result); // 25
```

### Tasks Usage

The `Tasks` class provides a lightweight alternative for sequential task execution with parameter passing between tasks. Unlike `Chains` which is optimized for accessing all previous results, `Tasks` focuses on clean parameter-based flow control.

#### Basic Task Execution

Execute multiple tasks sequentially, where each task can call `next()` to pass data to the next task:

```typescript
import { Tasks, createTasks } from '@tool-chain/core';

await new Tasks()
  .addTask(async ({ next }) => {
    console.log('Task 1');
    await next(); // Continue to next task
  })
  .addTask(async ({ next }) => {
    console.log('Task 2');
    await next(42); // Pass parameter to next task
  })
  .addTask<number>(async ({ param }) => {
    console.log(`Task 3 received: ${param}`); // 42
  })
  .invoke();
```

#### Parameter Passing Between Tasks

Each task can receive parameters from the previous task with full type safety:

```typescript
import { createTasks } from '@tool-chain/core';

await createTasks()
  .addTask<string>(async ({ next }) => {
    // This task passes a string to the next
    await next('hello');
  })
  .addTask(async ({ param, next }) => {
    // param is inferred as string (not optional)
    console.log(param); // "hello"
    await next({ id: 1, name: 'Alice' });
  })
  .addTask<{ id: number; name: string }>(async ({ param }) => {
    // param is inferred as { id: number; name: string }
    console.log(param.name); // "Alice"
  })
  .invoke();
```

#### Early Termination with finish()

Stop task execution at any point using the `finish()` method:

```typescript
await new Tasks()
  .addTask(async ({ next }) => {
    console.log('Task 1');
    await next();
  })
  .addTask(async ({ finish }) => {
    console.log('Task 2');
    await finish(); // Stop here, don't execute task 3
  })
  .addTask(async () => {
    console.log('Task 3'); // Not executed
  })
  .invoke();
```

#### Automatic Task Termination

If a task doesn't call `next()` or `finish()`, subsequent tasks stop executing automatically:

```typescript
await new Tasks()
  .addTask(async ({ next }) => {
    console.log('Task 1');
    await next();
  })
  .addTask(async () => {
    console.log('Task 2');
    // No next() or finish() call - auto stop
  })
  .addTask(async () => {
    console.log('Task 3'); // Not executed
  })
  .invoke();
```

#### Error Handling in Tasks

Errors thrown in any task stop execution and are propagated:

```typescript
try {
  await new Tasks()
    .addTask(async ({ next }) => {
      console.log('Task 1');
      await next();
    })
    .addTask(async () => {
      throw new Error('Task 2 failed');
    })
    .addTask(async () => {
      console.log('Task 3'); // Not executed
    })
    .invoke();
} catch (error) {
  console.error('Error:', error.message); // "Task 2 failed"
}
```

#### Factory Function

Use `createTasks()` for more concise code:

```typescript
import { createTasks } from '@tool-chain/core';

await createTasks()
  .addTask(async ({ next }) => {
    await next('data');
  })
  .addTask(async ({ param }) => {
    console.log(param);
  })
  .invoke();
```

## 🎯 Common Use Cases

### Scenario 1: Data Processing Pipeline

```typescript
// Validate → Transform → Clean → Save
const result = await new Chains(rawUserData)
  // Validate data
  .chain((r) => {
    const valid = r.r1.every((u) => u.id && u.name && u.email);
    if (!valid) throw new Error('Invalid data');
    return r.r1;
  })
  // Transform data
  .chain((r) => {
    return r.r1.map((u) => ({
      id: u.id,
      name: u.name.trim(),
      email: u.email.toLowerCase(),
    }));
  })
  // Clean data (remove duplicates)
  .chain((r) => {
    const seen = new Set();
    return r.r1.filter((u) => {
      if (seen.has(u.email)) return false;
      seen.add(u.email);
      return true;
    });
  })
  // Save to database
  .chain(async (r) => {
    return db.users.insertMany(r.r1);
  })
  .invoke();
```

### Scenario 2: API Call Chain

```typescript
// Fetch user → Fetch permissions → Fetch config → Combine
const userData = await new Chains()
  // Fetch user info
  .chain(
    async () => {
      const res = await fetch(`/api/user/${userId}`);
      return res.json();
    },
    { timeout: 5000 },
  )
  // Fetch user permissions
  .chain(
    async (r) => {
      const res = await fetch(`/api/permissions/${r.r1.id}`);
      return res.json();
    },
    { timeout: 5000 },
  )
  // Fetch user config
  .chain(
    async (r) => {
      const res = await fetch(`/api/config/${r.r1.userId}`);
      return res.json();
    },
    { timeout: 5000 },
  )
  // Combine all data
  .chain((r) => {
    return {
      user: r.r1,
      permissions: r.r2,
      config: r.r3,
    };
  })
  .invoke();
```

## 📖 Complete API Reference

### Class: `Chains<TResults>`

Main class for chaining execution, supports method chaining.

#### Constructor

```typescript
constructor(initialData?: T)
```

**Parameters:**

- `initialData` (optional) - Initial data, will be available as `r1` in the chain

**Example:**

```typescript
// Without initial data
const chain = new Chains();

// With initial data
const chain = new Chains(100);
const chain = new Chains({ name: 'John', age: 30 });
const chain = new Chains([1, 2, 3]);
```

#### Method: `chain<R>(fn, options?)`

Add an execution step to the chain.

**Parameters:**

- `fn` - Execution function with signature `(results: ResultsObject) => T | Promise<T>`
- `options` (optional) - Options object of type `ChainOptions<T>`

**Return Value:**

- Returns new `Chains` instance for method chaining

**Example:**

```typescript
const chain = new Chains()
  .chain(() => getValue())
  .chain((r) => r.r1 + 10)
  .chain(
    async (r) => {
      const data = await fetchData();
      return data;
    },
    { timeout: 5000 },
  );
```

#### Method: `invoke()`

Execute the entire chain and return the final result.

**Return Value:**

- `Promise<T>` - Return value of the last chain step

**Example:**

```typescript
const result = await new Chains()
  .chain(() => 10)
  .chain((r) => r.r1 * 2)
  .invoke();

console.log(result); // 20
```

### Function: `createChains<T>(initialData?)`

Factory function to create a new Chains instance.

**Parameters:**

- `initialData` (optional) - Initial data

**Return Value:**

- `Chains<[T]>` - Chains instance

**Example:**

```typescript
const result = await createChains(100)
  .chain((r) => r.r1 * 2)
  .invoke();

console.log(result); // 200
```

### Options Object: `ChainOptions<T>`

Options object for the `chain()` method.

**Properties Table:**

| Property       | Type                        | Default | Description                                                         |
| -------------- | --------------------------- | ------- | ------------------------------------------------------------------- |
| `withoutThrow` | `boolean`                   | `false` | Capture errors as `{ data?: T; error?: Error }` instead of throwing |
| `retry`        | `number`                    | `0`     | Number of retries on failure (0 means no retry)                     |
| `retryWhen`    | `Error \| string \| RegExp` | None    | Retry condition: only retry when matched                            |
| `retryDelay`   | `number`                    | `0`     | Delay between retries (milliseconds)                                |
| `timeout`      | `number`                    | None    | Execution timeout (milliseconds), throws TimeoutError if exceeded   |

## ⚙️ Development and Contributing

### Project Structure

```
tool-chain-core/
├── src/
│   ├── index.ts           # Main entry file (exports all modules)
│   ├── chains.ts          # Chains class and createChains factory function
│   ├── tasks.ts           # Tasks class and createTasks factory function
│   └── types.ts           # Shared type definitions
├── dist/                  # Build output
│   ├── cjs/              # CommonJS format
│   ├── esm/              # ESM format
│   └── types/            # TypeScript definitions
├── tests/                # Test files
│   ├── setup.ts          # Test utilities
│   ├── tasks.test.ts     # Tasks tests
│   ├── basic-features.test.ts
│   ├── error-handling.test.ts
│   ├── retry-and-timeout.test.ts
│   └── other test files...
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Install Development Dependencies

```bash
npm install
```

### Development Workflow

**Watch compilation:**

```bash
npm run dev
```

**Build project:**

```bash
npm run build
```

Outputs include:

- `dist/esm/` - ES Module format
- `dist/cjs/` - CommonJS format
- `dist/types/` - TypeScript definition files

**Run tests:**

```bash
npm test

# Verbose output
npm test -- --verbose

# Watch mode
npm test -- --watch
```

**Linting and formatting:**

```bash
# ESLint check
npm run lint

# Prettier auto-format
npm run format
```

### Contributing Guide

We welcome Pull Requests! Please follow these steps:

1. **Fork the repository**

   ```bash
   # Visit https://github.com/hu-shukang/tool-chain-core
   # Click the Fork button
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Modify code and commit**

   ```bash
   git add .
   git commit -m 'feat: add amazing feature'
   ```

4. **Push to branch**

   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**
   - Visit your forked repository and click "New Pull Request"
   - Fill in the PR description

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `test` - Test additions/modifications
- `docs` - Documentation updates
- `chore` - Project tooling configuration
- `perf` - Performance optimization

**Example:**

```
feat(chain): add chainIf for conditional execution

- Add chainIf method to support conditional step execution
- Maintain backward compatibility with existing API

Closes #123
```

### Contribution Requirements

Before submitting a PR, ensure:

- ✅ All tests pass (`npm test`)
- ✅ Code passes linting (`npm run lint`)
- ✅ Code is formatted (`npm run format`)
- ✅ New features have corresponding tests
- ✅ Documentation is updated if needed

## 📚 Related Resources

- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Jest Testing Framework](https://jestjs.io/)
- [Promises and Async Programming](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [ESM Module System](https://nodejs.org/api/esm.html)
- [CommonJS Module System](https://nodejs.org/api/modules.html)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🤝 Support and Feedback

- **GitHub Repository** - [hu-shukang/toolchain_core](https://github.com/hu-shukang/tool-chain-core)
- **Issue Tracker** - [Submit Issues](https://github.com/hu-shukang/tool-chain-core/issues)
- **Discussions** - [GitHub Discussions](https://github.com/hu-shukang/tool-chain-core/discussions)
- **Author** - HU SHUKANG

If you find this library helpful, please consider giving it a ⭐ Star!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Last Updated: v1.0.0** | [GitHub Repository](https://github.com/hu-shukang/tool-chain-core)
