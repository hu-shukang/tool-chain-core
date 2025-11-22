# 测试文件结构

本目录包含了按功能分类的模块化测试文件。每个测试文件都专注于 Actions 库的特定功能。

## 文件说明

### setup.ts
共享的测试数据和工具函数，包括：
- 接口定义：`User`, `Book`
- 异步函数：`getUser()`, `queryUser()`, `allUser()`, `getBook()`, `deleteBook()`, `foo()`
- 同步函数：`syncAdd()`, `syncMultiply()`
- 错误函数：`throwError()`

所有其他测试文件都从这个文件导入共享的测试工具。

### basic-features.test.ts
基础功能测试（3 个测试）
- 单个异步函数执行
- 多个链式函数执行
- 访问历史结果

### per-step-error-handling.test.ts
按步骤的错误处理测试（4 个测试）
- `withoutThrow` 模式下捕获错误
- `withoutThrow` 模式下的成功返回
- 错误捕获后继续链式调用
- 链中访问被包装的错误结果

### forward-reference.test.ts
前向引用功能测试（2 个测试）
- 后续步骤访问前面的结果
- 多步骤访问历史结果

### factory-function.test.ts
工厂函数测试（3 个测试）
- 通过工厂函数创建 Actions 实例
- 支持初始数据
- 初始数据作为 r1 可用

### error-handling.test.ts
错误处理模式测试（4 个测试）
- 普通模式下的错误抛出
- 链中间的错误停止执行
- 混合错误处理策略
- 没有错误时的正常返回

### mixed-async-sync.test.ts
异步和同步混合测试（3 个测试）
- 执行同步函数
- 混合异步和同步函数
- 多步骤的异步/同步混合

### complex-workflow.test.ts
复杂工作流测试（2 个测试）
- 获取用户然后获取书籍的工作流
- 条件链式调用

### initial-data.test.ts
初始数据流测试（3 个测试）
- 初始数据在第一个 chain 中可用
- 初始数据和链结果都可以访问
- 初始数据为 undefined 时的处理

### retry-and-timeout.test.ts
重试和超时功能测试（25 个测试）

#### 重试功能（16 个测试）
- 不指定 retry 时不进行重试
- 重试直到成功
- 达到最大重试次数后失败
- retryWhen 作为 string（匹配/不匹配）
- retryWhen 作为 RegExp（匹配/不匹配）
- retryWhen 作为 Error 实例
- retryWhen 作为 Error 构造函数（匹配/不匹配）
- retryDelay 延迟重试
- retryDelay 为 0 时立即重试
- withoutThrow 和 retry 组合
- 重试成功时的包装格式返回
- retryWhen + withoutThrow 选择性重试
- 链中多个步骤的重试

#### 超时功能（9 个测试）
- 函数执行超时时拒绝
- 函数在超时前完成时成功
- 没有指定超时时的正常执行
- 超时与 withoutThrow 的组合
- 超时与重试的组合
- 使用 retryWhen: "timeout" 重试
- 使用 TimeoutError 构造函数重试
- 超时时使用 withoutThrow 捕获错误
- 链中多个步骤的不同超时

## 总体统计

- **总测试文件数**：9 个
- **总测试数量**：49 个
- **全部通过** ✅

## 运行测试

运行所有测试：
```bash
npm test
```

运行特定的测试文件：
```bash
npm test basic-features
npm test retry-and-timeout
```

观察测试并在文件变更时自动重新运行：
```bash
npm test -- --watch
```

## 添加新测试

1. 确定测试属于哪个功能类别
2. 在相应的测试文件中添加新的 `it()` 块
3. 如果需要新的工具函数，在 `setup.ts` 中添加
4. 运行 `npm test` 验证新测试通过

## 最佳实践

- 保持每个测试文件专注于单一功能
- 在 `setup.ts` 中重用通用的测试数据和函数
- 使用描述性的测试名称
- 优先使用现有的工具函数而不是重复代码
