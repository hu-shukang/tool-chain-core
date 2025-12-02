# 更新日志

本项目的所有重要变更都将记录在此文件中。

格式基于[Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
本项目遵循[语义化版本](https://semver.org/lang/zh-CN/spec/v2.0.0.html)。

## [1.1.0] - 2024-12-02

### 新增
- **Tasks 类**：用于顺序任务执行的轻量级替代方案
  - 使用 `.addTask()` 方法顺序执行任务
  - 通过 `next(param)` 进行类型安全的参数传递
  - 支持使用 `finish()` 方法提前终止
  - 任务未调用 `next()` 时自动终止
  - 两层设计：Tasks（基类）和 TasksWithTasks（带 invoke）
  - 工厂函数 `createTasks()` 方便实例化

- **文档**：Tasks 的完整文档
  - 快速开始示例同时展示 Chains 和 Tasks
  - Tasks 的详细使用指南和代码示例
  - README 中的 Chains 和 Tasks 功能对比
  - Tasks 功能的测试演示

- **测试**：新的 Tasks 类测试套件
  - 15 个测试用例覆盖所有 Tasks 功能
  - 类型安全的参数传递测试
  - 错误处理测试
  - 工厂函数测试

### 变更
- 更新 README 文件，在快速示例中包含 Tasks
- 重组文档结构，清晰区分 Chains 和 Tasks 的使用方式
- 更新项目结构文档，包含新增文件

## [1.0.1] - 2024-12-02

### 修复
- 更新 README 文件中的仓库链接保持一致性

### 变更
- 在 package.json 中更新版本为 1.0.1

## [1.0.0] - 2024-12-02

### 新增
- **Chains 类**：强大的链式异步执行，完整的 TypeScript 支持
  - 使用 `.chain()` 方法链接多个异步操作
  - 在整个链中访问所有历史结果（r1, r2, r3...）
  - 支持 20+ 步链的自动类型推断
  - 完整的类型定义文件（.d.ts）

- **Tasks 类**：轻量级的顺序任务执行，支持参数传递
  - 使用 `.addTask()` 方法顺序执行任务
  - 通过 `next(param)` 进行类型安全的参数传递
  - 支持 `finish()` 方法提前终止
  - 任务未调用 `next()` 时自动终止
  - 两层级设计：Tasks（基类）和 TasksWithTasks（带 invoke）

- **错误处理**
  - 默认抛出模式：错误立即中断
  - 捕获模式：使用 `{ withoutThrow: true }` 按步骤捕获错误
  - 混合模式：在同一链中混合两种策略（仅 Chains）
  - Tasks 中的正确错误传播

- **重试和超时功能**（仅 Chains）
  - 自动重试，支持自定义重试次数
  - 智能重试条件：按错误类型、消息或正则表达式
  - 可配置的重试延迟
  - 执行超时控制
  - 超时错误处理

- **工厂函数**
  - `createChains<T>()` - Chains 的工厂函数
  - `createTasks()` - Tasks 的工厂函数

- **模块支持**
  - ESM（ES 模块）- 现代 JavaScript 模块格式
  - CommonJS - Node.js 标准模块格式
  - 自动模块检测，无需手动配置
  - 两种格式的完整类型定义

- **文档**
  - 英文、中文和日文的完整 README
  - Chains 和 Tasks 的快速开始示例
  - 带代码示例的详细使用指南
  - API 参考文档
  - 开发和贡献指南

- **测试**
  - 64+ 个全面的测试用例覆盖所有功能
  - 参数传递、错误处理和边界情况的测试
  - Chains 和 Tasks 功能的测试覆盖
  - 重试、超时和错误场景的测试

- **构建系统**
  - ESM 和 CommonJS 的 TypeScript 编译
  - 类型定义生成
  - Jest 测试框架
  - ESLint 和 Prettier 代码质量工具
  - 开发时的监视模式

### 对比：Chains vs Tasks

#### Chains
- 适用于：需要多个历史结果的数据管道
- API：`.chain()` 方法配合结果对象（r1, r2, r3...）
- 特性：完整的结果历史、错误捕获模式、重试/超时
- 类型安全：支持 20+ 步链

#### Tasks
- 适用于：线性数据流的顺序执行
- API：`.addTask()` 方法配合 `next(param)` 的参数传递
- 特性：清晰的参数流、可选的提前终止
- 类型安全：完整的类型安全参数传递

[1.0.1]: https://github.com/hu-shukang/tool-chain-core/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/hu-shukang/tool-chain-core/releases/tag/v1.0.0
