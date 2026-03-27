# 📚 WordPress Typia Block Examples

This directory contains practical examples demonstrating how to use the wp-typia-templates scaffolding flow effectively.

## 🎯 Available Examples

### 1. My Typia Block (`my-typia-block/`)

**Template Used**: Basic
**Status**: ✅ Complete - Fully functional example

Features demonstrated:

- Basic Typia validation
- Simple attributes (content, alignment, visibility)
- Rich text editing
- Basic styling controls
- Build and deployment ready

### 2. Product Showcase Block (Coming Soon)

**Template**: Full
**Status**: 🚧 In Development

Will demonstrate:

- Advanced attributes with complex validation
- Color controls with custom color pickers
- Spacing and layout controls
- Shadow effects
- Responsive design patterns

### 3. Interactive Quiz Block (Coming Soon)

**Template**: Interactivity
**Status**: 🚧 In Development

Will demonstrate:

- WordPress Interactivity API
- Client-side state management
- Event handling
- Dynamic content updates
- Progress tracking

### 4. Advanced Card Block (Coming Soon)

**Template**: Advanced
**Status**: 🚧 In Development

Will demonstrate:

- Migration system usage
- Version tracking
- Admin dashboard integration
- Deprecated attributes handling

## 🛠 How to Use These Examples

### Quick Start with My Typia Block

1. **Copy the Example**

   ```bash
   cp -r test-template/my-typia-block my-new-block
   cd my-new-block
   ```

2. **Install Dependencies**

   ```bash
   bun install
   ```

3. **Start Development**

   ```bash
   bun run start
   ```

4. **Build for Production**

   ```bash
   bun run build
   ```

5. **Deploy to WordPress**
   - Copy the entire directory to `wp-content/plugins/`
   - Or to your theme's `blocks/` directory
   - Activate in WordPress admin

### Understanding the Code Structure

```
my-typia-block/
├── src/                    # Source code
│   ├── types.ts           # Type definitions with Typia
│   ├── validators.ts      # Validation logic
│   ├── index.tsx          # Block registration
│   ├── edit.tsx           # Editor component
│   ├── save.tsx           # Save component
│   └── style.scss         # Block styles
├── scripts/               # Build and utility scripts
│   ├── sync-types-to-block-json.ts  # Sync types to block metadata
│   └── lib/typia-metadata-core.ts   # Shared metadata generator
├── build/                 # Compiled output (generated)
├── my-typia-block.php     # Plugin entry point
└── package.json          # Dependencies and scripts
```

### Key Concepts Demonstrated

#### 1. Type-Safe Attributes (`types.ts`)

```typescript
export interface MyTypiaBlockAttributes {
  content: string & tags.MinLength<1> & tags.MaxLength<1000> & tags.Default<"">;
  alignment?: ('left' | 'center' | 'right' | 'justify') & tags.Default<"left">;
  isVisible?: boolean & tags.Default<true>;
}
```

#### 2. Runtime Validation (`validators.ts`)

```typescript
export const validateMyTypiaBlockAttributes = (attributes: any) => {
  const validated = typia.validate<MyTypiaBlockAttributes>(attributes);
  return validated.success ? validated.data : null;
};
```

#### 3. Block Registration (`index.tsx`)

```typescript
export default {
  name: 'create-block/my-typia-block',
  title: 'My Typia Block',
  edit: Edit,
  save: Save,
  attributes: metadata.attributes as MyTypiaBlockAttributes,
};
```

## 🚀 Customization Examples

### Adding a New Attribute

1. **Update Types**

   ```typescript
   // src/types.ts
   export interface MyTypiaBlockAttributes {
     // ... existing attributes
     fontSize: 'small' | 'medium' | 'large' & tags.Default<'medium'>;
   }
   ```

2. **Update Validator**

   ```typescript
   // src/validators.ts
   export const sanitizeAttributes = (attributes) => ({
     ...attributes,
     fontSize: attributes.fontSize ?? 'medium',
   });
   ```

