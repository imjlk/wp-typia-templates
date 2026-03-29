# wp-typia

[![CI/CD](https://github.com/imjlk/wp-typia/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/imjlk/wp-typia/actions)
[![License: GPL-2.0+](https://img.shields.io/badge/License-GPL--2.0+-blue.svg)](https://opensource.org/licenses/GPL-2.0+)
[![npm version](https://badge.fury.io/js/%40wp-typia%2Fcreate.svg)](https://www.npmjs.com/package/@wp-typia/create)
[![codecov](https://codecov.io/gh/imjlk/wp-typia/branch/main/graph/badge.svg)](https://codecov.io/gh/imjlk/wp-typia)

> Type-safe WordPress block development with Typia-powered metadata, validation, and migration tooling

A Bun-first WordPress block template monorepo featuring TypeScript, Typia validation, generated `block.json` / `typia.manifest.json` v2 / `typia-validator.php` artifacts, and WordPress Interactivity API support. The advanced template also ships a dynamic `render.php` example plus snapshot-based migration tooling.

## ✨ Features

- 🎯 **Type-Safe Development**: Full TypeScript support with compile-time and runtime validation
- 🔄 **Type-First Metadata Generation**: Derive `block.json`, `typia.manifest.json` v2, and `typia-validator.php` from TypeScript types
- 🏗️ **Multiple Templates**: Choose from Basic, Full, Interactivity, or Advanced editions
- 🚀 **Migration System**: Snapshot-based legacy block migration tooling with `renameMap` / `transforms` helpers (Advanced)
- 🧱 **Dynamic Server Example**: The advanced template renders through `render.php` and the generated PHP validator
- ✍️ **Aggressive Migration Authoring**: High-confidence renames are auto-applied and semantic-risk coercions get suggested transform bodies
- 🧭 **Nested Leaf Authoring**: Migration rules can target object and supported union-branch leaf paths such as `settings.label`
- ⚛️ **Modern Stack**: React hooks, error boundaries, and utility functions
- 🧪 **Testing Ready**: Bun unit tests, CLI runtime tests, and Playwright E2E tests included
- 📦 **Scoped CLI + Shared Types**: Scaffold through `@wp-typia/create` and reuse `@wp-typia/block-types`

## 🚀 Quick Start

### Using `@wp-typia/create` (Recommended)

```bash
bun create wp-typia my-block
# or
bunx @wp-typia/create my-block
# or
npx @wp-typia/create my-block
# compatibility
npx create-wp-typia my-block
```

The CLI always asks which package manager the generated project should use. For non-interactive runs, pass it explicitly:

```bash
npx @wp-typia/create my-block --template basic --package-manager pnpm --yes --no-install
```

`@wp-typia/create` is the canonical scaffolding package in this repository, and `@wp-typia/block-types` provides the shared semantic unions used inside generated `types.ts` files. `create-wp-typia` remains as a compatibility shim for `bun create wp-typia` and historical unscoped installs.

## 📦 Published npm Packages

- [`@wp-typia/create`](https://www.npmjs.com/package/@wp-typia/create)
- [`@wp-typia/block-types`](https://www.npmjs.com/package/@wp-typia/block-types)
- [`create-wp-typia`](https://www.npmjs.com/package/create-wp-typia) - compatibility shim for `bun create wp-typia`

## 📁 Project Structure

```
wp-typia/
├── packages/
│   ├── create-wp-typia/        # Canonical scoped CLI source (@wp-typia/create)
│   ├── create-wp-typia/        # Unscoped compatibility shim
│   └── wp-typia-block-types/   # Shared semantic block types
├── test-template/              # Working example
│   └── my-typia-block/
├── tests/                      # Test suites
│   ├── unit/
│   └── e2e/
└── docs/                       # Generated documentation
```

## 🎯 Template Variations

### 1. **Basic** - Core Typia Features

Perfect for simple blocks with type safety:

- ✅ TypeScript to `block.json` + `typia.manifest.json` v2 + `typia-validator.php`
- ✅ Typia runtime validation
- ✅ Minimal setup for quick start

### 2. **Full** - Complete Development Environment

Everything you need for robust block development:

- ✅ All Basic features
- ✅ Utility functions (UUID, classNames, debounce)
- ✅ Custom hooks (useDebounce, useLocalStorage)
- ✅ ErrorBoundary component
- ✅ Enhanced editor experience

### 3. **Interactivity** - Modern Frontend Interactions

Leverage WordPress's latest Interactivity API:

- ✅ All Basic features
- ✅ Advanced Interactivity API store
- ✅ Reactive state management
- ✅ Async action handling
- ✅ Callback and watcher support

### 4. **Advanced** - Enterprise-Grade Features

For production applications with versioning needs:

- ✅ All Full features
- 🚀 **Snapshot-Based Migration Scaffolding**
- 🔄 **Version Management System**
- 🛠️ **WordPress Deprecated Integration**
- 🧱 **Dynamic `render.php` server boundary**
- 🐘 **Generated `typia-validator.php` + `typia-migration-registry.php`**
- 📊 **Migration Analytics**
- 🧪 **Migration Testing Tools**

## 💻 Usage Examples

### Define Block Attributes with Typia

```typescript
// src/types.ts
import { tags } from "typia";

export interface MyBlockAttributes {
  // Required field with validation
  title: string &
    tags.MinLength<1> &
    tags.MaxLength<100> &
    tags.Default<"Untitled">;

  // Optional field with type constraints
  count: number &
    tags.Type<"uint32"> &
    tags.Minimum<0> &
    tags.Maximum<100> &
    tags.Default<1>;

  // Enum field
  size: ("small" | "medium" | "large") &
    tags.Default<"medium">;

  // Nested object
  settings: {
    theme: ("light" | "dark") & tags.Default<"light">;
    showBorder: boolean & tags.Default<true>;
  };
}
```

### Auto-Generated Block Metadata

Repository contributor note: this monorepo is Bun-first, but the generated project can use `bun`, `npm`, `pnpm`, or `yarn`.

```bash
bun run sync-types
```

Generates:

```json
{
  "attributes": {
    "title": {
      "type": "string",
      "default": "Untitled"
    },
    "count": {
      "type": "number",
      "default": 1
    },
    "size": {
      "type": "string",
      "default": "medium",
      "enum": ["small", "medium", "large"]
    },
    "settings": {
      "type": "object",
      "default": {
        "theme": "light",
        "showBorder": true
      }
    }
  }
}
```

The generator also emits `typia.manifest.json` v2 and `typia-validator.php`, preserving Typia constraints, explicit default markers, and the supported discriminated-union metadata used by the generated PHP validator.

### Runtime Validation

```typescript
// In your block component
import { validators } from './validators';

// Validate attributes
const result = validators.validate(attributes);
if (!result.success) {
  console.error('Validation errors:', result.errors);
}

// Update with validation
const updateAttribute = (key: keyof MyBlockAttributes, value: any) => {
  const newAttrs = { ...attributes, [key]: value };
  if (validators.validate(newAttrs).success) {
    setAttributes(newAttrs);
  }
};
```

### Interactivity API Example

```typescript
// view.ts
import { store } from '@wordpress/interactivity';

const { state, actions } = store('my-plugin/my-block', {
  state: {
    count: 0,
    isActive: false,
  },

  actions: {
    increment() {
      state.count++;
    },

    toggle() {
      state.isActive = !state.isActive;
    },
  },

  callbacks: {
    onCountChange: () => {
      // React to count changes
      console.log(`Count is now: ${state.count}`);
    },
  },
});
```

### Migration System (Advanced Template)

```bash
# Bootstrap the first schema snapshot
bun run migration:init

# Capture another released schema version later on
bun run migration:snapshot -- --version 1.0.0

# Inspect manifest differences against the current schema
bun run migration:diff -- --from 1.0.0

# Scaffold deprecated + migrate wiring for the edge
bun run migration:scaffold -- --from 1.0.0

# Verify fixtures against the current validator
bun run migration:verify
```

Generated migration rules expose both `renameMap` and `transforms` so simple field renames and semantic coercions can be authored without rewriting the whole edge by hand.

## 🛠️ Available Scripts

### Development

- `bun run start` - Start development server with hot reload
- `bun run build` - Build blocks for production
- `bun run dev` - Alias for `bun run start`

### Type Management

- `bun run sync-types` - Generate `block.json`, `typia.manifest.json` v2, and `typia-validator.php`
- `bun run typecheck` - Run TypeScript compiler check

### Testing

- `bun run test` - Run Bun unit tests and CLI runtime tests
- `bun run test:e2e` - Run E2E tests with Playwright
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Run tests with coverage

### Code Quality

- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier

### WordPress Environment

- `bun run wp-env:start` - Start WordPress test environment
- `bun run wp-env:stop` - Stop WordPress test environment
- `bun run wp-env:reset` - Reset WordPress environment

### Migration (Advanced Template)

- `bun run migration:init` - Bootstrap the first migration snapshot
- `bun run migration:snapshot -- --version <semver>` - Store a released schema snapshot
- `bun run migration:diff -- --from <semver>` - Compare a legacy snapshot with the current schema
- `bun run migration:scaffold -- --from <semver>` - Generate deprecated + migrate wiring
- `bun run migration:verify` - Validate generated migration edges against fixtures

## 📚 Documentation

- [Interactive Tutorial](./docs/tutorials/interactive-tutorial.md) - Build your first block step by step
- [API Guide](./docs/API.md) - Where the public CLI and runtime surfaces live
- [Migration Guide](./docs/migrations.md) - Snapshot workflow, generated rules, and server-boundary notes
- [Interactivity API](./docs/interactivity.md) - Reactive frontend
- [Union Support Guide](./docs/union-support.md) - Supported enum and discriminated union shapes
- [Contributing](./CONTRIBUTING.md) - Development guidelines

## 🧪 Testing

This project includes comprehensive testing:

### Unit Tests

```bash
# Run all tests
bun run test

# Run with coverage
bun run test:coverage

# Watch mode
bun run test:watch
```

### E2E Tests

```bash
# Install Playwright
npx playwright install

# Run E2E tests
bun run test:e2e

# Run with UI
npx playwright test --ui
```

### Migration Testing

```bash
# Run the advanced template snapshot workflow
cd my-advanced-block
bun run migration:init
bun run migration:scaffold -- --from 1.0.0
bun run migration:verify
```

## 📊 Performance

- **Validation Speed**: 20,000x faster than Zod/Joi
- **Bundle Size**: ~15KB per block (gzipped)
- **Build Time**: TypeScript compilation < 2s
- **Test Coverage**: 95%+ maintained

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/imjlk/wp-typia.git
cd wp-typia

# Install dependencies
bun install

# Start development
bun run dev

# Run tests
bun run test
```

## 📄 License

GPL-2.0-or-later © [imjlk](https://github.com/imjlk)

## 🙏 Acknowledgments

- [Typia](https://typia.io/) - Amazing TypeScript validation library
- [WordPress](https://wordpress.org/) - CMS platform
- [Gutenberg](https://github.com/WordPress/gutenberg) - Block editor
- [Create Block](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/) - Block scaffolding tool

## 📞 Support

- 📖 [Documentation](https://github.com/imjlk/wp-typia/wiki)
- 🐛 [Issue Tracker](https://github.com/imjlk/wp-typia/issues)
- 💬 [Discussions](https://github.com/imjlk/wp-typia/discussions)
- 📧 [Email](mailto:support@example.com)

---

<p align="center">
  <strong>Built with ❤️ for the WordPress community</strong>
</p>
