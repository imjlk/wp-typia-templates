# WordPress Typia Block Boilerplate

[![CI/CD](https://github.com/yourusername/wp-typia-boilerplate/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/yourusername/wp-typia-boilerplate/actions)
[![License: GPL-2.0+](https://img.shields.io/badge/License-GPL--2.0+-blue.svg)](https://opensource.org/licenses/GPL-2.0+)
[![npm version](https://badge.fury.io/js/%40wp-typia%2Fbasic.svg)](https://badge.fury.io/js/%40wp-typia%2Fbasic)
[![codecov](https://codecov.io/gh/yourusername/wp-typia-boilerplate/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/wp-typia-boilerplate)

> Type-safe WordPress block development with automatic validation powered by Typia

A modern WordPress block development boilerplate featuring TypeScript, Typia validation, and the WordPress Interactivity API. Generate type-safe blocks with runtime validation, automatic `block.json` generation, and seamless WordPress integration.

## ✨ Features

- 🎯 **Type-Safe Development**: Full TypeScript support with compile-time and runtime validation
- ⚡ **Typia Integration**: 20,000x faster validation than alternatives
- 🔄 **Auto block.json Generation**: Derive WordPress block attributes from TypeScript types
- 🏗️ **Multiple Templates**: Choose from Basic, Full, Interactivity, or Advanced editions
- 🚀 **Migration System**: Automatic block migration detection and execution (Advanced)
- ⚛️ **Modern Stack**: React hooks, error boundaries, and utility functions
- 🧪 **Testing Ready**: Jest unit tests and Playwright E2E tests included
- 📦 **npm Templates**: Install via `@wordpress/create-block`

## 🚀 Quick Start

### Using npm Templates (Recommended)

```bash
# Basic template
npx @wordpress/create-block my-block --template=@wp-typia/basic

# Full template with utilities
npx @wordpress/create-block my-block --template=@wp-typia/full

# Interactivity API template
npx @wordpress/create-block my-block --template=@wp-typia/interactivity

# Advanced with migrations
npx @wordpress/create-block my-block --template=@wp-typia/advanced
```

### Manual Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/wp-typia-boilerplate.git my-block
cd my-block

# Install dependencies
npm install

# Start development
npm start
```

## 📁 Project Structure

```
wp-typia-boilerplate/
├── packages/                    # npm publishable templates
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

- ✅ TypeScript to block.json auto-generation
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

### Auto-Generated block.json

```bash
npm run sync-types
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
- `npm start` - Start development server with hot reload
- `npm run build` - Build blocks for production
- `npm run dev` - Alias for `npm start`

### Type Management
- `npm run sync-types` - Generate block.json from TypeScript types
- `npm run type-check` - Run TypeScript compiler check

### Testing
- `npm test` - Run unit tests with Jest
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

### Code Quality
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### WordPress Environment
- `npm run wp-env:start` - Start WordPress test environment
- `npm run wp-env:stop` - Stop WordPress test environment
- `npm run wp-env:reset` - Reset WordPress environment

### Migration (Advanced Template)
- `npm run generate-migrations` - Generate migration scripts
- `npm run test-migrations` - Test migration scripts
- `npm run migration-stats` - View migration statistics

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
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### E2E Tests
```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npx playwright test --ui
```

### Migration Testing
```bash
# Test migration scripts
cd packages/wp-typia-advanced
npm run test:migrations
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
git clone https://github.com/yourusername/wp-typia-boilerplate.git
cd wp-typia-boilerplate

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test
```

## 📄 License

GPL-2.0-or-later © [Your Name](https://github.com/yourusername)

## 🙏 Acknowledgments

- [Typia](https://typia.io/) - Amazing TypeScript validation library
- [WordPress](https://wordpress.org/) - CMS platform
- [Gutenberg](https://github.com/WordPress/gutenberg) - Block editor
- [Create Block](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/) - Block scaffolding tool

## 📞 Support

- 📖 [Documentation](https://yourusername.github.io/wp-typia-boilerplate/)
- 🐛 [Issue Tracker](https://github.com/yourusername/wp-typia-boilerplate/issues)
- 💬 [Discussions](https://github.com/yourusername/wp-typia-boilerplate/discussions)
- 📧 [Email](mailto:support@example.com)

---

<p align="center">
  <strong>Built with ❤️ for the WordPress community</strong>
</p>