# wp-typia-templates

[![CI/CD](https://github.com/imjlk/wp-typia-templates/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/imjlk/wp-typia-templates/actions)
[![License: GPL-2.0+](https://img.shields.io/badge/License-GPL--2.0+-blue.svg)](https://opensource.org/licenses/GPL-2.0+)
[![npm version](https://badge.fury.io/js/create-wp-typia.svg)](https://www.npmjs.com/package/create-wp-typia)
[![codecov](https://codecov.io/gh/imjlk/wp-typia-templates/branch/main/graph/badge.svg)](https://codecov.io/gh/imjlk/wp-typia-templates)

> Type-safe WordPress block development with automatic validation powered by Typia

A Bun-first WordPress block template monorepo featuring TypeScript, Typia validation, and the WordPress Interactivity API. Generate type-safe blocks with runtime validation, automatic `block.json` generation, generated `typia.manifest.json` metadata, and seamless WordPress integration.

## ✨ Features

- 🎯 **Type-Safe Development**: Full TypeScript support with compile-time and runtime validation
- ⚡ **Typia Integration**: 20,000x faster validation than alternatives
- 🔄 **Type-First Metadata Generation**: Derive `block.json` and `typia.manifest.json` from TypeScript types
- 🏗️ **Multiple Templates**: Choose from Basic, Full, Interactivity, or Advanced editions
- 🚀 **Migration System**: Automatic block migration detection and execution (Advanced)
- ⚛️ **Modern Stack**: React hooks, error boundaries, and utility functions
- 🧪 **Testing Ready**: Bun unit tests, Bunli CLI tests, and Playwright E2E tests included
- 📦 **Shared CLI + Templates**: Scaffold via `create-wp-typia` and keep direct template entrypoints

## 🚀 Quick Start

### Using `create-wp-typia` (Recommended)

```bash
bun create wp-typia my-block
# or
bunx create-wp-typia my-block
# or
npx create-wp-typia my-block
```

The CLI always asks which package manager the generated project should use. For non-interactive runs, pass it explicitly:

```bash
npx create-wp-typia my-block --template basic --package-manager pnpm --yes --no-install
```

### Legacy Direct Template Wrappers

```bash
npx wp-typia-basic
npx wp-typia-full
npx wp-typia-interactivity
npx wp-typia-advanced
```

These direct entrypoints remain supported for compatibility, but `create-wp-typia` is the primary path for new projects.

## 📦 Published npm Packages

- [`create-wp-typia`](https://www.npmjs.com/package/create-wp-typia)
- [`wp-typia-basic`](https://www.npmjs.com/package/wp-typia-basic)
- [`wp-typia-full`](https://www.npmjs.com/package/wp-typia-full)
- [`wp-typia-interactivity`](https://www.npmjs.com/package/wp-typia-interactivity)
- [`wp-typia-advanced`](https://www.npmjs.com/package/wp-typia-advanced)

## 📁 Project Structure

```
wp-typia-templates/
├── packages/                    # published templates and CLI
│   ├── wp-typia-basic/         # Core Typia functionality
│   ├── wp-typia-full/          # + utilities + hooks + ErrorBoundary
│   ├── wp-typia-interactivity/ # + WordPress Interactivity API
│   └── wp-typia-advanced/      # + migration system + admin dashboard
├── test-template/              # Working example
│   └── my-typia-block/
├── templates/                  # Mustache templates for npm packages
│   ├── basic/
│   ├── full/
│   ├── interactivity/
│   └── advanced/
├── tests/                      # Test suites
│   ├── unit/
│   └── e2e/
└── docs/                       # Generated documentation
```

## 🎯 Template Variations

### 1. **Basic** - Core Typia Features

Perfect for simple blocks with type safety:

- ✅ TypeScript to block.json + typia.manifest auto-generation
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
- 🚀 **Automatic Migration Generation**
- 🔄 **Version Management System**
- 🛠️ **WordPress Deprecated Integration**
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
      "default": 1,
      "minimum": 0,
      "maximum": 100
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

The generator also emits `typia.manifest.json`, which keeps Typia-only constraints such as `format`, `pattern`, and numeric/string ranges for future PHP-side validation.

### Runtime Validation

```typescript
// In your block component
import { createValidators } from './validators';

const validators = createValidators<MyBlockAttributes>();

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

```typescript
// src/migrations/index.ts
import typia from "typia";
import { MyBlockAttributesV1, MyBlockAttributes } from "../types/versions";

// Define migration
export const migrateV1ToV2 = typia.createMisc<MyBlockAttributesV1, MyBlockAttributes>({
  transform: (old) => ({
    ...old,
    // Add new field with default
    isVisible: old.isVisible ?? true,
    // Transform existing field
    title: old.title.toUpperCase(),
  }),
});

// Auto-detect required migrations
import { detectBlockMigration } from '../migration-detector';

const analysis = detectBlockMigration(oldAttributes);
if (analysis.needsMigration) {
  console.log(`Migrating from ${analysis.currentVersion} to ${analysis.targetVersion}`);
}
```

## 🛠️ Available Scripts

### Development

- `bun run start` - Start development server with hot reload
- `bun run build` - Build blocks for production
- `bun run dev` - Alias for `bun run start`

### Type Management

- `bun run sync-types` - Generate block.json and typia.manifest.json from TypeScript types
- `bun run typecheck` - Run TypeScript compiler check

### Testing

- `bun run test` - Run Bun/Bunli unit tests
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

- `bun run generate-migrations` - Generate migration scripts
- `bun run test-migrations` - Test migration scripts
- `bun run migration-stats` - View migration statistics

## 📚 Documentation

- [API Documentation](./docs/api/) - Complete API reference
- [Migration Guide](./docs/migrations.md) - Block migration system
- [Interactivity API](./docs/interactivity.md) - Reactive frontend
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
# Test migration scripts
cd packages/wp-typia-advanced
bun run test-migrations
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
git clone https://github.com/imjlk/wp-typia-templates.git
cd wp-typia-templates

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

- 📖 [Documentation](https://github.com/imjlk/wp-typia-templates/wiki)
- 🐛 [Issue Tracker](https://github.com/imjlk/wp-typia-templates/issues)
- 💬 [Discussions](https://github.com/imjlk/wp-typia-templates/discussions)
- 📧 [Email](mailto:support@example.com)

---

<p align="center">
  <strong>Built with ❤️ for the WordPress community</strong>
</p>
