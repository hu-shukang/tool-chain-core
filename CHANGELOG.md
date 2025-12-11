# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 2025-12-11

### Changed
- Updated README documentation version references
  - Updated version indicator from v1.0.0 to v1.1.2 in all README files
  - Updated CHANGELOG links to point to GitHub repository URLs
  - Improved formatting consistency in README.md

## [1.1.2] - 2025-12-02

### Added
- **Japanese Documentation**: New comprehensive Japanese documentation
  - Complete README.ja.md in Japanese
  - Full CHANGELOG.ja.md in Japanese with all version history
  - Full support for Japanese-speaking users

- **License File**: Added MIT LICENSE file to the project
  - Proper licensing for open-source distribution
  - Included in npm package distribution

### Changed
- Updated `files` field in package.json to include all documentation files
  - Added README.ja.md for Japanese users
  - Added CHANGELOG.ja.md for Japanese version history
  - Added LICENSE file to distribution

## [1.1.1] - 2025-12-02

### Fixed
- Fixed npm package publishing configuration by adding `files` field to package.json
  - Now only `dist/` folder is included in published npm package
  - Development files (src, tests, .claude) are excluded from distribution
  - Configuration files (eslintrc, jest.config, tsconfig.json) are no longer included
  - Reduces package size and prevents unnecessary files from being installed

## [1.1.0] - 2024-12-02

### Added
- **Tasks Class**: New lightweight alternative to Chains for sequential task execution
  - Execute tasks sequentially with `.addTask()` method
  - Type-safe parameter passing between tasks via `next(param)`
  - Support for early termination with `finish()` method
  - Automatic task termination when `next()` is not called
  - Two-class design: Tasks (base) and TasksWithTasks (with invoke)
  - Factory function `createTasks()` for convenient instantiation

- **Documentation**: Comprehensive documentation for Tasks
  - Quick start examples showing both Chains and Tasks
  - Detailed usage guides for Tasks with code examples
  - Feature comparison between Chains and Tasks in README
  - Tests demonstrating Tasks functionality

- **Tests**: New test suite for Tasks class
  - 15 test cases covering all Tasks features
  - Parameter passing tests with type safety
  - Error handling tests
  - Factory function tests

### Changed
- Updated README files to include Tasks in quick examples
- Reorganized documentation structure to clearly separate Chains and Tasks usage
- Updated project structure documentation to include new files

## [1.0.1] - 2024-12-02

### Fixed
- Updated repository links in README files for consistency

### Changed
- Updated version to 1.0.1 in package.json

## [1.0.0] - 2024-12-02

### Added
- **Chains Class**: Powerful chainable async execution with full TypeScript support
  - Chain multiple async operations with `.chain()` method
  - Access all historical results (r1, r2, r3...) throughout the chain
  - Automatic type inference for 20+ step chains
  - Complete type definitions (.d.ts)

- **Tasks Class**: Lightweight sequential task execution with parameter passing
  - Execute tasks sequentially with `.addTask()` method
  - Type-safe parameter passing between tasks via `next(param)`
  - Support for early termination with `finish()` method
  - Automatic task termination when `next()` is not called
  - Two-class design: Tasks (base) and TasksWithTasks (with invoke)

- **Error Handling**
  - Default throw mode: errors interrupt immediately
  - Capture mode: catch errors per step with `{ withoutThrow: true }`
  - Mixed mode: combine both strategies in same chain (Chains only)
  - Proper error propagation in Tasks

- **Retry and Timeout Features** (Chains)
  - Automatic retry with configurable retry count
  - Smart retry conditions: by error type, message, or regex
  - Configurable retry delay
  - Execution timeout control
  - Timeout error handling

- **Factory Functions**
  - `createChains<T>()` - Factory function for Chains
  - `createTasks()` - Factory function for Tasks

- **Module Support**
  - ESM (ES Modules) - Modern JavaScript module format
  - CommonJS - Node.js standard module format
  - Automatic module detection, no manual configuration needed
  - Complete type definitions for both formats

- **Documentation**
  - Comprehensive README in English, Chinese, and Japanese
  - Quick start examples for both Chains and Tasks
  - Detailed usage guides with code examples
  - API reference documentation
  - Development and contribution guidelines

- **Testing**
  - 64+ comprehensive test cases covering all features
  - Tests for parameter passing, error handling, and edge cases
  - Test coverage for both Chains and Tasks functionality
  - Tests for retry, timeout, and error scenarios

- **Build System**
  - TypeScript compilation for ESM and CommonJS
  - Type definitions generation
  - Jest testing framework
  - ESLint and Prettier for code quality
  - Watch mode for development

### Comparison: Chains vs Tasks

#### Chains
- Best for: Pipelines needing multiple historical results
- API: `.chain()` method with result object (r1, r2, r3...)
- Features: Full result history, error capture modes, retry/timeout
- Type Safety: 20+ step chains supported

#### Tasks
- Best for: Linear data flow with sequential execution
- API: `.addTask()` method with parameter passing via `next(param)`
- Features: Clean parameter flow, optional early termination
- Type Safety: Complete type-safe parameter passing

[1.0.1]: https://github.com/hu-shukang/tool-chain-core/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/hu-shukang/tool-chain-core/releases/tag/v1.0.0
