# 🚀 wp-typia-templates

Create robust WordPress blocks with TypeScript runtime validation using Typia. This Bun-first template monorepo provides shared scaffolding, generated `block.json` / `typia.manifest.json` / `typia-validator.php`, testing, and migration support.

## ✨ Key Features

- **🔒 Runtime Type Safety** - Typia provides compile-time and runtime type validation
- **⚡ Type-first metadata generation** - TypeScript interfaces generate `block.json`, `typia.manifest.json` v2, and `typia-validator.php`
- **🎯 4 Template Variations** - From basic to advanced patterns
- **🔄 Migration System** - Snapshot-based block migrations with `renameMap` / `transforms` authoring helpers (Advanced template)
- **🧪 Complete Testing** - Unit tests with Bun test, CLI runtime tests, E2E tests with Playwright
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

### Option 2: Use legacy direct template wrappers

```bash
npx wp-typia-basic
npx wp-typia-full
npx wp-typia-interactivity
npx wp-typia-advanced
```

These legacy entrypoints remain supported for compatibility, but `create-wp-typia` is the primary path for new projects.

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
bun run sync-types  # Generates block.json, typia.manifest.json v2, and typia-validator.php
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
- **[Interactive Tutorial](docs/tutorials/interactive-tutorial.md)** - Build your first block end-to-end
- **[Migration Guide](docs/migrations.md)** - Snapshot-based migration workflow for the advanced template
- **[Interactivity Guide](docs/interactivity.md)** - When to choose the interactivity template and how it fits
- **[API Guide](docs/API.md)** - Where the public CLI and generated runtime surfaces live
- **Generated PHP validator** - `typia.manifest.json` v2 preserves Typia constraints, explicit defaults, and supported discriminated unions; `typia-validator.php` enforces the supported PHP subset
- **[Union Support Guide](docs/union-support.md)** - What union shapes are supported today and what remains future work
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute

## 🧪 Testing

This project includes comprehensive testing:

```bash
# Unit tests
bun run test

# E2E tests with Playwright
bun run test:e2e

# Coverage report
bun run test:coverage
```

## 🔄 Migration System (Advanced Template)

The Advanced template uses snapshot-based migrations driven by `typia.manifest.json` diffs and now ships a dynamic `render.php` example that exercises the generated PHP validator:

```bash
# Bootstrap the first snapshot for the current schema
bun run migration:init

# Save another release snapshot later on
bun run migration:snapshot -- --version 1.0.0

# Compare a legacy snapshot with the current schema
bun run migration:diff -- --from 1.0.0

# Scaffold a deprecated migration edge from 1.0.0 -> current
bun run migration:scaffold -- --from 1.0.0

# Verify fixtures and generated deprecated wiring
bun run migration:verify
```

Features:

- 🔄 Snapshot-based manifest diffing and rule generation
- 📊 Migration dashboard in WordPress admin
- 🧪 Built-in migration verification and edge fixtures
- ✍️ Auto-applied high-confidence renames plus suggested transform bodies
- 🧭 Nested leaf authoring for object and supported union-branch paths
- 📝 Detailed migration reports

## 📦 Published npm Packages

All templates are published as npm packages:

- [`create-wp-typia`](https://www.npmjs.com/package/create-wp-typia)
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
│   ├── create-wp-typia/         # Shared CLI scaffolder
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
// src/migrations/rules/1.0.0-to-2.0.0.ts
export const renameMap = {
  // content: "headline",
};

export const transforms = {
  // content: (legacyValue) => String(legacyValue ?? ""),
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
