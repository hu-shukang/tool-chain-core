# @tool-chain/core

[![npm version](https://img.shields.io/npm/v/@tool-chain/core.svg)](https://www.npmjs.com/package/@tool-chain/core)
[![npm downloads](https://img.shields.io/npm/dm/@tool-chain/core.svg)](https://www.npmjs.com/package/@tool-chain/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D12-brightgreen)](https://nodejs.org/)

**强大的链式异步执行库** - 用优雅的 API 构建复杂的异步工作流。支持 ESM 和 CommonJS 双模块格式，提供完整的 TypeScript 类型安全和灵活的错误处理。

> 简化异步操作，让你的代码更优雅、更可读、更易维护。

## 🚀 快速开始

### 安装

使用你喜欢的包管理器：

```bash
# npm
npm install @tool-chain/core

# yarn
yarn add @tool-chain/core

# pnpm
pnpm add @tool-chain/core
```

### 环境要求

- **Node.js**: >= 12.0
- **TypeScript**: >= 4.5（可选，但推荐用于完整的类型支持）
- **浏览器**: 现代浏览器（需配合构建工具如 Webpack/Rollup）

### 30秒快速示例

```typescript
import { Chains } from '@tool-chain/core';

const result = await new Chains()
  .chain(() => 10) // 第1步：返回 10，r1 = 10
  .chain((r) => r.r1 * 2) // 第2步：r1=10，返回 20，r2 = 20
  .chain((r) => r.r2 + 5) // 第3步：r2=20，返回 25，r3 = 25
  .invoke();

console.log(result); // 输出: 25

// 关键概念：
// - 每步可以访问所有前面的结果（r1, r2, r3...）
// - r1 是第1步的结果，r2 是第2步的结果，依此类推
// - .invoke() 执行整个链并返回最后一步的结果
```

就这样！你已经掌握了基础用法。继续阅读了解更多强大功能。

## ✨ 核心特性

### 🔗 **优雅的链式 API**

- 使用 `.chain()` 方法构建异步工作流
- 支持访问所有历史结果（`r1`, `r2`, `r3`...）
- 自动类型推断，全程享受 TypeScript 类型安全
- 支持同步和异步函数混合使用
- 支持超过 20+ 步的链式调用

### 🛡️ **灵活的错误处理**

- **默认模式**：错误直接抛出，中断执行链
- **捕获模式**：使用 `{ withoutThrow: true }` 按步骤捕获错误
- **混合模式**：在同一链中灵活混合两种错误处理策略
- 细粒度的错误控制，无需 try-catch 包装整个链

### 🎯 **智能重试和超时**

- 自动重试失败的步骤（支持自定义重试次数）
- 灵活的重试条件（按错误类型、错误消息或正则表达式）
- 可配置的重试延迟（防止立即重试导致的资源浪费）
- 执行超时控制（防止长时间挂起）

### 📊 **初始数据和状态管理**

- 在构造时传入初始数据，作为 `r1` 在链中可用
- 自动保留所有步骤的执行结果
- 灵活的数据流和状态管理

### ✅ **完整的 TypeScript 支持**

- 完整的类型定义文件（`.d.ts`）
- 严格模式编译配置
- 智能的类型推断（支持最多 20+ 步链）
- 完美的 IDE 自动补全和类型检查

### 📦 **双模块支持**

- **ESM** (ES Modules) - 现代 JavaScript 模块格式
- **CommonJS** - Node.js 标准模块格式
- 自动模块识别，无需手动配置

## 📚 详细使用指南

### 基础链式调用

创建一个简单的链式流程，逐步处理数据：

```typescript
import { Chains } from '@tool-chain/core';

const result = await new Chains()
  .chain(() => 10)
  .chain((r) => r.r1 * 2) // 访问第1步结果
  .chain((r) => r.r2 + 5) // 访问第2步结果
  .chain((r) => r.r3.toString()) // 转换为字符串
  .invoke();

console.log(result); // "25"
```

**关键点：**

- 每个 `.chain()` 步骤都可以访问所有之前的结果
- `r1` 是第一步的结果，`r2` 是第二步的结果，依此类推
- 最后必须调用 `.invoke()` 来执行整个链

### 工厂函数快速创建

使用 `createChains()` 工厂函数创建实例，代码更简洁：

```typescript
import { createChains } from '@tool-chain/core';

const result = await createChains()
  .chain(() => 'hello')
  .chain((r) => r.r1.toUpperCase())
  .invoke();

console.log(result); // "HELLO"
```

### 使用初始数据

在构造时传入初始数据，它将作为 `r1` 在链中可用：

```typescript
const result = await new Chains(100) // 初始数据为 100
  .chain((r) => r.r1 * 2) // r1 = 100，结果为 200
  .chain((r) => r.r2 - 50) // r2 = 200，结果为 150
  .invoke();

console.log(result); // 150
```

**适用场景：**

- 处理从函数参数传入的初始数据
- 构建可重用的数据处理流程
- 在类方法中初始化链

### 错误处理详解

#### 方式 1：默认抛出模式

错误会直接抛出，中断链的执行。使用 try-catch 处理：

```typescript
try {
  const result = await new Chains()
    .chain(() => JSON.parse('invalid')) // 抛出 SyntaxError
    .chain((r) => r.r1.name) // 不会执行
    .invoke();
} catch (error) {
  console.error('链执行失败:', error.message);
  // 处理错误
}
```

**优点：** 简洁清晰，错误立即中断
**缺点：** 需要 try-catch 包装整个链

#### 方式 2：捕获模式（推荐）

使用 `{ withoutThrow: true }` 选项，错误被捕获并包装为对象，链继续执行：

```typescript
const result = await new Chains()
  .chain(() => JSON.parse('invalid'), { withoutThrow: true })
  // 返回: { error: SyntaxError, data: undefined }
  .chain((r) => {
    if (r.r1.error) {
      console.log('解析失败，使用默认值');
      return { name: 'default', age: 0 };
    }
    return r.r1.data;
  })
  .chain((r) => {
    // r.r1 现在是安全的对象
    return r.r1.name.toUpperCase();
  })
  .invoke();

console.log(result); // "DEFAULT"
```

**返回值结构：**

```typescript
{
  data?: T;      // 成功时的数据
  error?: Error; // 失败时的错误对象
}
```

**优点：** 灵活处理错误，链继续执行，可选择降级
**缺点：** 需要在每个步骤检查错误

#### 方式 3：混合模式

在同一条链中混合使用两种错误处理方式：

```typescript
const result = await new Chains()
  // 第1步：捕获网络错误
  .chain(
    async () => {
      const resp = await fetch('/api/users');
      return resp.json();
    },
    { withoutThrow: true },
  )
  // 第2步：检查错误，可选择降级
  .chain((r) => {
    if (r.r1.error) {
      console.log('API 调用失败，使用缓存数据');
      return [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
    }
    return r.r1.data;
  })
  // 第3步：数据转换（使用默认模式，错误直接抛出）
  .chain((r) => {
    return r.r1.map((user) => user.name.toUpperCase());
  })
  // 第4步：再次捕获错误
  .chain((r) => saveToDatabase(r.r1), { withoutThrow: true })
  .invoke();
```

**关键概念：**

- 每个步骤可独立设置错误处理方式
- 捕获模式的错误对象格式统一，便于处理
- 混合使用可以在关键位置防守，在其他位置快速失败

#### 方式 4：条件性错误重试

根据错误类型或消息选择性地重试：

```typescript
const result = await new Chains()
  .chain(
    async () => {
      const res = await fetch('/api/data');
      if (res.status === 429) {
        throw new Error('Rate limited');
      }
      if (res.status >= 500) {
        throw new Error('Server error');
      }
      return res.json();
    },
    {
      retry: 3,
      retryWhen: 'Rate limited', // 只在这个错误时重试
      retryDelay: 2000,
    },
  )
  .invoke();
```

### 重试和超时详解

#### 基本重试

失败时自动重试指定次数：

```typescript
const result = await new Chains()
  .chain(
    async () => {
      return fetch('/api/unstable').then((r) => r.json());
    },
    {
      retry: 3, // 最多重试3次（总共最多4次请求）
      retryDelay: 1000, // 每次重试间隔1秒
    },
  )
  .invoke();
```

**工作流程：**

1. 执行函数
2. 失败 → 等待 retryDelay → 重试
3. 重复直到成功或重试次数用尽

#### 智能重试条件

只在特定错误时重试，其他错误立即失败：

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
      // 方式1：字符串 - 错误消息包含此字符串时重试
      retryWhen: 'Rate limited',
      retryDelay: 2000,
    },
  )
  .invoke();
```

**retryWhen 参数类型：**

```typescript
// 1. Error 类型 - 仅重试该类型的错误
retryWhen: TypeError; // 只重试 TypeError

// 2. 字符串 - 错误消息包含此字符串时重试
retryWhen: 'timeout'; // 错误消息包含 'timeout' 时重试

// 3. 正则表达式 - 错误消息匹配正则时重试
retryWhen: /timeout|Rate limited/; // 匹配这两个词时重试
```

#### 超时控制

防止请求长时间挂起：

```typescript
const result = await new Chains()
  .chain(
    async () => {
      return fetch('/api/slow-endpoint').then((r) => r.json());
    },
    {
      timeout: 5000, // 5秒超时，超时后抛出错误
      retry: 2, // 如果超时，重试2次
      retryWhen: /timeout/, // 只在超时时重试
    },
  )
  .chain((r) => {
    // 这里保证数据在5秒内获取
    return r.r1;
  })
  .invoke();
```

**超时错误示例：**

```typescript
// 超时会抛出错误（如果未设置 withoutThrow）
// Error: Timeout exceeded: operation took longer than 5000ms
```

#### 完整重试配置示例

```typescript
const result = await new Chains()
  .chain(
    async () => {
      const res = await fetch('/api/critical-data');
      if (res.status === 429) throw new Error('Rate limited');
      return res.json();
    },
    {
      timeout: 5000, // 单个请求最多等待5秒
      retry: 5, // 最多重试5次
      retryWhen: /Rate limited|timeout/, // 仅这两类错误重试
      retryDelay: 1000, // 重试间隔1秒
      withoutThrow: true, // 最终失败不抛出，而是返回错误对象
    },
  )
  .chain((r) => {
    if (r.r1.error) {
      console.log('获取关键数据失败，可能需要人工介入');
      return { cached: true, data: getCachedData() };
    }
    return r.r1.data;
  })
  .invoke();
```

### 异步操作链

链接多个异步操作，自动处理 Promise：

```typescript
const result = await new Chains()
  // 第1步：获取用户列表
  .chain(async () => {
    const res = await fetch('/api/users');
    return res.json();
  })
  // 第2步：获取用户详情
  .chain(async (r) => {
    const userIds = r.r1.map((u) => u.id);
    const res = await fetch(`/api/user-details?ids=${userIds.join(',')}`);
    return res.json();
  })
  // 第3步：组合结果
  .chain((r) => {
    return {
      users: r.r1, // 第1步结果
      details: r.r2, // 第2步结果
    };
  })
  .invoke();
```

### 同步和异步混合

自由混合同步和异步操作：

```typescript
const result = await new Chains()
  .chain(() => 10) // 同步：初始值
  .chain(async (r) => {
    // 异步：模拟 API 调用
    await new Promise((resolve) => setTimeout(resolve, 100));
    return r.r1 * 2; // 20
  })
  .chain((r) => {
    // 同步：数据转换
    return r.r2 + 5; // 25
  })
  .chain(async (r) => {
    // 异步：保存数据
    await saveToDatabase({ value: r.r1 });
    return r.r1;
  })
  .invoke();

console.log(result); // 25
```

## 🎯 常见使用场景

### 场景 1：数据处理管道

```typescript
// 数据验证 → 转换 → 清洗 → 保存
const result = await new Chains(rawUserData)
  // 验证数据
  .chain((r) => {
    const valid = r.r1.every((u) => u.id && u.name && u.email);
    if (!valid) throw new Error('Invalid data');
    return r.r1;
  })
  // 数据转换
  .chain((r) => {
    return r.r1.map((u) => ({
      id: u.id,
      name: u.name.trim(),
      email: u.email.toLowerCase(),
    }));
  })
  // 数据清洗（去除重复）
  .chain((r) => {
    const seen = new Set();
    return r.r1.filter((u) => {
      if (seen.has(u.email)) return false;
      seen.add(u.email);
      return true;
    });
  })
  // 保存到数据库
  .chain(async (r) => {
    return db.users.insertMany(r.r1);
  })
  .invoke();
```

### 场景 2：API 调用链

```typescript
// 获取用户 → 获取权限 → 获取配置 → 组合返回
const userData = await new Chains()
  // 获取用户信息
  .chain(
    async () => {
      const res = await fetch(`/api/user/${userId}`);
      return res.json();
    },
    { timeout: 5000 },
  )
  // 获取用户权限
  .chain(
    async (r) => {
      const res = await fetch(`/api/permissions/${r.r1.id}`);
      return res.json();
    },
    { timeout: 5000 },
  )
  // 获取用户配置
  .chain(
    async (r) => {
      const res = await fetch(`/api/config/${r.r1.userId}`);
      return res.json();
    },
    { timeout: 5000 },
  )
  // 组合所有数据
  .chain((r) => {
    return {
      user: r.r1,
      permissions: r.r2,
      config: r.r3,
    };
  })
  .invoke();
```

### 场景 3：错误恢复和降级

```typescript
// 尝试主数据源 → 失败则使用备用源 → 最后使用本地缓存
const data = await new Chains()
  // 尝试从 API 获取
  .chain(
    async () => {
      const res = await fetch('/api/primary-source');
      if (!res.ok) throw new Error('Primary source failed');
      return res.json();
    },
    { withoutThrow: true },
  )
  // 如果失败，尝试备用源
  .chain(
    async (r) => {
      if (r.r1.error) {
        console.log('Primary source failed, trying backup...');
        const res = await fetch('/api/backup-source');
        if (!res.ok) throw new Error('Backup source failed');
        return res.json();
      }
      return r.r1.data;
    },
    { withoutThrow: true },
  )
  // 如果都失败，使用本地缓存
  .chain((r) => {
    if (r.r2.error) {
      console.log('Both sources failed, using local cache');
      return getLocalCache();
    }
    return r.r2.data;
  })
  .invoke();
```

### 场景 4：批量操作重试

```typescript
// 处理大量数据，重试失败的项
const results = await new Chains(items)
  .chain((r) =>
    Promise.all(
      r.r1.map((item) =>
        new Chains(item)
          .chain(
            async (ir) => {
              return processItem(ir.r1);
            },
            {
              retry: 3,
              retryDelay: 500,
              withoutThrow: true,
            },
          )
          .invoke(),
      ),
    ),
  )
  // 统计成功和失败
  .chain((r) => {
    const successful = r.r1.filter((result) => !result.error);
    const failed = r.r1.filter((result) => result.error);
    return {
      total: r.r1.length,
      successful: successful.length,
      failed: failed.length,
      results: r.r1,
    };
  })
  .invoke();
```

### 场景 5：Web 爬虫

```typescript
// 获取列表 → 逐个爬取详情 → 去重 → 保存
const scrapedData = await new Chains()
  // 获取列表页
  .chain(
    async () => {
      const res = await fetch(listUrl);
      const html = await res.text();
      const urls = extractUrlsFromHtml(html);
      return urls;
    },
    { timeout: 10000, retry: 2 },
  )
  // 爬取每个详情页
  .chain(
    async (r) => {
      const details = await Promise.all(
        r.r1.map(async (url) => {
          const res = await fetch(url);
          const html = await res.text();
          return parseDetailPage(html);
        }),
      );
      return details;
    },
    { timeout: 30000, retry: 1 },
  )
  // 去重
  .chain((r) => {
    const seen = new Set();
    return r.r1.filter((item) => {
      const key = item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })
  // 保存到数据库
  .chain(async (r) => {
    return db.items.insertMany(r.r1);
  })
  .invoke();
```

## 📖 完整 API 参考

### 类：`Chains<TResults>`

链式执行的主类，支持方法链。

#### 构造函数

```typescript
constructor(initialData?: T)
```

**参数：**

- `initialData` (可选) - 初始数据，将作为第一个结果 `r1` 可用

**示例：**

```typescript
// 不带初始数据
const chain = new Chains();

// 带初始数据
const chain = new Chains(100);
const chain = new Chains({ name: 'John', age: 30 });
const chain = new Chains([1, 2, 3]);
```

#### 方法：`chain<R>(fn, options?)`

添加一个执行步骤到链中。

**参数：**

- `fn` - 执行函数，签名为 `(results: ResultsObject) => T | Promise<T>`
- `options` (可选) - 选项对象，类型为 `ChainOptions<T>`

**返回值：**

- 返回新的 `Chains` 实例，支持链式调用

**示例：**

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

#### 方法：`invoke()`

执行整个链并返回最终结果。

**返回值：**

- `Promise<T>` - 最后一个 chain 步骤的返回值

**示例：**

```typescript
const result = await new Chains()
  .chain(() => 10)
  .chain((r) => r.r1 * 2)
  .invoke();

console.log(result); // 20
```

### 函数：`createChains<T>(initialData?)`

工厂函数，创建一个新的 Chains 实例。

**参数：**

- `initialData` (可选) - 初始数据

**返回值：**

- `Chains<[T]>` - Chains 实例

**示例：**

```typescript
const result = await createChains(100)
  .chain((r) => r.r1 * 2)
  .invoke();

console.log(result); // 200
```

### 选项对象：`ChainOptions<T>`

`chain()` 方法的选项对象。

**属性表：**

| 属性           | 类型                        | 默认值  | 说明                                                                  |
| -------------- | --------------------------- | ------- | --------------------------------------------------------------------- |
| `withoutThrow` | `boolean`                   | `false` | 是否捕获错误并包装为 `{ data?: T; error?: Error }` 对象，而非直接抛出 |
| `retry`        | `number`                    | `0`     | 失败时的重试次数（0 表示不重试）                                      |
| `retryWhen`    | `Error \| string \| RegExp` | 无      | 重试条件：仅当满足条件时才重试                                        |
| `retryDelay`   | `number`                    | `0`     | 重试间隔（毫秒）                                                      |
| `timeout`      | `number`                    | 无      | 执行超时时间（毫秒），超时后抛出 TimeoutError                         |

**详细说明：**

#### `withoutThrow`

控制错误处理行为：

```typescript
// false（默认）：错误直接抛出
.chain(() => throwError())  // 抛出错误

// true：错误被捕获，返回对象
.chain(() => throwError(), { withoutThrow: true })
// 返回: { error: Error, data: undefined }
```

#### `retry` 和 `retryDelay`

配置重试行为：

```typescript
.chain(
  () => unreliableOperation(),
  {
    retry: 3,        // 最多重试3次
    retryDelay: 1000 // 每次重试等待1秒
  }
)
```

#### `retryWhen`

指定重试条件（三种形式）：

```typescript
// 1. 错误类型
.chain(() => operation(), {
  retry: 3,
  retryWhen: TypeError  // 仅重试 TypeError
})

// 2. 字符串匹配
.chain(() => operation(), {
  retry: 3,
  retryWhen: 'timeout'  // 错误消息包含 'timeout' 时重试
})

// 3. 正则表达式
.chain(() => operation(), {
  retry: 3,
  retryWhen: /timeout|rate limit/  // 匹配这两个词时重试
})
```

#### `timeout`

设置执行超时：

```typescript
.chain(
  async () => slowOperation(),
  {
    timeout: 5000  // 5秒超时
  }
)
// 如果超过5秒：TimeoutError: Timeout exceeded
```

### 结果对象格式

每个 `.chain()` 步骤接收一个结果对象 `r`，包含所有之前步骤的结果：

```typescript
{
  r1: T1,     // 第1步的结果（或初始数据）
  r2: T2,     // 第2步的结果
  r3: T3,     // 第3步的结果
  ...
  r20: T20,   // 第20步的结果（最多支持20+步）
}
```

**访问结果示例：**

```typescript
await new Chains(10)
  .chain((r) => {
    console.log(r.r1); // 初始数据：10
    return r.r1 * 2; // 20
  })
  .chain((r) => {
    console.log(r.r1); // 第1步结果：10（初始数据）
    console.log(r.r2); // 第2步结果：20
    return r.r2 + 5; // 25
  })
  .invoke();
```

### 错误对象格式

使用 `{ withoutThrow: true }` 时的返回格式：

```typescript
// 成功时
{
  data: T,
  error: undefined
}

// 失败时
{
  data: undefined,
  error: Error
}

// 类型定义
{
  data?: T;
  error?: Error;
}
```

**使用示例：**

```typescript
const result = await new Chains()
  .chain(() => JSON.parse('invalid'), { withoutThrow: true })
  .chain((r) => {
    if (r.r1.error) {
      console.error('解析失败:', r.r1.error.message);
      return null;
    }
    console.log('解析成功:', r.r1.data);
    return r.r1.data;
  })
  .invoke();
```

## 🎓 高级主题

### 类型推断和 TypeScript

@tool-chain/core 提供完整的 TypeScript 支持，自动推断每个步骤的类型：

```typescript
const result = await new Chains(10) // r1: number
  .chain((r) => r.r1.toString()) // r2: string
  .chain((r) => r.r2.length) // r3: number
  .chain((r) => ({ value: r.r3 })) // r4: { value: number }
  .invoke(); // result: { value: number }

// 完整的类型检查和自动补全
```

**最佳实践：**

```typescript
// ✅ 推荐：直接从初始数据推断类型
const data = await new Chains({ id: 1, name: 'John' })
  .chain((r) => r.r1.id)
  .invoke();
// 自动推断：data 是 number

// ✅ 推荐：显式类型注解初始数据
const data = await new Chains<User>(fetchUser())
  .chain((r) => r.r1.name)
  .invoke();
```

### 性能优化

#### 1. 避免不必要的中间结果

```typescript
// ❌ 不优化：创建多个中间结果
const step1 = await new Chains(data).chain(transform1).invoke();
const step2 = await new Chains(step1).chain(transform2).invoke();
const step3 = await new Chains(step2).chain(transform3).invoke();

// ✅ 优化：单个链处理多步
const result = await new Chains(data)
  .chain(transform1)
  .chain((r) => transform2(r.r1))
  .chain((r) => transform3(r.r1))
  .invoke();
```

#### 2. 合理使用并发

```typescript
// ❌ 序列执行（慢）
const result = await new Chains(ids)
  .chain(async (r) => {
    const user = await fetchUser(r.r1[0]);
    return user;
  })
  .chain(async (r) => {
    const posts = await fetchPosts(r.r1.id);
    return posts;
  })
  .invoke();

// ✅ 并发执行（快）
const result = await new Chains(ids)
  .chain(async (r) => {
    const [user, posts] = await Promise.all([
      fetchUser(r.r1[0]),
      fetchPosts(r.r1[0]),
    ]);
    return { user, posts };
  })
  .invoke();
```

#### 3. 及时清理大对象

```typescript
// 对于大数据量，在处理完后清空引用
const result = await new Chains(largeData)
  .chain((r) => {
    const processed = processLargeData(r.r1);
    // 如果后续步骤不需要原始数据，可返回新对象
    return processed;
  })
  .invoke();
```

### 常见错误及解决方案

#### 错误 1：忘记 `await`

```typescript
// ❌ 错误：返回 Promise，未等待
const result = new Chains()
  .chain(() => asyncOperation())
  .invoke();  // 返回 Promise

// ✅ 正确：添加 await
const result = await new Chains()
  .chain(() => asyncOperation())
  .invoke();
```

#### 错误 2：访问不存在的结果

```typescript
// ❌ 错误：只有 2 步，却访问 r3
const result = await new Chains()
  .chain(() => 10)
  .chain((r) => r.r3)  // r3 不存在！
  .invoke();

// ✅ 正确：只访问已有的结果
const result = await new Chains()
  .chain(() => 10)
  .chain((r) => r.r1 * 2)
  .chain((r) => r.r2 + 5)  // 现在可以访问 r2
  .invoke();
```

#### 错误 3：混淆错误对象格式

```typescript
// ❌ 错误：withoutThrow 返回对象，但当作普通值处理
const result = await new Chains()
  .chain(() => JSON.parse('invalid'), { withoutThrow: true })
  .chain((r) => r.r1.length)  // r.r1 是对象，不是数组！
  .invoke();

// ✅ 正确：检查错误对象
const result = await new Chains()
  .chain(() => JSON.parse('invalid'), { withoutThrow: true })
  .chain((r) => {
    if (r.r1.error) {
      return 0;
    }
    return (r.r1.data as any[]).length;
  })
  .invoke();
```

#### 错误 4：重试配置不当

```typescript
// ❌ 问题：所有错误都重试，包括不应该重试的
.chain(() => operation(), {
  retry: 10  // 会重试所有错误，可能很慢
})

// ✅ 解决：指定重试条件
.chain(() => operation(), {
  retry: 10,
  retryWhen: /timeout|rate limit/  // 只重试特定错误
})
```

## 📦 模块导入

### ESM 导入

```typescript
import { Chains, createChains } from 'toolchain';

// 或分别导入
import { Chains } from '@tool-chain/core';
import { createChains } from '@tool-chain/core';
```

### CommonJS 导入

```javascript
const { Chains, createChains } = require('@tool-chain/core');
```

### 浏览器使用

对于浏览器环境，需要通过构建工具（如 Webpack、Rollup）进行打包：

```typescript
// 配置 webpack.config.js
module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
    ],
  },
};
```

## ⚙️ 开发和贡献

### 项目结构

```
toolchain_core/
├── src/
│   ├── index.ts           # 主入口文件
│   └── types.ts           # TypeScript 类型定义
├── dist/                  # 编译输出
│   ├── cjs/              # CommonJS 格式
│   ├── esm/              # ESM 格式
│   └── types/            # TypeScript 定义文件
├── tests/                # 测试文件
│   ├── setup.ts
│   ├── basic-features.test.ts
│   ├── error-handling.test.ts
│   └── retry-and-timeout.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.zh.md
```

### 安装开发依赖

```bash
npm install
```

### 开发工作流

**监视编译：**

```bash
npm run dev
```

**构建项目：**

```bash
npm run build
```

输出包括：

- `dist/esm/` - ES Module 格式
- `dist/cjs/` - CommonJS 格式
- `dist/types/` - TypeScript 定义文件

**运行测试：**

```bash
npm test

# 详细输出
npm test -- --verbose

# 监视模式
npm test -- --watch
```

**代码检查和格式化：**

```bash
# ESLint 检查
npm run lint

# Prettier 自动格式化
npm run format
```

### 贡献指南

欢迎提交 Pull Request！请遵循以下步骤：

1. **Fork 仓库**

   ```bash
   # 访问 https://github.com/hu-shukang/tool-chain-core
   # 点击 Fork 按钮
   ```

2. **创建功能分支**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **修改代码并提交**

   ```bash
   git add .
   git commit -m 'feat: add amazing feature'
   ```

4. **推送到分支**

   ```bash
   git push origin feature/amazing-feature
   ```

5. **开启 Pull Request**
   - 访问你的 fork 仓库，点击 "New Pull Request"
   - 填写 PR 描述和相关信息

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型：**

- `feat` - 新功能
- `fix` - 修复问题
- `refactor` - 代码重构
- `test` - 添加/修改测试
- `docs` - 文档更新
- `chore` - 项目工具配置
- `perf` - 性能优化

**示例：**

```
feat(chain): add chainIf for conditional execution

- Add chainIf method to support conditional step execution
- Maintain backward compatibility with existing API

Closes #123
```

### 贡献要求

提交 PR 前请确保：

- ✅ 所有测试通过（`npm test`）
- ✅ 代码通过 lint 检查（`npm run lint`）
- ✅ 代码经过格式化（`npm run format`）
- ✅ 新功能编写了相应的测试
- ✅ 更新了文档（如有必要）

## 🐛 故障排除

### TypeScript 错误

如果遇到类型错误：

```bash
npm run build
```

这会显示详细的编译错误。常见问题：

- **"Cannot find module 'toolchain'"** - 确保已运行 `npm install`
- **"Property 'r2' does not exist on type"** - 检查链的步骤数是否足够

### 测试失败

```bash
npm test -- --verbose
```

**常见原因：**

- 异步操作未等待完成
- 测试中未调用 `.invoke()`
- 错误处理配置不当

### 模块导入问题

**确保正确导入：**

```typescript
// ✅ 正确
import { Chains, createChains } from 'toolchain';

// ✅ 也正确
const { Chains, createChains } = require('@tool-chain/core');

// ❌ 错误 - 默认导出不存在
import Chains from 'toolchain';
```

**ESM/CommonJS 兼容性：**

- 自动检测环境，选择合适的模块格式
- Node.js 会自动根据文件类型选择（`.mjs` 用 ESM，`.cjs` 用 CommonJS）

### 性能问题

**如果运行缓慢：**

1. 检查是否有不必要的重试
2. 使用并发而非序列执行
3. 减少链的步骤数（合并相邻步骤）

## 📚 相关资源

- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Jest 测试框架](https://jestjs.io/)
- [Promise 和异步编程](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [ESM 模块系统](https://nodejs.org/api/esm.html)
- [CommonJS 模块系统](https://nodejs.org/api/modules.html)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 支持和反馈

- **GitHub 仓库** - [hu-shukang/toolchain_core](https://github.com/hu-shukang/tool-chain-core)
- **问题报告** - [提交 Issue](https://github.com/hu-shukang/tool-chain-core/issues)
- **讨论区** - [GitHub Discussions](https://github.com/hu-shukang/tool-chain-core/discussions)
- **作者** - HU SHUKANG

如果你觉得这个库有帮助，欢迎 ⭐ Star 支持！

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md) 了解版本历史和更新内容。

---

**最后更新：v1.0.0** | [GitHub 仓库](https://github.com/hu-shukang/tool-chain-core)