3. **Update Editor**

   ```typescript
   // src/edit.tsx
   <SelectControl
     label="Font Size"
     value={attributes.fontSize}
     onChange={(value) => setAttributes({ fontSize: value })}
     options={[
       { label: 'Small', value: 'small' },
       { label: 'Medium', value: 'medium' },
       { label: 'Large', value: 'large' },
     ]}
   />
   ```

4. **Sync block metadata**

   ```bash
   bun run sync-types
   ```

### Creating a Complex Attribute

```typescript
// For nested objects
export interface ComplexBlockAttributes {
  // Simple attributes
  title: string;

  // Nested object
  settings: {
    padding: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    colors: {
      primary: string;
      secondary: string;
    };
  };

  // Array of objects
  items: Array<{
    id: string;
    label: string;
    value: string;
  }>;
}
```

## 🧪 Testing Your Customizations

### Running Tests

```bash
# Run all tests
bun run test

# Run specific test file
bun run test -- my-block.test.ts

# Run tests in watch mode
bun run test -- --watch
```

### E2E Testing

```bash
# Start WordPress environment
bun run wp-env:start

# Run E2E tests
bun run test:e2e

# Stop environment
bun run wp-env:stop
```

## 📦 Deployment Examples

### Creating a WordPress Plugin

1. **Build your block**

   ```bash
   bun run build
   ```

2. **Create plugin ZIP**

   ```bash
   bun run zip
   ```

3. **Upload to WordPress**
   - Go to Plugins → Add New → Upload
   - Upload the generated ZIP file

### Adding to a Theme

1. **Build your block**

   ```bash
   bun run build
   ```

2. **Copy to theme**

   ```bash
   cp -r build/* your-theme/blocks/my-block/
   ```

3. **Enqueue in theme**

   ```php
   // functions.php
   function my_theme_enqueue_blocks() {
     wp_enqueue_script(
       'my-theme-blocks',
       get_theme_file_uri('/blocks/my-block/index.js'),
       array('wp-blocks', 'wp-element'),
       filemtime(get_theme_file_path('/blocks/my-block/index.js')),
       true
     );
   }
   add_action('enqueue_block_assets', 'my_theme_enqueue_blocks');
   ```

## 🎨 Style Examples

### SCSS Organization

```scss
// style.scss
.wp-block-my-typia-block {
  // Base styles
  padding: 1rem;

  // Modifiers
  &--align-center {
    text-align: center;
    margin: 0 auto;
  }

  // Elements
  &__content {
    font-size: 1.2rem;

    // Responsive
    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }

  // States
  &.is-selected {
    border: 2px solid var(--wp-admin-theme-color);
  }
}
```

### CSS Custom Properties

```scss
// Using CSS variables for theming
.wp-block-my-typia-block {
  --block-padding: 1rem;
  --block-background: var(--wp--preset--color--background);
  --block-text: var(--wp--preset--color--foreground);

  background-color: var(--block-background);
  color: var(--block-text);
  padding: var(--block-padding);
}
```

## 🔧 Common Patterns

### 1. Conditional Rendering

```typescript
// edit.tsx
{attributes.isVisible && (
  <div className="wp-block-my-typia-block__content">
    <RichText ... />
  </div>
)}
```

### 2. Dynamic Classes

```typescript
const blockProps = useBlockProps({
  className: `wp-block-my-typia-block wp-block-my-typia-block--${attributes.alignment} ${
    attributes.isVisible ? 'is-visible' : 'is-hidden'
  }`,
});
```

### 3. Event Handling

```typescript
// For interactive elements
const handleClick = () => {
  setAttributes({
    clickCount: (attributes.clickCount || 0) + 1,
  });
};

<button onClick={handleClick}>
  Clicked {attributes.clickCount || 0} times
</button>
```

## 📚 Additional Resources

- [WordPress Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [Typia Documentation](https://typia.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)

## 🤝 Contributing Examples

We encourage you to contribute your own examples! Please:

1. Create a new directory under `test-template/`
2. Follow the naming convention: `[feature]-block/`
3. Include a README.md explaining the example
4. Add tests demonstrating the functionality
5. Submit a pull request

---

Happy coding! 🎉
