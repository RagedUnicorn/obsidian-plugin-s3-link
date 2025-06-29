# Test Organization

This directory contains test utilities and mock implementations for the Obsidian S3 Link plugin tests.

## Directory Structure

### `__mocks__`

Contains manual mocks for external modules that need to be mocked during testing.

-   **obsidian.ts** - Mock implementation of the Obsidian API, providing test doubles for core Obsidian classes like `App`, `FileSystemAdapter`, and `TFile`.

### `mocks`

Contains test utilities, helpers, and mock implementations that are not direct module replacements.

-   **localStorageMock.ts** - Mock implementation of the browser's localStorage API for testing cache functionality.

## Usage

### Module Mocks (`__mocks__`)

These mocks are automatically used by Jest when a test imports the corresponding module. For example, when a test file imports from 'obsidian', Jest will automatically use the mock from `__mocks__/obsidian.ts`.

### Test Utilities (`mocks`)

These are imported explicitly in test files when needed:

```typescript
import { localStorageMock } from "../mocks/localStorageMock";
```

## Adding New Mocks

-   **External module mocks**: Add to `__mocks__` with the same name as the module
-   **Test utilities and helpers**: Add to `mocks` with descriptive names
