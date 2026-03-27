# 🚀 wp-typia-templates

Create robust WordPress blocks with TypeScript runtime validation using Typia. This Bun-first template monorepo provides shared scaffolding, generated `block.json` / `typia.manifest.json`, testing, and migration support.

## ✨ Key Features

- **🔒 Runtime Type Safety** - Typia provides compile-time and runtime type validation
- **⚡ Type-first metadata generation** - TypeScript interfaces generate `block.json` and `typia.manifest.json`
- **🎯 4 Template Variations** - From basic to advanced patterns
- **🔄 Migration System** - Automated block versioning and migrations (Advanced template)
- **🧪 Complete Testing** - Unit tests with Bun test, CLI tests with Bunli, E2E tests with Playwright
- **📦 Monorepo Ready** - Bun workspaces with shared dependencies
- **🎨 Modern Tooling** - TypeScript, SCSS, ESLint, Prettier, GitHub Actions

## 🚀 Quick Start

### Option 1: Use `create-wp-typia` (Recommended)

```bash
bun create wp-typia my-block
# or
bunx create-wp-typia my-block
# or
npx create-wp-typia my-block
```

Follow the prompts to choose `basic`, `full`, `interactivity`, or `advanced`. The CLI will:

- Ask for block details (name, description, author)
- Ask which package manager the generated project should use
- Generate all necessary files with your settings
- Configure the generated project for `bun`, `npm`, `pnpm`, or `yarn`
- Run the selected package manager's install step unless you pass `--no-install`

For non-interactive usage:

```bash
npx create-wp-typia my-block --template basic --package-manager pnpm --yes --no-install
```

### Option 2: Use direct template wrappers

```bash
npx wp-typia-basic
npx wp-typia-full
npx wp-typia-interactivity
npx wp-typia-advanced
```

These legacy entrypoints remain supported for compatibility, but `create-wp-typia` is the primary path.

## 📦 Templates Overview

| Template                                      | Features                                                                               | Best For                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------- |
| **[Basic](templates/basic/)**                 | • Type-safe attributes<br>• Runtime validation<br>• Minimal setup                      | Quick prototypes and simple blocks |
| **[Full](templates/full/)**                   | • Advanced controls<br>• Custom hooks<br>• Style options<br>• Animation support        | Feature-rich blocks                |
| **[Interactivity](templates/interactivity/)** | • Interactivity API<br>• Client-side state<br>• Event handling                         | Interactive blocks                 |
| **[Advanced](templates/advanced/)**           | • Migration system<br>• Version tracking<br>• Admin dashboard<br>• Enterprise features | Production blocks                  |

## 🎯 How It Works

### 1. Define Types with Typia

```typescript
// src/types.ts
import { tags } from "typia";

export interface MyBlockAttributes {
  content: string & tags.MinLength<1> & tags.MaxLength<1000> & tags.Default<"">;
  alignment?: ('left' | 'center' | 'right') & tags.Default<"left">;
  isVisible?: boolean & tags.Default<true>;
}
```

### 2. Auto-generate block metadata

```bash
bun run sync-types  # Generates block.json and typia.manifest.json from TypeScript types
```

### 3. Get Runtime Validation

```typescript
// src/validators.ts
import typia from "typia";

const validate = typia.validate<MyBlockAttributes>(attributes);
if (!validate.success) {
  console.error(validate.errors); // Type-safe error handling
}
```

## 🛠 Development Workflow

This section is for contributors to this repository. The repository itself stays Bun-first, even though scaffolded projects can use another package manager.

```bash
# Install dependencies
bun install

# Start development server
bun run start

# Type checking
bun run typecheck

# Run tests
bun run test

# Build for production
bun run build
```

## 📚 Documentation

- **[Examples Guide](test-template/EXAMPLES.md)** - Practical examples and patterns
- **Generated manifest** - `typia.manifest.json` preserves Typia-only constraints for future PHP validation
- **[Migration Guide](packages/wp-typia-advanced/MIGRATION.md)** - Using the migration system
- **[API Reference](docs/API.md)** - Complete API documentation
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute

## 🧪 Testing

This project includes comprehensive testing:

```bash
# Unit tests
bun run test

# E2E tests with Playwright
bun run test:e2e

# Migration tests (Advanced template)
bun run test:migrations

# Coverage report
bun run test:coverage
```

## 🔄 Migration System (Advanced Template)

The Advanced template includes a powerful migration system:

```typescript
// Define version history
export interface V1_Attributes {
  title: string;
}

export interface V2_Attributes extends V1_Attributes {
  subtitle?: string;
}

// Auto-generate migrations
bun run generate-migrations

// Test migrations
bun run test-migrations
```

Features:

- 🔄 Automatic migration generation from type changes
- 📊 Migration dashboard in WordPress admin
- 🧪 Built-in migration testing
- 📝 Detailed migration reports

## 📦 Published npm Packages

All templates are published as npm packages:

- [`wp-typia-basic`](https://www.npmjs.com/package/wp-typia-basic)
- [`wp-typia-full`](https://www.npmjs.com/package/wp-typia-full)
- [`wp-typia-interactivity`](https://www.npmjs.com/package/wp-typia-interactivity)
- [`wp-typia-advanced`](https://www.npmjs.com/package/wp-typia-advanced)

## 🏗 Project Structure

```
wp-typia-templates/
├── templates/                    # Template variations
│   ├── basic/                   # Basic Typia features
│   ├── full/                    # Full feature set
│   ├── interactivity/           # Interactivity API
│   └── advanced/                # Migration system
├── test-template/               # Working examples
│   └── my-typia-block/         # Complete example
├── packages/                    # Published npm packages and CLI
│   ├── create-wp-typia/         # Shared Bunli-based scaffolder
├── tests/                       # Test files
├── docs/                        # Documentation
└── .github/                     # GitHub configuration
```

## 🎯 Examples

### Basic Block

```typescript
// Define your block with full type safety
export interface QuoteBlockAttributes {
  text: string & tags.MinLength<1>;
  author?: string & tags.MaxLength<100>;
  citation?: string;
  fontSize: 'small' | 'medium' | 'large' & tags.Default<'medium'>;
}
```

### Interactive Block

```typescript
// Use WordPress Interactivity API
store('my-interactive-block', {
  state: {
    get clicks() {
      return getContext().clicks;
    }
  },
  actions: {
    handleClick: () => {
      context.clicks++;
    }
  }
});
```

### Migration Example

```typescript
// Automatic migrations
const migrations = {
  '1.0.0->1.1.0': (attrs) => ({
    ...attrs,
    newFeature: attrs.newFeature ?? true
  })
};
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

GPL-2.0-or-later. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Typia](https://typia.io/) - Amazing runtime validation library
- [WordPress](https://wordpress.org/) - Block Editor platform
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Playwright](https://playwright.dev/) - E2E testing

## 📞 Support

- 📖 [Documentation](https://github.com/imjlk/wp-typia-templates/wiki)
- 🐛 [Issue Tracker](https://github.com/imjlk/wp-typia-templates/issues)
- 💬 [Discussions](https://github.com/imjlk/wp-typia-templates/discussions)

---

Made with ❤️ for the WordPress community
